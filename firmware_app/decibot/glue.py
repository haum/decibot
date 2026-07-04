import asyncio
import time

import decibot.motors as mot
import decibot.microphones as mic
import decibot.sensors as sensors

mic_ctrl = False

async def start():
    global mic_ctrl
    while True:
        start = time.ticks_ms()

        v_stop = sensors.in_stop1.value() or sensors.in_stop2.value()
        v_wheels = sensors.in_wheel_l.value() and sensors.in_wheel_r.value()
        if v_stop or v_wheels:
            if mic_ctrl:
                mic_ctrl = False
                mot.ml(0)
                mot.mr(0)

        if mic_ctrl:
            mot.ml(mic.ml_p)
            mot.mr(mic.mr_p)

        await asyncio.sleep_ms(max(0, 50 - (time.ticks_ms() - start)))
