#!/usr/bin/env node
import { createWriteStream } from "node:fs";
import { mkdir, readFile, stat } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

type Options = { url: string; json: boolean };
type FileEntry = { name: string; path: string; kind: "file" | "directory"; size: number; modified: string };

const VERSION = "1.0.0";
const DEFAULT_URL = process.env.WIZARDO_URL ?? "http://localhost:3000";

function usage(): never {
  console.log(`wizardo-cli ${VERSION}\n\nUsage:\n  wizardo <command> [path] [options]\n\nCommands:\n  list [path]                 List files and folders\n  upload <file> [remote]      Upload a local file\n  download <remote> [local]   Download a remote file\n  mkdir <path>                Create a folder\n  rm <path>                   Delete a file or folder\n  health                     Check server availability\n  version                    Show the CLI version\n\nOptions:\n  --url <url>                Wizardo server URL (default: ${DEFAULT_URL})\n  --json                     Print machine-readable JSON\n  --help                     Show this help\n\nExamples:\n  wizardo list --url http://localhost:3000\n  wizardo upload photo.jpg Pictures/photo.jpg\n  wizardo download Pictures/photo.jpg ./photo.jpg`);
  process.exit(0);
}

function parseArgs(args: string[]): { command: string; values: string[]; options: Options } {
  let url = DEFAULT_URL;
  let json = false;
  const values: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") usage();
    if (arg === "--json") { json = true; continue; }
    if (arg === "--url" || arg === "-u") {
      url = args[++i] ?? usage();
      continue;
    }
    if (arg.startsWith("--url=")) { url = arg.slice(6); continue; }
    values.push(arg);
  }
  return { command: values.shift() ?? "help", values, options: { url: url.replace(/\/$/, ""), json } };
}

function remotePath(path = ""): string {
  return path.split("/").filter(Boolean).map(encodeURIComponent).join("/");
}
function endpoint(options: Options, path = ""): string { return `${options.url}/api/files${path ? `/${remotePath(path)}` : ""}`; }
function fail(message: string): never { console.error(`Error: ${message}`); process.exit(1); }

async function request(options: Options, path: string, init?: RequestInit): Promise<Response> {
  try { return await fetch(endpoint(options, path), init); }
  catch { fail(`could not connect to ${options.url}`); }
}
async function requireOk(response: Response): Promise<void> {
  if (!response.ok) {
    const detail = await response.text();
    fail(`${response.status} ${response.statusText}${detail ? `: ${detail.slice(0, 180)}` : ""}`);
  }
}
function print(value: unknown, json: boolean): void {
  if (json) console.log(JSON.stringify(value, null, 2));
}

async function list(path: string, options: Options): Promise<void> {
  const response = await request(options, path);
  await requireOk(response);
  const entries = await response.json() as FileEntry[];
  if (options.json) return print(entries, true);
  if (!entries.length) { console.log("Folder is empty."); return; }
  console.log(`${"Name".padEnd(34)} ${"Type".padEnd(12)} ${"Size".padStart(12)}  Modified`);
  console.log("─".repeat(78));
  for (const entry of entries) console.log(`${(entry.kind === "directory" ? `${entry.name}/` : entry.name).padEnd(34).slice(0, 34)} ${entry.kind.padEnd(12)} ${entry.kind === "file" ? formatBytes(entry.size).padStart(12) : "—".padStart(12)}  ${new Date(entry.modified).toLocaleString()}`);
}
function formatBytes(bytes: number): string { if (bytes < 1024) return `${bytes} B`; if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / 1_048_576).toFixed(1)} MB`; }

async function upload(local: string, remote: string | undefined, options: Options): Promise<void> {
  const source = resolve(local);
  const bytes = await readFile(source).catch(() => fail(`local file not found: ${local}`));
  const target = remote || basename(source);
  const response = await request(options, target, { method: "PUT", body: bytes });
  await requireOk(response);
  console.log(`Uploaded ${local} → ${target}`);
}
async function download(remote: string, local: string | undefined, options: Options): Promise<void> {
  const response = await request(options, remote);
  await requireOk(response);
  const target = resolve(local || basename(remote));
  await mkdir(resolve(target, ".."), { recursive: true });
  if (!response.body) fail("server returned an empty response");
  await pipeline(Readable.fromWeb(response.body as never), createWriteStream(target));
  console.log(`Downloaded ${remote} → ${target}`);
}
async function commandMkdir(path: string, options: Options): Promise<void> { const response = await request(options, path, { method: "POST" }); await requireOk(response); console.log(`Created ${path}`); }
async function remove(path: string, options: Options): Promise<void> { const response = await request(options, path, { method: "DELETE" }); await requireOk(response); console.log(`Deleted ${path}`); }
async function health(options: Options): Promise<void> { const response = await fetch(`${options.url}/health`).catch(() => fail(`could not connect to ${options.url}`)); await requireOk(response); const value = await response.json(); print(value, options.json); if (!options.json) console.log(`Wizardo is healthy at ${options.url}`); }

async function main(): Promise<void> {
  const { command, values, options } = parseArgs(process.argv.slice(2));
  if (command === "help") usage();
  if (command === "version") { console.log(VERSION); return; }
  if (command === "list" || command === "ls") return list(values[0] ?? "", options);
  if (command === "upload" || command === "up") { if (!values[0]) fail("upload requires a local file"); return upload(values[0], values[1], options); }
  if (command === "download" || command === "down") { if (!values[0]) fail("download requires a remote path"); return download(values[0], values[1], options); }
  if (command === "mkdir") { if (!values[0]) fail("mkdir requires a path"); return commandMkdir(values[0], options); }
  if (command === "rm" || command === "delete") { if (!values[0]) fail("rm requires a path"); return remove(values[0], options); }
  if (command === "health") return health(options);
  fail(`unknown command '${command}' (run 'wizardo --help')`);
}

main().catch((error: unknown) => fail(error instanceof Error ? error.message : String(error)));
