#!/bin/bash

set -e
cd "$(dirname "$0")"

MICROPY_DIR="${MICROPY_DIR:-/tmp/micropython}"
MICROPY_TAG="${MICROPY_TAG:-v1.28.0}"

if [ ! -d "$MICROPY_DIR" ]; then
    git clone https://github.com/micropython/micropython.git \
        --branch "$MICROPY_TAG" --depth 1 "$MICROPY_DIR"
fi

# A natmod is a freestanding object: it links against nothing but the
# MicroPython runtime table, so no ESP-IDF and no board SDK are needed here,
# only a bare metal compiler for the target architecture.
#
# dynruntime.mk defaults CROSS to riscv64-unknown-elf- for rv32imc, but
# distributions name their RISC-V toolchain differently, and the one shipped
# with ESP-IDF is riscv32-esp-elf-. Pick whichever is installed; a value
# passed on the command line overrides the makefile's own assignment.
if [ -z "$CROSS" ]; then
    for c in riscv64-unknown-elf- riscv64-elf- riscv32-esp-elf-; do
        if command -v "${c}gcc" > /dev/null 2>&1; then
            CROSS="$c"
            break
        fi
    done
fi

if [ -z "$CROSS" ]; then
    cat >&2 <<'MSG'
No RISC-V toolchain found.

Install a bare metal one, for instance:
  Arch     pacman -S riscv64-elf-gcc
  Debian   apt install gcc-riscv64-unknown-elf
  ESP-IDF  . $IDF_PATH/export.sh   (after ./install.sh esp32c3)

Or point at one explicitly:
  CROSS=riscv64-unknown-elf- ./build.sh
MSG
    exit 1
fi

echo "Building with ${CROSS}gcc"
exec make MPY_DIR="$MICROPY_DIR" CROSS="$CROSS" "$@"
