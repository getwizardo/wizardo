#!/usr/bin/env node
import { createReadStream, createWriteStream } from "node:fs";
import { appendFile, cp, mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import { pipeline } from "node:stream/promises";
import { stdin } from "node:process";

const VERSION = "2.0.0";
type Entry = { name: string; path: string; directory: boolean; size: number; modified: Date };

type Parsed = { command: string; values: string[]; flags: Set<string>; options: Map<string, string> };

function help(): never {
  console.log(`wizardo-cli ${VERSION} — powerful local file management\n\nUsage:\n  wizardo <command> [arguments] [options]\n\nNavigation and inspection:\n  pwd                         Print the current directory\n  ls [path]                  List files (-a hidden, -l details, -R recursive)\n  tree [path]                Print a directory tree (-L depth)\n  find [path] [pattern]      Find files by name or extension\n  stat <path>                Show detailed file metadata\n  du [path]                  Show disk usage\n  cat <file...>              Print files to stdout\n  head <file> [-n lines]     Print the first lines\n  tail <file> [-n lines]     Print the last lines\n\nFile operations:\n  touch <file...>            Create files or update timestamps\n  write <file> <text>        Create or replace a text file\n  append <file> <text>       Append text to a file\n  mkdir <dir...>             Create directories (-p parents)\n  cp <source> <target>       Copy files or directories (-r recursive)\n  mv <source> <target>       Move or rename files\n  rm <path...>               Remove files (-r recursive, -f force)\n\nOther:\n  version                    Show the CLI version\n  help                       Show this help\n\nOptions:\n  -a, --all                 Include hidden entries\n  -l, --long                Show detailed listing\n  -R, --recursive           Recurse into directories\n  -r, --recursive           Recursive copy/remove\n  -f, --force               Ignore missing files and confirmations\n  -p, --parents             Create parent directories\n  -n, --lines <number>      Number of lines for head/tail\n  -L, --depth <number>      Maximum tree depth\n  --json                    Machine-readable output where supported\n\nExamples:\n  wizardo ls -la projects\n  wizardo tree . -L 3\n  wizardo find . '*.ts'\n  wizardo cp -r src backup/src\n  wizardo rm -rf build\n  wizardo write notes/today.md "Ship it"`);
  process.exit(0);
}

function parse(args: string[]): Parsed {
  const flags = new Set<string>();
  const options = new Map<string, string>();
  const values: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") help();
    if (arg === "--json") { flags.add("json"); continue; }
    if (/^-[alRrfp]{2,}$/.test(arg)) {
      for (const short of arg.slice(1)) {
        if (short === "a") flags.add("all");
        if (short === "l") flags.add("long");
        if (short === "R" || short === "r") flags.add("recursive");
        if (short === "f") flags.add("force");
        if (short === "p") flags.add("parents");
      }
      continue;
    }
    if (arg === "-a" || arg === "--all") { flags.add("all"); continue; }
    if (arg === "-l" || arg === "--long") { flags.add("long"); continue; }
    if (arg === "-R" || arg === "--recursive") { flags.add("recursive"); continue; }
    if (arg === "-r") { flags.add("recursive"); continue; }
    if (arg === "-f" || arg === "--force") { flags.add("force"); continue; }
    if (arg === "-p" || arg === "--parents") { flags.add("parents"); continue; }
    if (arg === "-n" || arg === "--lines") { options.set("lines", args[++i] ?? "10"); continue; }
    if (arg.startsWith("--lines=")) { options.set("lines", arg.slice(8)); continue; }
    if (arg === "-L" || arg === "--depth") { options.set("depth", args[++i] ?? "3"); continue; }
    if (arg.startsWith("--depth=")) { options.set("depth", arg.slice(8)); continue; }
    if (arg.startsWith("-")) { fail(`unknown option '${arg}'`); }
    values.push(arg);
  }
  return { command: values.shift() ?? "help", values, flags, options };
}

