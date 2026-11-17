
const KEY = 'sathwik_income_analysis_v1';

const months = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
];

const colors = [
    '#059669', '#10b981', '#34d399', '#e9a23b',
    '#0f766e', '#60a5fa', '#a4abc0', '#c28a54',
    '#6c9b71', '#cf719d'
];

let db;

try {
    db = JSON.parse(localStorage.getItem(KEY));
} catch (e) {}

if (!db) {
    db = {
        salaries: [],
        expenses: [],
        categories: [
            'Hostel Expenses',
            'Food & Groceries',
            'Travel',
            'Mobile & Internet',
            'Education',
            'Shopping',
            'Medical',
            'Entertainment',
            'Miscellaneous'
        ].map(name => ({ name, description: '' })),
        notes: {}
    };
}

const $ = x => document.getElementById(x);

const money = n =>
    '₹' + Number(n || 0).toLocaleString('en-IN', {
        maximumFractionDigits: 2
    });

const esc = s =>
    String(s ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));

let d = new Date();
let cy = d.getFullYear();
let cm = d.getMonth();

// YEARS: 2024 TO 2035
function years() {
    return Array.from(
        { length: 12 },
        (_, i) => 2035 - i
    );
}

function persist() {
    localStorage.setItem(KEY, JSON.stringify(db));
    render();
}

function fill(id, arr, sel) {
    $(id).innerHTML = arr.map((x, i) => {
        const value = typeof x === 'object'
            ? x.v
            : typeof x === 'number'
                ? x
                : i;

        const label = typeof x === 'object'
            ? x.t
            : x;

        return `
            <option
                value="${value}"
                ${String(value) === String(sel) ? 'selected' : ''}
            >
                ${label}
            </option>
        `;
    }).join('');
}

function setup() {
    ['dashYear', 'monthYear', 'sy', 'ey'].forEach(id => {
        const available = years();
        const existing = Number($(id).value);

        const selected = available.includes(existing)
            ? existing
            : Math.min(2035, Math.max(2024, cy));

        fill(id, available, selected);
    });

    ['monthSelect', 'sm', 'em'].forEach(id => {
        fill(
            id,
            months.map((t, i) => ({ v: i, t })),
            $(id).value !== '' ? $(id).value : cm
        );
    });

    $('ec').innerHTML = db.categories
        .map(c => `<option>${esc(c.name)}</option>`)
        .join('');
}

function total(a) {
    return a.reduce((s, x) => s + (+x.amount || 0), 0);
}

function salary(y, m) {
    return total(
        db.salaries.filter(
            x => +x.y === +y && +x.m === +m
        )
    );
}

function exp(y, m) {
    return db.expenses.filter(
        x => +x.y === +y && +x.m === +m
    );
}

function stats(y) {
    let i = total(db.salaries.filter(x => +x.y === +y));
    let e = total(db.expenses.filter(x => +x.y === +y));

    return {
        i,
        e,
        save: Math.max(0, i - e),
        over: Math.max(0, e - i),
        net: i - e
    };
}

function noteKey(y, m) {
    return y + '-' + m;
}

