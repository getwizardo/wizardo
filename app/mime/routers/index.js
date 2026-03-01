/**
 * MIME App Router
 * 
 * Handles /mime API endpoints
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */
import { Request, Response, NextFunction } from "express";
import { getMimeType, getExtensions, getAllMimeTypes, isText, isImage, isVideo, isAudio } from "../app.js";

export const path = "/mime";
export const method = "use";
export const priority = 30;

export async function handler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (req.path === "" || req.path === "/") {
      res.json({
        name: "mime",
        version: "1.0.0",
        description: "MIME type detection and management",
        endpoints: [
          { path: "/mime/<filename", method: "GET", description: "Get MIME type for file" },
          { path: "/mime/lookup/<mime>", method: "GET", description: "Get extensions for MIME type" },
          { path: "/mime/all", method: "GET", description: "Get all MIME types" },
          { path: "/mime/is/<mime>/<type>", method: "GET", description: "Check if MIME is text/image/video/audio" }
        ]
      });
      return;
    }
    
    // Get MIME type for filename
    const filenameMatch = req.path.match(/^\/(.+)$/);
    if (filenameMatch) {
      const filename = decodeURIComponent(filenameMatch[1]);
      res.json({ filename, mimeType: getMimeType(filename) });
      return;
    }
    
    next();
  } catch (error) {
    next(error);
  }
}