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

function dur_fmt(dur) {
	dur = Math.floor(dur/1000);
	const sec = ('0' + dur % 60).slice(-2);
	dur = Math.floor(dur/60);
	const min = ('0' + dur % 60).slice(-2);
	dur = Math.floor(dur/60);
	return (dur > 0 ? dur + ':' : '' ) + min + ':' + sec;
}

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
	const n = (c + 1) % timetable.length;

	const curc = timetable[c];
	const nextc = timetable[n];
	const curs = c > n && time < timetable[n].start ? -7*day : 0;
	const nexts = c > n && time > timetable[c].end ? 7*day : 0;

	if (time < curc.end+curs) {
		cur.innerText = classes[curc.name].pretty;
		cur.href = `https://classroom.google.com/u/${guser}/c/${classes[curc.name].gc}`
		cur.style.backgroundColor = classes[curc.name].color;
		left.innerText = dur_fmt(curc.end+curs - time);
		progressbar.style.width = 100*(curc.end+curs - time)/(curc.end - curc.start) + '%';
		progressbar.style.backgroundColor = classes[curc.name].color;
		progressbar.style.right = null;
	} else {
		cur.innerText = '-';
		cur.removeAttribute('href');
		cur.style.backgroundColor = null;
		left.innerText = dur_fmt(nextc.start+nexts - time);
		progressbar.style.width = 100*(1 - (nextc.start+nexts - time)/((nextc.start+nexts) - (curc.end+curs))) + '%';
		progressbar.style.backgroundColor = classes[nextc.name].color;
		progressbar.style.right = 0;
	}
	next.innerText = classes[nextc.name].pretty;
	next.href = `https://classroom.google.com/u/${guser}/c/${classes[nextc.name].gc}`
	next.style.backgroundColor = classes[nextc.name].color;
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
	setInterval(update_times, 1000);
}
