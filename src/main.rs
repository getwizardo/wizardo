use axum::{body::Body, extract::{Path, State}, http::{header, HeaderMap, Method, StatusCode}, response::{Html, IntoResponse, Response}, routing::{any, delete, get, put}, Router};
use chrono::{DateTime, Utc};
use percent_encoding::percent_decode_str;
use serde::Serialize;
use std::{env, path::{Path as FsPath, PathBuf}, sync::Arc};
use tokio::{fs, net::TcpListener};
use tower_http::trace::TraceLayer;

#[derive(Clone)]
struct AppState { root: Arc<PathBuf> }

#[derive(Serialize)]
struct FileEntry { name: String, path: String, kind: &'static str, size: u64, modified: String }

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let host = env::var("WIZARDO_HOST").unwrap_or_else(|_| "0.0.0.0".into());
    let port: u16 = env::var("WIZARDO_PORT").ok().and_then(|v| v.parse().ok()).unwrap_or(3000);
    let root = PathBuf::from(env::var("WIZARDO_DATA_DIR").unwrap_or_else(|_| "./data"));
    fs::create_dir_all(&root).await?;
    let state = AppState { root: Arc::new(fs::canonicalize(root).await?) };
    let app = Router::new()
        .route("/", get(index))
        .route("/health", get(health))
        .route("/api/files", get(list_root).post(create_directory))
        .route("/api/files/*path", get(download).put(upload).delete(remove).post(create_directory))
        .route("/webdav", any(webdav)).route("/webdav/", any(webdav)).route("/webdav/*path", any(webdav))
        .with_state(state).layer(TraceLayer::new_for_http());
    let listener = TcpListener::bind(format!("{host}:{port}")).await?;
    println!("🪄 Wizardo cloud desktop listening on http://{host}:{port}");
    axum::serve(listener, app).with_graceful_shutdown(shutdown()).await?;
    Ok(())
}

