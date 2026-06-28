import json

config = {}
config_types = {}

def init_configs():
    def c(n, v, t):
        global config, config_types
        config[n] = v
        config_types[n] = t

    c('pin_i2s_sck', 0, int)
    c('pin_i2s_sd', 1, int)
    c('pin_i2s_ws', 2, int)
    c('pin_stop1', 3, int)
    c('pin_stop2', 4, int)
    c('pin_ml_lpwm', 5, int)
    c('pin_ml_rpwm', 6, int)
    c('pin_mr_lpwm', 7, int)
    c('pin_mr_rpwm', 8, int)
    c('pin_wheel_l', 9, int)
    c('pin_wheel_r', 10, int)

    c('mic_filter_5tau_fast', 0.5, float)
    c('mic_filter_5tau_slow', 4.0, float)
    c('mic_filter_5tau_ratio', 1.5, float)
    c('mic_filter_ratio', 1.25, float)

notify_changes_cbs = {}

def load():
    global config
    try:
        with open('haumbot_config.json', 'r') as f:
            config.update(json.load(f))
    except:
        print('Loading config failed, use default')

def save():
    with open('haumbot_config.json', 'w') as f:
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

