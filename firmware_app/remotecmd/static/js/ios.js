import { infos_mask, INFOS_BUTTONS } from "./infos.js";

const section = document.getElementById('section_ios');
section.insertAdjacentHTML('beforeend', `
	<p class="grid">
			<span class="iosensor" id="ios_xp">X+</span>
			<span class="iosensor" id="ios_yp">Y+</span>
			<span class="iosensor" id="ios_zp">Z+</span>
			<span class="iosensor" id="ios_xm">X-</span>
			<span class="iosensor" id="ios_ym">Y-</span>
			<span class="iosensor" id="ios_zm">Z-</span>
			<span class="iosensor" id="ios_xc">✗</span>
			<span class="iosensor" id="ios_yc">•</span>
			<span class="iosensor" id="ios_zc">✓</span>
	</p>
`);

const chk_ios_xp = document.getElementById('ios_xp');
const chk_ios_yp = document.getElementById('ios_yp');
const chk_ios_zp = document.getElementById('ios_zp');
const chk_ios_xm = document.getElementById('ios_xm');
const chk_ios_ym = document.getElementById('ios_ym');
const chk_ios_zm = document.getElementById('ios_zm');
const chk_ios_xc = document.getElementById('ios_xc');
const chk_ios_yc = document.getElementById('ios_yc');
const chk_ios_zc = document.getElementById('ios_zc');

document.body.addEventListener('h:infos:buttons', e => {
	chk_ios_xp.classList.toggle('on', e.detail[0])
	chk_ios_yp.classList.toggle('on', e.detail[1])
	chk_ios_zp.classList.toggle('on', e.detail[2])
	chk_ios_xm.classList.toggle('on', e.detail[3])
	chk_ios_ym.classList.toggle('on', e.detail[4])
	chk_ios_zm.classList.toggle('on', e.detail[5])
	chk_ios_xc.classList.toggle('on', e.detail[6])
	chk_ios_yc.classList.toggle('on', e.detail[7])
	chk_ios_zc.classList.toggle('on', e.detail[8])
});

document.body.addEventListener('h:section:statechanged', e => {
	infos_mask(INFOS_BUTTONS, e.detail['on']);
});
infos_mask(INFOS_BUTTONS, true);
