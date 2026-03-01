/**
 * Template App - Main Application Module
 * 
 * This is the main entry point for the template app
 * Similar to Nextcloud file management functionality
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */

import { Request, Response, NextFunction } from "express";
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, statSync, unlinkSync, renameSync, appendFileSync } from "fs";
import { join, dirname, basename } from "path";
import { cwd } from "process";

/**
 * App configuration
 */
export const appConfig = {
  name: "template",
  version: "1.0.0",
  description: "Nextcloud-like file management app for wizardo",
  author: "wizardo",
  license: "MIT",
  enabled: true,
  dataPath: join(cwd(), "app", "template", "data")
};

/**
 * Ensure data directory exists
 */
function ensureDataDir(): void {
  if (!existsSync(appConfig.dataPath)) {
    mkdirSync(appConfig.dataPath, { recursive: true });
  }
}

/**
 * Initialize the app
 * Called when the app is loaded by wizardo
 */
export function init(): void {
  ensureDataDir();
  console.log("📦 Initializing template app (Nextcloud-like)...");
  console.log(`📁 Data path: ${appConfig.dataPath}`);
}

/**
 * Get app info
 */
export function getInfo(): object {
  return {
    name: appConfig.name,
    version: appConfig.version,
    description: appConfig.description,
    author: appConfig.author,
    license: appConfig.license,
    features: [
      "file_management",
      "folder_management", 
      "file_upload",
      "file_download",
      "file_delete",
      "file_rename",
      "file_move",
      "file_share"
    ]
  };
}

/**
 * List files and folders (like Nextcloud files app)
 */
