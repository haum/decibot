import { infos_mask, INFOS_UDPCMD } from "./infos.js";

const section = document.getElementById('section_udpcmd');
section.insertAdjacentHTML('beforeend', `
	<div class="grid">
			<div><div class="iosensor" id="udpcmd_indicator">Actif</div></div>
			<input type="button" value="Activer UDPcmd" id="udpcmd_btn" />
	</div>
`);

const el_ind = document.getElementById('udpcmd_indicator');
const el_btn = document.getElementById('udpcmd_btn');
let enabled = false;

el_btn.addEventListener('click', _ => {
	if (enabled)
		fetch('/udpcmd/off');
	else
		fetch('/udpcmd/on');
})

document.body.addEventListener('h:infos:udpcmd', e => {
	const v_udpcmd = e.detail[0];

	enabled = v_udpcmd;
	el_ind.classList.toggle('on', v_udpcmd);
	el_btn.value = (enabled ? "Désactiver" : "Activer") + " UDPcmd"
});

document.body.addEventListener('h:section:statechanged', e => {
	infos_mask(INFOS_UDPCMD, e.detail['on']);
});
infos_mask(INFOS_UDPCMD, true);
