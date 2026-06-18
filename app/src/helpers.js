export const pad = (n) => String(n).padStart(2, '0');

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// "Martes 17 de junio"
export function fmtDateLong(d = new Date()) {
    return cap(`${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`);
}

// "17 jun"
export function fmtDateShort(dStr) {
    const d = parseDate(dStr);
    if (!d) return '';
    return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`;
}

// Fecha local de hoy como "YYYY-MM-DD".
export function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "YYYY-MM-DD" → Date local (mediodía para evitar saltos de huso).
export function parseDate(dStr) {
    if (!dStr) return null;
    const s = String(dStr).slice(0, 10);
    const [y, m, day] = s.split('-').map(Number);
    if (!y || !m || !day) return null;
    return new Date(y, m - 1, day, 12, 0, 0);
}

// Date → "YYYY-MM-DD".
export function toISO(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