export async function listFiles(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    ensureDataDir();
    const path = req.query.path || "/";
    const targetPath = path === "/" ? appConfig.dataPath : join(appConfig.dataPath, path);
    
    if (!targetPath.startsWith(appConfig.dataPath)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    
    if (!existsSync(targetPath)) {
      res.status(404).json({ error: "Path not found" });
      return;
    }
    
    const items = readdirSync(targetPath, { withFileTypes: true });
    const files = items.map(item => ({
      name: item.name,
      type: item.isDirectory() ? "folder" : "file",
      path: path === "/" ? `/${item.name}` : `${path}/${item.name}`,
      size: item.isFile() ? statSync(join(targetPath, item.name)).size : 0,
      mtime: statSync(join(targetPath, item.name)).mtime.toISOString()
    }));
    
    res.json({
      path,
      items: files.sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create folder (like Nextcloud new folder)
 */
export async function createFolder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    ensureDataDir();
    const { path: folderPath } = req.body;
    
    if (!folderPath) {
      res.status(400).json({ error: "Path is required" });
      return;
    }
    
    const targetPath = join(appConfig.dataPath, folderPath);
    
    if (!targetPath.startsWith(appConfig.dataPath)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    
    if (existsSync(targetPath)) {
      res.status(409).json({ error: "Folder already exists" });
      return;
    }
    
    mkdirSync(targetPath, { recursive: true });
    
    res.json({ success: true, path: folderPath, type: "folder" });
  } catch (error) {
    next(error);
  }
}

/**
 * Upload file (like Nextcloud upload)
 */
export async function uploadFile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    ensureDataDir();
    const { path: filePath, content } = req.body;
    
    if (!filePath || content === undefined) {
      res.status(400).json({ error: "Path and content are required" });
      return;
    }
    
    const targetPath = join(appConfig.dataPath, filePath);
    
    if (!targetPath.startsWith(appConfig.dataPath)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    
    const dir = dirname(targetPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    writeFileSync(targetPath, content, "utf-8");
    
    res.json({ success: true, path: filePath, type: "file" });
  } catch (error) {
    next(error);
  }
}

/**
 * Download file (like Nextcloud download)
 */
export async function downloadFile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const filePath = req.params[0] || req.query.path;
    
    if (!filePath) {
      res.status(400).json({ error: "Path is required" });
      return;
    }
    
    const targetPath = join(appConfig.dataPath, filePath);
    
    if (!targetPath.startsWith(appConfig.dataPath)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    
    if (!existsSync(targetPath)) {
      res.status(404).json({ error: "File not found" });
      return;
    }
    
    const stat = statSync(targetPath);
    if (stat.isDirectory()) {
      res.status(400).json({ error: "Cannot download folder" });
      return;
    }
    
    const content = readFileSync(targetPath, "utf-8");
    res.json({ path: filePath, content, size: stat.size });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete file or folder (like Nextcloud delete)
 */
export async function deleteItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { path: itemPath } = req.body;
    
    if (!itemPath) {
      res.status(400).json({ error: "Path is required" });
      return;
    }
    
    const targetPath = join(appConfig.dataPath, itemPath);
    
    if (!targetPath.startsWith(appConfig.dataPath)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    
    if (!existsSync(targetPath)) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    
    const stat = statSync(targetPath);
    if (stat.isDirectory()) {
      rmSync(targetPath, { recursive: true });
    } else {
      unlinkSync(targetPath);
    }
    
    res.json({ success: true, path: itemPath });
  } catch (error) {
    next(error);
  }
}

/**
 * Rename file or folder (like Nextcloud rename)
 */
export async function renameItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { path: oldPath, newName } = req.body;
    
    if (!oldPath || !newName) {
      res.status(400).json({ error: "Path and newName are required" });
      return;
    }
    
    const oldTargetPath = join(appConfig.dataPath, oldPath);
    const newTargetPath = join(dirname(oldTargetPath), newName);
    
    if (!oldTargetPath.startsWith(appConfig.dataPath) || !newTargetPath.startsWith(appConfig.dataPath)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    
    if (!existsSync(oldTargetPath)) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    
    renameSync(oldTargetPath, newTargetPath);
    
    res.json({ success: true, oldPath, newPath: join(dirname(oldPath), newName) });
  } catch (error) {
    next(error);
  }
}

/**
 * Move file or folder (like Nextcloud move)
 */
export async function moveItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { path: sourcePath, destination } = req.body;
    
    if (!sourcePath || !destination) {
      res.status(400).json({ error: "Path and destination are required" });
      return;
    }
    
    const sourceTargetPath = join(appConfig.dataPath, sourcePath);
    const destTargetPath = join(appConfig.dataPath, destination, basename(sourcePath));
    
    if (!sourceTargetPath.startsWith(appConfig.dataPath) || !destTargetPath.startsWith(appConfig.dataPath)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    
    if (!existsSync(sourceTargetPath)) {
      res.status(404).json({ error: "Source not found" });
      return;
    }
    
    const destDir = dirname(destTargetPath);
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }
    
    renameSync(sourceTargetPath, destTargetPath);
    
    res.json({ success: true, sourcePath, destination: join(destination, basename(sourcePath)) });
  } catch (error) {
    next(error);
  }
}

/**
 * Get file/folder info (like Nextcloud properties)
 */
export async function getItemInfo(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { path } = req.query;
    
    if (!path) {
      res.status(400).json({ error: "Path is required" });
      return;
    }
    
    const targetPath = join(appConfig.dataPath, path);
    
    if (!targetPath.startsWith(appConfig.dataPath)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    
    if (!existsSync(targetPath)) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    
    const stat = statSync(targetPath);
    res.json({
      path,
      name: basename(targetPath),
      type: stat.isDirectory() ? "folder" : "file",
      size: stat.size,
      created: stat.birthtime.toISOString(),
      modified: stat.mtime.toISOString(),
      permissions: stat.mode.toString(8)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Health check endpoint
 */
export async function healthCheck(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    ensureDataDir();
    res.json({
      app: appConfig.name,
      status: "healthy",
      timestamp: new Date().toISOString(),
      dataPath: appConfig.dataPath,
      dataExists: existsSync(appConfig.dataPath)
    });
  } catch (error) {
    next(error);
  }
}

export default {
  config: appConfig,
  init,
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
};