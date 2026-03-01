/**
 * App Manager Module - Application Management
 * 
 * Handles app loading, enabling, disabling
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */

import { readdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { cwd } from 'process';
import type { AppManifest, AppInfo, AppListQuery, AppListResult, AppStatus } from '../object/index.js';

export class AppManager {
  private apps: Map<string, AppManifest> = new Map();
  private appDir: string;

  constructor(appDir?: string) {
    this.appDir = appDir || join(cwd(), 'app');
  }

  /**
   * Load all apps from the app directory
   */
  loadApps(): void {
    if (!existsSync(this.appDir)) {
      console.warn(`App directory not found: ${this.appDir}`);
      return;
    }

    const entries = readdirSync(this.appDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      
      const appPath = join(this.appDir, entry.name);
      const appinfoPath = join(appPath, 'appinfo.xml');
      
      if (!existsSync(appinfoPath)) continue;

      try {
        const appInfo = this.parseAppInfo(appinfoPath);
        const manifest: AppManifest = {
          id: entry.name,
          path: appPath,
          enabled: true,
          info: appInfo,
        };
        
        this.apps.set(entry.name, manifest);
        console.log(`📦 Loaded app: ${entry.name} v${appInfo.version}`);
      } catch (err) {
        console.warn(`⚠️  Failed to load app ${entry.name}:`, err);
      }
    }
  }

  /**
   * Parse appinfo.xml to get app info
   */
  private parseAppInfo(appinfoPath: string): AppInfo {
    const xml = readFileSync(appinfoPath, 'utf-8');
    
    // Simple XML parsing
    const getValue = (tag: string): string => {
      const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
      return match ? match[1] : '';
    };

    const getDeps = (): string[] => {
      const matches = xml.matchAll(/<ext:dependency\s+name="([^"]+)"/g);
      return Array.from(matches, m => m[1]);
    };

    const getPermissions = (): { name: string; value: boolean | string }[] => {
      const matches = xml.matchAll(/<pasv:permission\s+name="([^"]+)"\s+value="([^"]+)"/g);
      return Array.from(matches, m => ({
        name: m[1],
        value: m[2] === 'true' ? true : m[2] === 'false' ? false : m[2],
      }));
    };

    return {
      id: getValue('appname'),
      name: getValue('name'),
      version: getValue('version'),
      description: getValue('description'),
      author: getValue('author'),
      license: getValue('license'),
      dependencies: getDeps(),
      permissions: getPermissions(),
      features: [],
      categories: [],
    };
  }

  /**
   * Get app by ID
   */
  getApp(id: string): AppManifest | undefined {
    return this.apps.get(id);
  }

  /**
   * List all apps with optional filtering
   */
  listApps(query: AppListQuery = {}): AppListResult {
    let apps = Array.from(this.apps.values());

    // Filter by status
    if (query.status) {
      apps = apps.filter(app => {
        switch (query.status) {
          case 'enabled': return app.enabled;
          case 'disabled': return !app.enabled;
          case 'installed': return true;
          default: return true;
        }
      });
    }

    // Filter by search
    if (query.search) {
      const search = query.search.toLowerCase();
      apps = apps.filter(app => 
        app.info.name.toLowerCase().includes(search) ||
        app.info.description.toLowerCase().includes(search)
      );
    }

    // Filter by category
    if (query.category) {
      apps = apps.filter(app => app.info.categories.includes(query.category!));
    }

    const total = apps.length;
    const limit = query.limit || 50;
    const offset = query.offset || 0;

    apps = apps.slice(offset, offset + limit);

    return {
      apps,
      total,
      limit,
      offset,
    };
  }

  /**
   * Enable an app
   */
  enableApp(id: string): boolean {
    const app = this.apps.get(id);
    if (!app) return false;
    app.enabled = true;
    return true;
  }

  /**
   * Disable an app
   */
  disableApp(id: string): boolean {
    const app = this.apps.get(id);
    if (!app) return false;
    app.enabled = false;
    return true;
  }
}

export default new AppManager();
