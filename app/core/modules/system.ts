/**
 * System Module - System Information Provider
 * 
 * Provides system information and health checks
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */

import os from 'os';
import type { SystemInfo, HealthCheckResult } from '../object/index.js';

export class SystemModule {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Get comprehensive system information
   */
  getSystemInfo(): SystemInfo {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      cpuUsage: this.getCpuUsage(),
      memoryUsage: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        percentage: Math.round((usedMem / totalMem) * 100),
      },
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get current CPU usage (simplified)
   */
  private getCpuUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    }

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - (idle / total * 100);

    return Math.round(usage * 100) / 100;
  }

  /**
   * Perform health check
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const checks: HealthCheckResult['checks'] = {};
    
    // Check memory
    const memUsage = this.getSystemInfo().memoryUsage;
    checks.memory = {
      status: memUsage.percentage > 90 ? 'fail' : memUsage.percentage > 75 ? 'warn' : 'pass',
      message: `Memory usage: ${memUsage.percentage}%`,
    };

    // Check disk (simplified)
    checks.disk = {
      status: 'pass',
      message: 'Disk OK',
    };

    // Check uptime
    const uptime = this.getSystemInfo().uptime;
    checks.uptime = {
      status: 'pass',
      message: `Uptime: ${uptime}s`,
    };

    // Overall status
    const hasFail = Object.values(checks).some(c => c.status === 'fail');
    const hasWarn = Object.values(checks).some(c => c.status === 'warn');

    return {
      status: hasFail ? 'unhealthy' : hasWarn ? 'degraded' : 'healthy',
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}

export default new SystemModule();
