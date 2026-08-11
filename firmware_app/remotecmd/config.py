import json

config = {}
config_types = {}

def init_configs():
    def c(n, v, t):
        global config, config_types
        config[n] = v
        config_types[n] = t

    c('pin_l0', 4, int)
    c('pin_l1', 5, int)
    c('pin_l2', 15, int)
    c('pin_c0', 12, int)
    c('pin_c1', 14, int)
    c('pin_c2', 13, int)
    c('pin_led_x', 16, int)
    c('pin_led_y', 0, int)
    c('pin_led_z', 2, int)
    c('pin_led', 2, int)


notify_changes_cbs = {}

def load():
    global config
    try:
        with open('remotecmd_config.json', 'r') as f:
            config.update(json.load(f))
    except:
        print('Loading config failed, use default')

def save():
    with open('remotecmd_config.json', 'w') as f:
        json.dump(config, f)

def get(k, dv=None):
    if k in config:
        return config[k]
    else:
        return dv

def set(k, v):
    if not k in config: return
    v = config_types[k](v)
    if v == config[k]: return
    config[k] = v
    if k in notify_changes_cbs:
        for cb in notify_changes_cbs[k]:
            cb()

def notify_changes(k, fct):
    if not k in notify_changes_cbs:
        notify_changes_cbs[k] = []
    notify_changes_cbs[k].append(fct)

init_configs()
load()

