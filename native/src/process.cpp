#include "wizardo/process.hpp"

#include <cerrno>
#include <cstring>
#include <iostream>
#include <unistd.h>

namespace wizardo {

int execute_sshd(const Config& config, const std::string& generated_config) {
  std::cout << "wizardo native SSH server\n"
            << "listening on " << config.address << ":" << config.port << "\n"
            << "using OpenSSH: " << config.sshd << "\n";

  execlp(config.sshd.c_str(), config.sshd.c_str(), "-D", "-e", "-f",
         generated_config.c_str(), static_cast<char*>(nullptr));
  std::cerr << "error: cannot execute " << config.sshd << ": " << std::strerror(errno) << "\n";
  return 127;
}

}  // namespace wizardo
