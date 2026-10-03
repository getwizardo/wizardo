export type CliInput = { command: string; args: string[]; flags: Set<string>; options: Map<string, string> };

export function parseArgs(input: string[]): CliInput {
  const flags = new Set<string>();
  const options = new Map<string, string>();
  const args: string[] = [];
  for (let i = 0; i < input.length; i++) {
    const value = input[i];
    if (value === "--") { args.push(...input.slice(i + 1)); break; }
    if (value === "--json") { flags.add("json"); continue; }
    if (value === "--all" || value === "-a") { flags.add("all"); continue; }
    if (value === "--long" || value === "-l") { flags.add("long"); continue; }
    if (value === "--recursive" || value === "-r" || value === "-R") { flags.add("recursive"); continue; }
    if (value === "--force" || value === "-f") { flags.add("force"); continue; }
    if (value === "--parents" || value === "-p") { flags.add("parents"); continue; }
    if (/^-[alrRfp]{2,}$/.test(value)) { for (const flag of value.slice(1)) { const mapped = ({ a: "all", l: "long", r: "recursive", R: "recursive", f: "force", p: "parents" } as Record<string, string>)[flag]; if (mapped) flags.add(mapped); } continue; }
    if (value === "--lines" || value === "-n" || value === "--depth" || value === "-L") { options.set(value === "--depth" || value === "-L" ? "depth" : "lines", input[++i] ?? "10"); continue; }
    if (value.startsWith("--lines=")) { options.set("lines", value.slice(8)); continue; }
    if (value.startsWith("--depth=")) { options.set("depth", value.slice(8)); continue; }
    if (value.startsWith("-")) throw new Error(`unknown option '${value}'`);
    args.push(value);
  }
  return { command: args.shift() ?? "help", args, flags, options };
}

export const has = (input: CliInput, name: string) => input.flags.has(name);
export const option = (input: CliInput, name: string, fallback: string) => input.options.get(name) ?? fallback;
