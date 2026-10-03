cmake_minimum_required(VERSION 3.16)
project(wizardo_ssh VERSION 1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_executable(wizardo-ssh
  native/src/main.cpp
  native/src/config.cpp
  native/src/sshd_config.cpp
  native/src/process.cpp
)

target_include_directories(wizardo-ssh PRIVATE native/include)
target_compile_options(wizardo-ssh PRIVATE -Wall -Wextra -Wpedantic)
install(TARGETS wizardo-ssh RUNTIME DESTINATION bin)
