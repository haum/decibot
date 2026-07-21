import asyncio
import socket
import struct

import decibot.config as config
import decibot.motors as motors

enabled = False


async def start():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setblocking(False)
    sock.bind((config.get('listen_ip'), config.get('listen_port')))

    bot_nr = config.get('bot_nr')

    while True:
        try:
            data, addr = sock.recvfrom(1024)
            if len(data) == 5:
                f, p = struct.unpack(">Bf", data)
                if f & 0x0F == bot_nr:
                    m = motors.ml if f & 0xF0 else motors.mr
                    if enabled:
                        m(p)
        except OSError as e:
            if e.args[0] not in (11, 35):  # EAGAIN or EWOULDBLOCK
                raise
        await asyncio.sleep_ms(10)
