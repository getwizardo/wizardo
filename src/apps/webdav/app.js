/**
 * WebDAV App - WebDAV Server Implementation
 * 
 * Provides WebDAV protocol support for file access
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */
import { Request, Response, NextFunction } from "express";
import { existsSync, mkdirSync, readdirSync, statSync, readFileSync, writeFileSync, unlinkSync, renameSync, copyFileSync } from "fs";
import { join, dirname, basename } from "path";
import { cwd } from "process";

export const appConfig = {
  name: "webdav",
  version: "1.0.0",
  description: "WebDAV server for file access",
  author: "wizardo",
  license: "MIT"
};

let webDAVRoot: string = join(cwd(), "webdav");

export function init(): void {
  console.log("🌐 Initializing WebDAV app...");
  
  if (!existsSync(webDAVRoot)) {
    mkdirSync(webDAVRoot, { recursive: true });
  }
}

export function setRoot(rootPath: string): void {
  webDAVRoot = rootPath;
  if (!existsSync(webDAVRoot)) {
    mkdirSync(webDAVRoot, { recursive: true });
  }
}

export function getRoot(): string {
  return webDAVRoot;
}

/**
 * Get file/folder stats for PROPFIND
 */
export function getPropfindResponse(reqPath: string, depth: number = 1): object[] {
  const results: object[] = [];
  const fullPath = join(webDAVRoot, reqPath === "/" ? "" : reqPath);
  
  if (!existsSync(fullPath)) {
    return results;
  }
  
  const stats = statSync(fullPath);
  const isDir = stats.isDirectory();
  
  results.push({
    path: reqPath,
    href: reqPath,
    "d:resourcetype": isDir ? "d:collection" : "",
    "d:displayname": basename(reqPath) || "root",
    "d:getcontentlength": isDir ? undefined : stats.size,
    "d:getlastmodified": stats.mtime.toUTCString(),
    "d:getetag": `"${stats.ino}-${stats.mtime.getTime()}"`,
    "d:ishidden": basename(reqPath).startsWith("."),
    "d:getcontenttype": isDir ? "httpd/unix-directory" : getMimeType(reqPath)
  });
  
  if (isDir && depth > 0) {
    try {
      const entries = readdirSync(fullPath);
      for (const entry of entries) {
        const entryPath = join(reqPath === "/" ? "" : reqPath, entry);
        const entryFullPath = join(fullPath, entry);
        
        try {
          const entryStats = statSync(entryFullPath);
          const entryIsDir = entryStats.isDirectory();
          
          results.push({
            path: entryPath,
            href: entryPath,
            "d:resourcetype": entryIsDir ? "d:collection" : "",
            "d:displayname": entry,
            "d:getcontentlength": entryIsDir ? undefined : entryStats.size,
            "d:getlastmodified": entryStats.mtime.toUTCString(),
            "d:getetag": `"${entryStats.ino}-${entryStats.mtime.getTime()}"`,
            "d:ishidden": entry.startsWith("."),
            "d:getcontenttype": entryIsDir ? "httpd/unix-directory" : getMimeType(entry)
          });
        } catch (e) {
          // Skip inaccessible files
        }
      }
    } catch (e) {
      // Directory not readable
    }
  }
  
  return results;
}

/**
 * Simple MIME type detection
 */
function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const mimeTypes: Record<string, string> = {
    "txt": "text/plain",
    "html": "text/html",
    "css": "text/css",
    "js": "application/javascript",
    "json": "application/json",
    "xml": "application/xml",
    "pdf": "application/pdf",
    "zip": "application/zip",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "gif": "image/gif",
    "svg": "image/svg+xml",
    "mp3": "audio/mpeg",
    "mp4": "video/mp4",
    "md": "text/markdown"
  };
  
  return mimeTypes[ext] || "application/octet-stream";
}

/**
 * Handle WebDAV methods
 */
