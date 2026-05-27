def start():
    import decibot.wlan
    try:
        import aiowebserver as web
    except ImportError:
        try:
            decibot.wlan.first_connect()
        except ValueError:
            print(f'No known network in file wifi.dat')
        try:
            import mip
            mip.install('github:haum/micropython-aiowebserver')
            import aiowebserver as web
        except OSError:
            print('''
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!! Need haum/micropython-aiowebserver library, but unable to download. !!
!! Is the target connected?                                            !!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
''')

    import asyncio
    import decibot.routes # To register web routes

    asyncio.create_task(wlan.autoconnect())
    asyncio.create_task(web.start())

    try:
        asyncio.get_event_loop().run_forever()
    except KeyboardInterrupt:
        web.stop()
