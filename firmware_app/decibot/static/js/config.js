import { form_post } from "./main.js";

const section = document.getElementById('section_config');
const form = document.createElement('form');

const c_pins = [
  ['pin_i2s_sck', 'Microphone I2S SCK'],
  ['pin_i2s_sd', 'Microphone I2S SD'],
  ['pin_i2s_ws', 'Microphone I2S WS'],
  ['pin_stop1', 'STOP button 1'],
  ['pin_stop2', 'STOP button 2'],
  ['pin_ml_lpwm', 'Moteur Gauche - LPWM'],
  ['pin_ml_rpwm', 'Moteur Gauche - RPWM'],
  ['pin_mr_lpwm', 'Moteur Droit - LPWM'],
  ['pin_mr_rpwm', 'Moteur Droit - RPWM'],
  ['pin_wheel_l', 'Détection levage gauche'],
  ['pin_wheel_r', 'Détection levage droit'],
]

const c_mic_filters = [
  ['mic_filter_5tau_slow', '5×τ microphone slow'],
  ['mic_filter_5tau_fast', '5×τ microphone fast'],
  ['mic_filter_5tau_ratio', '5×τ signal moteur'],
  ['mic_filter_ratio', 'Ratio déclenchement moteur'],
]

function update_form(conf) {
	for (const input of form.elements) {
		if (input.name)
			input.value = conf[input.name];
	}
}

async function load_config() {
	const r = await fetch('/config/all.json');
	const conf = await r.json();
	update_form(conf);
}

function setup_form() {
	form.action = '/config/set';
	form.method = 'POST';
	section.append(form);

	const add_input = (l, locked) => {
		const l_label = l[1];
		const l_name = l[0];
		const label = document.createElement('label');
		form.append(label);
		const input = document.createElement('input')
		input.type="text";
		input.disabled = locked;
		input.name = l_name;
		label.append(l_label, input);
	};

	const h_pins = document.createElement('h3');
	h_pins.innerText = 'Brochage'
	form.append(h_pins);
	for (const l of c_pins) add_input(l, true);

	const h_mic_filters = document.createElement('h3');
	h_mic_filters.innerText = 'Filtres microphone'
	form.append(h_mic_filters);
	for (const l of c_mic_filters) add_input(l);

	const btn = document.createElement('input');
	btn.type = 'submit';
	form.append(btn)

	form.addEventListener('submit', async e => {
		e.preventDefault();
		btn.disabled = true;
		const r = await form_post(form);
		update_form(await r.json())
		btn.disabled = false;
	});
}

setup_form();
load_config();
