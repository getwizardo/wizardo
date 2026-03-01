/**
 * Authentication Module
 * 
 * Handles user authentication
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */

import { createHash, randomBytes } from 'crypto';
import type { User, Session, LoginCredentials, AuthResult, UserRole } from '../object/index.js';

export class AuthModule {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, Session> = new Map();
  private sessionTimeout: number = 3600000; // 1 hour

  constructor() {
    // Create default admin user
    this.createUser({
      id: '1',
      username: 'admin',
      email: 'admin@wizardo.local',
      passwordHash: this.hashPassword('admin'),
      displayName: 'Administrator',
      role: 'admin',
      active: true,
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Hash password using SHA-256
   */
  hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  /**
   * Create a user
   */
  createUser(user: User): User {
    this.users.set(user.id, user);
    return user;
  }

  /**
   * Get user by ID
   */
  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  /**
   * Get user by username
   */
  getUserByUsername(username: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  /**
   * Get user by email
   */
  getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  /**
   * Verify password
   */
  verifyPassword(user: User, password: string): boolean {
    return user.passwordHash === this.hashPassword(password);
  }

  /**
   * Authenticate user
   */
  async authenticate(credentials: LoginCredentials): Promise<AuthResult> {
    const user = this.getUserByUsername(credentials.username);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (!user.active) {
      return { success: false, error: 'Account is disabled' };
    }

    if (!this.verifyPassword(user, credentials.password)) {
      return { success: false, error: 'Invalid password' };
    }

    // Update last login
    user.lastLogin = new Date().toISOString();

    // Create session
    const session = this.createSession(user);

    return {
      success: true,
      user,
      session,
    };
  }

  /**
   * Create a session
   */
  createSession(user: User, ip?: string, userAgent?: string): Session {
    const id = randomBytes(16).toString('hex');
    const token = randomBytes(32).toString('hex');
    const now = Date.now();

    const session: Session = {
      id,
      userId: user.id,
      token,
      createdAt: now,
      expiresAt: now + this.sessionTimeout,
      ip,
      userAgent,
    };

    this.sessions.set(token, session);
    return session;
  }

  /**
   * Validate session
   */
  validateSession(token: string): Session | null {
    const session = this.sessions.get(token);
    
    if (!session) {
      return null;
    }

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }

    return session;
  }

  /**
   * Invalidate session
   */
  invalidateSession(token: string): boolean {
    return this.sessions.delete(token);
  }

  /**
   * Get sessions for user
   */
  getUserSessions(userId: string): Session[] {
    return Array.from(this.sessions.values())
      .filter(s => s.userId === userId);
  }

  /**
   * Set session timeout
   */
  setSessionTimeout(timeout: number): void {
    this.sessionTimeout = timeout;
  }

  /**
   * Get all users
   */
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  /**
   * Delete user
   */
  deleteUser(id: string): boolean {
    return this.users.delete(id);
  }

  /**
   * Update user
   */
  updateUser(id: string, updates: Partial<User>): User | null {
    const user = this.users.get(id);
    if (!user) return null;
    
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }
}

export default new AuthModule();