function fail(message: string): never { console.error(`wizardo: ${message}`); process.exit(1); }
function target(path = "."): string { return resolve(path); }
function display(path: string): string { return path === process.cwd() ? "." : relative(process.cwd(), path) || "."; }
function bytes(size: number): string { if (size < 1024) return `${size} B`; if (size < 1048576) return `${(size / 1024).toFixed(1)} KB`; if (size < 1073741824) return `${(size / 1048576).toFixed(1)} MB`; return `${(size / 1073741824).toFixed(1)} GB`; }
function errorPath(error: unknown, path: string): never { const code = (error as NodeJS.ErrnoException)?.code; fail(`${code === "ENOENT" ? "not found" : code ?? "error"}: ${path}`); }

async function entries(path: string, includeHidden: boolean): Promise<Entry[]> {
  const names = await readdir(path).catch(error => errorPath(error, path));
  const result: Entry[] = [];
  for (const name of names) {
    if (!includeHidden && name.startsWith(".")) continue;
    const full = join(path, name);
    const info = await stat(full).catch(error => errorPath(error, full));
    result.push({ name, path: full, directory: info.isDirectory(), size: info.size, modified: info.mtime });
  }
  return result.sort((a, b) => Number(b.directory) - Number(a.directory) || a.name.localeCompare(b.name));
}

async function list(values: string[], flags: Set<string>): Promise<void> {
  const requested = values.length ? values : ["."];
  const output: unknown[] = [];
  for (const raw of requested) {
    const path = target(raw);
    const info = await stat(path).catch(error => errorPath(error, raw));
    if (!info.isDirectory()) {
      const item = { name: basename(path), path: display(path), type: "file", size: info.size, modified: info.mtime.toISOString() };
      output.push(item);
      if (!flags.has("json")) console.log(flags.has("long") ? `${bytes(info.size).padStart(10)}  ${info.mtime.toLocaleString()}  ${display(path)}` : display(path));
      continue;
    }
    const items = await entries(path, flags.has("all"));
    if (requested.length > 1) console.log(`\n${raw}:`);
    for (const item of items) {
      const value = { name: item.name, path: display(item.path), type: item.directory ? "directory" : "file", size: item.size, modified: item.modified.toISOString() };
      output.push(value);
      if (!flags.has("json")) console.log(flags.has("long") ? `${item.directory ? "dir ".padEnd(10) : bytes(item.size).padStart(10)}  ${item.modified.toLocaleString()}  ${item.name}${item.directory ? sep : ""}` : `${item.name}${item.directory ? sep : ""}`);
    }
  }
  if (flags.has("json")) console.log(JSON.stringify(output, null, 2));
}

async function tree(path: string, flags: Set<string>, depth: number, prefix = ""): Promise<void> {
  const items = await entries(path, flags.has("all"));
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    const last = index === items.length - 1;
    console.log(`${prefix}${last ? "└── " : "├── "}${item.name}${item.directory ? sep : ""}`);
    if (item.directory && depth > 0) await tree(item.path, flags, depth - 1, `${prefix}${last ? "    " : "│   "}`);
  }
}

function globToRegex(pattern: string): RegExp { const source = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, "."); return new RegExp(`^${source}$`, "i"); }
async function find(path: string, pattern: string, flags: Set<string>, result: string[] = []): Promise<string[]> {
  const items = await entries(path, flags.has("all"));
  const matcher = globToRegex(pattern);
  for (const item of items) { if (matcher.test(item.name) || (pattern.startsWith(".") && extname(item.name) === pattern)) result.push(display(item.path)); if (item.directory) await find(item.path, pattern, flags, result); }
  return result;
}

