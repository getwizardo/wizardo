# Wizardo

Wizardo now includes two native-facing tools:

- `wizardo-cli` / `wizardo-package`: a powerful local TypeScript file manager.
- `wizardo-ssh`: a dependency-free C++17 supervisor for a real OpenSSH server.

## Native SSH server

The C++ program deliberately does not reimplement SSH cryptography. It generates a locked-down temporary OpenSSH configuration and executes the platform's audited `sshd` binary. This keeps the entry point native while avoiding an unsafe home-grown SSH protocol implementation.

The native server is split into focused source files:

```text
native/include/wizardo/config.hpp
native/include/wizardo/sshd_config.hpp
native/include/wizardo/process.hpp
native/src/main.cpp
native/src/config.cpp
native/src/sshd_config.cpp
native/src/process.cpp
```

Build it with:

```sh
cmake -S . -B build
cmake --build build
```

Run it with an existing OpenSSH host key:

```sh
./build/wizardo-ssh \
  --host-key /etc/ssh/ssh_host_ed25519_key \
  --port 2222
```

Options include `--sshd`, `--address`, `--config`, and `--pid`. The generated configuration enables password and public-key authentication, disables root login, X11 forwarding, TCP forwarding, and tunneling, and runs in the foreground.

A system OpenSSH server package must be installed separately. Wizardo does not copy or reimplement OpenSSH.

## TypeScript file CLI

```sh
npm install
npm run build
npm link
wizardo help
```

The CLI works directly on the local filesystem and is split into command, parser, core filesystem, and firmware modules:

```text
src/index.ts
src/cli/parser.ts
src/core/files.ts
src/firmware/boot.ts
schemas/commands.yaml
schemas/firmware.xml
```

```sh
wizardo ls -la projects
wizardo tree . -L 3
wizardo find . '*.ts'
wizardo checksum package.json sha512
wizardo cp -r src backup/src
wizardo rm -rf build
wizardo firmware
wizardo schema
```

The YAML command registry documents handlers, arguments, aliases, flags, and output contracts. The XML firmware manifest describes the portable TypeScript runtime devices and boot entry point.

Node.js 20 or newer is required for the TypeScript CLI. The TypeScript firmware layer is a portable runtime/boot abstraction; it is not bare-metal microcontroller firmware.
