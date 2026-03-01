/**
 * MIME App - MIME Type Management
 * 
 * Provides MIME type detection and management
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */
import { Request, Response, NextFunction } from "express";

export const appConfig = {
  name: "mime",
  version: "1.0.0",
  description: "MIME type detection and management",
  author: "wizardo",
  license: "MIT"
};

// Comprehensive MIME type mappings
const mimeTypes: Record<string, string> = {
  // Text
  "txt": "text/plain",
  "html": "text/html",
  "htm": "text/html",
  "css": "text/css",
  "scss": "text/x-scss",
  "sass": "text/x-sass",
  "less": "text/x-less",
  "js": "application/javascript",
  "mjs": "application/javascript",
  "ts": "application/typescript",
  "tsx": "text/tsx",
  "jsx": "text/jsx",
  "json": "application/json",
  "xml": "application/xml",
  "xsl": "application/xslt+xml",
  "svg": "image/svg+xml",
  "md": "text/markdown",
  "markdown": "text/markdown",
  "yaml": "text/yaml",
  "yml": "text/yaml",
  "csv": "text/csv",
  "ini": "text/plain",
  "cfg": "text/plain",
  "conf": "text/plain",
  
  // Images
  "jpg": "image/jpeg",
  "jpeg": "image/jpeg",
  "png": "image/png",
  "gif": "image/gif",
  "webp": "image/webp",
  "bmp": "image/bmp",
  "ico": "image/x-icon",
  "tiff": "image/tiff",
  "tif": "image/tiff",
  "svgz": "image/svg+xml",
  "psd": "image/vnd.adobe.photoshop",
  "ai": "application/illustrator",
  "eps": "application/eps",
  
  // Audio
  "mp3": "audio/mpeg",
  "wav": "audio/wav",
  "ogg": "audio/ogg",
  "flac": "audio/flac",
  "aac": "audio/aac",
  "m4a": "audio/mp4",
  "wma": "audio/x-ms-wma",
  "opus": "audio/opus",
  
  // Video
  "mp4": "video/mp4",
  "avi": "video/x-msvideo",
  "mov": "video/quicktime",
  "wmv": "video/x-ms-wmv",
  "flv": "video/x-flv",
  "webm": "video/webm",
  "mkv": "video/x-matroska",
  "m4v": "video/x-m4v",
  "mpeg": "video/mpeg",
  "mpg": "video/mpeg",
  
  // Archives
  "zip": "application/zip",
  "rar": "application/x-rar-compressed",
  "7z": "application/x-7z-compressed",
  "tar": "application/x-tar",
  "gz": "application/gzip",
  "bz2": "application/x-bzip2",
  "xz": "application/x-xz",
  "iso": "application/x-iso9660-image",
  
  // Documents
  "pdf": "application/pdf",
  "doc": "application/msword",
  "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "xls": "application/vnd.ms-excel",
  "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "ppt": "application/vnd.ms-powerpoint",
  "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "odt": "application/vnd.oasis.opendocument.text",
  "ods": "application/vnd.oasis.opendocument.spreadsheet",
  "odp": "application/vnd.oasis.opendocument.presentation",
  "rtf": "application/rtf",
  "tex": "text/x-tex",
  
  // Code
  "c": "text/x-c",
  "h": "text/x-c",
  "cpp": "text/x-c++",
  "hpp": "text/x-c++",
  "java": "text/x-java",
  "py": "text/x-python",
  "rb": "text/x-ruby",
  "php": "text/x-php",
  "swift": "text/x-swift",
  "go": "text/x-go",
  "rs": "text/x-rust",
  "sql": "text/x-sql",
  "sh": "application/x-sh",
  "bash": "application/x-sh",
  "zsh": "application/x-sh",
  "ps1": "text/x-powershell",
  "bat": "text/x-batch",
  "cmd": "text/x-batch",
  
  // Executables
  "exe": "application/x-msdownload",
  "dll": "application/x-msdownload",
  "so": "application/x-sharedlib",
  "dylib": "application/x-sharedlib",
  "app": "application/x-apple-diskimage",
  
  // Fonts
  "ttf": "font/ttf",
  "otf": "font/otf",
  "woff": "font/woff",
  "woff2": "font/woff2",
  "eot": "application/vnd.ms-fontobject",
  
  // Other
  "wasm": "application/wasm",
  "wasm": "application/wasm",
  "wasm": "application/wasm",
};

// Reverse mapping: MIME -> extensions
const extensions: Record<string, string[]> = {};
for (const [ext, mime] of Object.entries(mimeTypes)) {
  if (!extensions[mime]) {
    extensions[mime] = [];
  }
  extensions[mime].push(ext);
}

export function init(): void {
  console.log("� MIME Initializing mime app...");
}

/**
 * Get MIME type from filename/extension
 */
export function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return mimeTypes[ext] || "application/octet-stream";
}

/**
 * Get extensions for MIME type
 */
export function getExtensions(mimeType: string): string[] {
  return extensions[mimeType] || [];
}

/**
 * Get all MIME types
 */
export function getAllMimeTypes(): Record<string, string> {
  return { ...mimeTypes };
}

/**
 * Check if MIME type is text-based
 */
export function isText(mimeType: string): boolean {
  return mimeType.startsWith("text/") || 
         mimeType.includes("javascript") || 
         mimeType.includes("json") ||
         mimeType.includes("xml");
}

/**
 * Check if MIME type is image
 */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/**
 * Check if MIME type is video
 */
export function isVideo(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}

/**
 * Check if MIME type is audio
 */
export function isAudio(mimeType: string): boolean {
  return mimeType.startsWith("audio/");
}

export default {
  config: appConfig,
  init,
  getMimeType,
  getExtensions,
  getAllMimeTypes,
  isText,
  isImage,
  isVideo,
  isAudio
};