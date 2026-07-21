import cron from 'node-cron';
import { Op } from 'sequelize';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import ReminderSetting from '../models/ReminderSetting.js';
import { sendPushToUser } from '../services/notification/send-push.js';
import { localDateStr, localMinutes, timeToMinutes } from '../utils/helpers.js';

// Cada cuánto corre el scheduler (no es el intervalo del usuario; ese vive en sus ajustes).
const TICK = process.env.TASK_REMINDER_CRON || '*/15 * * * *';

/** ¿Estamos dentro de la franja [start, end] en minutos locales? */
function inWindow(mins, startStr, endStr) {
    const start = timeToMinutes(String(startStr));
    const end = timeToMinutes(String(endStr));
    if (start === null || end === null) return false;
    return mins >= start && mins <= end;
}

/** ¿Ya se envió una notificación de `type` dentro de los últimos `intervalMin` minutos? */
async function sentRecently(userId, type, intervalMin) {
    const since = new Date(Date.now() - intervalMin * 60 * 1000);
    const already = await Notification.findOne({
        where: { user_id: userId, type, createdAt: { [Op.gte]: since } },
    });
    return !!already;
}

/** Crea la Notification, dispara el push y sella el estado (sent/failed). */
async function emit(userId, { type, title, body, data, categoryId }) {
    const notif = await Notification.create({ user_id: userId, type, title, body, status: 'pending' });
    const result = await sendPushToUser(userId, { title, body, data, categoryId });
    await notif.update({
        status: result.sent ? 'sent' : 'failed',
        sent_at: result.sent ? new Date() : null,
    });
    return result.sent;
}

/**
 * Recorre a cada usuario con recordatorios habilitados y evalúa dos recordatorios
 * independientes (cada uno respeta su franja, su intervalo y su propio dedupe):
 *
 *  - PLANIFICACIÓN (mañana): si NO cargó ninguna tarea PARA HOY, empuja a planificar
 *    cada `plan_interval_minutes`. Una vez que cargó ≥1 tarea para hoy sigue avisando,
 *    pero espaciado a `plan_interval_loaded_minutes`.
 *  - CIERRE (tarde): si quedan tareas pendientes para hoy, recuerda cerrarlas cada
 *    `close_interval_minutes`, con acciones marcar-hecha / posponer.
 *
 * Es el lado servidor del esquema híbrido (la app además agenda notificaciones locales).
 */
export async function runTaskReminder() {
    const prefs = await ReminderSetting.findAll({ where: { enabled: true, notif_enabled: true } });

    let notified = 0;
    for (const pref of prefs) {
        const tz = pref.timezone || 'America/Argentina/Buenos_Aires';
        const mins = localMinutes(tz);
        const today = localDateStr(tz);

        // ---------- PLANIFICACIÓN (mañana) ----------
        if (pref.plan_enabled && inWindow(mins, pref.plan_window_start, pref.plan_window_end)) {
            // Tareas cargadas PARA HOY (pending o done); las de días anteriores NO cuentan.
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

        // ---------- CIERRE (tarde) ----------
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
