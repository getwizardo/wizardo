/**
 * MIME Type Module
 * 
 * Handles MIME type detection and lookup
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */

import { extname } from 'path';
import type { MimeType, MimeResult, MimeOptions } from '../object/index.js';

export class MimeModule {
  private types: Map<string, MimeType> = new Map();
  private extensions: Map<string, string> = new Map();

  constructor() {
    this.initTypes();
  }

  /**
   * Initialize MIME types database
   */
  private initTypes(): void {
    const types: MimeType[] = [
      // Images
      { mime: 'image/png', extensions: ['png'], category: 'image' },
      { mime: 'image/jpeg', extensions: ['jpg', 'jpeg'], category: 'image' },
      { mime: 'image/gif', extensions: ['gif'], category: 'image' },
      { mime: 'image/webp', extensions: ['webp'], category: 'image' },
      { mime: 'image/svg+xml', extensions: ['svg'], category: 'image' },
      { mime: 'image/bmp', extensions: ['bmp'], category: 'image' },
      { mime: 'image/tiff', extensions: ['tiff', 'tif'], category: 'image' },
      { mime: 'image/x-icon', extensions: ['ico'], category: 'image' },
      
      // Audio
      { mime: 'audio/mpeg', extensions: ['mp3'], category: 'audio' },
      { mime: 'audio/wav', extensions: ['wav'], category: 'audio' },
      { mime: 'audio/ogg', extensions: ['ogg'], category: 'audio' },
      { mime: 'audio/flac', extensions: ['flac'], category: 'audio' },
      { mime: 'audio/aac', extensions: ['aac'], category: 'audio' },
      { mime: 'audio/mp4', extensions: ['m4a'], category: 'audio' },
      
      // Video
      { mime: 'video/mp4', extensions: ['mp4'], category: 'video' },
      { mime: 'video/webm', extensions: ['webm'], category: 'video' },
      { mime: 'video/x-msvideo', extensions: ['avi'], category: 'video' },
      { mime: 'video/quicktime', extensions: ['mov'], category: 'video' },
      { mime: 'video/x-matroska', extensions: ['mkv'], category: 'video' },
      
      // Text
      { mime: 'text/plain', extensions: ['txt', 'text'], category: 'text' },
      { mime: 'text/html', extensions: ['html', 'htm'], category: 'text' },
      { mime: 'text/css', extensions: ['css'], category: 'text' },
      { mime: 'text/javascript', extensions: ['js'], category: 'text' },
      { mime: 'text/markdown', extensions: ['md', 'markdown'], category: 'text' },
      { mime: 'text/xml', extensions: ['xml'], category: 'text' },
      { mime: 'text/csv', extensions: ['csv'], category: 'text' },
      { mime: 'text/xml', extensions: ['svg'], category: 'text' },
      
      // Application
      { mime: 'application/json', extensions: ['json'], category: 'application' },
      { mime: 'application/javascript', extensions: ['js'], category: 'application' },
      { mime: 'application/pdf', extensions: ['pdf'], category: 'application' },
      { mime: 'application/zip', extensions: ['zip'], category: 'application' },
      { mime: 'application/x-tar', extensions: ['tar'], category: 'application' },
      { mime: 'application/gzip', extensions: ['gz'], category: 'application' },
      { mime: 'application/x-rar-compressed', extensions: ['rar'], category: 'application' },
      { mime: 'application/x-7z-compressed', extensions: ['7z'], category: 'application' },
      { mime: 'application/msword', extensions: ['doc'], category: 'application' },
      { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', extensions: ['docx'], category: 'application' },
      { mime: 'application/vnd.ms-excel', extensions: ['xls'], category: 'application' },
      { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extensions: ['xlsx'], category: 'application' },
      { mime: 'application/vnd.ms-powerpoint', extensions: ['ppt'], category: 'application' },
      { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', extensions: ['pptx'], category: 'application' },
      { mime: 'application/octet-stream', extensions: ['bin'], category: 'application' },
      { mime: 'application/xml', extensions: ['xml', 'xsd'], category: 'application' },
      
      // Fonts
      { mime: 'font/woff', extensions: ['woff'], category: 'application' },
      { mime: 'font/woff2', extensions: ['woff2'], category: 'application' },
      { mime: 'font/ttf', extensions: ['ttf'], category: 'application' },
      { mime: 'font/otf', extensions: ['otf'], category: 'application' },
      
      // OpenDocument
      { mime: 'application/vnd.oasis.opendocument.text', extensions: ['odt'], category: 'application' },
      { mime: 'application/vnd.oasis.opendocument.spreadsheet', extensions: ['ods'], category: 'application' },
      { mime: 'application/vnd.oasis.opendocument.presentation', extensions: ['odp'], category: 'application' },
    ];

    for (const type of types) {
      this.types.set(type.mime, type);
      for (const ext of type.extensions) {
        this.extensions.set(ext, type.mime);
      }
    }
  }

  /**
   * Get MIME type from filename
   */
  getMimeType(filename: string, options: MimeOptions = {}): MimeResult {
    const ext = extname(filename).toLowerCase().slice(1);
    const defaultMime = options.default || 'application/octet-stream';
    
    if (!ext) {
      return {
        mime: defaultMime,
        extension: '',
        category: 'application',
      };
    }

    const mime = this.extensions.get(ext) || defaultMime;
    const type = this.types.get(mime);

    return {
      mime,
      extension: ext,
      description: type?.description,
      category: type?.category || 'application',
    };
  }

  /**
   * Get extensions for a MIME type
   */
  getExtensions(mime: string): string[] {
    const type = this.types.get(mime);
    return type?.extensions || [];
  }

  /**
   * Check if MIME type is text
   */
  isText(mime: string): boolean {
    return mime.startsWith('text/') || 
           mime === 'application/json' || 
           mime === 'application/javascript';
  }

  /**
   * Check if MIME type is image
   */
  isImage(mime: string): boolean {
    return mime.startsWith('image/');
  }

  /**
   * Check if MIME type is video
   */
  isVideo(mime: string): boolean {
    return mime.startsWith('video/');
  }

  /**
   * Check if MIME type is audio
   */
  isAudio(mime: string): boolean {
    return mime.startsWith('audio/');
  }

  /**
   * Get all MIME types
   */
  getAllMimeTypes(): MimeType[] {
    return Array.from(this.types.values());
  }
}

export default new MimeModule();
