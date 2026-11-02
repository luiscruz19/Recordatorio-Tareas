import { IS_EXPO_GO } from './runtime';
import { pendingCountLabel } from './helpers';

// Avisos locales; el push del servidor cubre la app cerrada y otros dispositivos.
const CATEGORY = 'TASK_REMINDER';
const MIN_INTERVAL_MINUTES = 5;
const DEFAULT_PLAN_INTERVAL_MINUTES = 30;
const DEFAULT_CLOSE_INTERVAL_MINUTES = 60;
// Topes para no saturar la cola de notificaciones del sistema operativo.
const MAX_PLAN_REMINDERS = 8;
const MAX_CLOSE_REMINDERS = 16;

let notificationsModule = null;

function loadNotifications() {
    if (IS_EXPO_GO) return null;
    if (!notificationsModule) {
        try { notificationsModule = require('expo-notifications'); } catch { notificationsModule = null; }
    }
    return notificationsModule;
}

function timeToMinutes(time) {
    if (!time) return 0;
    const [hours, minutes] = String(time).split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
}

export async function getPermissionStatus() {
    const notifications = loadNotifications();
    if (!notifications) return 'unsupported';
    try {
        const { status } = await notifications.getPermissionsAsync();
        return status;
    } catch {
        return 'unsupported';
    }
}

async function ensurePermission(notifications) {
    try {
        let { status } = await notifications.getPermissionsAsync();
        if (status !== 'granted') status = (await notifications.requestPermissionsAsync()).status;
        return status === 'granted';
    } catch {
        return false;
    }
}

export async function setupCategory() {
    const notifications = loadNotifications();
    if (!notifications) return;
    try {
        await notifications.setNotificationCategoryAsync(CATEGORY, [
            { identifier: 'DONE', buttonTitle: 'Marcar hecha', options: { opensAppToForeground: true } },
            { identifier: 'SNOOZE', buttonTitle: 'Posponer', options: { opensAppToForeground: false } },
        ]);
    } catch {}
}

async function scheduleWindow(notifications, { startMin, endMin, interval, title, body, data, nowMin, now, maxReminders }) {
    let scheduled = 0;
    for (let minute = startMin; minute <= endMin && scheduled < maxReminders; minute += interval) {
        if (minute <= nowMin) continue;
        const date = new Date(now);
        date.setHours(Math.floor(minute / 60), minute % 60, 0, 0);
        await notifications.scheduleNotificationAsync({
            content: { title, body, categoryIdentifier: CATEGORY, data, sound: 'default' },
            trigger: date,
        });
        scheduled++;
    }
}

export async function reschedule(settings, pendingCount, loadedCount = 0) {
    const notifications = loadNotifications();
    if (!notifications) return;
    try {
        await notifications.cancelAllScheduledNotificationsAsync();
        if (!settings?.enabled || !settings?.notif_enabled) return;
        const granted = await ensurePermission(notifications);
        if (!granted) return;

        const now = new Date();
        const nowMin = now.getHours() * 60 + now.getMinutes();

        // A diferencia del push del servidor, este aviso no insiste si ya hay tareas cargadas.
        if (settings.plan_enabled !== false && !loadedCount) {
            await scheduleWindow(notifications, {
                startMin: timeToMinutes(settings.plan_window_start),
                endMin: timeToMinutes(settings.plan_window_end),
                interval: Math.max(MIN_INTERVAL_MINUTES, Number(settings.plan_interval_minutes) || DEFAULT_PLAN_INTERVAL_MINUTES),
                title: 'Planificá tu día',
                body: 'Todavía no cargaste tareas para hoy. Planificá tu día ✍️',
                data: { type: 'plan_reminder' },
                nowMin,
                now,
                maxReminders: MAX_PLAN_REMINDERS,
            });
        }

        if (settings.close_enabled !== false && pendingCount) {
            await scheduleWindow(notifications, {
                startMin: timeToMinutes(settings.close_window_start),
                endMin: timeToMinutes(settings.close_window_end),
                interval: Math.max(MIN_INTERVAL_MINUTES, Number(settings.close_interval_minutes) || DEFAULT_CLOSE_INTERVAL_MINUTES),
                title: 'Tareas pendientes',
                body: `${pendingCountLabel(pendingCount)} para hoy.`,
                data: { type: 'task_reminder' },
                nowMin,
                now,
                maxReminders: MAX_CLOSE_REMINDERS,
            });
        }
    } catch { /* sin avisos locales queda el push del servidor */ }
}
