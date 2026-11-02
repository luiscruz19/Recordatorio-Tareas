import cron from 'node-cron';
import { Op } from 'sequelize';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import ReminderSetting from '../models/ReminderSetting.js';
import { sendPushToUser } from '../services/notification/send-push.js';
import { DEFAULT_TZ, localDateStr, localMinutes, timeToMinutes } from '../utils/helpers.js';

// Cadencia del scheduler; el intervalo de cada usuario vive en sus ajustes.
const TICK = process.env.TASK_REMINDER_CRON || '*/15 * * * *';

const MS_PER_MINUTE = 60 * 1000;
const NOTIFICATION_CATEGORY = 'TASK_REMINDER';
const DEFAULT_PLAN_INTERVAL_MINUTES = 30;
const DEFAULT_PLAN_LOADED_INTERVAL_MINUTES = 90;
const DEFAULT_CLOSE_INTERVAL_MINUTES = 60;

function inWindow(minutes, windowStart, windowEnd) {
    const start = timeToMinutes(String(windowStart));
    const end = timeToMinutes(String(windowEnd));
    if (start === null || end === null) return false;
    return minutes >= start && minutes <= end;
}

async function sentRecently(userId, type, intervalMinutes) {
    const since = new Date(Date.now() - intervalMinutes * MS_PER_MINUTE);
    const already = await Notification.findOne({
        where: { user_id: userId, type, createdAt: { [Op.gte]: since } },
    });
    return !!already;
}

async function emit(userId, { type, title, body, data, categoryId }) {
    const notification = await Notification.create({ user_id: userId, type, title, body, status: 'pending' });
    const result = await sendPushToUser(userId, { title, body, data, categoryId });
    await notification.update({
        status: result.sent ? 'sent' : 'failed',
        sent_at: result.sent ? new Date() : null,
    });
    return result.sent;
}

async function sendPlanReminder(pref, today) {
    // Cuentan las pendientes y hechas de hoy; las de días anteriores no.
    const loadedToday = await Task.count({
        where: { user_id: pref.user_id, task_date: today },
    });
    const interval = loadedToday > 0
        ? (pref.plan_interval_loaded_minutes || DEFAULT_PLAN_LOADED_INTERVAL_MINUTES)
        : (pref.plan_interval_minutes || DEFAULT_PLAN_INTERVAL_MINUTES);

    if (await sentRecently(pref.user_id, 'plan_reminder', interval)) return false;

    return emit(pref.user_id, {
        type: 'plan_reminder',
        title: 'Planificá tu día',
        body: loadedToday > 0
            ? '¿Algo más para hoy? Sumá lo que falte a tu plan del día.'
            : 'Todavía no cargaste tareas para hoy. Planificá tu día ✍️',
        data: { type: 'plan_reminder', loadedToday },
        categoryId: NOTIFICATION_CATEGORY,
    });
}

async function sendCloseReminder(pref, today) {
    const pending = await Task.count({
        where: { user_id: pref.user_id, status: 'pending', task_date: today },
    });
    if (pending === 0) return false;

    const interval = pref.close_interval_minutes || DEFAULT_CLOSE_INTERVAL_MINUTES;
    if (await sentRecently(pref.user_id, 'task_reminder', interval)) return false;

    return emit(pref.user_id, {
        type: 'task_reminder',
        title: 'Tareas pendientes',
        body: `Te ${pending === 1 ? 'queda' : 'quedan'} ${pending} ${pending === 1 ? 'tarea' : 'tareas'} para hoy.`,
        data: { type: 'task_reminder', count: pending },
        categoryId: NOTIFICATION_CATEGORY,
    });
}

// El push del servidor cubre la app cerrada y otros dispositivos; la app además agenda avisos locales.
async function runTaskReminder() {
    const prefs = await ReminderSetting.findAll({ where: { enabled: true, notif_enabled: true } });

    let notified = 0;
    for (const pref of prefs) {
        const tz = pref.timezone || DEFAULT_TZ;
        const minutes = localMinutes(tz);
        const today = localDateStr(tz);

        if (pref.plan_enabled && inWindow(minutes, pref.plan_window_start, pref.plan_window_end)) {
            if (await sendPlanReminder(pref, today)) notified++;
        }
        if (pref.close_enabled && inWindow(minutes, pref.close_window_start, pref.close_window_end)) {
            if (await sendCloseReminder(pref, today)) notified++;
        }
    }

    if (notified > 0) console.info(`[task-reminder] ${notified} recordatorio(s) enviados`);
    return notified;
}

export default function scheduleTaskReminder() {
    cron.schedule(TICK, () => {
        runTaskReminder().catch(error => console.error('[task-reminder]', error.message));
    });
}
