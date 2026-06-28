import micropython
import asyncio
import machine
import array
import math
import time

import decibot.config as conf

sck_pin = machine.Pin(conf.get('pin_i2s_sck'))  # Serial clock
sd_pin  = machine.Pin(conf.get('pin_i2s_sd'))   # Serial data
ws_pin  = machine.Pin(conf.get('pin_i2s_ws'))   # Word select

dt = 0.050

audio_in = machine.I2S(
    0,
    sck=sck_pin,
    ws=ws_pin,
    sd=sd_pin,
    mode=machine.I2S.RX,
    bits=32,
    format=machine.I2S.STEREO,
    rate=32000,
    ibuf=2048
)

power_fast_l = 0
power_fast_r = 0
power_slow_l = 0
power_slow_r = 0
ml_p = 0
mr_p = 0

@micropython.native
def process_buffer(buf, n, a_f, a_s, a_r, r):
    global power_fast_l, power_fast_r
    global power_slow_l, power_slow_r
    global ml_p, mr_p

    acc_l = 0
    acc_r = 0

    for i in range(n//2):
        acc_l += buf[2*i]**2
        acc_r += buf[2*i+1]**2

    p_l = math.sqrt(2*acc_l/n)
    p_r = math.sqrt(2*acc_r/n)

    power_fast_l += a_f * (p_l - power_fast_l)
    power_fast_r += a_f * (p_r - power_fast_r)
    power_slow_l += a_s * (p_l - power_slow_l)
    power_slow_r += a_s * (p_r - power_slow_r)
    ml_p += a_r * ((1 if power_fast_l > power_slow_l * r else 0) - ml_p)
    mr_p += a_r * ((1 if power_fast_r > power_slow_r * r else 0) - mr_p)


async def start():
    sreader = asyncio.StreamReader(audio_in)
    buf = array.array("i", [0] * 4096)

    while True:
        start = time.ticks_ms()

        n = await sreader.readinto(buf)
        if n > 0:
            alpha_fast = 1-math.exp(-5*dt/conf.get('mic_filter_5tau_fast'))
            alpha_slow = 1-math.exp(-5*dt/conf.get('mic_filter_5tau_slow'))
            alpha_ratio = 1-math.exp(-5*dt/conf.get('mic_filter_5tau_ratio'))
            ratio = conf.get('mic_filter_ratio')
            process_buffer(buf, n, alpha_fast, alpha_slow, alpha_ratio, ratio)

        await asyncio.sleep_ms(max(0, 50 - (time.ticks_ms() - start)))
