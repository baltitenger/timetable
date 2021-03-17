'use strict';

const wdays = [
	'Mon',
	'Tue',
	'Wed',
	'Thu',
	'Fri',
];

function mins(m) {
	return 60000*m;
}

const day = 86400000;

// poor man's date
function pmd(h, m) {
	return mins(60*h + m);
}

function cur_pmd() {
	const now = new Date();
	return (now.getTime() - mins(now.getTimezoneOffset())) % day + now.getDay() * day;
}

const starttimes = [
	pmd( 7,20),
	pmd( 8, 0),
	pmd( 8,50),
	pmd(10, 0),
	pmd(10,50),
	pmd(11,40),
	pmd(13,10),
	pmd(14, 0),
	pmd(14,50),
];

let timetable = [];
let classes;
let guser;

function cur_lesson(time) {
	let count = timetable.length;
	let i = 0;
	while (count > 0) {
		const step = Math.floor(count / 2);
		if (timetable[i + step].start <= time) {
			i     += step + 1;
			count -= step + 1;
		} else {
			count = step;
		}
	}
	return (i + timetable.length - 1) % timetable.length;
}

function update_times() {
	const time = cur_pmd();
	const c = cur_lesson(time);
	const n = c + 1 % timetable.length;
	const formatter = new Intl.DateTimeFormat('default', { timeStyle: 'medium', hourCycle: 'h23', timeZone: 'UTC' });

	if (time < timetable[c].end) {
		cur.innerText = classes[timetable[c].name].pretty;
		cur.href = `https://classroom.google.com/u/${guser}/c/${classes[timetable[c].name].gc}`
		cur.style.backgroundColor = classes[timetable[c].name].color;
		left.innerText = formatter.format(timetable[c].end - time);
		progressbar.style.width = 100*(timetable[c].end - time)/(timetable[c].end - timetable[c].start) + '%';
		progressbar.style.backgroundColor = classes[timetable[c].name].color;
		progressbar.style.right = null;
	} else {
		cur.innerText = '-';
		cur.href = null;
		cur.style.backgroundColor = null;
		left.innerText = formatter.format(timetable[n].start - time);
		progressbar.style.width = 100*(1 - (timetable[n].start - time)/(timetable[n].start - timetable[c].end)) + '%';
		progressbar.style.backgroundColor = classes[timetable[n].name].color;
		progressbar.style.right = 0;
	}
	next.innerText = classes[timetable[n].name].pretty;
	next.href = `https://classroom.google.com/u/${guser}/c/${classes[timetable[n].name].gc}`
	next.style.backgroundColor = classes[timetable[n].name].color;

	setTimeout(update_times, 1000);
}

window.onload = async function() {
	const formatter = new Intl.DateTimeFormat('default', { timeStyle: 'short', hourCycle: 'h23', timeZone: 'UTC' });
	const params = new URLSearchParams(window.location.search);
	const cls = params.get('class');
	const filter = params.get('filter').split(',');
	guser = params.get('authuser') ?? '1';
	const usecolor = +(params.get('color') ?? '0');
	const thing = await (await fetch(cls+'.json')).json();
	const table = thing.table;
	classes = thing.classes;
	for (let i = 0; i < table.length; ++i) {
		let row = tbody.appendChild(document.createElement('tr'));
		let num = 0;
		row.appendChild(document.createElement('td')).innerText = wdays[i];
		for (let lesson of table[i]) {
			if (lesson.start < num)
				continue;
			if (!filter.includes(lesson.name))
				continue;
			if (lesson.start > num)
				row.appendChild(document.createElement('td')).colSpan = lesson.start - num;
			let cell = row.appendChild(document.createElement('td'));
			cell.colSpan = lesson.len;
			if (usecolor && classes[lesson.name].color)
				cell.style.backgroundColor = classes[lesson.name].color;
			const start = starttimes[lesson.start] + (i + 1) * day;
			const end = start + mins(40*lesson.len);
			cell.innerHTML = `<a href='https://classroom.google.com/u/${guser}/c/${classes[lesson.name].gc}'><div class='lesson'>${classes[lesson.name].pretty}</div><span class='startt'>${formatter.format(start)}</span><span class='endt'>${formatter.format(end)}</span></a>`;
			cell.className = 'tile';
			timetable.push({
				name: lesson.name,
				cell: cell,
				start: start,
				end: end,
			});
			num = lesson.start + lesson.len;
		}
	}
	update_times();
}
