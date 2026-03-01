/**
 * Parse config.xml and return a config object
 *
 * @returns {Object} config object
 */
import { readFileSync, mkdirSync, existsSync } from "fs";
import { parse, HTMLElement } from "node-html-parser";
import { resolve, join } from "path";
import { cwd, exit } from "process";

// Define the shape of the configuration object
export interface WizardoConfig {
  port: number;
  host?: string;
  [key: string]: any;
}

/**
 * Ensures the working directory structure is ready (optional safety check)
 */
function ensureRuntimeEnv(): void {
  const workDir = cwd();
  // Example: Ensure a 'logs' or 'data' folder exists if needed by the app later
  // For now, we just verify the cwd is accessible.
  if (!existsSync(workDir)) {
    console.error("❌ Current working directory does not exist.");
    exit(1);
  }
}

/**
 * Parses config.xml and returns a structured config object.
 * Exits the process if the file is missing or malformed.
 */
function parseConfig(): WizardoConfig {
  const configPath = resolve(cwd(), "config.xml");

  if (!existsSync(configPath)) {
    console.error(`❌ Configuration file not found: ${configPath}`);
    console.log("💡 Please create a config.xml in the root directory.");
    exit(1);
  }

  let xmlContent: string;
  try {
    xmlContent = readFileSync(configPath, "utf-8");
  } catch (err) {
    console.error("❌ Failed to read config.xml:", err);
    exit(1);
  }

  const root = parse(xmlContent);
  const configNode = root.querySelector("config");

  if (!configNode) {
    console.error("❌ Invalid config.xml: Missing <config> root element.");
    exit(1);
  }

  const configObj: WizardoConfig = {
    port: 3000, // Default fallback
  };

  // Extract children elements as key-value pairs
  configNode.childNodes.forEach((node) => {
    if (node instanceof HTMLElement) {
      const key = (node as HTMLElement).tagName.toLowerCase();
      const value = (node as HTMLElement).textContent?.trim();

      if (key === "port") {
        const portNum = parseInt(value || "3000", 10);
        if (isNaN(portNum)) {
          console.error(`❌ Invalid port value in config.xml: "${value}"`);
          exit(1);
        }
        configObj.port = portNum;
      } else {
        configObj[key] = value;
      }
    }
  });

  return configObj;
}

/**
 * Prints the current configuration to the console.
 */
export function describeConfig(): void {
  console.log("\n--- 🪄 Wizardo Configuration ---");
  console.log(`Port: ${config.port}`);

  // Print other dynamic keys if present
  Object.keys(config).forEach((key) => {
    if (key !== "port") {
      console.log(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${config[key]}`);
    }
  });
  console.log("-------------------------------\n");
}

// Initialize environment and parse config immediately upon import
ensureRuntimeEnv();
export const config: WizardoConfig = parseConfig();