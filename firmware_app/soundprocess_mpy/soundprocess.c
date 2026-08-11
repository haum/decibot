// Sound energy computation for decibot, as a MicroPython native module.
//
// The audio task hands over an I2S buffer of interleaved 16 bits stereo
// samples and gets back the sum of the squares of each channel. That sum is
// the only part of the microphone processing worth leaving Python: it runs
// once per sample, around 22000 times per second, while the filter chain
// consuming it runs about ten times per second.

#include <stddef.h>
#include <stdint.h>

// The exact sum over a 1024 frames buffer reaches 2**40, which does not fit
// in a 32 bits value, and this module cannot hand back anything wider:
// dynruntime.mk builds rv32imc with MICROPY_FLOAT_IMPL = none, and
// dynruntime.h only exposes 32 bits integer constructors. So accumulate
// exactly on 64 bits, then drop the low bits on the way out.
//
// With a shift of 12 the result of a 1024 frames buffer stays below 2**28,
// small enough to cross into Python as a plain small integer, no allocation
// involved. What is dropped sits far below what the filters can use: even a
// signal grazing the noise floor, an amplitude of 10 out of 32768, still
// comes back as 25 rather than 0.
//
// Keep the shift even, so the amplitude derived from it by the Python side is
// scaled by an exact power of two: sqrt(2**12) = 64.
#define SP_SCALE_SHIFT 12

// Samples are read through an int16_t pointer, so the buffer must be 2 bytes
// aligned. Both array('h') and the I2S DMA buffer it is filled from satisfy
// this.
static void sp_energy(const int16_t *s, size_t nframes,
                      uint32_t *out_l, uint32_t *out_r) {
    uint64_t acc_l = 0;
    uint64_t acc_r = 0;

    for (size_t i = 0; i < nframes; i++) {
        // Squaring in 32 bits is exact: the widest square, (-32768)**2, is
        // 2**30. Only the accumulation needs 64 bits, and a 64 bits add is
        // inlined by the compiler, so this pulls in no libgcc helper and the
        // module links without LINK_RUNTIME.
        int32_t l = s[2 * i];
        int32_t r = s[2 * i + 1];
        acc_l += (uint32_t)(l * l);
        acc_r += (uint32_t)(r * r);
    }

    *out_l = (uint32_t)(acc_l >> SP_SCALE_SHIFT);
    *out_r = (uint32_t)(acc_r >> SP_SCALE_SHIFT);
}

#ifndef SP_TEST

#include "py/dynruntime.h"

// energy(buf, nbytes) -> (left, right)
//
// buf holds interleaved 16 bits stereo samples, nbytes is the count returned
// by readinto(), so nbytes // 4 complete frames are processed and a trailing
// partial frame is ignored.
static mp_obj_t sp_energy_fun(mp_obj_t buf_obj, mp_obj_t nbytes_obj) {
    mp_buffer_info_t bufinfo;
    mp_get_buffer_raise(buf_obj, &bufinfo, MP_BUFFER_READ);

    mp_int_t nbytes = mp_obj_get_int(nbytes_obj);
    if (nbytes < 0 || (size_t)nbytes > bufinfo.len) {
        mp_raise_ValueError(MP_ERROR_TEXT("nbytes out of range"));
    }

    uint32_t l, r;
    sp_energy((const int16_t *)bufinfo.buf, (size_t)nbytes / 4, &l, &r);

    mp_obj_t items[2] = {
        mp_obj_new_int_from_uint(l),
        mp_obj_new_int_from_uint(r),
    };
    return mp_obj_new_tuple(2, items);
}
static MP_DEFINE_CONST_FUN_OBJ_2(sp_energy_obj, sp_energy_fun);

mp_obj_t mpy_init(mp_obj_fun_bc_t *self, size_t n_args, size_t n_kw, mp_obj_t *args) {
    MP_DYNRUNTIME_INIT_ENTRY

    mp_store_global(MP_QSTR_energy, MP_OBJ_FROM_PTR(&sp_energy_obj));
    // Exported so the caller derives its scale factor instead of hardcoding
    // one that would silently go stale if the shift above ever changed.
    mp_store_global(MP_QSTR_SCALE_SHIFT, mp_obj_new_int(SP_SCALE_SHIFT));

    MP_DYNRUNTIME_INIT_EXIT
}

#endif // SP_TEST
