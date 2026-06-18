import scheduleTaskReminder from './task-reminder.js';

// Permite apagar los jobs (p.ej. en tests) con ENABLE_JOBS=false.
const ENABLE_JOBS = process.env.ENABLE_JOBS !== 'false';

if (ENABLE_JOBS) {
    scheduleTaskReminder();
    console.info('Jobs programados: task-reminder (recordatorios de tareas)');
}
