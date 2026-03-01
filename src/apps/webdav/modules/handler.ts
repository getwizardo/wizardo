/**
 * WebDAV Handler Module
 * 
 * Handles WebDAV protocol operations
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */

import { 
  existsSync, 
  statSync, 
  readdirSync, 
  readFileSync, 
  writeFileSync, 
  mkdirSync, 
  rmSync, 
  renameSync,
  copyFileSync,
  constants 
} from 'fs';
import { join, dirname, basename, extname } from 'path';
import type { WebDAVResource, WebDAVLock, WebDAVMultiStatus, WebDAVError } from '../object/index.js';

export class WebDAVHandler {
  private root: string;
  private locks: Map<string, WebDAVLock> = new Map();

  constructor(root: string) {
    this.root = root;
  }

  /**
   * Set root directory
   */
  setRoot(root: string): void {
    this.root = root;
  }

  /**
   * Get full path from webdav path
   */
  private getFullPath(path: string): string {
    return join(this.root, path.replace(/^\//, ''));
  }

  /**
   * Check if path exists
   */
  exists(path: string): boolean {
    return existsSync(this.getFullPath(path));
  }

  /**
   * Check if path is a directory
   */
  isDirectory(path: string): boolean {
    try {
      return statSync(this.getFullPath(path)).isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Get resource info
   */
  getResource(path: string): WebDAVResource | null {
    const fullPath = this.getFullPath(path);
    
    try {
      const stat = statSync(fullPath);
      const isDir = stat.isDirectory();
      
      return {
        path,
        type: isDir ? 'collection' : 'file',
        size: isDir ? undefined : stat.size,
        modified: stat.mtime.toISOString(),
        etag: `"${stat.ino}-${stat.mtime.getTime()}"`,
        contentType: isDir ? undefined : this.getContentType(fullPath),
        created: stat.birthtime.toISOString(),
      };
    } catch {
      return null;
    }
  }

  /**
   * List directory contents
   */
  listDirectory(path: string, depth: number = 1): WebDAVResource[] {
    const fullPath = this.getFullPath(path);
    const resources: WebDAVResource[] = [];

    try {
      const entries = readdirSync(fullPath);
      
      for (const entry of entries) {
        const entryPath = join(path, entry);
        const resource = this.getResource(entryPath);
        
        if (resource) {
          resources.push(resource);
        }
        
        // Handle depth for collections
        if (depth > 1 && this.isDirectory(entryPath)) {
          const subResources = this.listDirectory(entryPath, depth - 1);
          resources.push(...subResources);
        }
      }
    } catch (err) {
      console.error('Failed to list directory:', err);
    }

    return resources;
  }

  /**
   * Read file content
   */
  readFile(path: string): Buffer | null {
    try {
      return readFileSync(this.getFullPath(path));
    } catch {
      return null;
    }
  }

  /**
   * Write file content
   */
  writeFile(path: string, content: Buffer): boolean {
    const fullPath = this.getFullPath(path);
    
    try {
      // Ensure parent directory exists
      const dir = dirname(fullPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      writeFileSync(fullPath, content);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create directory
   */
  mkcol(path: string): boolean {
    try {
      mkdirSync(this.getFullPath(path), { recursive: true });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete resource
   */
  delete(path: string): boolean {
    try {
      const fullPath = this.getFullPath(path);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        rmSync(fullPath, { recursive: true });
      } else {
        rmSync(fullPath);
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Copy resource
   */
  copy(source: string, destination: string, overwrite: boolean): boolean {
    const srcFull = this.getFullPath(source);
    const dstFull = this.getFullPath(destination);

    try {
      if (existsSync(dstFull) && !overwrite) {
        return false;
      }

      const stat = statSync(srcFull);
      
      if (stat.isDirectory()) {
        this.copyDirectory(srcFull, dstFull);
      } else {
        copyFileSync(srcFull, dstFull);
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Copy directory recursively
   */
  private copyDirectory(src: string, dst: string): void {
    mkdirSync(dst, { recursive: true });
    
    for (const entry of readdirSync(src)) {
      const srcPath = join(src, entry);
      const dstPath = join(dst, entry);
      
      if (statSync(srcPath).isDirectory()) {
        this.copyDirectory(srcPath, dstPath);
      } else {
        copyFileSync(srcPath, dstPath);
      }
    }
  }

  /**
   * Move resource
   */
  move(source: string, destination: string, overwrite: boolean): boolean {
    const srcFull = this.getFullPath(source);
    const dstFull = this.getFullPath(destination);

    try {
      if (existsSync(dstFull) && !overwrite) {
        return false;
      }

      renameSync(srcFull, dstFull);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Lock a resource
   */
  lock(path: string, owner: string, timeout: number = 300): WebDAVLock | null {
    // Check if already locked
    for (const lock of this.locks.values()) {
      if (lock.path === path) {
        return null;
      }
    }

    const token = `urn:uuid:${Date.now()}-${Math.random().toString(36).substr(2)}`;
    const lock: WebDAVLock = {
      token,
      path,
      owner,
      timeout,
      createdAt: Date.now(),
    };

    this.locks.set(token, lock);
    return lock;
  }

  /**
   * Unlock a resource
   */
  unlock(path: string, token: string): boolean {
    const lock = this.locks.get(token);
    
    if (!lock || lock.path !== path) {
      return false;
    }

    this.locks.delete(token);
    return true;
  }

  /**
   * Get locks for a resource
   */
  getLocks(path: string): WebDAVLock[] {
    return Array.from(this.locks.values()).filter(lock => lock.path === path);
  }

  /**
   * Get content type from extension
   */
  private getContentType(filePath: string): string {
    const ext = extname(filePath).toLowerCase();
    const types: Record<string, string> = {
      '.html': 'text/html',
      '.htm': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.pdf': 'application/pdf',
      '.zip': 'application/zip',
      '.tar': 'application/x-tar',
      '.gz': 'application/gzip',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.mp3': 'audio/mpeg',
      '.mp4': 'video/mp4',
    };
    
    return types[ext] || 'application/octet-stream';
  }
}

export default WebDAVHandler;
