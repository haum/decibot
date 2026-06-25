import machine

class Sensor:
    def __init__(self, n, inv=False):
        self.inv = inv
        self.p = machine.Pin(n, machine.Pin.IN, machine.Pin.PULL_UP)

    def value(self):
        return self.p.value() ^ self.inv;

in_stop1 = Sensor(3, True)    # Detector 1 of stop button
in_stop2 = Sensor(4, True)    # Detector 2 of stop button
in_wheel_l = Sensor(9, True)  # Detection of left wheel lift
in_wheel_r = Sensor(10, True) # Detection of right wheel lift
