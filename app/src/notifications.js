import Constants from 'expo-constants';

// Notificaciones LOCALES (lado app del esquema híbrido): agendan recordatorios dentro de la
// franja horaria según el intervalo, mientras haya pendientes. El push del servidor cubre el
// caso de app cerrada / otro dispositivo.
const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';
const CATEGORY = 'TASK_REMINDER';

let N = null;
function load() {
    if (IS_EXPO_GO) return null;
    if (!N) { try { N = require('expo-notifications'); } catch { N = null; } }
    return N;
}

function toMin(t) {
    if (!t) return 0;
    const [h, m] = String(t).split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
}

export async function getPermissionStatus() {
    const n = load();
    if (!n) return 'unsupported';
    try {
        const { status } = await n.getPermissionsAsync();
        return status; // granted | denied | undetermined
    } catch {
        return 'unsupported';
    }
}

export async function ensurePermission() {
    const n = load();
    if (!n) return false;
    try {
        let { status } = await n.getPermissionsAsync();
        if (status !== 'granted') status = (await n.requestPermissionsAsync()).status;
        return status === 'granted';
    } catch {
        return false;
    }
}

export async function setupCategory() {
    const n = load();
    if (!n) return;
    try {
        await n.setNotificationCategoryAsync(CATEGORY, [
            { identifier: 'DONE', buttonTitle: 'Marcar hecha', options: { opensAppToForeground: true } },
            { identifier: 'SNOOZE', buttonTitle: 'Posponer', options: { opensAppToForeground: false } },
        ]);
    } catch { /* no-op */ }
}

// Agenda los disparos de HOY que aún faltan dentro de [startMin, endMin] cada `interval`.
// Devuelve cuántos programó (tope global para no saturar la cola del SO).
async function scheduleWindow(n, { startMin, endMin, interval, title, body, data, nowMin, now, budget }) {
    let scheduled = 0;
    for (let m = startMin; m <= endMin && scheduled < budget; m += interval) {
        if (m <= nowMin) continue;
        const date = new Date(now);
        date.setHours(Math.floor(m / 60), m % 60, 0, 0);
        await n.scheduleNotificationAsync({
            content: { title, body, categoryIdentifier: CATEGORY, data, sound: 'default' },
            trigger: date,
        });
        scheduled++;
    }
    return scheduled;
}

/**
 * Reprograma las notificaciones locales (lado app del esquema híbrido). Cancela todo y agenda
 * los disparos de HOY que aún faltan para dos recordatorios independientes:
 *  - PLANIFICACIÓN: en la franja de la mañana, si aún NO cargaste tareas para hoy.
 *  - CIERRE: en la franja de la tarde, si quedan tareas pendientes para hoy.
 */
export async function reschedule(settings, pendingCount, loadedCount = 0) {
    const n = load();
    if (!n) return;
    try {
        await n.cancelAllScheduledNotificationsAsync();
        if (!settings?.enabled || !settings?.notif_enabled) return;
        const granted = await ensurePermission();
        if (!granted) return;

        const now = new Date();
        const nowMin = now.getHours() * 60 + now.getMinutes();

        // PLANIFICACIÓN (mañana): solo si no cargaste ninguna tarea para hoy.
        if (settings.plan_enabled !== false && !loadedCount) {
            await scheduleWindow(n, {
                startMin: toMin(settings.plan_window_start), endMin: toMin(settings.plan_window_end),
                interval: Math.max(5, Number(settings.plan_interval_minutes) || 30),
                title: 'Planificá tu día',
                body: 'Todavía no cargaste tareas para hoy. Planificá tu día ✍️',
                data: { type: 'plan_reminder' }, nowMin, now, budget: 8,
            });
        }

        // CIERRE (tarde): solo si quedan pendientes para hoy.
        if (settings.close_enabled !== false && pendingCount) {
            await scheduleWindow(n, {
                startMin: toMin(settings.close_window_start), endMin: toMin(settings.close_window_end),
                interval: Math.max(5, Number(settings.close_interval_minutes) || 60),
                title: 'Tareas pendientes',
                body: `Te ${pendingCount === 1 ? 'queda' : 'quedan'} ${pendingCount} ${pendingCount === 1 ? 'tarea' : 'tareas'} para hoy.`,
                data: { type: 'task_reminder' }, nowMin, now, budget: 16,
            });
        }
    } catch { /* best-effort */ }
}

export async function cancelAll() {
    const n = load();
    if (!n) return;
    try { await n.cancelAllScheduledNotificationsAsync(); } catch { /* no-op */ }
}
