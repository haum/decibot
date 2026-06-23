import machine

# Using https://handsontec.com/index.php/product/43a-high-power-bts7960-dc-motor-driver-module/ module
ml_lpwm_pin = machine.Pin(5)  # LPWM of BTS7960 (left motor)
ml_rpwm_pin = machine.Pin(6)  # RPWM of BTS7960 (left motor)
mr_lpwm_pin = machine.Pin(7)  # LPWM of BTS7960 (right motor)
mr_rpwm_pin = machine.Pin(8)  # RPWM of BTS7960 (right motor)

ml_lpwm = machine.PWM(ml_lpwm_pin, freq=24000, duty_u16=0)
ml_rpwm = machine.PWM(ml_rpwm_pin, freq=24000, duty_u16=0)
mr_lpwm = machine.PWM(mr_lpwm_pin, freq=24000, duty_u16=0)
mr_rpwm = machine.PWM(mr_rpwm_pin, freq=24000, duty_u16=0)

ml_p = 0
mr_p = 0

def ml(p):
    global ml_p
    ml_p = max(-1, min(p, 1))
    if p > 0:
        ml_lpwm.duty_u16(0)
        ml_rpwm.duty_u16(int(ml_p*65535))
    else:
        ml_rpwm.duty_u16(0)
        ml_lpwm.duty_u16(int(-ml_p*65535))

def mr(p):
    global mr_p
    mr_p = max(-1, min(p, 1))
    if p > 0:
        mr_lpwm.duty_u16(0)
        mr_rpwm.duty_u16(int(mr_p*65535))
    else:
        mr_rpwm.duty_u16(0)
        mr_lpwm.duty_u16(int(-mr_p*65535))

def stop():
    ml(0)
    mr(0)
    ml_p = mr_p = 0

