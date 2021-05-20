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
	pmd( 7,10),
	pmd( 8, 0),
	pmd( 9, 0),
	pmd(10, 0),
	pmd(11, 0),
	pmd(12, 0),
	pmd(13, 0),
	pmd(14, 0),
	pmd(15, 0),
];

//const starttimes = [
//	pmd( 7,20),
//	pmd( 8, 0),
//	pmd( 8,50),
//	pmd(10, 0),
//	pmd(10,50),
//	pmd(11,40),
//	pmd(13,10),
//	pmd(14, 0),
//	pmd(14,50),
//];

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
		cur.replaceChildren(curc.cell.firstChild.cloneNode(true))
		left.innerText = dur_fmt(curc.end+curs - time);
		progressbar.style.width = 100*(curc.end+curs - time)/(curc.end - curc.start) + '%';
		progressbar.style.backgroundColor = classes[curc.name].color;
		progressbar.style.right = null;
	} else {
		cur.innerText = '-';
		left.innerText = dur_fmt(nextc.start+nexts - time);
		progressbar.style.width = 100*(1 - (nextc.start+nexts - time)/((nextc.start+nexts) - (curc.end+curs))) + '%';
		progressbar.style.backgroundColor = classes[nextc.name].color;
		progressbar.style.right = 0;
	}
	next.replaceChildren(nextc.cell.firstChild.cloneNode(true))
}

window.onload = async function() {
	const formatter = new Intl.DateTimeFormat('default', { timeStyle: 'short', hourCycle: 'h23', timeZone: 'UTC' });
	const params = new URLSearchParams(window.location.search);
	localStorage.cls = params.get('class') ?? localStorage.cls;
	localStorage.filter = params.get('filter') ?? localStorage.filter;
	const filter = localStorage.filter.split(',');
	localStorage.guser = params.get('authuser') ?? localStorage.guser ?? '1';
	localStorage.usecolor = params.get('color') ?? localStorage.usecolor ?? '0'
	const usecolor = +localStorage.usecolor;
	const thing = await (await fetch(localStorage.cls+'.json', {cache: 'no-cache'})).json();
	const table = thing.table;
	const lunch = thing.lunch;
	classes = thing.classes;
	for (let i = 0; i < table.length; ++i) {
		let row = tbody.appendChild(document.createElement('tr'));
		let lastEnd = pmd(7,0) + (i + 1) * day
		let num = 0;
		row.appendChild(document.createElement('td')).innerText = wdays[i];
		for (let lesson of table[i]) {
			if (lesson.start < num)
				continue;
			if (!filter.includes(lesson.name))
				continue;
			if (lesson.start > num) {
				if (num < lunch[i] && lunch[i] < lesson.start) {
					let y = row.appendChild(document.createElement('td'));
					y.colSpan = lunch[i] - num;
					num = lunch[i];
					y.style.borderRight = '3px solid red'
				}
				let x = row.appendChild(document.createElement('td'));
				x.colSpan = lesson.start - num;
				if (lesson.start == lunch[i])
					x.style.borderRight = '3px solid red'
			}
			let cell = row.appendChild(document.createElement('td'));
			cell.colSpan = lesson.len;
			const start = starttimes[lesson.start] + mins(lesson.offset) + (i + 1) * day;
			const end = start + mins(45*lesson.len);
			cell.innerHTML = `<a href='https://classroom.google.com/u/${localStorage.guser}/c/${classes[lesson.name].gc}'><div class='lesson'>${classes[lesson.name].pretty}</div><span class='startt'>${formatter.format(start)}</span><span class='endt'>${formatter.format(end)}</span><div class='room'>${lesson.room}</div></a>`;
			if (usecolor && classes[lesson.name].color)
				cell.firstChild.style.backgroundColor = classes[lesson.name].color;
				cell.style.backgroundColor = classes[lesson.name].color;
			if (lesson.start + lesson.len == lunch[i])
				cell.style.borderRight = '3px solid red'
			timetable.push({
				name: lesson.name,
				cell: cell,
				start: start,
				end: end,
			});
			num = lesson.start + lesson.len;
			lastEnd = end
		}
	}
	update_times();
	setInterval(update_times, 1000);
}
