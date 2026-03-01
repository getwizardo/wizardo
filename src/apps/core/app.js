/**
 * Core App - Core System Functions
 * 
 * Provides essential system functions for wizardo
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */
import { Request, Response, NextFunction } from "express";
import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { cpus, totalmem, freemem, uptime } from "os";

export const appConfig = {
  name: "core",
  version: "1.0.0",
  description: "Core system functions and utilities",
  author: "wizardo",
  license: "MIT"
};

export function init(): void {
  console.log("⚙️  Initializing core app...");
}

/**
 * Get system information
 */
export function getSystemInfo(): object {
  const cpuList = cpus();
  const cpuModel = cpuList[0]?.model || "Unknown";
  const cpuCores = cpuList.length;
  
  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    v8Version: process.versions.v8,
    cpu: {
      model: cpuModel,
      cores: cpuCores,
      load: cpuList.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
        const idle = cpu.times.idle;
        return acc + ((total - idle) / total * 100);
      }, 0) / cpuCores
    },
    memory: {
      total: totalmem(),
      free: freemem(),
      used: totalmem() - freemem()
    },
    uptime: uptime(),
    pid: process.pid
  };
}

/**
 * List installed apps
 */
export function listApps(appDir: string): object[] {
  const apps: object[] = [];
  
  if (!existsSync(appDir)) {
    return apps;
  }
  
  const entries = readdirSync(appDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const appInfoPath = join(appDir, entry.name, "appinfo.xml");
      apps.push({
        name: entry.name,
        installed: existsSync(appInfoPath)
      });
    }
  }
  
  return apps;
}

/**
 * Get app info by name
 */
export function getAppInfo(appDir: string, appName: string): object | null {
  const appInfoPath = join(appDir, appName, "appinfo.xml");
  
  if (!existsSync(appInfoPath)) {
    return null;
  }
  
  const content = readFileSync(appInfoPath, "utf-8");
  
  // Simple XML parsing
  const getTag = (tag: string): string => {
    const match = content.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
    return match ? match[1] : "";
  };
  
  return {
    name: getTag("appname"),
    version: getTag("version"),
    description: getTag("description"),
    author: getTag("author"),
    license: getTag("license")
  };
}

/**
 * Get logs
 */
export function getLogs(lines: number = 100): string[] {
  // This would read from actual log files in production
  return [
    `[${new Date().toISOString()}] INFO: Core app initialized`,
    `[${new Date().toISOString()}] INFO: System ready`
  ].slice(-lines);
}

export default {
  config: appConfig,
  init,
  getSystemInfo,
  listApps,
  getAppInfo,
  getLogs
};