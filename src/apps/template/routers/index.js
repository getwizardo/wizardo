/**
 * Template App Router
 * 
 * This router handles the /template API endpoints
 * Similar to Nextcloud WebDAV and Files app APIs
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */
import { Request, Response, NextFunction } from "express";
import { 
  getInfo, 
  listFiles, 
  createFolder, 
  uploadFile, 
  downloadFile,
  deleteItem,
  renameItem,
  moveItem,
  getItemInfo,
  healthCheck
} from "../app.js";

export const path = "/template";
export const method = "use";
export const priority = 10;

export async function handler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const method = req.method.toUpperCase();
    const path = req.path;

    // API endpoints
    if (path === "/info" || path === "/api/info") {
      res.json(getInfo());
      return;
    }
    
    if (path === "/health" || path === "/api/health") {
      await healthCheck(req, res, next);
      return;
    }

    // Files API - GET /files (list)
    if (method === "GET" && (path === "/files" || path.startsWith("/files/"))) {
      const queryPath = path === "/files" ? "/" : path.replace("/files", "");
      req.query.path = queryPath;
      await listFiles(req, res, next);
      return;
    }

    // Files API - POST /files (create folder or upload)
    if (method === "POST" && path === "/files") {
      if (req.body.operation === "createFolder") {
        await createFolder(req, res, next);
      } else if (req.body.operation === "upload") {
        await uploadFile(req, res, next);
      } else {
        res.status(400).json({ error: "Unknown operation" });
      }
      return;
    }

    // Files API - DELETE /files (delete)
    if (method === "DELETE" && (path === "/files" || path.startsWith("/files/"))) {
      const deletePath = path === "/files" ? "/" : path.replace("/files", "");
      req.body.path = deletePath;
      await deleteItem(req, res, next);
      return;
    }

    // Files API - PUT /files (rename)
    if (method === "PUT" && (path === "/files" || path.startsWith("/files/"))) {
      const renamePath = path === "/files" ? "/" : path.replace("/files", "");
      req.body.path = renamePath;
      await renameItem(req, res, next);
      return;
    }

    // Files API - MOVE /files (move)
    if (method === "MOVE" && (path === "/files" || path.startsWith("/files/"))) {
      const movePath = path === "/files" ? "/" : path.replace("/files", "");
      req.body.path = movePath;
      await moveItem(req, res, next);
      return;
    }

    // Download file
    if (method === "GET" && path.startsWith("/download")) {
      const downloadPath = path.replace("/download", "");
      req.params[0] = downloadPath;
      await downloadFile(req, res, next);
      return;
    }

    // Get item info
    if (method === "GET" && path.startsWith("/info")) {
      const infoPath = path.replace("/info", "");
      req.query.path = infoPath || "/";
      await getItemInfo(req, res, next);
      return;
    }

    // Default: show available endpoints
    res.json({
      app: "template",
      version: "1.0.0",
      endpoints: [
        { method: "GET", path: "/template/info", description: "Get app info" },
        { method: "GET", path: "/template/health", description: "Health check" },
        { method: "GET", path: "/template/files", description: "List files (root)" },
        { method: "GET", path: "/template/files/<path>", description: "List files in path" },
        { method: "POST", path: "/template/files", description: "Create folder or upload file", body: { operation: "createFolder|upload", path: "...", content: "..." }},
        { method: "DELETE", path: "/template/files/<path>", description: "Delete file or folder" },
        { method: "PUT", path: "/template/files/<path>", description: "Rename file or folder", body: { newName: "..." }},
        { method: "MOVE", path: "/template/files/<path>", description: "Move file or folder", body: { destination: "/new/path" }},
        { method: "GET", path: "/template/download/<path>", description: "Download file" },
        { method: "GET", path: "/template/info/<path>", description: "Get file/folder info" }
      ]
    });
  } catch (error) {
    next(error);
  }
}