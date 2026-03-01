/**
 * wizardo SPRING - Main Application Server
 * © 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 *
 * HTTP/WebDAV Server with dynamic router loading
 */
import express, { Express, Request, Response, NextFunction } from "express";
import {
  createServer,
  Server as HTTPServer,
} from "http";
import {
  existsSync,
  readdirSync,
  mkdirSync,
} from "fs";
import { join, resolve, extname, dirname } from "path";
import { cwd } from "process";
import nephele from "nephele";
import { LocalFileSystemAdapter } from "@nephele/adapter-file-system";

// Router handler type
export type RouterHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void> | void;

// Router module interface
export interface RouterModule {
  path?: string;
  handler?: RouterHandler;
  method?: string;
  priority?: number;
}

export class WizardoApp {
  private app: Express;
  private server: HTTPServer | null = null;
  private routers: Array<{
    path: string;
    handler: RouterHandler;
    method: string;
    priority: number;
  }> = [];
  private webDAVRoot: string;
  private appName: string;
  private webDAVEnabled: boolean;

  constructor(
    appName: string = "wizardo",
    webDAVRoot?: string,
    webDAVEnabled: boolean = true,
  ) {
    this.appName = appName;
    this.webDAVRoot = webDAVRoot || join(cwd(), "webdav");
    this.webDAVEnabled = webDAVEnabled;
    this.app = express();

    this.initializeMiddleware();
    this.ensureWebDAVRoot();
  }

  /**
   * Initialize Express middleware
   */
  private initializeMiddleware(): void {
    // Body parsers
    this.app.use(express.json({ limit: "50mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "50mb" }));
    this.app.use(express.text({ limit: "50mb" }));

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const timestamp = new Date().toISOString();
      console.log(`📡 [${timestamp}] ${req.method} ${req.path}`);
      next();
    });

    // CORS headers for WebDAV compatibility
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PROPFIND, PROPPATCH, MKCOL, COPY, MOVE, LOCK, UNLOCK",
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Depth, Destination, Overwrite, If, Lock-Token, Timeout",
      );
      res.setHeader(
        "Access-Control-Expose-Headers",
        "DAV, MS-Author-Via, Content-Length",
      );
      res.setHeader("DAV", "1, 2");
      res.setHeader("MS-Author-Via", "DAV");

      if (req.method === "OPTIONS") {
        res.sendStatus(200);
        return;
      }
      next();
    });
  }

  /**
   * Ensure WebDAV root directory exists
   */
  private ensureWebDAVRoot(): void {
    if (!existsSync(this.webDAVRoot)) {
      mkdirSync(this.webDAVRoot, { recursive: true });
      console.log(`📁 Created WebDAV root: ${this.webDAVRoot}`);
    }
  }

  /**
   * Load routers from standard locations
   */
  public loadRouters(): void {
    const routerPaths = [
      { path: join(cwd(), "routers"), type: "core" },
      { path: join(cwd(), "app", this.appName, "routers"), type: "extension" },
    ];

    for (const routerConfig of routerPaths) {
      if (!existsSync(routerConfig.path)) {
        console.log(`⚠️  Router directory not found: ${routerConfig.path}`);
        continue;
      }

      try {
        const files = readdirSync(routerConfig.path).filter((f) =>
          f.endsWith(".js"),
        );
        for (const file of files) {
          const fullPath = join(routerConfig.path, file);
          try {
            const routerModule: RouterModule = require(fullPath);

            if (routerModule && typeof routerModule.handler === "function") {
              const routePath = routerModule.path || "/";
              const method = routerModule.method || "use";
              const priority = routerModule.priority || 0;

              this.routers.push({
                path: routePath,
                handler: routerModule.handler,
                method,
                priority,
              });

              console.log(
                `📦 Loaded ${routerConfig.type} router: ${file} (${routePath})`,
              );
            }
          } catch (err) {
            console.warn(`⚠️  Failed to load router ${file}:`, err);
          }
        }
      } catch (err) {
        console.warn(
          `⚠️  Failed to read router directory ${routerConfig.path}:`,
          err,
        );
      }
    }

    // Sort by priority (higher first)
    this.routers.sort((a, b) => b.priority - a.priority);
    console.log(`✅ Loaded ${this.routers.length} router(s)`);
  }

  /**
   * Register all loaded routers
   */
  private registerRouters(): void {
    for (const router of this.routers) {
      if (router.method === "use") {
        this.app.use(router.path, router.handler);
      } else {
        const method = router.method.toLowerCase() as keyof Express;
        if (typeof this.app[method] === "function") {
          (this.app[method] as any)(router.path, router.handler);
        }
      }
    }
  }

  /**
   * Setup WebDAV server using nephele
   * nephele is a pluggable WebDAV server for Node.js and Express [[24]]
   */
  private setupWebDAV(): void {
    if (!this.webDAVEnabled) {
      console.log("🔒 WebDAV disabled");
      return;
    }

    try {
      const adapter = new LocalFileSystemAdapter({
        root: this.webDAVRoot,
      });

      const webDAVHandler = nephele({
        adapter,
        authenticate: async (username: string, password: string) => {
          // Basic authentication - customize as needed
          return true;
        },
        authorize: async (username: string, path: string, method: string) => {
          // Authorization logic - customize as needed
          return true;
        },
      });

      // Mount WebDAV at /webdav path
      this.app.use("/webdav", webDAVHandler);
      console.log(`🗄️  WebDAV enabled at /webdav (root: ${this.webDAVRoot})`);
    } catch (err) {
      console.warn("⚠️  Failed to setup WebDAV:", err);
    }
  }

  /**
   * Setup default routes
   */
  private setupDefaultRoutes(): void {
    // Health check
    this.app.get("/health", (req: Request, res: Response) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Root endpoint
    this.app.get("/", (req: Request, res: Response) => {
      res.json({
        name: "wizardo SPRING",
        version: "1.0.0",
        copyright: "© 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>",
      });
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ error: "Not Found", path: req.path });
    });

    // Error handler
    this.app.use(
      (err: Error, req: Request, res: Response, next: NextFunction) => {
        console.error(`❌ Error: ${err.message}`);
        res
          .status(500)
          .json({ error: "Internal Server Error", message: err.message });
      },
    );
  }

  /**
   * Start the server
   */
  public sniff(port: number, callback?: () => void): void {
    // Load and register routers
    this.loadRouters();
    this.registerRouters();

    // Setup WebDAV
    this.setupWebDAV();

    // Setup default routes (after custom routers)
    this.setupDefaultRoutes();

    // Create HTTP server
    this.server = createServer(this.app);

    // Start listening
    this.server.listen(port, () => {
      if (callback) callback();
    });

    // Graceful shutdown
    process.on("SIGINT", () => this.shutdown());
    process.on("SIGTERM", () => this.shutdown());
  }

  /**
   * Graceful shutdown
   */
  private shutdown(): void {
    console.log("\n🛑 Shutting down wizardo...");
    if (this.server) {
      this.server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }

  /**
   * Get Express app instance (for advanced usage)
   */
  public getExpressApp(): Express {
    return this.app;
  }
}

// Export singleton instance
export const app = new WizardoApp();
