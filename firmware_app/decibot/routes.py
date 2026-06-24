import json
 
import aiowebserver as web

import decibot.wlan as wlan

@web.route('GET', '/')
async def root_handler(rq):
    await rq.sendfile('decibot/static/root_index.htm')


@web.route('GET', '/static/', True)
async def root_handler(rq):
    await rq.sendfile(rq.path[8:], 'decibot/static/')


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

