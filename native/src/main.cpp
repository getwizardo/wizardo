#include "wizardo/config.hpp"
#include "wizardo/process.hpp"
#include "wizardo/sshd_config.hpp"

#include <filesystem>
#include <iostream>

int main(int argc, char** argv) {
  const wizardo::Config config = wizardo::parse_arguments(argc, argv);
  const std::string generated = wizardo::write_sshd_config(config);
  const int result = wizardo::execute_sshd(config, generated);

  // Temporary configuration is removed after sshd exits. A user-supplied
  // --config is preserved for inspection and service management.
  if (config.config_file.empty()) {
    std::error_code ignored;
    std::filesystem::remove(generated, ignored);
  }
  return result;
}
