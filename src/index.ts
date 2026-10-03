#!/usr/bin/env node
import { parseArgs } from "./cli/parser.js";
import { boot } from "./firmware/boot.js";
import { checksum, copy, disk, find, list, makeDir, metadata, move, read, remove, touch, tree, write } from "./core/files.js";

const VERSION = "3.0.0";

function help(): never {
  console.log(`wizardo-cli ${VERSION} — native local file and runtime command system

Navigation and inspection:
  pwd                         Print the current directory
  ls [path]                   List files (-a hidden, -l details)
  tree [path]                 Directory tree (-L depth)
  find [path] [pattern]       Search by name or extension
  stat <path>                 File metadata
  du [path]                   Recursive disk usage
  checksum <file> [algorithm] SHA-256/SHA-512 checksum
  cat <file...>               Print files
  head <file> -n <lines>      Print first lines
  tail <file> -n <lines>      Print last lines

File operations:
  touch <file...>             Create files or update timestamps
  write <file> <text>         Replace a text file
  append <file> <text>        Append text to a file
  mkdir <dir...>              Create directories (-p parents)
  cp <source> <target>        Copy files or directories (-r recursive)
  mv <source> <target>        Move or rename files
  rm <path...>                Remove files (-r recursive, -f force)

Runtime and schemas:
  firmware                    Print the TypeScript runtime boot manifest
  schema                      Print YAML/XML command schemas
  version                     Show version
  help                        Show this help

Global options: -a -l -r -R -f -p --json -n <lines> -L <depth>`);
  process.exit(0);
}

async function schema() {
  console.log("schemas/commands.yaml");
  console.log("schemas/firmware.xml");
  console.log("Schema files describe the command surface and firmware manifest.");
}

async function main() {
  const input = parseArgs(process.argv.slice(2));
  switch (input.command) {
    case "help": case "--help": help(); break;
    case "version": console.log(VERSION); break;
    case "pwd": console.log(process.cwd()); break;
    case "ls": case "dir": await list(input); break;
    case "tree": await tree(input); break;
    case "find": await find(input); break;
    case "cat": await read(input, "cat"); break;
    case "head": await read(input, "head"); break;
    case "tail": await read(input, "tail"); break;
    case "stat": await metadata(input); break;
    case "du": await disk(input); break;
    case "checksum": case "hash": await checksum(input); break;
    case "touch": await touch(input); break;
    case "write": await write(input); break;
    case "append": await write(input, true); break;
    case "mkdir": await makeDir(input); break;
    case "cp": case "copy": await copy(input); break;
    case "mv": case "move": await move(input); break;
    case "rm": case "remove": case "delete": await remove(input); break;
    case "firmware": console.log(JSON.stringify(boot(), null, 2)); break;
    case "schema": await schema(); break;
    default: throw new Error(`unknown command '${input.command}' (run 'wizardo help')`);
  }
}

main().catch(error => { console.error(`wizardo: ${error instanceof Error ? error.message : String(error)}`); process.exit(1); });