async function cat(files: string[]): Promise<void> { for (const file of files) process.stdout.write(await readFile(target(file)).catch(error => errorPath(error, file))); }
async function lines(file: string, count: number, last: boolean): Promise<void> { const text = await readFile(target(file), "utf8").catch(error => errorPath(error, file)); const all = text.split(/\r?\n/); const selected = last ? all.slice(-count) : all.slice(0, count); console.log(selected.join("\n")); }
async function touch(files: string[]): Promise<void> { if (!files.length) fail("touch requires a file"); for (const file of files) { const path = target(file); await writeFile(path, "", { flag: "a" }).catch(error => errorPath(error, file)); const now = new Date(); const { utimes } = await import("node:fs/promises"); await utimes(path, now, now); } }
async function makeDirs(paths: string[], parents: boolean): Promise<void> { if (!paths.length) fail("mkdir requires a directory"); for (const path of paths) await mkdir(target(path), { recursive: parents }).catch(error => errorPath(error, path)); }
async function write(path: string, text: string, append: boolean): Promise<void> { const file = target(path); await mkdir(dirname(file), { recursive: true }); await (append ? appendFile(file, `${text}\n`) : writeFile(file, `${text}\n`)); }
async function copy(source: string, destination: string, recursive: boolean): Promise<void> { const from = target(source); const to = target(destination); const info = await stat(from).catch(error => errorPath(error, source)); if (info.isDirectory() && !recursive) fail(`${source} is a directory; use -r`); await cp(from, to, { recursive, force: true }); }
async function move(source: string, destination: string): Promise<void> { await rename(target(source), target(destination)).catch(error => errorPath(error, source)); }
async function remove(paths: string[], flags: Set<string>): Promise<void> { if (!paths.length) fail("rm requires a path"); for (const raw of paths) { const path = target(raw); const info = await stat(path).catch(error => { if (flags.has("force")) return null; return errorPath(error, raw); }); if (!info) continue; if (info.isDirectory() && !flags.has("recursive")) fail(`${raw} is a directory; use -r`); await rm(path, { recursive: flags.has("recursive"), force: flags.has("force") }); } }

async function main(): Promise<void> {
  const parsed = parse(process.argv.slice(2));
  const { command, values, flags, options } = parsed;
  if (command === "help") help();
  if (command === "version") { console.log(VERSION); return; }
  if (command === "pwd") { console.log(process.cwd()); return; }
  if (command === "ls" || command === "dir") return list(values, flags);
  if (command === "tree") { const path = target(values[0] ?? "."); console.log(display(path)); return tree(path, flags, Number(options.get("depth") ?? 3)); }
  if (command === "find") { const result = await find(target(values[0] ?? "."), values[1] ?? "*", flags); if (flags.has("json")) console.log(JSON.stringify(result, null, 2)); else console.log(result.join("\n")); return; }
  if (command === "cat") { if (!values.length) fail("cat requires a file"); return cat(values); }
  if (command === "head" || command === "tail") { if (!values[0]) fail(`${command} requires a file`); return lines(values[0], Number(options.get("lines") ?? 10), command === "tail"); }
  if (command === "stat") { if (!values[0]) fail("stat requires a path"); const info = await stat(target(values[0])).catch(error => errorPath(error, values[0])); console.log(JSON.stringify({ path: target(values[0]), type: info.isDirectory() ? "directory" : info.isFile() ? "file" : "other", size: info.size, mode: info.mode.toString(8), created: info.birthtime.toISOString(), modified: info.mtime.toISOString(), accessed: info.atime.toISOString() }, null, 2)); return; }
  if (command === "du") { const path = target(values[0] ?? "."); let total = 0; for (const item of await entries(path, true)) total += item.directory ? 0 : item.size; console.log(`${bytes(total)}\t${display(path)}`); return; }
  if (command === "touch") return touch(values);
  if (command === "write" || command === "append") { if (!values[0] || values.length < 2) fail(`${command} requires a file and text`); return write(values[0], values.slice(1).join(" "), command === "append"); }
  if (command === "mkdir") return makeDirs(values, flags.has("parents"));
  if (command === "cp") { if (values.length < 2) fail("cp requires source and target"); return copy(values[0], values[1], flags.has("recursive")); }
  if (command === "mv") { if (values.length < 2) fail("mv requires source and target"); return move(values[0], values[1]); }
  if (command === "rm" || command === "delete") return remove(values, flags);
  fail(`unknown command '${command}' (run 'wizardo help')`);
}

main().catch((error: unknown) => fail(error instanceof Error ? error.message : String(error)));
