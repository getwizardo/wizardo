/**
 * Settings Module
 * 
 * Manages application settings
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { cwd } from 'process';
import type { Setting, SettingCategory, SettingsGroup, UserPreference, SettingsExport } from '../object/index.js';
import { DEFAULT_SETTINGS } from '../object/index.js';

export class SettingsModule {
  private settings: Map<string, Setting> = new Map();
  private userPreferences: Map<string, Map<string, UserPreference>> = new Map();
  private configDir: string;
  private configFile: string;

  constructor(configDir?: string) {
    this.configDir = configDir || join(cwd(), 'config');
    this.configFile = join(this.configDir, 'settings.json');
    this.init();
  }

  /**
   * Initialize settings
   */
  private init(): void {
    // Load default settings
    for (const setting of DEFAULT_SETTINGS) {
      this.settings.set(setting.key, { ...setting });
    }

    // Load saved settings
    this.load();
  }

  /**
   * Load settings from file
   */
  private load(): void {
    if (!existsSync(this.configFile)) {
      return;
    }

    try {
      const data = readFileSync(this.configFile, 'utf-8');
      const parsed = JSON.parse(data);
      
      if (parsed.settings) {
        for (const [key, value] of Object.entries(parsed.settings)) {
          const setting = this.settings.get(key);
          if (setting && !setting.readonly) {
            setting.value = value;
            this.settings.set(key, setting);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load settings:', err);
    }
  }

  /**
   * Save settings to file
   */
  private save(): void {
    if (!existsSync(this.configDir)) {
      mkdirSync(this.configDir, { recursive: true });
    }

    const data: Record<string, unknown> = {};
    for (const [key, setting] of this.settings) {
      if (!setting.readonly) {
        data[key] = setting.value;
      }
    }

    writeFileSync(this.configFile, JSON.stringify({ settings: data }, null, 2));
  }

  /**
   * Get a setting value
   */
  get(key: string): unknown {
    return this.settings.get(key)?.value;
  }

  /**
   * Get a setting with full info
   */
  getSetting(key: string): Setting | undefined {
    return this.settings.get(key);
  }

  /**
   * Set a setting value
   */
  set(key: string, value: unknown): boolean {
    const setting = this.settings.get(key);
    
    if (!setting) {
      return false;
    }

    if (setting.readonly) {
      return false;
    }

    setting.value = value;
    this.settings.set(key, setting);
    this.save();
    return true;
  }

  /**
   * Get all settings
   */
  getAll(includePrivate: boolean = false): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    
    for (const [key, setting] of this.settings) {
      if (includePrivate || setting.public) {
        result[key] = setting.value;
      }
    }

    return result;
  }

  /**
   * Get settings by category
   */
  getByCategory(category: SettingCategory): Setting[] {
    return Array.from(this.settings.values())
      .filter(s => s.category === category);
  }

  /**
   * Get all categories
   */
  getCategories(): SettingsGroup[] {
    const categories: SettingsGroup[] = [
      { category: 'general', name: 'General', description: 'General settings', settings: [] },
      { category: 'server', name: 'Server', description: 'Server configuration', settings: [] },
      { category: 'security', name: 'Security', description: 'Security settings', settings: [] },
      { category: 'storage', name: 'Storage', description: 'Storage settings', settings: [] },
      { category: 'appearance', name: 'Appearance', description: 'UI appearance', settings: [] },
      { category: 'integration', name: 'Integration', description: 'Third-party integrations', settings: [] },
      { category: 'advanced', name: 'Advanced', description: 'Advanced settings', settings: [] },
    ];

    for (const [key, setting] of this.settings) {
      const group = categories.find(c => c.category === setting.category);
      if (group) {
        group.settings.push(key);
      }
    }

    return categories;
  }

  /**
   * Delete a setting (reset to default)
   */
  delete(key: string): boolean {
    const setting = this.settings.get(key);
    
    if (!setting || setting.readonly) {
      return false;
    }

    setting.value = setting.default;
    this.settings.set(key, setting);
    this.save();
    return true;
  }

  /**
   * Reset all settings to default
   */
  resetAll(): void {
    for (const [key, setting] of this.settings) {
      if (!setting.readonly) {
        setting.value = setting.default;
        this.settings.set(key, setting);
      }
    }
    this.save();
  }

  /**
   * Export settings
   */
  exportSettings(): SettingsExport {
    const settings: Record<string, unknown> = {};
    
    for (const [key, setting] of this.settings) {
      if (!setting.readonly) {
        settings[key] = setting.value;
      }
    }

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      settings,
    };
  }

  /**
   * Import settings
   */
  importSettings(settings: Record<string, unknown>, merge: boolean = true): boolean {
    try {
      if (!merge) {
        this.resetAll();
      }

      for (const [key, value] of Object.entries(settings)) {
        this.set(key, value);
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get user preference
   */
  getUserPreference(userId: string, key: string): unknown {
    const userPrefs = this.userPreferences.get(userId);
    return userPrefs?.get(key)?.value;
  }

  /**
   * Set user preference
   */
  setUserPreference(userId: string, key: string, value: unknown): void {
    let userPrefs = this.userPreferences.get(userId);
    
    if (!userPrefs) {
      userPrefs = new Map();
      this.userPreferences.set(userId, userPrefs);
    }

    userPrefs.set(key, {
      userId,
      key,
      value,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Delete user preference
   */
  deleteUserPreference(userId: string, key: string): boolean {
    const userPrefs = this.userPreferences.get(userId);
    return userPrefs?.delete(key) || false;
  }
}

export default new SettingsModule();
