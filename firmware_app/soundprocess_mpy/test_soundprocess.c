// Host side checks for the energy computation. Needs no cross toolchain and
// no board, just a compiler:
//
//     gcc -Wall -Wextra -O2 -o /tmp/sp_test test_soundprocess.c && /tmp/sp_test
//
// SP_TEST keeps the MicroPython glue of soundprocess.c out of the build, so
// only the arithmetic is compiled here.

#define SP_TEST
#include "soundprocess.c"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static int failures = 0;

static void check_u32(const char *what, uint32_t got, uint32_t expected) {
    if (got != expected) {
        printf("FAIL %s: got %u, expected %u\n", what, got, expected);
        failures++;
    } else {
        printf("ok   %s (%u)\n", what, got);
    }
}

// Deliberately not the same shape as the implementation: a separate loop over
// the two channels, so a mistake in the interleaving is not reproduced here.
static uint64_t reference(const int16_t *s, size_t nframes, int channel) {
    uint64_t acc = 0;
    for (size_t i = channel; i < nframes * 2; i += 2) {
        int64_t v = s[i];
        acc += (uint64_t)(v * v);
    }
    return acc;
}

int main(void) {
    enum { NFRAMES = 1024 };
    static int16_t buf[NFRAMES * 2];
    uint32_t l, r;

    // Silence stays silent.
    memset(buf, 0, sizeof(buf));
    sp_energy(buf, NFRAMES, &l, &r);
    check_u32("silence left", l, 0);
    check_u32("silence right", r, 0);

    // Full scale on both channels: 1024 * 32768**2 = 2**40, shifted down to
    // 2**28. This is the worst case the accumulator must survive.
    for (size_t i = 0; i < NFRAMES; i++) {
        buf[2 * i] = -32768;
        buf[2 * i + 1] = -32768;
    }
    sp_energy(buf, NFRAMES, &l, &r);
    check_u32("full scale left", l, 1u << 28);
    check_u32("full scale right", r, 1u << 28);

    // Channels must not bleed into each other.
    for (size_t i = 0; i < NFRAMES; i++) {
        buf[2 * i] = 1000;
        buf[2 * i + 1] = 0;
    }
    sp_energy(buf, NFRAMES, &l, &r);
    check_u32("left only, left", l, (uint32_t)((1000ull * 1000ull * NFRAMES) >> SP_SCALE_SHIFT));
    check_u32("left only, right", r, 0);

    for (size_t i = 0; i < NFRAMES; i++) {
        buf[2 * i] = 0;
        buf[2 * i + 1] = 1000;
    }
    sp_energy(buf, NFRAMES, &l, &r);
    check_u32("right only, left", l, 0);
    check_u32("right only, right", r, (uint32_t)((1000ull * 1000ull * NFRAMES) >> SP_SCALE_SHIFT));

    // A signal grazing the noise floor must still come back non zero, which
    // is what justifies the shift being 12 and not more.
    for (size_t i = 0; i < NFRAMES; i++) {
        buf[2 * i] = 10;
        buf[2 * i + 1] = -10;
    }
    sp_energy(buf, NFRAMES, &l, &r);
    check_u32("noise floor left", l, 25);
    check_u32("noise floor right", r, 25);

    // Pseudo random content, checked against an independent accumulation.
    srand(1);
    for (size_t i = 0; i < NFRAMES * 2; i++) {
        buf[i] = (int16_t)((rand() % 65536) - 32768);
    }
    sp_energy(buf, NFRAMES, &l, &r);
    check_u32("random left", l, (uint32_t)(reference(buf, NFRAMES, 0) >> SP_SCALE_SHIFT));
    check_u32("random right", r, (uint32_t)(reference(buf, NFRAMES, 1) >> SP_SCALE_SHIFT));

    // A trailing partial frame is ignored: 3 bytes past 4 frames is still
    // 4 frames worth of energy. nbytes // 4 is what the caller passes in.
    for (size_t i = 0; i < NFRAMES * 2; i++) {
        buf[i] = 100;
    }
    sp_energy(buf, 19 / 4, &l, &r);
    check_u32("partial frame left", l, (uint32_t)((100ull * 100ull * 4) >> SP_SCALE_SHIFT));

    // An empty buffer is not an error.
    sp_energy(buf, 0, &l, &r);
    check_u32("empty buffer left", l, 0);
    check_u32("empty buffer right", r, 0);

    if (failures) {
        printf("\n%d check(s) failed\n", failures);
        return 1;
    }
    printf("\nall checks passed\n");
    return 0;
}
