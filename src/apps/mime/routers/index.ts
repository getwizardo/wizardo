/**
 * MIME App Router (TypeScript)
 * 
 * Handles /mime API endpoints
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */

import { Router, Request, Response, NextFunction } from 'express';
import MimeModule from '../modules/mime.js';

export const path = '/mime';
export const priority = 30;

const router = Router();

/**
 * GET /mime/:filename - Get MIME type for file
 */
router.get('/:filename', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filename = Array.isArray(req.params.filename) ? req.params.filename[0] : req.params.filename;
    const result = MimeModule.getMimeType(filename);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /mime - Get MIME type from query
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filename = req.query.filename as string;
    
    if (!filename) {
      res.status(400).json({
        success: false,
        error: 'filename is required',
      });
      return;
    }

    const result = MimeModule.getMimeType(filename);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /mime/all - Get all MIME types
 */
router.get('/all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const types = MimeModule.getAllMimeTypes();
    
    res.json({
      success: true,
      data: types,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /mime/ext/:extension - Get MIME type by extension
 */
router.get('/ext/:extension', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { extension } = req.params;
    const result = MimeModule.getMimeType(`file.${extension}`);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /mime/category/:category - Get MIME types by category
 */
router.get('/category/:category', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;
    const allTypes = MimeModule.getAllMimeTypes();
    const filtered = allTypes.filter(t => t.category === category);
    
    res.json({
      success: true,
      data: filtered,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
