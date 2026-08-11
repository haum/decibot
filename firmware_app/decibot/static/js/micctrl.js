import { infos_mask, INFOS_MICCTRL } from "./infos.js";

const section = document.getElementById('section_micctrl');
section.insertAdjacentHTML('beforeend', `
	<div class="grid">
			<div><div class="iosensor" id="micctrl_indicator">Actif</div></div>
			<input type="button" value="Activer MicCtrl" id="micctrl_btn" />
	</div>
`);

const el_ind = document.getElementById('micctrl_indicator');
const el_btn = document.getElementById('micctrl_btn');
let enabled = false;

el_btn.addEventListener('click', _ => {
	if (enabled)
		fetch('/mic_ctrl/off');
	else
		fetch('/mic_ctrl/on');
})

document.body.addEventListener('h:infos:micctrl', e => {
	const v_mic_ctrl = e.detail[0];

	enabled = v_mic_ctrl;
	el_ind.classList.toggle('on', v_mic_ctrl);
	el_btn.value = (enabled ? "Désactiver" : "Activer") + " MicCtrl"
});

document.body.addEventListener('h:section:statechanged', e => {
	infos_mask(INFOS_MICCTRL, e.detail['on']);
});
infos_mask(INFOS_MICCTRL, true);
