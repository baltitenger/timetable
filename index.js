'use strict';

const days = [
	'Mon',
	'Tue',
	'Wed',
	'Thu',
	'Fri',
];

const starttimes = [
	new Date(0, 0, 0,  7, 20),
	new Date(0, 0, 0,  8,  0),
	new Date(0, 0, 0,  8, 50),
	new Date(0, 0, 0, 10,  0),
	new Date(0, 0, 0, 10, 50),
	new Date(0, 0, 0, 11, 40),
	new Date(0, 0, 0, 13, 10),
	new Date(0, 0, 0, 14,  0),
	new Date(0, 0, 0, 14, 50),
];

const formatter = new Intl.DateTimeFormat('default', { timeStyle: 'short', hour12: false });

function addMinutes(date, minutes) {
	let d = new Date(date);
	d.setMinutes(d.getMinutes() + minutes);
	return d;
}

window.onload = async function() {
	const params = new URLSearchParams(window.location.search);
	const cls = params.get('class');
	const filter = params.get('filter').split(',');
	const guser = params.get('authuser') ?? '1';
	const thing = await (await fetch(cls+'.json')).json();
	const table = thing.table;
	const classes = thing.classes;
	for (let i = 0; i < table.length; ++i) {
		let row = document.createElement('tr');
		let num = 0;
		let wd = document.createElement('td');
		wd.innerText = days[i];
		row.appendChild(wd);
		for (let lesson of table[i]) {
			if (lesson.start < num)
				continue;
			if (!filter.includes(lesson.name))
				continue;
			if (lesson.start > num) {
				let space = document.createElement('td');
				space.colSpan = lesson.start - num;
				row.appendChild(space);
			}
			let cell = document.createElement('td');
			cell.colSpan = lesson.len;
			cell.innerHTML = `<a href='https://classroom.google.com/u/${guser}/c/${classes[lesson.name].gc}'><div class='lesson'>${classes[lesson.name].pretty}</div><span class='startt'>${formatter.format(starttimes[lesson.start])}</span><span class='endt'>${formatter.format(addMinutes(starttimes[lesson.start], lesson.len*40))}</span></a>`;
			cell.className = 'tile';
			row.appendChild(cell);
			num = lesson.start + lesson.len;
		}
		tbody.appendChild(row);
	}
}
