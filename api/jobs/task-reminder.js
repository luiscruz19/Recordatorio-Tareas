import cron from 'node-cron';
import { Op } from 'sequelize';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import ReminderSetting from '../models/ReminderSetting.js';
import { sendPushToUser } from '../services/notification/send-push.js';
import { localDateStr, localMinutes, timeToMinutes } from '../utils/helpers.js';

// Cadencia del scheduler; el intervalo de cada usuario vive en sus ajustes.
const TICK = process.env.TASK_REMINDER_CRON || '*/15 * * * *';

function inWindow(mins, startStr, endStr) {
    const start = timeToMinutes(String(startStr));
    const end = timeToMinutes(String(endStr));
    if (start === null || end === null) return false;
    return mins >= start && mins <= end;
}

async function sentRecently(userId, type, intervalMin) {
    const since = new Date(Date.now() - intervalMin * 60 * 1000);
    const already = await Notification.findOne({
        where: { user_id: userId, type, createdAt: { [Op.gte]: since } },
    });
    return !!already;
}

async function emit(userId, { type, title, body, data, categoryId }) {
    const notif = await Notification.create({ user_id: userId, type, title, body, status: 'pending' });
    const result = await sendPushToUser(userId, { title, body, data, categoryId });
    await notif.update({
        status: result.sent ? 'sent' : 'failed',
        sent_at: result.sent ? new Date() : null,
    });
    return result.sent;
}

// El push del servidor cubre la app cerrada y otros dispositivos; la app además agenda avisos locales.
export async function runTaskReminder() {
    const prefs = await ReminderSetting.findAll({ where: { enabled: true, notif_enabled: true } });

    let notified = 0;
    for (const pref of prefs) {
        const tz = pref.timezone || 'America/Argentina/Buenos_Aires';
        const mins = localMinutes(tz);
        const today = localDateStr(tz);

        if (pref.plan_enabled && inWindow(mins, pref.plan_window_start, pref.plan_window_end)) {
            // Cuentan las pendientes y hechas de hoy; las de días anteriores no.
            const loadedToday = await Task.count({
                where: { user_id: pref.user_id, task_date: today },
            });
            const interval = loadedToday > 0
                ? (pref.plan_interval_loaded_minutes || 90)
                : (pref.plan_interval_minutes || 30);

            if (!(await sentRecently(pref.user_id, 'plan_reminder', interval))) {
                const body = loadedToday > 0
                    ? '¿Algo más para hoy? Sumá lo que falte a tu plan del día.'
                    : 'Todavía no cargaste tareas para hoy. Planificá tu día ✍️';
                const sent = await emit(pref.user_id, {
                    type: 'plan_reminder',
                    title: 'Planificá tu día',
                    body,
                    data: { type: 'plan_reminder', loadedToday },
                    categoryId: 'TASK_REMINDER',
                });
                if (sent) notified++;
            }
        }

        if (pref.close_enabled && inWindow(mins, pref.close_window_start, pref.close_window_end)) {
            const pending = await Task.count({
                where: { user_id: pref.user_id, status: 'pending', task_date: today },
            });
            const interval = pref.close_interval_minutes || 60;

            if (pending > 0 && !(await sentRecently(pref.user_id, 'task_reminder', interval))) {
                const sent = await emit(pref.user_id, {
                    type: 'task_reminder',
                    title: 'Tareas pendientes',
                    body: `Te ${pending === 1 ? 'queda' : 'quedan'} ${pending} ${pending === 1 ? 'tarea' : 'tareas'} para hoy.`,
                    data: { type: 'task_reminder', count: pending },
                    categoryId: 'TASK_REMINDER',
                });
                if (sent) notified++;
            }
        }
    }

    if (notified > 0) console.info(`[task-reminder] ${notified} recordatorio(s) enviados`);
    return notified;
}

export default function scheduleTaskReminder() {
    cron.schedule(TICK, () => {
        runTaskReminder().catch(e => console.error('[task-reminder]', e.message));
    });
}
