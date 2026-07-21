import { form_post } from "./main.js";

const section = document.getElementById('section_config');
const form = document.createElement('form');

const c_pins = [
  ['pin_l0', 'Line 0'],
  ['pin_l1', 'Line 1'],
  ['pin_l2', 'Line 2'],
  ['pin_c0', 'Colonne 0'],
  ['pin_c1', 'Colonne 1'],
  ['pin_c2', 'Colonne 2'],
  ['pin_led_x', 'Led X'],
  ['pin_led_y', 'Led Y'],
  ['pin_led_z', 'Led Z'],
  ['pin_led', 'Wifi LED'],
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
