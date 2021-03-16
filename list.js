'use strict';

window.onload = async function() {
	const params = new URLSearchParams(window.location.search);
	const cls = params.get('class');
	let thing = await (await fetch(cls+'.json')).json();
	let classes = thing.classes;

	function genurl() {
		let url = 'https://balti.desnull.hu/timetable/index.html';
		url += '?class='+cls;
		url += '&authuser='+authuser.value;
		url += '&color='+ +color.checked;
		url += '&filter=';
		let first = true;
		for (let abbrev in classes) {
			if (classes[abbrev].set) {
				if (first)
					first = false;
				else
					url += ',';
				url += abbrev;
			}
		}
		urlbox.href = url;
		urlbox.innerText = url;
	}

	for (let abbrev in classes) {
		let row = document.createElement('tr');

		classes[abbrev].set = false;

		let checkc = document.createElement('td');
		let check = document.createElement('input');
		check.type = 'checkbox';
		check.onchange = function() {
			classes[abbrev].set = this.checked;
			genurl();
		};
		checkc.appendChild(check)
		row.appendChild(checkc);

		let abbrevc = document.createElement('td');
		abbrevc.innerText = abbrev;
		row.appendChild(abbrevc);

		let namec = document.createElement('td');
		namec.innerText = classes[abbrev].pretty;
		row.appendChild(namec);

		let croomc = document.createElement('td');
		croomc.innerText = classes[abbrev].gc;
		row.appendChild(croomc);

		let colorc = document.createElement('td');
		colorc.innerText = classes[abbrev].color;
		colorc.style.color = classes[abbrev].color;
		row.appendChild(colorc);

		tbody.appendChild(row);
	}

	authuser.onchange = genurl;
	color.onchange = genurl;
	genurl();
}
