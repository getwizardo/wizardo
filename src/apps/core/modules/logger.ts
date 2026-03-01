/**
 * Logger Module - Logging Service
 * 
 * Provides structured logging functionality
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */

import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { cwd } from 'process';
import type { LogEntry } from '../object/index.js';

export class Logger {
  private logDir: string;
  private logFile: string;
  private maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private maxFiles: number = 5;

  constructor(logDir?: string) {
    this.logDir = logDir || join(cwd(), 'logs');
    this.logFile = join(this.logDir, 'app.log');
    this.ensureLogDir();
  }

  private ensureLogDir(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Create a log entry
   */
  private createEntry(level: LogEntry['level'], message: string, metadata?: Record<string, unknown>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    };
  }

  /**
   * Write log entry to file
   */
  private write(entry: LogEntry): void {
    const line = JSON.stringify(entry) + '\n';
    
    try {
      appendFileSync(this.logFile, line);
    } catch (err) {
      console.error('Failed to write log:', err);
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    const entry = this.createEntry('debug', message, metadata);
    this.write(entry);
  }

  /**
   * Log info message
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    const entry = this.createEntry('info', message, metadata);
    this.write(entry);
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    const entry = this.createEntry('warn', message, metadata);
    this.write(entry);
  }

  /**
   * Log error message
   */
  error(message: string, metadata?: Record<string, unknown>): void {
    const entry = this.createEntry('error', message, metadata);
    this.write(entry);
  }

  /**
   * Get recent logs
   */
  getLogs(limit: number = 100, level?: LogEntry['level']): LogEntry[] {
    // Simplified - would read from file in production
    return [];
  }
}

export default new Logger();