async fn shutdown() { let _ = tokio::signal::ctrl_c().await; println!("\nWizardo stopped"); }
async fn index() -> Html<&'static str> { Html(include_str!("../public/index.html")) }
async fn health() -> impl IntoResponse { (StatusCode::OK, [(header::CONTENT_TYPE, "application/json")], r#"{"status":"ok","service":"wizardo"}"#) }

fn clean_path(raw: &str) -> Option<PathBuf> {
    let decoded = percent_decode_str(raw).decode_utf8().ok()?;
    let mut out = PathBuf::new();
    for part in decoded.split('/') { if part.is_empty() || part == "." { continue; } if part == ".." || part.contains('\\') { return None; } out.push(part); }
    Some(out)
}
fn safe_path(root: &FsPath, raw: &str) -> Option<PathBuf> { let rel = clean_path(raw)?; let path = root.join(rel); if path.starts_with(root) { Some(path) } else { None } }
fn rel_string(root: &FsPath, path: &FsPath) -> String { path.strip_prefix(root).unwrap_or(path).to_string_lossy().replace('\\', "/") }

async fn list_root(State(state): State<AppState>) -> impl IntoResponse { list_dir(state, "").await }
async fn list_dir(state: AppState, raw: &str) -> Response {
    let Some(dir) = safe_path(&state.root, raw) else { return StatusCode::BAD_REQUEST.into_response() };
    let Ok(mut entries) = fs::read_dir(&dir).await else { return StatusCode::NOT_FOUND.into_response() };
    let mut files = Vec::new();
    while let Ok(Some(entry)) = entries.next_entry().await {
        let Ok(meta) = entry.metadata().await else { continue };
        let modified: DateTime<Utc> = meta.modified().ok().map(DateTime::<Utc>::from).unwrap_or_else(Utc::now);
        let path = rel_string(&state.root, &entry.path());
        files.push(FileEntry { name: entry.file_name().to_string_lossy().into(), path, kind: if meta.is_dir() { "directory" } else { "file" }, size: if meta.is_file() { meta.len() } else { 0 }, modified: modified.to_rfc3339() });
    }
    files.sort_by_key(|f| (f.kind != "directory", f.name.to_lowercase()));
    (StatusCode::OK, axum::Json(files)).into_response()
}

async fn download(State(state): State<AppState>, Path(path): Path<String>) -> Response {
    let Some(file) = safe_path(&state.root, &path) else { return StatusCode::BAD_REQUEST.into_response() };
    let Ok(meta) = fs::metadata(&file).await else { return StatusCode::NOT_FOUND.into_response() };
    if meta.is_dir() { return list_dir(state, &path).await; }
    match fs::read(file).await { Ok(bytes) => (StatusCode::OK, bytes).into_response(), Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response() }
}
async fn upload(State(state): State<AppState>, Path(path): Path<String>, body: Body) -> Response {
    let Some(file) = safe_path(&state.root, &path) else { return StatusCode::BAD_REQUEST.into_response() };
    if path.is_empty() { return StatusCode::BAD_REQUEST.into_response(); }
    if let Some(parent) = file.parent() { if fs::create_dir_all(parent).await.is_err() { return StatusCode::INTERNAL_SERVER_ERROR.into_response(); } }
    match axum::body::to_bytes(body, 100 * 1024 * 1024).await.and_then(|b| Ok(b)) { Ok(bytes) => match fs::write(file, bytes).await { Ok(_) => StatusCode::CREATED, Err(_) => StatusCode::INTERNAL_SERVER_ERROR }.into_response(), Err(_) => StatusCode::PAYLOAD_TOO_LARGE.into_response() }
}
async fn remove(State(state): State<AppState>, Path(path): Path<String>) -> StatusCode { let Some(target) = safe_path(&state.root, &path) else { return StatusCode::BAD_REQUEST }; if target == *state.root { return StatusCode::FORBIDDEN }; match fs::metadata(&target).await { Ok(m) if m.is_dir() => fs::remove_dir_all(target).await, Ok(_) => fs::remove_file(target).await, Err(_) => return StatusCode::NOT_FOUND }.map(|_| StatusCode::NO_CONTENT).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR) }
async fn create_directory(State(state): State<AppState>, Path(path): Option<Path<String>>, body: Body) -> StatusCode { let raw = path.map(|Path(p)| p).unwrap_or_default(); let Some(dir) = safe_path(&state.root, &raw) else { return StatusCode::BAD_REQUEST }; if dir == *state.root { return StatusCode::BAD_REQUEST }; match fs::create_dir_all(dir).await { Ok(_) => StatusCode::CREATED, Err(_) => StatusCode::INTERNAL_SERVER_ERROR } }

async fn webdav(State(state): State<AppState>, method: Method, headers: HeaderMap, Path(path): Option<Path<String>>, body: Body) -> Response {
    let raw = path.map(|Path(p)| p).unwrap_or_default();
    match method {
        Method::GET | Method::HEAD => download(State(state), Path(raw)).await,
        Method::PUT => upload(State(state), Path(raw), body).await,
        Method::DELETE => remove(State(state), Path(raw)).await.into_response(),
        Method::OPTIONS => { let mut r = StatusCode::NO_CONTENT.into_response(); r.headers_mut().insert("dav", "1".parse().unwrap()); r.headers_mut().insert("allow", "OPTIONS, GET, HEAD, PUT, DELETE, MKCOL, PROPFIND".parse().unwrap()); r }
        _ if method.as_str() == "MKCOL" => create_directory(State(state), Some(Path(raw)), body).await.into_response(),
        _ if method.as_str() == "PROPFIND" => propfind(state, &raw, headers.get("depth").and_then(|v| v.to_str().ok()).unwrap_or("0")).await,
        _ => StatusCode::METHOD_NOT_ALLOWED.into_response(),
    }
}
async fn propfind(state: AppState, raw: &str, depth: &str) -> Response { let Some(path) = safe_path(&state.root, raw) else { return StatusCode::BAD_REQUEST.into_response() }; let Ok(meta) = fs::metadata(&path).await else { return StatusCode::NOT_FOUND.into_response() }; let mut paths = vec![path.clone()]; if meta.is_dir() && depth != "0" { if let Ok(mut it) = fs::read_dir(&path).await { while let Ok(Some(e)) = it.next_entry().await { paths.push(e.path()); } } } let mut xml = String::from(r#"<?xml version="1.0" encoding="utf-8"?><D:multistatus xmlns:D="DAV:">"#); for p in paths { let Ok(m) = fs::metadata(&p).await else { continue }; let href = format!("/webdav/{}", rel_string(&state.root, &p)); xml.push_str(&format!(r#"<D:response><D:href>{href}</D:href><D:propstat><D:prop><D:displayname>{}</D:displayname><D:resourcetype>{}</D:resourcetype><D:getcontentlength>{}</D:getcontentlength></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>"#, p.file_name().unwrap_or_default().to_string_lossy(), if m.is_dir() { "<D:collection/>" } else { "" }, m.len())); } xml.push_str("</D:multistatus>"); let mut r = (StatusCode::MULTI_STATUS, [(header::CONTENT_TYPE, "application/xml; charset=utf-8")], xml).into_response(); r.headers_mut().insert("dav", "1".parse().unwrap()); r }
