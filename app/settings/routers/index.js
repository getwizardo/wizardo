/**
 * Settings App Router
 * 
 * Handles /settings API endpoints
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */
import { Request, Response, NextFunction } from "express";
import { getSettings, getSetting, updateSettings, setSetting, resetSettings, getUserPreferences, updateUserPreferences } from "../app.js";

export const path = "/settings";
export const method = "use";
export const priority = 20;

export async function handler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (req.path === "" || req.path === "/") {
      res.json({
        name: "settings",
        version: "1.0.0",
        description: "Application settings and configuration",
        endpoints: [
          { path: "/settings", method: "GET", description: "Get all settings" },
          { path: "/settings/<key>", method: "GET", description: "Get setting by key" },
          { path: "/settings", method: "PUT", description: "Update settings" },
          { path: "/settings/reset", method: "POST", description: "Reset to defaults" }
        ]
      });
      return;
    }
    
    // Get all settings
    if (req.path === "" && req.method === "GET") {
      res.json(getSettings());
      return;
    }
    
    // Update settings
    if (req.path === "" && req.method === "PUT") {
      updateSettings(req.body);
      res.json({ success: true, settings: getSettings() });
      return;
    }
    
    // Reset settings
    if (req.path === "/reset" && req.method === "POST") {
      resetSettings();
      res.json({ success: true, message: "Settings reset to defaults" });
      return;
    }
    
    // Get specific setting
    const keyMatch = req.path.match(/^\/([^/]+)$/);
    if (keyMatch && req.method === "GET") {
      const key = keyMatch[1];
      const value = getSetting(key);
      
      if (value !== undefined) {
        res.json({ key, value });
      } else {
        res.status(404).json({ error: "Setting not found" });
      }
      return;
    }
    
    // Set specific setting
    if (keyMatch && req.method === "PUT") {
      const key = keyMatch[1];
      const { value } = req.body;
      setSetting(key, value);
      res.json({ success: true, key, value: getSetting(key) });
      return;
    }
    
    next();
  } catch (error) {
    next(error);
  }
}