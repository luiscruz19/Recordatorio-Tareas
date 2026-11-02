export const pad = (n) => String(n).padStart(2, '0');

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);

export function fmtDateLong(date = new Date()) {
    return capitalize(`${DIAS[date.getDay()]} ${date.getDate()} de ${MESES[date.getMonth()]}`);
}

// Mediodía local para que el huso no cambie la fecha.
function parseDate(dateStr) {
    if (!dateStr) return null;
    const [year, month, day] = String(dateStr).slice(0, 10).split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day, 12, 0, 0);
}

export function fmtDateShort(dateStr) {
    const date = parseDate(dateStr);
    if (!date) return '';
    return `${date.getDate()} ${MESES[date.getMonth()].slice(0, 3)}`;
}

export function toISO(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const todayISO = () => toISO(new Date());

export const pendingCountLabel = (count) =>
    `Te ${count === 1 ? 'queda' : 'quedan'} ${count} ${count === 1 ? 'tarea' : 'tareas'}`;
