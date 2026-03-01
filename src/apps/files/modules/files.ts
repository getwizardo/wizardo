/**
 * Files App - Core File Management
 * 
 * Main entry point for the Files app
 * Provides file management functionality similar to Nextcloud
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */

import { Router, Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { cwd } from 'process';

export const appConfig = {
  name: 'files',
  version: '1.0.0',
  description: 'Core file management app',
  author: 'wizardo',
  license: 'MIT'
};

const router = Router();

// Storage root - configurable
let storageRoot = path.join(cwd(), 'files');

/**
 * Initialize the files app
 */
export function init(): void {
  console.log('📁 Initializing Files app...');
  
  if (!fs.existsSync(storageRoot)) {
    fs.mkdirSync(storageRoot, { recursive: true });
  }
  
  // Create default folders
  const defaultFolders = ['Documents', 'Photos', 'Music', 'Videos', 'Downloads'];
  for (const folder of defaultFolders) {
    const folderPath = path.join(storageRoot, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  }
}

/**
 * Set storage root path
 */
export function setStorageRoot(rootPath: string): void {
  storageRoot = rootPath;
  if (!fs.existsSync(storageRoot)) {
    fs.mkdirSync(storageRoot, { recursive: true });
  }
}

/**
 * Get storage root path
 */
export function getStorageRoot(): string {
  return storageRoot;
}

/**
 * Get file info
 */
function getFileInfo(relativePath: string): any {
  const fullPath = path.join(storageRoot, relativePath === '/' ? '' : relativePath);
  
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  
  const stats = fs.statSync(fullPath);
  const isDir = stats.isDirectory();
  
  return {
    id: Buffer.from(relativePath).toString('base64').slice(0, 12),
    name: path.basename(relativePath) || '/',
    path: relativePath,
    size: isDir ? 0 : stats.size,
    mtime: stats.mtime.toISOString(),
    etag: `"${stats.ino}-${stats.mtime.getTime()}"`,
    type: isDir ? 'dir' : 'file',
    mimeType: isDir ? 'httpd/unix-directory' : getMimeType(relativePath),
    permissions: isDir ? 'RGDNVR' : 'RGDNVW'
  };
}

/**
 * Get MIME type
 */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase().slice(1);
  const mimeTypes: Record<string, string> = {
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    'pdf': 'application/pdf',
    'zip': 'application/zip',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'mp3': 'audio/mpeg',
    'mp4': 'video/mp4',
    'md': 'text/markdown'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * GET / - List root files
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestedPath = req.query.path as string || '/';
    const fullPath = path.join(storageRoot, requestedPath === '/' ? '' : requestedPath);
    
    if (!fs.existsSync(fullPath)) {
      res.status(404).json({ error: 'Path not found' });
      return;
    }
    
    const stats = fs.statSync(fullPath);
    
    if (stats.isFile()) {
      const content = fs.readFileSync(fullPath);
      res.setHeader('Content-Type', getMimeType(requestedPath));
      res.setHeader('Content-Length', stats.size);
      res.send(content);
      return;
    }
    
    // Directory - list contents
    const entries = fs.readdirSync(fullPath);
    const files = entries.map(entry => {
      const entryPath = path.join(requestedPath === '/' ? '' : requestedPath, entry);
      return getFileInfo(entryPath);
    }).filter(Boolean);
    
    // Sort: directories first, then by name
    files.sort((a, b) => {
      if (a.type === 'dir' && b.type !== 'dir') return -1;
      if (a.type !== 'dir' && b.type === 'dir') return 1;
      return a.name.localeCompare(b.name);
    });
    
    res.json({
      ocs: {
        meta: { status: 'ok', statuscode: 200 },
        data: files
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT / - Upload file
 */
router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filePath = req.query.path as string || req.body.path;
    const fullPath = path.join(storageRoot, filePath?.replace(/^\//, '') || '');
    
    // Create parent directories if needed
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    
    await new Promise<void>((resolve) => {
      req.on('end', resolve);
    });
    
    const buffer = Buffer.concat(chunks);
    fs.writeFileSync(fullPath, buffer);
    
    res.status(201).json({
      ocs: {
        meta: { status: 'ok', statuscode: 201 },
        data: getFileInfo(filePath)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /mkdir - Create directory
 */
router.post('/mkdir', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { path: dirPath } = req.body;
    const fullPath = path.join(storageRoot, dirPath?.replace(/^\//, '') || '');
    
    if (fs.existsSync(fullPath)) {
      res.status(405).json({ error: 'Directory already exists' });
      return;
    }
    
    fs.mkdirSync(fullPath, { recursive: true });
    
    res.status(201).json({
      ocs: {
        meta: { status: 'ok', statuscode: 201 },
        data: getFileInfo(dirPath)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE / - Delete file/directory
 */
router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filePath = req.query.path as string;
    const fullPath = path.join(storageRoot, filePath?.replace(/^\//, '') || '');
    
    if (!fs.existsSync(fullPath)) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true });
    } else {
      fs.unlinkSync(fullPath);
    }
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * MOVE / - Move/rename file
 */
router.post('/move', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { source, destination } = req.body;
    
    if (!source || !destination) {
      res.status(400).json({ error: 'Source and destination required' });
      return;
    }
    
    const sourcePath = path.join(storageRoot, source.replace(/^\//, ''));
    const destPath = path.join(storageRoot, destination.replace(/^\//, ''));
    
    if (!fs.existsSync(sourcePath)) {
      res.status(404).json({ error: 'Source not found' });
      return;
    }
    
    // Create parent directory if needed
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    fs.renameSync(sourcePath, destPath);
    
    res.json({
      ocs: {
        meta: { status: 'ok', statuscode: 200 },
        data: getFileInfo(destination)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * COPY / - Copy file
 */
router.post('/copy', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { source, destination } = req.body;
    
    if (!source || !destination) {
      res.status(400).json({ error: 'Source and destination required' });
      return;
    }
    
    const sourcePath = path.join(storageRoot, source.replace(/^\//, ''));
    const destPath = path.join(storageRoot, destination.replace(/^\//, ''));
    
    if (!fs.existsSync(sourcePath)) {
      res.status(404).json({ error: 'Source not found' });
      return;
    }
    
    // Create parent directory if needed
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    const stats = fs.statSync(sourcePath);
    if (stats.isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
    
    res.json({
      ocs: {
        meta: { status: 'ok', statuscode: 201 },
        data: getFileInfo(destination)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Copy directory recursively
 */
function copyDirectory(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src);
  for (const entry of entries) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stats = fs.statSync(srcPath);
    if (stats.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export default router;
