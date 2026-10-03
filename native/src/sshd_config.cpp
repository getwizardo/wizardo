#include "wizardo/sshd_config.hpp"

#include <cerrno>
#include <cstdlib>
#include <cstring>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <sys/stat.h>
#include <unistd.h>

namespace fs = std::filesystem;

namespace wizardo {

static bool valid_port(const std::string& port) {
  if (port.empty()) return false;
  for (const char character : port) if (character < '0' || character > '9') return false;
  const long number = std::strtol(port.c_str(), nullptr, 10);
  return number > 0 && number < 65536;
}

static std::string absolute_path(const std::string& path) {
  return path.empty() ? std::string{} : fs::absolute(path).lexically_normal().string();
}

std::string write_sshd_config(const Config& input) {
  if (input.host_key.empty()) {
    std::cerr << "error: --host-key is required\n";
    std::exit(2);
  }
  if (!valid_port(input.port)) {
    std::cerr << "error: invalid port: " << input.port << "\n";
    std::exit(2);
  }

  const std::string host_key = absolute_path(input.host_key);
  if (!fs::exists(host_key)) {
    std::cerr << "error: host key does not exist: " << host_key << "\n";
    std::exit(2);
  }

  const fs::path generated = input.config_file.empty()
      ? fs::temp_directory_path() / ("wizardo-sshd-" + std::to_string(getpid()) + ".conf")
      : fs::absolute(input.config_file);
  std::ofstream file(generated, std::ios::trunc);
  if (!file) {
    std::cerr << "error: cannot write config: " << generated << "\n";
    std::exit(1);
  }

  file << "Port " << input.port << "\n"
       << "ListenAddress " << input.address << "\n"
       << "HostKey " << host_key << "\n"
       << "PidFile " << (input.pid_file.empty() ? "/tmp/wizardo-sshd.pid" : absolute_path(input.pid_file)) << "\n"
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

  if (chmod(generated.c_str(), 0600) != 0)
    std::cerr << "warning: could not lock config permissions: " << std::strerror(errno) << "\n";
  return generated.string();
}

}  // namespace wizardo
