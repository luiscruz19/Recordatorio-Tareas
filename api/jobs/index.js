import scheduleTaskReminder from './task-reminder.js';

const ENABLE_JOBS = process.env.ENABLE_JOBS !== 'false';

if (ENABLE_JOBS) {
    scheduleTaskReminder();
    console.info('Jobs programados: task-reminder (recordatorios de tareas)');
}
