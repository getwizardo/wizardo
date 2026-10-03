cmake_minimum_required(VERSION 3.16)
project(wizardo_ssh VERSION 1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_executable(wizardo-ssh native/ssh_server.cpp)
target_compile_options(wizardo-ssh PRIVATE -Wall -Wextra -Wpedantic)
install(TARGETS wizardo-ssh RUNTIME DESTINATION bin)