function render() {
    setup();

    let y = +$('dashYear').value || cy;
    let s = stats(y);

    $('annualIncome').textContent = money(s.i);
    $('annualSpent').textContent = money(s.e);
    $('annualSaved').textContent = money(s.save);
    $('annualOver').textContent = money(s.over);

    let items = db.categories
        .map(c => ({
            name: c.name,
            value: total(
                db.expenses.filter(
                    x => +x.y === y && x.cat === c.name
                )
            )
        }))
        .filter(x => x.value);

    let totalExp = items.reduce((a, x) => a + x.value, 0);
    let start = 0;
    let parts = [];

    items.forEach((x, i) => {
        let end = start + (
            totalExp ? x.value / totalExp * 100 : 0
        );

        parts.push(
            `${colors[i % colors.length]} ${start}% ${end}%`
        );

        start = end;
    });

    $('donut').style.background = totalExp
        ? `conic-gradient(${parts.join(',')})`
        : '#e5e7eb';

    $('donutTotal').textContent = money(totalExp);

    $('legend').innerHTML = items.length
        ? items.map((x, i) => `
            <div class="leg">
                <span style="--c:${colors[i % colors.length]}">
                    ${esc(x.name)}
                </span>
                <b>${money(x.value)}</b>
            </div>
        `).join('')
        : '<small class="muted">No expenses recorded</small>';

    let max = Math.max(
        1,
        ...months.map((m, i) => total(exp(y, i)))
    );

    $('bars').innerHTML = months.map((m, i) => {
        let v = total(exp(y, i));

        return `
            <div>
                <div class="barhead">
                    <span>${m}</span>
                    <b>${money(v)}</b>
                </div>
                <div class="track">
                    <div class="fill" style="width:${v / max * 100}%"></div>
                </div>
            </div>
        `;
    }).join('');

    $('annualRows').innerHTML = months.map((m, i) => {
        let inc = salary(y, i);
        let spent = total(exp(y, i));
        let n = inc - spent;

        return `
            <tr>
                <td>${m}</td>
                <td>${money(inc)}</td>
                <td>${money(spent)}</td>
                <td class="${n >= 0 ? 'green' : 'red'}">
                    ${money(Math.abs(n))}
                </td>
                <td>${n >= 0 ? 'Saved' : 'Overspent'}</td>
            </tr>
        `;
    }).join('');

    $('salaryRows').innerHTML = db.salaries
        .slice()
        .sort((a, b) => b.y - a.y || b.m - a.m)
        .map(x => `
            <tr>
                <td>${x.y}</td>
                <td>${months[x.m]}</td>
                <td>${money(x.amount)}</td>
                <td>${esc(x.note || '—')}</td>
                <td>
                    <button class="delete" onclick="delSal(${x.id})">×</button>
                </td>
            </tr>
        `).join('') ||
        '<tr><td colspan="5" class="empty">No salary entries yet.</td></tr>';

    $('expenseRows').innerHTML = db.expenses
        .slice()
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        .map(x => `
            <tr>
                <td>${x.date || '—'}</td>
                <td>${x.y} / ${months[x.m]}</td>
                <td>${esc(x.cat)}</td>
                <td>${money(x.amount)}</td>
                <td>${esc(x.note || '—')}</td>
                <td>
                    <button class="delete" onclick="delExp(${x.id})">×</button>
                </td>
            </tr>
        `).join('') ||
        '<tr><td colspan="6" class="empty">No expenses yet.</td></tr>';

    $('catRows').innerHTML = db.categories
        .map((c, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${esc(c.name)}</td>
                <td>${esc(c.description || '—')}</td>
                <td>${money(total(db.expenses.filter(x => x.cat === c.name)))}</td>
                <td>
                    <button class="delete" onclick="delCat(${i})">×</button>
                </td>
            </tr>
        `).join('');

    $('yearRows').innerHTML = years().map(yr => {
        let a = stats(yr);

        return `
            <tr>
                <td>${yr}</td>
                <td>${money(a.i)}</td>
                <td>${money(a.e)}</td>
                <td class="green">${money(a.save)}</td>
                <td class="red">${money(a.over)}</td>
                <td>${a.i ? (a.save / a.i * 100).toFixed(1) : '0.0'}%</td>
            </tr>
        `;
    }).join('');

    renderMonth();
}

function renderMonth() {
    if (!$('monthYear').value) return;

    let y = +$('monthYear').value;
    let m = +$('monthSelect').value;
    let a = salary(y, m);
    let exs = exp(y, m);
    let e = total(exs);
    let n = a - e;

    $('mi').textContent = money(a);
    $('me').textContent = money(e);
    $('ms').textContent = money(Math.max(0, n));
    $('mo').textContent = money(Math.max(0, -n));

    $('monthRows').innerHTML = exs.map((x, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${esc(x.cat)}</td>
            <td>${money(x.amount)}</td>
            <td>${esc(x.note || x.details || '—')}</td>
            <td>${x.date || '—'}</td>
            <td>
                <button class="delete" onclick="delExp(${x.id})">×</button>
            </td>
        </tr>
    `).join('') ||
    '<tr><td colspan="6" class="empty">No expenses this month.</td></tr>';

    $('monthNotes').value = db.notes[noteKey(y, m)] || '';
}

function page(p) {
    document.querySelectorAll('.section').forEach(x => {
        x.classList.remove('active');
    });

    $('p-' + p).classList.add('active');

    document.querySelectorAll('.nav button').forEach(x => {
        x.classList.toggle('active', x.dataset.p === p);
    });

    $('crumb').textContent = ({
        dashboard: 'Dashboard',
        monthly: 'Monthly Analysis',
        salary: 'Add Salary',
        expenses: 'Add Expenses',
        categories: 'Expense Items',
        yearly: 'Yearly Reports'
    })[p];

    if (p === 'monthly') renderMonth();
}

document.querySelectorAll('.nav button').forEach(b => {
    b.onclick = () => page(b.dataset.p);
});

$('salaryForm').onsubmit = e => {
    e.preventDefault();

    db.salaries.push({
        id: Date.now() + Math.random(),
        y: +$('sy').value,
        m: +$('sm').value,
        amount: +$('sa').value,
        note: $('sn').value,
        details: $('sx').value
    });

    e.target.reset();
    persist();
    alert('Salary saved.');
};

$('expenseForm').onsubmit = e => {
    e.preventDefault();

    let y = +$('ey').value;
    let m = +$('em').value;

    db.expenses.push({
        id: Date.now() + Math.random(),
        y,
        m,
        cat: $('ec').value,
        amount: +$('ea').value,
        date: $('ed').value ||
            `${y}-${String(m + 1).padStart(2, '0')}-01`,
        note: $('en').value,
        details: $('ex').value
    });

    e.target.reset();
    persist();
    alert('Expense saved.');
};

$('catForm').onsubmit = e => {
    e.preventDefault();

    let name = $('cn').value.trim();

    if (
        db.categories.some(
            c => c.name.toLowerCase() === name.toLowerCase()
        )
    ) {
        return alert('Item already exists.');
    }

    db.categories.push({
        name,
        description: $('cd').value
    });

    e.target.reset();
    persist();
};

function saveNote() {
    db.notes[
        noteKey(+$('monthYear').value, +$('monthSelect').value)
    ] = $('monthNotes').value;

    persist();
    alert('Monthly notes saved.');
}

function delSal(id) {
    if (confirm('Delete salary entry?')) {
        db.salaries = db.salaries.filter(x => x.id !== id);
        persist();
    }
}

function delExp(id) {
    if (confirm('Delete expense?')) {
        db.expenses = db.expenses.filter(x => x.id !== id);
        persist();
    }
}

function delCat(i) {
    let name = db.categories[i].name;

    if (db.expenses.some(x => x.cat === name)) {
        return alert(
            'This item has expenses recorded. Keep it to preserve your history.'
        );
    }

    if (confirm('Delete category?')) {
        db.categories.splice(i, 1);
        persist();
    }
}

function download(blob, name) {
    let a = document.createElement('a');

    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();

    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function backup() {
    download(
        new Blob(
            [JSON.stringify(db, null, 2)],
            { type: 'application/json' }
        ),
        'sathwik-monthly-income-backup.json'
    );
}

function csv() {
    let rows = [
        ['Date', 'Year', 'Month', 'Expense item', 'Amount', 'Note', 'Details'],
        ...db.expenses.map(x => [
            x.date,
            x.y,
            months[x.m],
            x.cat,
            x.amount,
            x.note,
            x.details
        ])
    ];

    download(
        new Blob(
            [
                rows.map(r =>
                    r.map(v =>
                        '"' + String(v ?? '').replace(/"/g, '""') + '"'
                    ).join(',')
                ).join('\n')
            ],
            { type: 'text/csv' }
        ),
        'monthly-expenses.csv'
    );
}

$('restore').onchange = async e => {
    try {
        let v = JSON.parse(await e.target.files[0].text());

        if (
            !Array.isArray(v.salaries) ||
            !Array.isArray(v.expenses) ||
            !Array.isArray(v.categories)
        ) {
            throw 0;
        }

        if (confirm('Replace current browser data with this backup?')) {
            db = v;
            persist();
            alert('Backup restored.');
        }
    } catch (x) {
        alert('Invalid backup file.');
    }

    e.target.value = '';
};

render();
