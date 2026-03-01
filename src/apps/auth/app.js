/**
 * Auth App - Authentication and Authorization
 * 
 * Provides user authentication and session management
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */
import { Request, Response, NextFunction } from "express";
import { createHash, randomBytes } from "crypto";

export const appConfig = {
  name: "auth",
  version: "1.0.0",
  description: "Authentication and authorization",
  author: "wizardo",
  license: "MIT"
};

// In-memory user store (in production, use a database)
const users: Map<string, { username: string; passwordHash: string; role: string }> = new Map();
const sessions: Map<string, { username: string; createdAt: Date; expiresAt: Date }> = new Map();
const tokens: Map<string, { username: string; createdAt: Date; name: string }> = new Map();

export function init(): void {
  console.log("🔐 Initializing auth app...");
  
  // Create default admin user
  const adminPassword = randomBytes(8).toString("hex");
  createUser("admin", adminPassword, "admin");
  console.log(`🔑 Default admin password: ${adminPassword}`);
}

/**
 * Hash password
 */
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

/**
 * Create user
 */
export function createUser(username: string, password: string, role: string = "user"): boolean {
  if (users.has(username)) {
    return false;
  }
  
  users.set(username, {
    username,
    passwordHash: hashPassword(password),
    role
  });
  
  return true;
}

/**
 * Authenticate user
 */
export function authenticate(username: string, password: string): string | null {
  const user = users.get(username);
  if (!user) {
    return null;
  }
  
  if (user.passwordHash !== hashPassword(password)) {
    return null;
  }
  
  return user.role;
}

/**
 * Create session
 */
export function createSession(username: string): string {
  const sessionId = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
  
  sessions.set(sessionId, { username, createdAt: now, expiresAt });
  
  return sessionId;
}

/**
 * Validate session
 */
export function validateSession(sessionId: string): string | null {
  const session = sessions.get(sessionId);
  if (!session) {
    return null;
  }
  
  if (new Date() > session.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }
  
  return session.username;
}

/**
 * Create API token
 */
export function createToken(username: string, name: string): string {
  const token = randomBytes(32).toString("hex");
  
  tokens.set(token, { username, createdAt: new Date(), name });
  
  return token;
}

/**
 * Validate API token
 */
export function validateToken(token: string): string | null {
  const tokenData = tokens.get(token);
  if (!tokenData) {
    return null;
  }
  
  return tokenData.username;
}

/**
 * List user tokens
 */
export function listTokens(username: string): Array<{ name: string; createdAt: Date }> {
  const result: Array<{ name: string; createdAt: Date }> = [];
  
  for (const [, data] of tokens) {
    if (data.username === username) {
      result.push({ name: data.name, createdAt: data.createdAt });
    }
  }
  
  return result;
}

/**
 * Delete token
 */
export function deleteToken(token: string): boolean {
  return tokens.delete(token);
}

/**
 * Middleware to require authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.status(401).json({ error: "Authorization header required" });
    return;
  }
  
  const [type, credentials] = authHeader.split(" ");
  
  if (type === "Bearer") {
    // Check session
    let username = validateSession(credentials);
    
    // Or check token
    if (!username) {
      username = validateToken(credentials);
    }
    
    if (username) {
      (req as any).user = username;
      next();
      return;
    }
  }
  
  res.status(401).json({ error: "Invalid credentials" });
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user;
  
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  
  const userData = users.get(user);
  if (!userData || userData.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  
  next();
}

export default {
  config: appConfig,
  init,
  createUser,
  authenticate,
  createSession,
  validateSession,
  createToken,
  validateToken,
  listTokens,
  deleteToken,
  requireAuth,
  requireAdmin
};