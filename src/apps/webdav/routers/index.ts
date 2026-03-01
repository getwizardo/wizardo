/**
 * WebDAV App Router (TypeScript)
 * 
 * Mounts WebDAV handler
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */

import { Router, Request, Response, NextFunction } from 'express';
import WebDAVHandler from '../modules/handler.js';

export const path = '/webdav';
export const priority = 50;

const router = Router();
const handler = new WebDAVHandler('./webdav');

// Helper to send XML response
const sendXml = (res: Response, data: any) => {
  const xml = typeof data === 'string' ? data : JSON.stringify(data);
  res.type('application/xml').send(xml);
};

/**
 * Handle WebDAV requests
 */
router.all('*', async (req: Request, res: Response, next: NextFunction) => {
  const path = req.path === '/' ? '/' : req.path;
  const method = req.method;
  const depth = req.headers.depth ? parseInt(req.headers.depth as string) : 1;

  try {
    switch (method) {
      case 'GET': {
        if (handler.isDirectory(path)) {
          const resources = handler.listDirectory(path, depth);
          sendXml(res, resources);
        } else {
          const content = handler.readFile(path);
          if (content) {
            res.send(content);
          } else {
            res.status(404).send('Not Found');
          }
        }
        break;
      }

      case 'PUT': {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => {
          const success = handler.writeFile(path, Buffer.concat(chunks));
          res.status(success ? 201 : 500).send(success ? 'Created' : 'Error');
        });
        break;
      }

      case 'MKCOL': {
        const success = handler.mkcol(path);
        res.status(success ? 201 : 500).send(success ? 'Created' : 'Error');
        break;
      }

      case 'DELETE': {
        const success = handler.delete(path);
        res.status(success ? 204 : 500).send(success ? 'No Content' : 'Error');
        break;
      }

      case 'PROPFIND': {
        const resources = handler.listDirectory(path, depth);
        sendXml(res, resources);
        break;
      }

      case 'COPY': {
        const destination = req.headers.destination as string;
        const overwrite = req.headers.overwrite === 'T';
        const success = handler.copy(path, destination, overwrite);
        res.status(success ? 201 : 500).send(success ? 'Created' : 'Error');
        break;
      }

      case 'MOVE': {
        const destination = req.headers.destination as string;
        const overwrite = req.headers.overwrite === 'T';
        const success = handler.move(path, destination, overwrite);
        res.status(success ? 201 : 500).send(success ? 'Created' : 'Error');
        break;
      }

      case 'LOCK': {
        const lock = handler.lock(path, 'wizardo', 300);
        if (lock) {
          res.set('Lock-Token', lock.token);
          res.status(200).send('Locked');
        } else {
          res.status(423).send('Locked');
        }
        break;
      }

      case 'UNLOCK': {
        const token = req.headers['lock-token'] as string;
        const success = handler.unlock(path, token);
        res.status(success ? 204 : 500).send(success ? 'No Content' : 'Error');
        break;
      }

      default:
        res.status(405).send('Method Not Allowed');
    }
  } catch (error) {
    next(error);
  }
});

export default router;