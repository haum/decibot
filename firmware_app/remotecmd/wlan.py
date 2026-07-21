import json
import network
import asyncio
import time
from machine import Pin

import remotecmd.config as conf

LED_builtin = Pin(conf.get('pin_led'), Pin.OUT)

wlan = network.WLAN(network.STA_IF)
mac = wlan.config('mac')
hostname = 'remotecmd-' + ''.join('{:02x}'.format(b) for b in mac[3:])

def led_state(on):
    if on == None:
        LED_builtin.value(not LED_builtin.value())
    else:
        LED_builtin.value(not on)

def load_networks():
    res = []
    try:
        with open('wifi.dat', 'r') as f:
            for line in f:
                res.append(line.strip().split(';', 1))
    except OSError:
        pass
    return res

def save_networks(networks):
    with open('wifi.dat', 'w') as f:
        for n in networks:
            f.write(n[0] + ';' + n[1] + '\n')

def print_wlaninfo():
    if wlan.isconnected():
        c = wlan.ifconfig()
        print("Connected\nIP:", c[0])
        print("Mask:", c[1])
        print("Gateway:", c[2])
        print("DNS:", c[3])
        print("Hostname:", wlan.config('hostname'))
        print(f"RSSI: {wlan.status('rssi')} dB")
        print(f'Web access: http://{c[0]}/')
    else:
        print("Not connected")

def first_connect(): # use autoconnect coroutine
    t = asyncio.create_task(autoconnect())
    async def stop_if_connected():
        while True:
            if wlan.isconnected():
                t.cancel()
                break
            else:
                await asyncio.sleep_ms(100)
    asyncio.create_task(stop_if_connected())
    try:
        asyncio.get_event_loop().run_forever()
    except KeyboardInterrupt:
        pass

async def connect(ssid, passwd):
    wlan.connect(ssid, passwd)
    while True:
        status = wlan.status()
        if status == network.STAT_CONNECTING or status == network.STAT_IDLE:
            await asyncio.sleep_ms(100)
            led_state(None)
        else:
            break
    led_state(False)

    if status == network.STAT_CONNECT_FAIL:
        print('Wifi: CONNECT_FAIL')
    elif status == network.STAT_GOT_IP:
        print('Wifi: GOT_IP')
    elif status == network.STAT_NO_AP_FOUND:
        print('Wifi: NO_AP_FOUND')
    elif status == network.STAT_WRONG_PASSWORD:
        print('Wifi: WRONG_PASSWORD')

    print_wlaninfo()

def disconnect():
    wlan.disconnect()

async def autoconnect():
    if wlan.isconnected():
        print_wlaninfo()

    while True:
        if wlan.isconnected():
            led_state(True)
            await asyncio.sleep(1)
            continue
        if not wlan.active():
            wlan.active(True)
        if wlan.status() != network.STAT_IDLE:
            wlan.disconnect()
        if hostname:
            wlan.config(hostname=hostname)
        nets = wlan.scan()
        ssids = tuple(net[0] for net in nets)

        for n in load_networks():
            s = n[0].encode()
            if s in ssids:
                print(f'Found network "{n[0]}", try connecting')
                await connect(*n)
                break
        else:
            print(f'No known network in {ssids}')
        await asyncio.sleep(1)
