/**
 * Core App Types and Interfaces
 * 
 * Type definitions for the core app
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */

export interface AppInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  dependencies: string[];
  permissions: Permission[];
  features: string[];
  categories: string[];
}

export interface Permission {
  name: string;
  value: boolean | string;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  cpuUsage: number;
  memoryUsage: {
    total: number;
    free: number;
    used: number;
    percentage: number;
  };
  uptime: number;
  timestamp: string;
}

export interface AppManifest {
  id: string;
  path: string;
  enabled: boolean;
  info: AppInfo;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface ConfigValue {
  key: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  readonly: boolean;
  default?: unknown;
  description?: string;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn';
      message?: string;
    };
  };
  timestamp: string;
}

export type AppStatus = 'installed' | 'enabled' | 'disabled' | 'error';

export interface AppListQuery {
  status?: AppStatus;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AppListResult {
  apps: AppManifest[];
  total: number;
  limit: number;
  offset: number;
}
