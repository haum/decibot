import aiowebserver as web

@web.route('GET', '/')
async def root_handler(rq):
    await rq.sendfile('decibot/static/root_index.htm')


@web.route('GET', '/static/', True)
async def root_handler(rq):
    await rq.sendfile(rq.path[8:], 'decibot/static/')
