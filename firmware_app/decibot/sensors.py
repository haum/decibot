import machine

import decibot.config as conf

class Sensor:
    def __init__(self, n, inv=False):
        self.inv = inv
        self.p = machine.Pin(n, machine.Pin.IN, machine.Pin.PULL_UP)

    def value(self):
        return self.p.value() ^ self.inv;

in_stop1 = Sensor(conf.get('pin_stop1'), True)      # Detector 1 of stop button
in_stop2 = Sensor(conf.get('pin_stop2'), True)      # Detector 2 of stop button
in_wheel_l = Sensor(conf.get('pin_wheel_l'), True)  # Detection of left wheel lift
in_wheel_r = Sensor(conf.get('pin_wheel_r'), True)  # Detection of right wheel lift
