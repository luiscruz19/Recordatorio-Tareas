import cron from 'node-cron';
import { Op } from 'sequelize';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import ReminderSetting from '../models/ReminderSetting.js';
import { sendPushToUser } from '../services/notification/send-push.js';
import { localDateStr, localMinutes, timeToMinutes } from '../utils/helpers.js';

// Cada cuánto corre el scheduler (no es el intervalo del usuario; ese vive en sus ajustes).
const TICK = process.env.TASK_REMINDER_CRON || '*/15 * * * *';

/**
 * Por cada usuario con recordatorios habilitados:
 *   1) dentro de su franja horaria activa,
 *   2) si pasó su intervalo desde el último recordatorio (dedupe vía Notification),
 *   3) y tiene tareas pendientes hoy (en su zona horaria),
 * manda un push "Te quedan N tareas" con acciones marcar-hecha / posponer.
 *
 * Es el lado servidor del esquema híbrido (la app además agenda notificaciones locales).
 */
export async function runTaskReminder() {
    const prefs = await ReminderSetting.findAll({ where: { enabled: true, notif_enabled: true } });

    let notified = 0;
    for (const pref of prefs) {
        const tz = pref.timezone || 'America/Argentina/Buenos_Aires';

        // 1) franja horaria
        const mins = localMinutes(tz);
        const start = timeToMinutes(String(pref.window_start));
        const end = timeToMinutes(String(pref.window_end));
        if (start !== null && end !== null && (mins < start || mins > end)) continue;

        // 2) intervalo (dedupe contra el último recordatorio enviado)
        const since = new Date(Date.now() - (pref.interval_minutes || 120) * 60 * 1000);
        const already = await Notification.findOne({
            where: { user_id: pref.user_id, type: 'task_reminder', createdAt: { [Op.gte]: since } },
        });
        if (already) continue;

        // 3) pendientes de hoy (en la tz del usuario)
        const today = localDateStr(tz);
        const pending = await Task.count({
            where: { user_id: pref.user_id, status: 'pending', task_date: today },
        });
        if (pending === 0) continue;

        // 4) crear → enviar → actualizar estado
        const notif = await Notification.create({
            user_id: pref.user_id,
            type: 'task_reminder',
            title: 'Tareas pendientes',
            body: `Te ${pending === 1 ? 'queda' : 'quedan'} ${pending} ${pending === 1 ? 'tarea' : 'tareas'} para hoy.`,
            status: 'pending',
        });

        const result = await sendPushToUser(pref.user_id, {
            title: notif.title,
            body: notif.body,
            data: { type: 'task_reminder', count: pending },
            categoryId: 'TASK_REMINDER',
        });

        await notif.update({
            status: result.sent ? 'sent' : 'failed',
            sent_at: result.sent ? new Date() : null,
        });
        notified++;
    }

    if (notified > 0) console.info(`[task-reminder] ${notified} recordatorio(s) enviados`);
    return notified;
}

export default function scheduleTaskReminder() {
    cron.schedule(TICK, () => {
        runTaskReminder().catch(e => console.error('[task-reminder]', e.message));
    });
}
