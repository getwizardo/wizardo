/**
 * Core App Router (TypeScript)
 * 
 * Handles /core API endpoints
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */

import { Router, Request, Response, NextFunction } from 'express';
import SystemModule from '../modules/system.js';
import AppManager from '../modules/app-manager.js';
import Logger from '../modules/logger.js';
import type { AppListQuery } from '../object/index.js';

export const path = '/core';
export const priority = 100;

const router = Router();

/**
 * GET /core/info - Get system information
 */
router.get('/info', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const info = SystemModule.getSystemInfo();
    res.json({
      success: true,
      data: info,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /core/health - Health check
 */
router.get('/health', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await SystemModule.healthCheck();
    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /core/apps - List apps
 */
router.get('/apps', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query: AppListQuery = {
      status: req.query.status as any,
      search: req.query.search as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const apps = AppManager.listApps(query);
    res.json({
      success: true,
      data: apps,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /core/apps/:id - Get app info
 */
router.get('/apps/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const app = AppManager.getApp(req.params.id);
    
    if (!app) {
      res.status(404).json({
        success: false,
        error: 'App not found',
      });
      return;
    }

    res.json({
      success: true,
      data: app,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /core/logs - Get logs
 */
router.get('/logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const level = req.query.level as any;
    
    const logs = Logger.getLogs(limit, level);
    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
