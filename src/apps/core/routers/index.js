/**
 * Core App Router
 * 
 * Handles /core API endpoints for system functions
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */
import { Request, Response, NextFunction } from "express";
import { getSystemInfo, listApps, getAppInfo, getLogs } from "../app.js";
import { join } from "path";
import { cwd } from "process";

export const path = "/core";
export const method = "use";
export const priority = 100;

export async function handler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const basePath = "/core";
    const appDir = join(cwd(), "app");
    
    if (req.path === "/info" || req.path === basePath) {
      res.json({
        name: "core",
        version: "1.0.0",
        description: "Core system functions",
        endpoints: [
          { path: "/core/info", method: "GET", description: "System information" },
          { path: "/core/apps", method: "GET", description: "List installed apps" },
          { path: "/core/app/<name>", method: "GET", description: "Get app info" },
          { path: "/core/logs", method: "GET", description: "Get system logs" }
        ]
      });
      return;
    }
    
    if (req.path === "/info") {
      res.json(getSystemInfo());
      return;
    }
    
    if (req.path === "/apps") {
      res.json({ apps: listApps(appDir) });
      return;
    }
    
    const appMatch = req.path.match(/^\/app\/([^/]+)$/);
    if (appMatch) {
      const appName = appMatch[1];
      const appInfo = getAppInfo(appDir, appName);
      if (appInfo) {
        res.json(appInfo);
      } else {
        res.status(404).json({ error: "App not found" });
      }
      return;
    }
    
    if (req.path === "/logs") {
      const lines = parseInt(req.query.lines as string) || 100;
      res.json({ logs: getLogs(lines) });
      return;
    }
    
    if (req.path === "/health") {
      const sysInfo = getSystemInfo();
      res.json({
        status: "healthy",
        uptime: sysInfo.uptime,
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    next();
  } catch (error) {
    next(error);
  }
}