import { infos_mask, INFOS_IOSENSORS } from "./infos.js";

const section = document.getElementById('section_iosensors');
section.insertAdjacentHTML('beforeend', `
	<div class="grid">
			<div class="iosensor" id="iosensors_stop">Stop</div>
			<div class="iosensor" id="iosensors_lift_l">Soulèvement gauche</div>
			<div class="iosensor" id="iosensors_lift_r">Soulèvement droit</div>
	</div>
`);

const chk_stop = document.getElementById('iosensors_stop');
const chk_lift_l = document.getElementById('iosensors_lift_l');
const chk_lift_r = document.getElementById('iosensors_lift_r');

document.body.addEventListener('h:infos:iosensors', e => {
	const v_stop1 = e.detail[0];
	const v_stop2 = e.detail[1];
	const v_lify_l = e.detail[2];
	const v_lify_r = e.detail[3];

	chk_stop.classList.toggle('on', v_stop1 || v_stop2);
	chk_lift_l.classList.toggle('on', v_lify_l);
	chk_lift_r.classList.toggle('on', v_lify_r);
});

document.body.addEventListener('h:section:statechanged', e => {
	infos_mask(INFOS_IOSENSORS, e.detail['on']);
});
infos_mask(INFOS_IOSENSORS, true);
