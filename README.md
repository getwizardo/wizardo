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

The CLI works directly on the local filesystem:

```sh
wizardo ls -la projects
wizardo tree . -L 3
wizardo find . '*.ts'
wizardo cp -r src backup/src
wizardo rm -rf build
```

Node.js 20 or newer is required for the TypeScript CLI.
