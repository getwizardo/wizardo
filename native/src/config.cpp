#include "wizardo/config.hpp"

#include <cstdlib>
#include <iostream>
#include <string>

namespace wizardo {

void print_usage(const char* program, int exit_code) {
  std::cout << "wizardo-ssh — native OpenSSH supervisor\n\n"
            << "Usage: " << program << " [options]\n\n"
            << "Options:\n"
            << "  --sshd PATH       OpenSSH daemon executable (default: sshd)\n"
            << "  --port PORT       Listen port (default: 2222)\n"
            << "  --address HOST    Listen address (default: 0.0.0.0)\n"
            << "  --host-key PATH   Host private key (required by sshd)\n"
            << "  --config PATH     Generated config path\n"
            << "  --pid PATH        PID file path\n"
            << "  --help            Show this help\n\n"
            << "Authentication is delegated to the system OpenSSH configuration.\n";
  std::exit(exit_code);
}

static std::string value_for(int argc, char** argv, int& index, const std::string& option) {
  if (index + 1 >= argc) {
    std::cerr << option << " requires a value\n";
    print_usage(argv[0], 2);
  }
  return argv[++index];
}

Config parse_arguments(int argc, char** argv) {
  Config config;
  for (int index = 1; index < argc; ++index) {
    const std::string argument = argv[index];
    if (argument == "--help" || argument == "-h") print_usage(argv[0], 0);
    else if (argument == "--sshd") config.sshd = value_for(argc, argv, index, argument);
    else if (argument == "--port") config.port = value_for(argc, argv, index, argument);
    else if (argument == "--address") config.address = value_for(argc, argv, index, argument);
    else if (argument == "--host-key") config.host_key = value_for(argc, argv, index, argument);
    else if (argument == "--config") config.config_file = value_for(argc, argv, index, argument);
    else if (argument == "--pid") config.pid_file = value_for(argc, argv, index, argument);
    else {
      std::cerr << "unknown option: " << argument << "\n";
      print_usage(argv[0], 2);
    }
  }
  return config;
}

}  // namespace wizardo
