export const INFOS_BUTTONS = 0x01;

let infos_ws = null;
let period_ms = 500;
let mask = 0;
const connected_el = document.getElementById('infos_connected');

export const infos_ms = ms => {
	if (ms === undefined) return period_ms;
	period_ms = ms;
	send_mask(mask);
};
window.infos_ms = infos_ms;

function on_open() {
	connected_el.classList.add('on');
	send_mask(mask);
}

function on_close() {
	connected_el.classList.remove('on');
}

function on_msg(e) {
	const view = new DataView(e.data);
	let pos = 0;

	const mask = view.getUint8(pos);
	pos++;

	if (mask & INFOS_BUTTONS) {
		document.body.dispatchEvent(new CustomEvent('h:infos:buttons', {
			'detail': [
				view.getUint8(pos + 0),
				view.getUint8(pos + 1),
				view.getUint8(pos + 2),
				view.getUint8(pos + 3),
				view.getUint8(pos + 4),
				view.getUint8(pos + 5),
				view.getUint8(pos + 6),
				view.getUint8(pos + 7),
				view.getUint8(pos + 8),
				view.getUint8(pos + 9),
				view.getUint8(pos + 10),
				view.getUint8(pos + 11),
			]
		}));
		pos += 12;
	}
}

function send_mask() {
	if (mask == 0) {
		if (infos_ws) {
			infos_ws.close();
			infos_ws = null;
		}
	} else {
		if (infos_ws) {
			if (infos_ws.readyState == WebSocket.OPEN) {
				const buf = new Uint8Array(2);
				buf[0] = period_ms / 10;
				buf[1] = mask;
				infos_ws.send(buf);
			}
		} else {
			infos_ws = new WebSocket('ws://' + document.location.host + '/infos.ws');
			infos_ws.binaryType = "arraybuffer";
			infos_ws.addEventListener("open", on_open);
			infos_ws.addEventListener("message", on_msg);
			infos_ws.addEventListener("close", on_close);
		}
	}
}

export function infos_mask(v, on) {
	if (on)
		mask |= v;
	else
		mask &= ~v;
	send_mask();
}
