/**
 * WebDAV App Router
 * 
 * Mounts WebDAV handler at /webdav
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */
import { Request, Response, NextFunction } from "express";
import { handleWebDAV } from "../app.js";

export const path = "/webdav";
export const method = "use";
export const priority = 50;

export async function handler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await handleWebDAV(req, res, next);
}