export async function handleWebDAV(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const reqPath = req.path === "/" ? "/" : req.path.replace(/\/$/, "") || "/";
  const fullPath = join(webDAVRoot, reqPath === "/" ? "" : reqPath);
  
  try {
    switch (req.method) {
      case "PROPFIND": {
        const depth = req.headers.depth === "infinity" ? 10 : 
                      parseInt(req.headers.depth as string) || 1;
        
        const results = getPropfindResponse(reqPath, depth);
        
        res.setHeader("Content-Type", "application/xml");
        res.setHeader("DAV", "1, 2");
        
        const xml = `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:">
${results.map((r: any) => `  <d:response>
    <d:href>${r.href}</d:href>
    <d:propstat>
      <d:prop>
        <d:resourcetype>${r["d:resourcetype"]}</d:resourcetype>
        <d:displayname>${r["d:displayname"]}</d:displayname>
        ${r["d:getcontentlength"] !== undefined ? `<d:getcontentlength>${r["d:getcontentlength"]}</d:getcontentlength>` : ""}
        <d:getlastmodified>${r["d:getlastmodified"]}</d:getlastmodified>
        <d:getcontenttype>${r["d:getcontenttype"]}</d:getcontenttype>
      </d:prop>
    </d:propstat>
  </d:response>`).join("\n")}
</d:multistatus>`;
        
        res.status(207).send(xml);
        break;
      }
      
      case "MKCOL": {
        if (existsSync(fullPath)) {
          res.status(405).json({ error: "Already exists" });
          return;
        }
        
        mkdirSync(fullPath, { recursive: true });
        res.status(201).send("Created");
        break;
      }
      
      case "DELETE": {
        if (!existsSync(fullPath)) {
          res.status(404).json({ error: "Not found" });
          return;
        }
        
        unlinkSync(fullPath);
        res.status(204).send("Deleted");
        break;
      }
      
      case "PUT": {
        const body = req.body;
        const dir = dirname(fullPath);
        
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
        
        if (typeof body === "string") {
          writeFileSync(fullPath, body);
        } else if (Buffer.isBuffer(body)) {
          writeFileSync(fullPath, body);
        }
        
        res.status(201).send("Created");
        break;
      }
      
      case "GET": {
        if (!existsSync(fullPath)) {
          res.status(404).json({ error: "Not found" });
          return;
        }
        
        const stats = statSync(fullPath);
        if (stats.isDirectory()) {
          const entries = readdirSync(fullPath);
          res.json({ path: reqPath, entries });
        } else {
          const content = readFileSync(fullPath);
          res.setHeader("Content-Length", stats.size);
          res.setHeader("Content-Type", getMimeType(reqPath));
          res.send(content);
        }
        break;
      }
      
      case "COPY": {
        const dest = req.headers.destination;
        if (!dest) {
          res.status(400).json({ error: "Destination required" });
          return;
        }
        
        const destPath = dest.replace(/^https?:\/\/[^\/]+\//, "/");
        const destFull = join(webDAVRoot, destPath === "/" ? "" : destPath);
        
        if (!existsSync(fullPath)) {
          res.status(404).json({ error: "Source not found" });
          return;
        }
        
        copyFileSync(fullPath, destFull);
        res.status(201).send("Copied");
        break;
      }
      
      case "MOVE": {
        const dest = req.headers.destination;
        if (!dest) {
          res.status(400).json({ error: "Destination required" });
          return;
        }
        
        const destPath = dest.replace(/^https?:\/\/[^\/]+\//, "/");
        const destFull = join(webDAVRoot, destPath === "/" ? "" : destPath);
        
        if (!existsSync(fullPath)) {
          res.status(404).json({ error: "Source not found" });
          return;
        }
        
        renameSync(fullPath, destFull);
        res.status(201).send("Moved");
        break;
      }
      
      default:
        next();
    }
  } catch (error) {
    next(error);
  }
}

export default {
  config: appConfig,
  init,
  setRoot,
  getRoot,
  handleWebDAV
};