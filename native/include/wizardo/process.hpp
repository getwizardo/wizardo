#pragma once

#include "wizardo/config.hpp"
#include <string>

namespace wizardo {

int execute_sshd(const Config& config, const std::string& generated_config);

}  // namespace wizardo
