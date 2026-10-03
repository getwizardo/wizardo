#pragma once

#include "wizardo/config.hpp"
#include <string>

namespace wizardo {

// Writes a private, explicit sshd configuration and returns its path.
std::string write_sshd_config(const Config& config);

}  // namespace wizardo
