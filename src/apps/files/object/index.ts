/**
 * Files App Types
 * 
 * Type definitions for the files app
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */

export interface FileInfo {
  id: string;
  name: string;
  path: string;
  size: number;
  mtime: string;
  etag: string;
  type: 'dir' | 'file';
  mimeType: string;
  permissions: string;
}

export interface FilesConfig {
  storageRoot: string;
  maxFileSize: number;
  allowedExtensions: string[];
  enableVersioning: boolean;
}

export interface UploadResult {
  success: boolean;
  file?: FileInfo;
  error?: string;
}

export interface MoveResult {
  success: boolean;
  file?: FileInfo;
  error?: string;
}

export interface CopyResult {
  success: boolean;
  file?: FileInfo;
  error?: string;
}

// Re-export app config from modules
export const appConfig = {
  name: 'files',
  version: '1.0.0',
  description: 'Core file management app',
  author: 'wizardo',
  license: 'MIT'
};