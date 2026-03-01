/**
 * Settings App - Configuration Management
 * 
 * Manages application settings and user preferences
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */
import { Request, Response, NextFunction } from "express";

export const appConfig = {
  name: "settings",
  version: "1.0.0",
  description: "Application settings and configuration",
  author: "wizardo",
  license: "MIT"
};

// Default settings
const defaultSettings = {
  app: {
    name: "wizardo",
    version: "1.0.0",
    language: "en",
    timezone: "UTC"
  },
  server: {
    port: 3000,
    host: "0.0.0.0"
  },
  storage: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedExtensions: []
  },
  security: {
    sessionTimeout: 86400,
    maxLoginAttempts: 5
  },
  theme: {
    mode: "light",
    primaryColor: "#3b82f6"
  }
};

// In-memory settings store
let settings = { ...defaultSettings };

// User preferences
const userPreferences: Map<string, object> = new Map();

export function init(): void {
  console.log("⚙️  Initializing settings app...");
}

/**
 * Get all settings
 */
export function getSettings(): object {
  return { ...settings };
}

/**
 * Get setting by key
 */
export function getSetting(key: string): any {
  const keys = key.split(".");
  let value: any = settings;
  
  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      return undefined;
    }
  }
  
  return value;
}

/**
 * Update settings
 */
export function updateSettings(newSettings: object): void {
  settings = { ...settings, ...newSettings };
}

/**
 * Set setting by key
 */
export function setSetting(key: string, value: any): void {
  const keys = key.split(".");
  let obj: any = settings;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!(k in obj)) {
      obj[k] = {};
    }
    obj = obj[k];
  }
  
  obj[keys[keys.length - 1]] = value;
}

/**
 * Reset to defaults
 */
export function resetSettings(): void {
  settings = { ...defaultSettings };
}

/**
 * Get user preferences
 */
export function getUserPreferences(username: string): object {
  return (userPreferences.get(username) || {}) as object;
}

/**
 * Update user preferences
 */
export function updateUserPreferences(username: string, prefs: object): void {
  const current = (userPreferences.get(username) || {}) as object;
  userPreferences.set(username, { ...current, ...prefs });
}

export default {
  config: appConfig,
  init,
  getSettings,
  getSetting,
  updateSettings,
  setSetting,
  resetSettings,
  getUserPreferences,
  updateUserPreferences
};