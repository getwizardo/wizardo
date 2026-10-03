# Wizardo

Wizardo is a lightweight, self-hosted cloud desktop for local files. It provides a browser file manager and a WebDAV endpoint backed by the same storage directory.

## Run

```sh
cargo run --release
```

Configuration is via environment variables:

- `WIZARDO_HOST` (default `0.0.0.0`)
- `WIZARDO_PORT` (default `3000`)
- `WIZARDO_DATA_DIR` (default `./data`)

Open `http://localhost:3000` in a browser. WebDAV clients use `http://localhost:3000/webdav/`.

This initial server has no authentication. Put it behind an authenticated reverse proxy before exposing it to the public internet.
