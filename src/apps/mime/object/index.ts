/**
 * MIME App Types
 * 
 * Type definitions for the mime app
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */

export interface MimeType {
  mime: string;
  extensions: string[];
  description?: string;
  category: 'application' | 'audio' | 'image' | 'message' | 'model' | 'multipart' | 'text' | 'video' | 'chemical' | 'x_conference' | 'x_world';
}

export interface MimeCategory {
  name: string;
  description: string;
  types: string[];
}

export interface MimeResult {
  mime: string;
  extension: string;
  description?: string;
  category: string;
}

export interface MimeOptions {
  default?: string;
  useAliases?: boolean;
}
