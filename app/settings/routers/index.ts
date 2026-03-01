/**
 * Settings App Router (TypeScript)
 * 
 * Handles /settings API endpoints
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */

import { Router, Request, Response, NextFunction } from 'express';
import SettingsModule from '../modules/settings.js';

export const path = '/settings';
export const priority = 80;

const router = Router();

/**
 * GET /settings - Get all settings
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const includePrivate = req.query.private === 'true';
    const settings = SettingsModule.getAll(includePrivate);
    
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /settings/:key - Get a specific setting
 */
router.get('/:key', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    const setting = SettingsModule.getSetting(key);
    
    if (!setting) {
      res.status(404).json({
        success: false,
        error: 'Setting not found',
      });
      return;
    }

    res.json({
      success: true,
      data: setting,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /settings/:key - Update a setting
 */
router.put('/:key', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    const success = SettingsModule.set(key, value);
    
    if (!success) {
      res.status(400).json({
        success: false,
        error: 'Failed to update setting',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        key,
        value,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /settings - Update multiple settings
 */
router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = req.body;
    
    for (const [key, value] of Object.entries(settings)) {
      SettingsModule.set(key, value);
    }

    res.json({
      success: true,
      message: 'Settings updated',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /settings/:key - Reset a setting to default
 */
router.delete('/:key', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    const success = SettingsModule.delete(key);
    
    if (!success) {
      res.status(400).json({
        success: false,
        error: 'Failed to reset setting',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Setting reset to default',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /settings/categories - Get settings categories
 */
router.get('/meta/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = SettingsModule.getCategories();
    
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /settings/export - Export settings
 */
router.get('/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exportData = SettingsModule.exportSettings();
    
    res.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /settings/import - Import settings
 */
router.post('/import', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { settings, merge = true } = req.body;
    
    const success = SettingsModule.importSettings(settings, merge);
    
    if (!success) {
      res.status(400).json({
        success: false,
        error: 'Failed to import settings',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Settings imported successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /settings/reset - Reset all settings
 */
router.post('/reset', async (req: Request, res: Response, next: NextFunction) => {
  try {
    SettingsModule.resetAll();
    
    res.json({
      success: true,
      message: 'All settings reset to default',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /settings/preferences/:userId - Get user preferences
 */
router.get('/preferences/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const pref = SettingsModule.getUserPreference(userId, '*');
    
    res.json({
      success: true,
      data: pref,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /settings/preferences/:userId - Update user preferences
 */
router.put('/preferences/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;
    
    for (const [key, value] of Object.entries(preferences)) {
      SettingsModule.setUserPreference(userId, key, value);
    }

    res.json({
      success: true,
      message: 'Preferences updated',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
