/**
 * Core Middleware - Core App Middleware
 * 
 * Middleware for the core app
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */

import { Request, Response, NextFunction } from 'express';

export interface RequestMetadata {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  ip: string;
  userAgent?: string;
}

/**
 * Request ID middleware - adds unique ID to each request
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = crypto.randomUUID();
  (req as any).id = id;
  (req as any).timestamp = new Date().toISOString();
  res.setHeader('X-Request-ID', id);
  next();
}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  
  next();
}

/**
 * Error handler middleware
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  console.error(`❌ Error: ${err.message}`);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    requestId: (req as any).id,
  });
}

/**
 * Not found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    requestId: (req as any).id,
  });
}

/**
 * CORS middleware for API
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
}

/**
 * Rate limiting middleware (simple)
 */
export function rateLimiter(maxRequests: number = 100, windowMs: number = 60000) {
  const requests: Map<string, number[]> = new Map();
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    const ipRequests = requests.get(ip) || [];
    const recentRequests = ipRequests.filter(t => t > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      res.status(429).json({
        error: 'Too Many Requests',
        retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000),
      });
      return;
    }
    
    recentRequests.push(now);
    requests.set(ip, recentRequests);
    next();
  };
}
