import { form_post } from "./main.js";

const section = document.getElementById('section_wlan');
section.insertAdjacentHTML('beforeend', `
	<h3>Enregistrés</h3>
	<form action="/wlan/sort" method="POST" id="form_wlan_sort"></form>
	<h3>Ajouter/Modifier</h3>
	<form action="/wlan/set_password" method="POST" id="form_wlan_pass">
		<div role="group">
			<input type="text" name="ssid" placeholder="SSID" />
			<input type="text" name="password" placeholder="Mot de passe" />
			<input type="submit" value="Ajouter/Modifier" />
		</div>
	</form>
	<h3>Déconnecter</h3>
	<form action="/wlan/disconnect" method="GET" id="form_wlan_disconnect">
		<input type="submit" value="Déconnecter" />
	</form>
`);

const form_sort = document.getElementById('form_wlan_sort');
const form_pass = document.getElementById('form_wlan_pass');
const form_deco = document.getElementById('form_wlan_disconnect');

async function load_known() {
	form_sort.innerText = '';
	const r = await fetch('/wlan/known.json');
	const networks = await r.json();
	let i = 0;
	form_sort.innerText = 'Renuméroter pour changer l\'ordre de priorité';
	for (const n of networks) {
		const div = document.createElement('div');
		div.role = "group";
		const input_n = document.createElement('input');
		input_n.type = "text";
		input_n.value = n;
		input_n.disabled = true;
		const input_v = document.createElement('input');
		input_v.type = "number";
		input_v.name = i+1;
		input_v.min = 1;
		input_v.max = networks.length;
		input_v.value = i+1;
		const input_d = document.createElement('input');
		input_d.type = 'button';
		input_d.value = '×';
		input_d.classList.add('outline');
		input_d.classList.add('secondary');
		input_d.style.backgroundColor = '#800000';
		input_d.onclick = async () => {
			const data = new URLSearchParams();
			data.append('ssid', n);
			form_sort.innerText = '';
			await fetch('/wlan/delete', {
				method: 'post',
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: data
			});
			load_known();
		}
		i++;
		div.append(input_n, input_v, input_d);
		form_sort.append(div);
	}
	const input_s = document.createElement('input');
	input_s.type = 'submit';
	input_s.value = 'Réordonner';
	form_sort.append(input_s);
}

form_sort.addEventListener('submit', async e => {
	e.preventDefault();
	await form_post(form_sort);
	load_known();
});

form_pass.addEventListener('submit', async e => {
	e.preventDefault();
	await form_post(form_pass);
	load_known();
});

form_deco.addEventListener('submit', e => {
	e.preventDefault();
	fetch(form_deco.action)
});

load_known();
