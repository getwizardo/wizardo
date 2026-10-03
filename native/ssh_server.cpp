// Wizardo native SSH server launcher.
//
// This is intentionally a small, dependency-free C++ supervisor. SSH is a
// cryptographic protocol and must not be reimplemented with ad-hoc sockets.
// The supervisor creates a locked-down configuration and execs the platform's
// OpenSSH daemon, giving Wizardo a native C++ entry point while retaining the
// audited SSH implementation.

#include <cerrno>
#include <cstdlib>
#include <cstring>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <optional>
#include <string>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>

namespace fs = std::filesystem;

struct Config {
  std::string sshd = "sshd";
  std::string port = "2222";
  std::string address = "0.0.0.0";
  std::string host_key;
  std::string config_file;
  std::string pid_file;
  bool foreground = true;
  bool help = false;
};

[[noreturn]] void usage(int code) {
  std::cout << "wizardo-ssh — native OpenSSH supervisor\n\n"
            << "Usage: wizardo-ssh [options]\n\n"
            << "Options:\n"
            << "  --sshd PATH       OpenSSH daemon executable (default: sshd)\n"
            << "  --port PORT       Listen port (default: 2222)\n"
            << "  --address HOST    Listen address (default: 0.0.0.0)\n"
            << "  --host-key PATH   Host private key (required by sshd)\n"
            << "  --config PATH     Generated config path\n"
            << "  --pid PATH        PID file path\n"
            << "  --help            Show this help\n\n"
            << "Authentication is delegated to the system OpenSSH configuration.\n";
  std::exit(code);
}

std::string take(int argc, char** argv, int& i, const std::string& option) {
  if (i + 1 >= argc) { std::cerr << option << " requires a value\n"; usage(2); }
  return argv[++i];
}

Config parse(int argc, char** argv) {
  Config config;
  for (int i = 1; i < argc; ++i) {
    const std::string arg = argv[i];
    if (arg == "--help" || arg == "-h") config.help = true;
    else if (arg == "--sshd") config.sshd = take(argc, argv, i, arg);
    else if (arg == "--port") config.port = take(argc, argv, i, arg);
    else if (arg == "--address") config.address = take(argc, argv, i, arg);
    else if (arg == "--host-key") config.host_key = take(argc, argv, i, arg);
    else if (arg == "--config") config.config_file = take(argc, argv, i, arg);
    else if (arg == "--pid") config.pid_file = take(argc, argv, i, arg);
    else { std::cerr << "unknown option: " << arg << "\n"; usage(2); }
  }
  if (config.help) usage(0);
  return config;
}

bool valid_port(const std::string& port) {
  if (port.empty()) return false;
  for (char c : port) if (c < '0' || c > '9') return false;
  const long value = std::strtol(port.c_str(), nullptr, 10);
  return value > 0 && value < 65536;
}

std::string absolute_or_empty(const std::string& path) {
  if (path.empty()) return {};
  return fs::absolute(path).lexically_normal().string();
}

std::string make_config(const Config& input) {
  Config config = input;
  if (config.host_key.empty()) {
    std::cerr << "error: --host-key is required\n";
    std::exit(2);
  }
  if (!valid_port(config.port)) {
    std::cerr << "error: invalid port: " << config.port << "\n";
    std::exit(2);
  }
  config.host_key = absolute_or_empty(config.host_key);
  if (!fs::exists(config.host_key)) {
    std::cerr << "error: host key does not exist: " << config.host_key << "\n";
    std::exit(2);
  }

  const fs::path generated = config.config_file.empty()
      ? fs::temp_directory_path() / ("wizardo-sshd-" + std::to_string(getpid()) + ".conf")
      : fs::absolute(config.config_file);
  std::ofstream file(generated, std::ios::trunc);
  if (!file) { std::cerr << "error: cannot write config: " << generated << "\n"; std::exit(1); }

  // Explicit settings prevent accidental inheritance from a machine-wide config.
  file << "Port " << config.port << "\n"
       << "ListenAddress " << config.address << "\n"
       << "HostKey " << config.host_key << "\n"
       << "PidFile " << (config.pid_file.empty() ? "/tmp/wizardo-sshd.pid" : absolute_or_empty(config.pid_file)) << "\n"
       << "PasswordAuthentication yes\n"
       << "KbdInteractiveAuthentication no\n"
       << "PubkeyAuthentication yes\n"
       << "PermitRootLogin no\n"
       << "X11Forwarding no\n"
       << "AllowTcpForwarding no\n"
       << "PermitTunnel no\n"
       << "PrintMotd no\n"
       << "LogLevel VERBOSE\n";
  file.close();
  if (chmod(generated.c_str(), 0600) != 0) { std::cerr << "warning: could not lock config permissions: " << std::strerror(errno) << "\n"; }
  return generated.string();
}

int run_daemon(const Config& config, const std::string& generated) {
  std::cout << "wizardo native SSH server\n"
            << "listening on " << config.address << ":" << config.port << "\n"
            << "using OpenSSH: " << config.sshd << "\n";
  execlp(config.sshd.c_str(), config.sshd.c_str(), "-D", "-e", "-f", generated.c_str(), static_cast<char*>(nullptr));
  std::cerr << "error: cannot execute " << config.sshd << ": " << std::strerror(errno) << "\n";
  return 127;
}

int main(int argc, char** argv) {
  const Config config = parse(argc, argv);
  const std::string generated = make_config(config);
  const int result = run_daemon(config, generated);
  std::error_code ignored;
  if (config.config_file.empty()) fs::remove(generated, ignored);
  return result;
}
