import micropython
import asyncio
import machine
import array
import math
import time
import socket

import decibot.config as conf

sck_pin = machine.Pin(conf.get('pin_i2s_sck'))  # Serial clock
sd_pin  = machine.Pin(conf.get('pin_i2s_sd'))   # Serial data
ws_pin  = machine.Pin(conf.get('pin_i2s_ws'))   # Word select

debug_addr = None

bufsz = 4096
samplerate = 22050
audio_in = machine.I2S(
    0,
    sck=sck_pin,
    ws=ws_pin,
    sd=sd_pin,
    mode=machine.I2S.RX,
    bits=16,
    format=machine.I2S.STEREO,
    rate=samplerate,
    ibuf=bufsz
)

nt = 0
acc_l = 0
acc_r = 0
power_fast_l = 0
power_fast_r = 0
power_slow_l = 0
power_slow_r = 0
ml_p = 0
mr_p = 0

@micropython.native
def process_buffer(buf, n):
    global nt
    global acc_l, acc_r
    global power_fast_l, power_fast_r
    global power_slow_l, power_slow_r
    global ml_p, mr_p

    for i in range(n//2):
        acc_l += buf[2*i]**2
        acc_r += buf[2*i+1]**2

    nt += n//2
    if nt >= 2048:
        dt = nt/samplerate

        a_f = 1-math.exp(-5*dt/conf.get('mic_filter_5tau_fast'))
        a_s = 1-math.exp(-5*dt/conf.get('mic_filter_5tau_slow'))
        a_r = 1-math.exp(-5*dt/conf.get('mic_filter_5tau_ratio'))
        r = conf.get('mic_filter_ratio')

        p_l = math.sqrt(2*acc_l/nt)
        p_r = math.sqrt(2*acc_r/nt)

        power_fast_l += a_f * (p_l - power_fast_l)
        power_fast_r += a_f * (p_r - power_fast_r)
        power_slow_l += a_s * (p_l - power_slow_l)
        power_slow_r += a_s * (p_r - power_slow_r)

        ml_p += a_r * ((1 if power_fast_l > power_slow_l * r else 0) - ml_p)
        mr_p += a_r * ((1 if power_fast_r > power_slow_r * r else 0) - mr_p)

        nt = 0


async def start():
    udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    udp_socket.setblocking(False)
 
    buf = bytearray(bufsz)
    sreader = asyncio.StreamReader(audio_in)
 
    try:
        while True:
            n = await sreader.readinto(buf)
            if n > 0:
                process_buffer(buf, n)
                if debug_addr:
                    udp_socket.sendto(buf[:n], debug_addr)
            await asyncio.sleep_ms(0) 

    except Exception as e:
        print(f"Erreur audio: {e}")
    finally:
        udp_socket.close()
