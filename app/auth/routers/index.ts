/**
 * Auth App Router (TypeScript)
 * 
 * Handles /auth API endpoints
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */

import { Router, Request, Response, NextFunction } from 'express';
import AuthModule from '../modules/auth.js';

export const path = '/auth';
export const priority = 90;

const router = Router();

/**
 * POST /auth/login - User login
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: 'Username and password are required',
      });
      return;
    }

    const result = await AuthModule.authenticate({ username, password });
    
    if (!result.success) {
      res.status(401).json(result);
      return;
    }

    res.json({
      success: true,
      data: {
        user: result.user,
        token: result.session?.token,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/logout - User logout
 */
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      AuthModule.invalidateSession(token);
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/me - Get current user
 */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
      });
      return;
    }

    const session = AuthModule.validateSession(token);
    
    if (!session) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired session',
      });
      return;
    }

    const user = AuthModule.getUserById(session.userId);
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
        session: {
          expiresAt: session.expiresAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/sessions - Get user sessions
 */
router.get('/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
      });
      return;
    }

    const session = AuthModule.validateSession(token);
    
    if (!session) {
      res.status(401).json({
        success: false,
        error: 'Invalid session',
      });
      return;
    }

    const sessions = AuthModule.getUserSessions(session.userId);
    
    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/register - Register new user
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password, displayName } = req.body;
    
    if (!username || !email || !password) {
      res.status(400).json({
        success: false,
        error: 'Username, email, and password are required',
      });
      return;
    }

    // Check if user exists
    if (AuthModule.getUserByUsername(username)) {
      res.status(400).json({
        success: false,
        error: 'Username already exists',
      });
      return;
    }

    // Create user
    const user = AuthModule.createUser({
      id: Date.now().toString(),
      username,
      email,
      passwordHash: AuthModule.hashPassword(password),
      displayName: displayName || username,
      role: 'user',
      active: true,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
