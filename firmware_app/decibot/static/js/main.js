document.body.innerHTML = `
	<header class="pico">
		<details class="dropdown">
			<summary>Sections…</summary>
			<ul id="ul_header_menu"></ul>
		</details>
		<h1>Decibot</h1>
	</header>
`;

const sections_opened = new Set();
if (sessionStorage.getItem('sections_opened')) {
	for (const s of sessionStorage.getItem('sections_opened').split('\n'))
		sections_opened.add(s);
}

const sections = [
	{ 'id': 'motors', 'title': 'Moteurs' },
	{ 'id': 'iosensors', 'title': 'Capteurs' },
	{ 'id': 'wlan', 'title': 'Wifi' },
];
const ul_header_menu = document.getElementById('ul_header_menu');
for (const d of sections) {
	const s = document.createElement('section');
	const id = d['id'];
	const title = d['title'];
	s.id = 'section_' + id;
	document.body.append(s);

	const li = document.createElement('li');
	ul_header_menu.append(li);
	const label = document.createElement('label');
	li.append(label);
	const checkbox = document.createElement('input');
	checkbox.type = 'checkbox';
	checkbox.checked = false;
	label.append(checkbox, title);

	const h2 = document.createElement('h2');
	const b_spans = document.createElement('b');
	const span_fs = document.createElement('span');
	span_fs.innerText = "⛶";
	const span_close = document.createElement('span');
	span_close.innerText = "×";
	b_spans.append(span_fs, span_close);
	h2.append(title, b_spans);
	s.insertBefore(h2, s.firstChild);
	s.classList.add('pico');
	span_close.addEventListener('click', () => {
		if (document.fullscreenElement != null)
			document.exitFullscreen();
		toggle(false);
	});
	span_fs.addEventListener('click', () => {
		if (document.fullscreenElement == null)
			s.requestFullscreen();
		else
			document.exitFullscreen();
	});

	const toggle = on => {
		s.classList.toggle('opened', on);
		checkbox.checked = on;
		if (on)
			sections_opened.add(id);
		else
			sections_opened.delete(id);
		sessionStorage.setItem('sections_opened', Array.from(sections_opened).join('\n'));
		if (on)
			import('./' + id + '.js');
		document.body.dispatchEvent(new CustomEvent('h:section:statechanged', {
			'detail': {
				'id': id,
				'on': on,
				'section': s
			}
		}));
	}
	checkbox.addEventListener('click', e => toggle(e.target.checked));
	if (sections_opened.has(id)) toggle(true);
}

export async function form_post(form) {
		const data = new URLSearchParams();
		for (const pair of new FormData(form)) {
			data.append(pair[0], pair[1]);
		}
		return await fetch(form.action, {
			method: 'post',
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: data
		});
}
