# wizardo-cli

`wizardo-package` is a powerful TypeScript command-line file manager. It works directly on the local filesystem: no cloud desktop server, account, or backend is required.

## Install

```sh
npm install
npm run build
npm link
wizardo help
```

The package exposes both `wizardo` and `wizardo-cli` commands. Node.js 20 or newer is required.

## Commands

```sh
wizardo pwd
wizardo ls -la projects
wizardo tree . -L 3
wizardo find . '*.ts'
wizardo stat package.json
wizardo du .
wizardo cat README.md
wizardo head README.md -n 5
wizardo tail app.log -n 20
wizardo touch notes/today.md
wizardo write notes/today.md "Ship it"
wizardo append notes/today.md "Another line"
wizardo mkdir -p backups/2026
wizardo cp -r src backups/src
wizardo mv old.txt archive/old.txt
wizardo rm -rf build
```

## Capabilities

- Fast directory listing with hidden files, metadata, and JSON output
- Recursive tree display with configurable depth
- Recursive name and extension search
- File metadata and disk-usage inspection
- Read, head, and tail files
- Create, replace, append, and touch files
- Recursive copy and removal
- Move and rename files
- Parent-directory creation
- Useful Unix-style aliases and flags

All paths are resolved from the directory where the command is run. Use `--json` with supported inspection commands for scripts.
