/**
 * Settings App Types
 * 
 * Type definitions for the settings app
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */

export interface Setting {
  key: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  category: SettingCategory;
  description?: string;
  default?: unknown;
  readonly: boolean;
  public: boolean;
}

export type SettingCategory = 
  | 'general'
  | 'server'
  | 'security'
  | 'storage'
  | 'appearance'
  | 'integration'
  | 'advanced';

export interface UserPreference {
  userId: string;
  key: string;
  value: unknown;
  updatedAt: string;
}

export interface SettingsGroup {
  category: SettingCategory;
  name: string;
  description: string;
  settings: string[];
}

export interface SettingsExport {
  version: string;
  exportedAt: string;
  settings: Record<string, unknown>;
}

export interface SettingsImport {
  settings: Record<string, unknown>;
  merge?: boolean;
}

export const DEFAULT_SETTINGS: Setting[] = [
  {
    key: 'app.name',
    value: 'wizardo',
    type: 'string',
    category: 'general',
    description: 'Application name',
    default: 'wizardo',
    readonly: false,
    public: true,
  },
  {
    key: 'app.version',
    value: '1.0.0',
    type: 'string',
    category: 'general',
    description: 'Application version',
    default: '1.0.0',
    readonly: true,
    public: true,
  },
  {
    key: 'server.port',
    value: 3000,
    type: 'number',
    category: 'server',
    description: 'Server port',
    default: 3000,
    readonly: false,
    public: false,
  },
  {
    key: 'server.host',
    value: '0.0.0.0',
    type: 'string',
    category: 'server',
    description: 'Server host',
    default: '0.0.0.0',
    readonly: false,
    public: false,
  },
  {
    key: 'storage.root',
    value: './data',
    type: 'string',
    category: 'storage',
    description: 'Root directory for file storage',
    default: './data',
    readonly: false,
    public: false,
  },
  {
    key: 'security.sessionTimeout',
    value: 3600,
    type: 'number',
    category: 'security',
    description: 'Session timeout in seconds',
    default: 3600,
    readonly: false,
    public: false,
  },
  {
    key: 'appearance.theme',
    value: 'light',
    type: 'string',
    category: 'appearance',
    description: 'UI theme',
    default: 'light',
    readonly: false,
    public: true,
  },
  {
    key: 'appearance.language',
    value: 'en',
    type: 'string',
    category: 'appearance',
    description: 'UI language',
    default: 'en',
    readonly: false,
    public: true,
  },
];
