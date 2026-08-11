import asyncio
import time

import decibot.config as conf
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

        halt = v_stop or v_wheels
        mot.inhibit(halt)

        if halt:
            mic_ctrl = False
        elif mic_ctrl:
            mot.ml(mic.ml_p)
            mot.mr(mic.mr_p)
        elif (mot.ml_p or mot.mr_p) and mot.idle_ms() > conf.get('cmd_timeout_ms'):
            # A remote command source that goes silent (browser tab closed,
            # wifi drop, UDP pilot crashed) must not leave the robot running.
            mot.stop()

        await asyncio.sleep_ms(max(0, 50 - (time.ticks_ms() - start)))
