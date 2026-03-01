/**
 * Files App Router
 * 
 * Mounts file management endpoints at /api/files
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */

import { Router } from 'express';
import FilesModule from '../modules/files.js';

export const path = '/files';
export const priority = 10;

const router = Router();

// Mount the files module router
router.use('/', FilesModule);

export default router;
