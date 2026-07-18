#!/usr/bin/env python3

import argparse
import socket
import wave
import requests
import struct
import time

def debug_mic_stream(ip, local_ip, local_port=9000):
    if ip: requests.get(f"http://{ip}/debug_mic_addr/{local_ip}:{local_port}", timeout=3)

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind((local_ip, local_port))
    sock.settimeout(1.0)

    try:
        while True:
            try:
                data, addr = sock.recvfrom(4096)
                values = [v[0] for v in struct.iter_unpack("<h", data)]
                left = values[0::2]
                right = values[1::2]
                yield left, right
            except socket.timeout:
                pass
    except KeyboardInterrupt:
        pass
    finally:
        sock.close()
        if ip: requests.get(f"http://{ip}/debug_mic_addr/None", timeout=3)

def main():
    time0 = time.time()
    parser = argparse.ArgumentParser(description="Get Decibot microphone data for debug")
    parser.add_argument("--ip", help="Remote IP")
    parser.add_argument("--local-ip", required=True, help="Local IP")
    parser.add_argument("--local-port", type=int, default=9000, help="Local UDP port")
    parser.add_argument("--file", default="capture.wav", help="File to write")
    args = parser.parse_args()

    wav = wave.open(args.file, "wb")
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(22050)

    for left, right in debug_mic_stream(args.ip, args.local_ip, args.local_port):
        print(f'{time.time()-time0:.3f}\tSample received!\tlen={[len(left), len(right)]}')
        b = b"".join(struct.pack("<h", l) + struct.pack("<h", r) for l, r in zip(left, right))
        wav.writeframes(b)

    wav.close()

if __name__ == "__main__":
    main()
