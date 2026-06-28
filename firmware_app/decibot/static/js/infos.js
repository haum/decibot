export const INFOS_MICROPHONE = 0x01;
export const INFOS_MOTORS = 0x02;
export const INFOS_IOSENSORS = 0x04;

let infos_ws = null;
let period_ms = 500;
let mask = 0;

export const infos_ms = ms => {
	if (ms === undefined) return period_ms;
	period_ms = ms;
	send_mask(mask);
};
window.infos_ms = infos_ms;

function on_msg(e) {
	const view = new DataView(e.data);
	let pos = 0;

	const mask = view.getUint8(pos);
	pos++;

	if (mask & INFOS_MICROPHONE) {
		document.body.dispatchEvent(new CustomEvent('h:infos:microphone', {
			'detail': [
				view.getFloat32(pos + 0),
				view.getFloat32(pos + 4),
				view.getFloat32(pos + 8),
				view.getFloat32(pos + 12),
				view.getUint8(pos + 16),
				view.getUint8(pos + 17),
			]
		}));
		pos += 4*4 + 2;
	}

	if (mask & INFOS_MOTORS) {
		document.body.dispatchEvent(new CustomEvent('h:infos:motors', {
			'detail': [
				view.getFloat32(pos + 0),
				view.getFloat32(pos + 4),
			]
		}));
		pos += 2*4;
	}

	if (mask & INFOS_IOSENSORS) {
		document.body.dispatchEvent(new CustomEvent('h:infos:iosensors', {
			'detail': [
				!!view.getUint8(pos + 0),
				!!view.getUint8(pos + 1),
				!!view.getUint8(pos + 2),
				!!view.getUint8(pos + 3),
			]
		}));
		pos += 4;
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
			infos_ws.addEventListener("open", send_mask);
			infos_ws.addEventListener("message", on_msg);
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
