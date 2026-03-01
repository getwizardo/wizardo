/**
 * Template App Health Router
 * 
 * Health check endpoint for the template app
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */
import { Request, Response, NextFunction } from "express";

export const path = "/template/health";
export const method = "get";
export const priority = 10;

export async function handler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.json({
      app: "template",
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    next(error);
  }
}