/**
 * Config Service - Configuration Management
 * 
 * Handles app configuration
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { cwd } from 'process';
import type { ConfigValue } from '../object/index.js';

export class ConfigService {
  private config: Map<string, ConfigValue> = new Map();
  private configFile: string;

  constructor(configDir?: string) {
    const dir = configDir || join(cwd(), 'config');
    this.configFile = join(dir, 'core.json');
    this.load();
  }

  /**
   * Load configuration from file
   */
  private load(): void {
    if (existsSync(this.configFile)) {
      try {
        const data = readFileSync(this.configFile, 'utf-8');
        const parsed = JSON.parse(data);
        for (const [key, value] of Object.entries(parsed)) {
          this.config.set(key, value as ConfigValue);
        }
      } catch (err) {
        console.warn('Failed to load config:', err);
      }
    }
  }

  /**
   * Save configuration to file
   */
  private save(): void {
    const data: Record<string, unknown> = {};
    for (const [key, value] of this.config) {
      data[key] = value;
    }
    writeFileSync(this.configFile, JSON.stringify(data, null, 2));
  }

  /**
   * Get a config value
   */
  get(key: string): unknown {
    return this.config.get(key)?.value;
  }

  /**
   * Set a config value
   */
  set(key: string, value: unknown, type?: ConfigValue['type'], readonly = false): void {
    const configValue: ConfigValue = {
      key,
      value,
      type: type || typeof value as ConfigValue['type'],
      readonly,
    };
    this.config.set(key, configValue);
    this.save();
  }

  /**
   * Get all config values
   */
  getAll(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of this.config) {
      if (!value.readonly) {
        result[key] = value.value;
      }
    }
    return result;
  }

  /**
   * Delete a config value
   */
  delete(key: string): boolean {
    const result = this.config.delete(key);
    if (result) this.save();
    return result;
  }

  /**
   * Check if a key exists
   */
  has(key: string): boolean {
    return this.config.has(key);
  }
}

export default new ConfigService();
