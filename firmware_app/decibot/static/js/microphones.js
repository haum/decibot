import { infos_mask, infos_ms, INFOS_MICROPHONE } from "./infos.js";

const section = document.getElementById('section_microphones');
section.insertAdjacentHTML('beforeend', `
	<div>
		<canvas id="microphones_canvas" width="800" height="800"></canvas>
	</div>
`);

const mic_canvas = document.getElementById('microphones_canvas');
const mic_history = [];
const maxhist = 400;

document.body.addEventListener('h:infos:microphone', e => {
	mic_history.push([...e.detail]);
	if (mic_history.length > maxhist) {
		const n = mic_history.length - maxhist;
		mic_history.splice(0, n);
	}

	const ctx = mic_canvas.getContext("2d");
	const w = mic_canvas.width;
	const h = mic_canvas.height;

	const scale_v = x => Math.log(1 + 1e-5* x) / Math.log(1 + 1e-5 * 1e9) * w/2;

	ctx.resetTransform();
	ctx.clearRect(0, 0, w, h);
	ctx.translate(w/2, 0);

	ctx.fillStyle = "#008000";

	ctx.beginPath();
	ctx.moveTo(0, 0);
	for (let i = mic_history.length-1; i > 0; i--) {
		const v = scale_v(mic_history[i][0]) * -1;
		ctx.lineTo(v, (mic_history.length - i - 1)*h/maxhist);
	}
	ctx.lineTo(0, mic_history.length*h/maxhist);
	ctx.closePath();
	ctx.fill();

	ctx.beginPath();
	ctx.moveTo(0, 0);
	for (let i = mic_history.length-1; i > 0; i--) {
		const v = scale_v(mic_history[i][1]);
		ctx.lineTo(v, (mic_history.length - i - 1)*h/maxhist);
	}
	ctx.lineTo(0, mic_history.length*h/maxhist);
	ctx.closePath();
	ctx.fill();

	ctx.lineWidth = 2;
	ctx.strokeStyle = "#800000";
	ctx.beginPath();
	const v0 = scale_v(mic_history[mic_history.length-1][2]) * -1;
	ctx.moveTo(v0, 0);
	for (let i = mic_history.length-1; i > 0; i--) {
		const v = scale_v(mic_history[i][2]) * -1;
		ctx.lineTo(v, (mic_history.length - i - 1)*h/maxhist);
	}
	ctx.stroke();

	ctx.beginPath();
	const v0b = scale_v(mic_history[mic_history.length-1][3]);
	ctx.moveTo(v0b, 0);
	for (let i = mic_history.length-1; i > 0; i--) {
		const v = scale_v(mic_history[i][3]);
		ctx.lineTo(v, (mic_history.length - i - 1)*h/maxhist);
	}
	ctx.stroke();

	ctx.fillStyle = "#00aa00";
	ctx.beginPath();
	ctx.moveTo(0, 0);
	for (let i = mic_history.length-1; i >= 0; i--) {
		const v = mic_history[i][4] / 255 * -1 * 20;
		ctx.lineTo(v, (mic_history.length - i - 1)*h/maxhist);
	}
	ctx.lineTo(0, (mic_history.length-1)*h/maxhist);
	ctx.closePath();
	ctx.fill();

	ctx.beginPath();
	ctx.moveTo(0, 0);
	for (let i = mic_history.length-1; i >= 0; i--) {
		const v = mic_history[i][5] / 255 * 20;
		ctx.lineTo(v, (mic_history.length - i - 1)*h/maxhist);
	}
	ctx.lineTo(0, (mic_history.length-1)*h/maxhist);
	ctx.closePath();
	ctx.fill();

	ctx.lineWidth = 2;
	ctx.strokeStyle = "#e0e3e7";
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(0, h);
	ctx.stroke();
});

document.body.addEventListener('h:section:statechanged', e => {
	infos_mask(INFOS_MICROPHONE, e.detail['on']);
});
infos_mask(INFOS_MICROPHONE, true);
