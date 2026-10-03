import { createHash } from "node:crypto";
import { appendFile, cp, mkdir, readdir, readFile, rename, rm, stat, utimes, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import type { CliInput } from "../cli/parser.js";

export const fail = (message: string): never => { throw new Error(message); };
export const pathOf = (value = ".") => resolve(value);
export const shown = (value: string) => relative(process.cwd(), value) || ".";
export const size = (n: number) => n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : n < 1073741824 ? `${(n / 1048576).toFixed(1)} MB` : `${(n / 1073741824).toFixed(1)} GB`;
export const json = (input: CliInput, value: unknown) => { if (has(input, "json")) console.log(JSON.stringify(value, null, 2)); };
export const has = (input: CliInput, name: string) => input.flags.has(name);
export const need = (value: string | undefined, message: string) => value ?? fail(message);

export async function children(path: string, all = false) {
  const names = await readdir(path);
  const result = [] as Array<{ name: string; path: string; directory: boolean; size: number; modified: Date }>;
  for (const name of names) {
    if (!all && name.startsWith(".")) continue;
    const full = join(path, name); const info = await stat(full);
    result.push({ name, path: full, directory: info.isDirectory(), size: info.size, modified: info.mtime });
  }
  return result.sort((a, b) => Number(b.directory) - Number(a.directory) || a.name.localeCompare(b.name));
}

export async function list(input: CliInput) {
  const paths = input.args.length ? input.args : ["."]; const output: unknown[] = [];
  for (const raw of paths) {
    const path = pathOf(raw); const info = await stat(path);
    if (!info.isDirectory()) { output.push({ name: basename(path), path: shown(path), type: "file", size: info.size, modified: info.mtime.toISOString() }); continue; }
    const items = await children(path, has(input, "all"));
    if (!has(input, "json")) { if (paths.length > 1) console.log(`\n${raw}:`); for (const item of items) console.log(has(input, "long") ? `${item.directory ? "dir" : size(item.size).padStart(10)}  ${item.modified.toLocaleString()}  ${item.name}${item.directory ? "/" : ""}` : `${item.name}${item.directory ? "/" : ""}`); }
    output.push(...items.map(item => ({ name: item.name, path: shown(item.path), type: item.directory ? "directory" : "file", size: item.size, modified: item.modified.toISOString() })));
  }
  json(input, output);
}

export async function tree(input: CliInput) { const root = pathOf(input.args[0]); console.log(shown(root)); const walk = async (dir: string, depth: number, prefix: string) => { if (depth < 0) return; const items = await children(dir, has(input, "all")); for (let i = 0; i < items.length; i++) { const item = items[i]; const last = i === items.length - 1; console.log(`${prefix}${last ? "└── " : "├── "}${item.name}${item.directory ? "/" : ""}`); if (item.directory) await walk(item.path, depth - 1, prefix + (last ? "    " : "│   ")); } }; await walk(root, Number(input.options.get("depth") ?? 3), ""); }

export async function find(input: CliInput) { const root = pathOf(input.args[0]); const pattern = input.args[1] ?? "*"; const expression = new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".")}$`, "i"); const found: string[] = []; const walk = async (dir: string) => { for (const item of await children(dir, has(input, "all"))) { if (expression.test(item.name) || (pattern.startsWith(".") && extname(item.name) === pattern)) found.push(shown(item.path)); if (item.directory) await walk(item.path); } }; await walk(root); has(input, "json") ? console.log(JSON.stringify(found, null, 2)) : console.log(found.join("\n")); }

export async function read(input: CliInput, mode: "cat" | "head" | "tail") { const file = need(input.args[0], `${mode} requires a file`); const text = await readFile(pathOf(file), "utf8"); if (mode === "cat") return process.stdout.write(text); const count = Number(input.options.get("lines") ?? 10); console.log(text.split(/\r?\n/).slice(mode === "tail" ? -count : 0, mode === "tail" ? undefined : count).join("\n")); }
export async function touch(input: CliInput) { for (const raw of input.args) { const file = pathOf(raw); await writeFile(file, "", { flag: "a" }); await utimes(file, new Date(), new Date()); } }
export async function makeDir(input: CliInput) { for (const raw of input.args) await mkdir(pathOf(raw), { recursive: has(input, "parents") }); }
export async function write(input: CliInput, append = false) { const file = need(input.args[0], "write requires a file"); const text = input.args.slice(1).join(" "); await mkdir(dirname(pathOf(file)), { recursive: true }); append ? await appendFile(pathOf(file), `${text}\n`) : await writeFile(pathOf(file), `${text}\n`); }
export async function copy(input: CliInput) { const source = need(input.args[0], "cp requires a source"); const target = need(input.args[1], "cp requires a target"); await cp(pathOf(source), pathOf(target), { recursive: has(input, "recursive"), force: true }); }
export async function move(input: CliInput) { await rename(pathOf(need(input.args[0], "mv requires a source")), pathOf(need(input.args[1], "mv requires a target"))); }
export async function remove(input: CliInput) { for (const raw of input.args) await rm(pathOf(raw), { recursive: has(input, "recursive"), force: has(input, "force") }); }
export async function checksum(input: CliInput) { const file = need(input.args[0], "checksum requires a file"); const algorithm = input.args[1] ?? "sha256"; const hash = createHash(algorithm); hash.update(await readFile(pathOf(file))); console.log(`${hash.digest("hex")}  ${file}`); }
export async function metadata(input: CliInput) { const raw = need(input.args[0], "stat requires a path"); const file = pathOf(raw); const info = await stat(file); console.log(JSON.stringify({ path: file, type: info.isDirectory() ? "directory" : info.isFile() ? "file" : "other", size: info.size, mode: info.mode.toString(8), created: info.birthtime.toISOString(), modified: info.mtime.toISOString(), accessed: info.atime.toISOString() }, null, 2)); }
export async function disk(input: CliInput) { const root = pathOf(input.args[0]); let total = 0; const walk = async (dir: string) => { for (const item of await children(dir, true)) item.directory ? await walk(item.path) : total += item.size; }; await walk(root); console.log(`${size(total)}\t${shown(root)}`); }
