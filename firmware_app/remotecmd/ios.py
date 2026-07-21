import asyncio
import machine

import remotecmd.config as config

led_x = machine.Signal(config.get('pin_led_x'), machine.Pin.OUT, invert=True)
led_y = machine.Signal(config.get('pin_led_y'), machine.Pin.OUT, invert=True)
led_z = machine.Signal(config.get('pin_led_z'), machine.Pin.OUT, invert=True)

l0 = machine.Signal(config.get('pin_l0'), machine.Pin.OUT, invert=True)
l1 = machine.Signal(config.get('pin_l1'), machine.Pin.OUT, invert=True)
l2 = machine.Signal(config.get('pin_l2'), machine.Pin.OUT, invert=True)

c0 = machine.Signal(config.get('pin_c0'), machine.Pin.IN, machine.Pin.PULL_UP, invert=True)
c1 = machine.Signal(config.get('pin_c1'), machine.Pin.IN, machine.Pin.PULL_UP, invert=True)
c2 = machine.Signal(config.get('pin_c2'), machine.Pin.IN, machine.Pin.PULL_UP, invert=True)

btns = {}
for k in ['x+', 'y+', 'z+', 'x-', 'y-', 'z-', '✗', '•', '✓']:
    btns[k] = False


def set_btn_value(k, v):
    if btns[k] != v:
        btns[k] = v


async def start():
    led_x.on()
    led_y.on()
    led_z.on()
    l0.off()
    l1.off()
    l2.off()
    while True:
        l0.on()
        set_btn_value('x+', c0.value())
        set_btn_value('y+', c1.value())
        set_btn_value('z+', c2.value())
        l0.off()

        l1.on()
        set_btn_value('x-', c0.value())
        set_btn_value('y-', c1.value())
        set_btn_value('z-', c2.value())
        l1.off()

        l2.on()
        set_btn_value('✗', c0.value())
        set_btn_value('•', c1.value())
        set_btn_value('✓', c2.value())
        l2.off()

        await asyncio.sleep_ms(50)
