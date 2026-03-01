/**
 * Auth App Types
 * 
 * Type definitions for the auth app
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  displayName?: string;
  createdAt: string;
  lastLogin?: string;
  role: UserRole;
  active: boolean;
}

export type UserRole = 'admin' | 'user' | 'guest';

export interface Session {
  id: string;
  userId: string;
  token: string;
  createdAt: number;
  expiresAt: number;
  ip?: string;
  userAgent?: string;
}

export interface Token {
  id: string;
  userId: string;
  name: string;
  token: string;
  createdAt: string;
  expiresAt?: string;
  lastUsed?: string;
  scope: string[];
}

export interface AuthConfig {
  sessionTimeout: number;
  tokenExpiry: number;
  maxSessionsPerUser: number;
  requireEmailVerification: boolean;
  allowRegistration: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: Session;
  token?: string;
  error?: string;
}

export interface AuthContext {
  user?: User;
  session?: Session;
  authenticated: boolean;
}
