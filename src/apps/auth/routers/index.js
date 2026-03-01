/**
 * Auth App Router
 * 
 * Handles /auth API endpoints
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */
import { Request, Response, NextFunction } from "express";
import { authenticate, createSession, createToken, listTokens, deleteToken, validateSession } from "../app.js";

export const path = "/auth";
export const method = "use";
export const priority = 90;

export async function handler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Login
    if (req.path === "/login" && req.method === "POST") {
      const { username, password } = req.body;
      
      const role = authenticate(username, password);
      if (!role) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
      
      const sessionId = createSession(username);
      res.json({ sessionId, username, role });
      return;
    }
    
    // Get current user info
    if (req.path === "/me" && req.method === "GET") {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }
      
      const [, credentials] = authHeader.split(" ");
      const username = validateSession(credentials);
      
      if (!username) {
        res.status(401).json({ error: "Invalid session" });
        return;
      }
      
      res.json({ username });
      return;
    }
    
    // Create API token
    if (req.path === "/token" && req.method === "POST") {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      
      const [, credentials] = authHeader.split(" ");
      const username = validateSession(credentials);
      
      if (!username) {
        res.status(401).json({ error: "Invalid session" });
        return;
      }
      
      const { name } = req.body;
      const token = createToken(username, name || "API Token");
      res.json({ token });
      return;
    }
    
    // List tokens
    if (req.path === "/tokens" && req.method === "GET") {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      
      const [, credentials] = authHeader.split(" ");
      const username = validateSession(credentials);
      
      if (!username) {
        res.status(401).json({ error: "Invalid session" });
        return;
      }
      
      res.json({ tokens: listTokens(username) });
      return;
    }
    
    next();
  } catch (error) {
    next(error);
  }
}