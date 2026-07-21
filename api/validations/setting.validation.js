import { body } from 'express-validator';

const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;

export const updateSettingsValidation = [
    body('enabled').optional().isBoolean().withMessage('enabled debe ser booleano'),
    body('notif_enabled').optional().isBoolean().withMessage('notif_enabled debe ser booleano'),
    body('timezone').optional().isString().withMessage('Zona horaria no válida'),

    // Planificación (mañana)
    body('plan_enabled').optional().isBoolean().withMessage('plan_enabled debe ser booleano'),
    body('plan_window_start').optional().matches(TIME_RE).withMessage('Hora de inicio (planificación) no válida'),
    body('plan_window_end').optional().matches(TIME_RE).withMessage('Hora de fin (planificación) no válida'),
    body('plan_interval_minutes').optional().isInt({ min: 5, max: 1440 }).withMessage('Intervalo (planificación) no válido'),
    body('plan_interval_loaded_minutes').optional().isInt({ min: 5, max: 1440 }).withMessage('Intervalo con tareas cargadas no válido'),

    // Cierre (tarde)
    body('close_enabled').optional().isBoolean().withMessage('close_enabled debe ser booleano'),
    body('close_window_start').optional().matches(TIME_RE).withMessage('Hora de inicio (cierre) no válida'),
    body('close_window_end').optional().matches(TIME_RE).withMessage('Hora de fin (cierre) no válida'),
    body('close_interval_minutes').optional().isInt({ min: 5, max: 1440 }).withMessage('Intervalo (cierre) no válido'),

    // Legacy
    body('interval_minutes').optional().isInt({ min: 5, max: 1440 }).withMessage('Intervalo no válido'),
    body('window_start').optional().matches(TIME_RE).withMessage('Hora de inicio no válida'),
    body('window_end').optional().matches(TIME_RE).withMessage('Hora de fin no válida'),
];
