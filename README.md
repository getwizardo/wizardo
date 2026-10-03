# wizardo-cli

`wizardo-package` is the TypeScript CLI for a Wizardo cloud desktop server.

## Install and build

```sh
npm install
npm run build
npm link
wizardo --help
```

The CLI also installs the `wizardo-cli` alias. Node.js 20 or newer is required.

## Configuration

Set `WIZARDO_URL` or pass `--url` to select the server. The default is `http://localhost:3000`.

```sh
wizardo health
wizardo list Documents
wizardo upload ./photo.jpg Pictures/photo.jpg
wizardo download Pictures/photo.jpg ./photo.jpg
wizardo mkdir Backups
wizardo rm old.txt
```

Use `--json` with `list` or `health` for scripting.
