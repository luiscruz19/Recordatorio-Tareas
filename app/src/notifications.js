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

/**
 * Reprograma las notificaciones locales: cancela todo y agenda los disparos de HOY que aún
 * faltan, dentro de [window_start, window_end] cada interval_minutes, si hay pendientes.
 */
export async function reschedule(settings, pendingCount) {
    const n = load();
    if (!n) return;
    try {
        await n.cancelAllScheduledNotificationsAsync();
        if (!settings?.enabled || !settings?.notif_enabled || !pendingCount) return;
        const granted = await ensurePermission();
        if (!granted) return;

        const startMin = toMin(settings.window_start);
        const endMin = toMin(settings.window_end);
        const interval = Math.max(5, Number(settings.interval_minutes) || 120);
        const body = `Te ${pendingCount === 1 ? 'queda' : 'quedan'} ${pendingCount} ${pendingCount === 1 ? 'tarea' : 'tareas'} para hoy.`;

        const now = new Date();
        const nowMin = now.getHours() * 60 + now.getMinutes();
        let scheduled = 0;
        for (let m = startMin; m <= endMin && scheduled < 24; m += interval) {
            if (m <= nowMin) continue;
            const date = new Date(now);
            date.setHours(Math.floor(m / 60), m % 60, 0, 0);
            await n.scheduleNotificationAsync({
                content: {
                    title: 'Tareas pendientes',
                    body,
                    categoryIdentifier: CATEGORY,
                    data: { type: 'task_reminder' },
                    sound: 'default',
                },
                trigger: date,
            });
            scheduled++;
        }
    } catch { /* best-effort */ }
}

export async function cancelAll() {
    const n = load();
    if (!n) return;
    try { await n.cancelAllScheduledNotificationsAsync(); } catch { /* no-op */ }
}
