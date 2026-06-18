import { body } from 'express-validator';

export const updateSettingsValidation = [
    body('enabled').optional().isBoolean().withMessage('enabled debe ser booleano'),
    body('notif_enabled').optional().isBoolean().withMessage('notif_enabled debe ser booleano'),
    body('interval_minutes').optional().isInt({ min: 5, max: 1440 }).withMessage('Intervalo no válido'),
    body('window_start').optional().matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('Hora de inicio no válida'),
    body('window_end').optional().matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('Hora de fin no válida'),
    body('timezone').optional().isString().withMessage('Zona horaria no válida'),
];
