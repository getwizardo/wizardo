/**
 * WebDAV App Types and Interfaces
 * 
 * Type definitions for the webdav app
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */

export interface WebDAVConfig {
  root: string;
  lockTimeout: number;
  maxDepth: number;
  allowOrigin?: string;
}

export interface WebDAVLock {
  token: string;
  path: string;
  owner: string;
  timeout: number;
  createdAt: number;
}

export interface WebDAVResource {
  path: string;
  type: 'file' | 'collection';
  size?: number;
  modified?: string;
  etag?: string;
  contentType?: string;
  created?: string;
}

export interface WebDAVMultiStatus {
  responses: WebDAVResource[];
}

export interface WebDAVResponse {
  status: number;
  headers?: Record<string, string>;
  body?: string;
}

export type WebDAVMethod = 
  | 'GET' 
  | 'PUT' 
  | 'DELETE' 
  | 'MKCOL' 
  | 'PROPFIND' 
  | 'PROPPATCH' 
  | 'COPY' 
  | 'MOVE' 
  | 'LOCK' 
  | 'UNLOCK';

export interface WebDAVRequest {
  method: WebDAVMethod;
  path: string;
  headers: Record<string, string>;
  body?: Buffer;
  depth?: number;
  overwrite?: boolean;
  destination?: string;
  lockToken?: string;
  owner?: string;
}

export interface WebDAVError {
  error: string;
  message: string;
  status: number;
}

export interface LockInfo {
  locktoken: string;
  path: string;
  owner: string;
  timeout: number;
  depth: number;
}
