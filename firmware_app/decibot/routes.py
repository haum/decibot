import asyncio
import json
import struct
 
import aiowebserver as web

import decibot.config as conf
import decibot.microphones as mic
import decibot.motors as motors
import decibot.sensors as sensors
import decibot.wlan as wlan

@web.route('GET', '/')
async def root_handler(rq):
    await rq.sendfile('decibot/static/root_index.htm')


@web.route('GET', '/static/', True)
async def root_handler(rq):
    await rq.sendfile(rq.path[8:], 'decibot/static/')


@web.route('GET', '/config/all.json')
async def config_all_handler(rq):
    await rq.header_json()
    await rq.w(json.dumps(conf.config))

@web.route('POST', '/config/set')
async def config_set_handler(rq):
    d = await rq.decode_postform_data()
    for k, v in d.items():
        try:
            conf.set(k, v)
        except:
            pass
    conf.save()
    await config_all_handler(rq)


@web.route('GET', '/wlan/known.json')
async def wlan_known_handler(rq):
    await rq.header_json()
    await rq.w(json.dumps([n[0] for n in wlan.load_networks()]))

@web.route('POST', '/wlan/set_password')
async def wlan_password_handler(rq):
    networks = wlan.load_networks()
    form = await rq.decode_postform_data()
    ssid = form.get('ssid')
    pwd = form.get('password')
    if ssid in next(zip(*networks)):
        wlan.save_networks([[ssid, pwd] if n[0] == ssid else n for n in networks])
    else:
        networks.append([ssid, pwd])
        wlan.save_networks(networks)
    await rq.header_text()
    await rq.w('OK')

@web.route('POST', '/wlan/delete')
async def wlan_delete_handler(rq):
    ssid = (await rq.decode_postform_data()).get('ssid')
    wlan.save_networks([n for n in wlan.load_networks() if n[0] != ssid])
    await rq.header_text()
    await rq.w('OK')

@web.route('POST', '/wlan/sort')
async def wlan_sort_handler(rq):
    form = await rq.decode_postform_data()
    networks = wlan.load_networks()
    ranks = (form.get(str(i+1), 1000) for i in range(len(networks)))
    wlan.save_networks([n for _, _, n in sorted(zip(ranks, range(len(networks)), networks))])
    await rq.header_text()
    await rq.w('OK');

@web.route('GET', '/wlan/disconnect')
async def wlan_disconnect_handler(rq):
    print('DISCONNECT')
    wlan.disconnect()
    await rq.header_text()
    await rq.w('OK');


@web.route_ws('/motors.ws')
async def motor_ws(rq, evt):
    t = evt['type']
    if t == 'bytes':
        vl, vr = struct.unpack('ff', evt['data'])
        motors.ml(vl)
        motors.mr(vr)
    elif t == 'close':
        motors.stop()


infos_ws_data = {}
async def infos_ws_task(rq):
    info = infos_ws_data[rq]
    while True:
        mask = info['mask']
        b = int(mask).to_bytes()
        if mask & 1: b += struct.pack(
            '>ffff',
            mic.power_slow_l, mic.power_slow_r,
            mic.power_fast_l, mic.power_fast_r
        )
        if mask & 2: b += struct.pack('>ff', motors.ml_p, motors.mr_p)
        if mask & 4: b+= struct.pack(
            'BBBB',
            sensors.in_stop1.value(), sensors.in_stop2.value(),
            sensors.in_wheel_l.value(), sensors.in_wheel_r.value()
        )
        await rq.w(b);
        await asyncio.sleep(info['delay'])

@web.route_ws('/infos.ws')
async def infos_ws(rq, evt):
    global infos_ws_data
    t = evt['type']
    if t == 'open':
        infos_ws_data[rq] = {
            'task': asyncio.create_task(infos_ws_task(rq)),
            'mask': 1,
            'delay': 0.5
        }
    elif t == 'bytes':
        infos_ws_data[rq]['mask'] = evt['data'][-1]
        if len(evt['data']) > 1:
            infos_ws_data[rq]['delay'] = max(evt['data'][-2], 1) * 0.01
    elif t == 'close':
        infos_ws_data[rq]['task'].cancel()
        del infos_ws_data[rq]

