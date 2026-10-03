#pragma once

#include <string>

namespace wizardo {

struct Config {
  std::string sshd = "sshd";
  std::string port = "2222";
  std::string address = "0.0.0.0";
  std::string host_key;
  std::string config_file;
  std::string pid_file;
};

void print_usage(const char* program, int exit_code);
Config parse_arguments(int argc, char** argv);

}  // namespace wizardo
