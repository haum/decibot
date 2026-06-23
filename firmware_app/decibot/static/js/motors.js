import { infos_mask, INFOS_MOTORS } from "./infos.js";

const section = document.getElementById('section_motors');
section.insertAdjacentHTML('beforeend', `
	<div class="grid">
		<p><canvas id="motors_joystick" width="400" height="400"></canvas></p>
		<p>
			<input type="range" min="-100" max="100" value="0" id="motors_ml" /><br/>
			<input type="range" min="-100" max="100" value="0" id="motors_mr" /><br/>
			<input type="button" id="motors_stop" value="Stop" />
			<canvas id="motors_canvas" width="350" height="40"></canvas>
		</p>
	</div>
`);

const motors_buf = new Float32Array(2);
const motors_ml = document.getElementById("motors_ml")
const motors_mr = document.getElementById("motors_mr")
const motors_stop = document.getElementById("motors_stop")
const motors_joystick = document.getElementById('motors_joystick');
const motors_canvas = document.getElementById('motors_canvas');

let motors_ws = null;

const send_motors = (vl, vr) => {
	if (motors_ws && motors_ws.readyState == WebSocket.OPEN) {
		const lim = v => Math.max(-1, Math.min(v, 1));
		motors_buf[0] = lim(vl);
		motors_buf[1] = lim(vr);
		motors_ml.value = vl * 100;
		motors_mr.value = vr * 100;
		motors_ws.send(motors_buf);
	} else if (!motors_ws || motors_ws.readyState != WebSocket.CONNECTING) {
		motors_ws = new WebSocket('ws://' + document.location.host + '/motors.ws');
		motors_ws.addEventListener("open", () => send_motors(vl, vr));
	}
};

const update_motors = () => {
	const vl = motors_ml.value / 100;
	const vr = motors_mr.value / 100;
	send_motors(vl, vr);
}

motors_ml.addEventListener('change', update_motors);
motors_mr.addEventListener('change', update_motors);
motors_stop.addEventListener('click', e => {
	e.preventDefault();
	motors_ml.value = 0;
	motors_mr.value = 0;
	update_motors();
});

const btnsz = 40;
let positionX = 0, positionY = 0;
let clicked = false;
let lastsend = performance.now();
const joystick_draw = () => {
	const ctx = motors_joystick.getContext("2d");
	const w = motors_joystick.width;
	const h = motors_joystick.height;
	ctx.clearRect(0, 0, w, h);

	ctx.fillStyle = "#00aaff40";
	ctx.beginPath();
	ctx.arc(w/2, h/2, w/2-btnsz, 0, 2 * Math.PI);
	ctx.fill();

	ctx.lineWidth = 2;
	ctx.strokeStyle = "#0099ee";
	ctx.fillStyle = "#00aaff";
	ctx.beginPath();
	ctx.arc(w/2 + positionX, h/2 + positionY, btnsz, 0, 2 * Math.PI);
	ctx.fill();
	ctx.stroke();
}
const updatePosition = e => {
	const clientX = e.clientX || e.touches[0].clientX;
	const clientY = e.clientY || e.touches[0].clientY;
	const r = motors_joystick.getBoundingClientRect();
	const kw = r.width/2 - btnsz;
	let vx = Math.max(-1, Math.min((clientX - r.left - r.width/2) / kw, 1));
	let vy = Math.max(-1, Math.min((clientY - r.top - r.height/2) / kw, 1));
	if (vx*vx + vy*vy > 1) {
		const a = Math.atan2(vy, vx);
		vx = Math.cos(a);
		vy = Math.sin(a);
	}
	positionX = vx * kw;
	positionY = vy * kw;
	vy *= -1;
	if (performance.now() - lastsend > 250) {
		send_motors(vy+vx, vy-vx);
		lastsend = performance.now();
	}
	joystick_draw();
}
const ondown = e => {
	clicked = true;
	motors_joystick.style.cursor = 'none'
	updatePosition(e);
};
const onmove = e => {
	if (clicked) {
		updatePosition(e);
	}
};
const onup = () => {
	if (clicked) {
		send_motors(0, 0);
		motors_joystick.style.cursor = ''
		clicked = false;
		positionX = positionY = 0;
		joystick_draw();
	}
};
joystick_draw();
motors_joystick.addEventListener('mousedown', ondown);
motors_joystick.addEventListener('mousemove', onmove);
motors_joystick.addEventListener('mouseup', onup);
motors_joystick.addEventListener('mouseleave', onup);
motors_joystick.addEventListener('touchstart', ondown);
motors_joystick.addEventListener('touchmove', onmove);
motors_joystick.addEventListener('touchend', onup);
motors_joystick.addEventListener('touchcancel', onup);

document.body.addEventListener('h:infos:motors', e => {
	const ctx = motors_canvas.getContext("2d");
	const w = motors_canvas.width;
	const h = motors_canvas.height;
	const m = 5;
	const ml = e.detail[0];
	const mr = e.detail[1];
	ctx.clearRect(0, 0, w, h);
	ctx.lineWidth = 3;
	ctx.strokeStyle = "#808080"
	ctx.fillStyle = "#008000"

	ctx.beginPath();
	ctx.rect(m, m, w-2*m, (h/2-m));
	ctx.stroke();

	ctx.beginPath();
	ctx.rect(m, (h/2-m)+m, w-2*m, (h/2-m));
	ctx.stroke();

	ctx.beginPath();
	if (ml > 0)
		ctx.rect(w/2, m+1, ml*(w/2-m), (h/2-m)-2);
	else
		ctx.rect(w/2+ml*(w/2-m), m+1, -ml*(w/2-m), (h/2-m)-2);
	ctx.fill();

	ctx.beginPath();
	if (ml > 0)
		ctx.rect(w/2, (h/2-m)+m+1, mr*(w/2-m), (h/2-m)-2);
	else
		ctx.rect(w/2+mr*(w/2-m), (h/2-m)+m+1, -mr*(w/2-m), (h/2-m)-2);
	ctx.fill();
});

document.body.addEventListener('h:section:statechanged', e => {
	infos_mask(INFOS_MOTORS, e.detail['on']);
});
infos_mask(INFOS_MOTORS, true);
