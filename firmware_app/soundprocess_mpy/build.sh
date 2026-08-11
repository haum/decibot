#!/bin/bash

set -e
cd "$(dirname "$0")"

MICROPY_DIR="/tmp/micropython"
ESPIDF="/tmp/espidf"

if [ ! -d "$MICROPY_DIR" ]; then
	MICROPY_REPO="https://github.com/micropython/micropython.git"
	git clone "$MICROPY_REPO" --branch v1.28.0 --depth 1 "$MICROPY_DIR"
fi

if [ ! -d "$ESPIDF" ]; then
	git clone -b v5.5.1 --recursive --depth 1 https://github.com/espressif/esp-idf.git "$ESPIDF"
	cd "$ESPIDF"
	./install.sh esp32
	cd -
fi

source "$ESPIDF"/export.sh
make
