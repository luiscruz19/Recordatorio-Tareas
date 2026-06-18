import { validationResult } from 'express-validator';
import { errorMessage } from './messages.js';

/**
 * Corre un set de validaciones de express-validator y, si hay errores,
 * responde 400 con el detalle agrupado por campo.
 */
export const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        const errors = validationResult(req);

        if (errors.isEmpty()) {
            return next();
        }

        const errorArray = errors.array();

        const errorsByField = {};
        errorArray.forEach(error => {
            const field = error.param || error.path;
            if (!errorsByField[field]) errorsByField[field] = [];
            errorsByField[field].push(error.msg);
        });

        const errorMessages = Object.entries(errorsByField).map(
            ([field, msgs]) => `${field}: ${msgs.join(', ')}`
        );

        return res.status(400).json(errorMessage({
            message: 'Error de validación en los campos ingresados',
            extra: {
                details: errorMessages.join(' | '),
                errors: errorArray.map(err => ({
                    field: err.param || err.path,
                    message: err.msg,
                    value: err.value
                })),
                validation: errorsByField
            }
        }));
    };
};

export const isEmpty = (value) =>
    (value === null || value === undefined || value === '');

const DEFAULT_TZ = 'America/Argentina/Buenos_Aires';

/**
 * Fecha local "YYYY-MM-DD" en la zona dada (default Argentina).
 * Se usa para resolver el "hoy" de las tareas (DATEONLY, sin hora).
 */
export const localDateStr = (tz = DEFAULT_TZ, date = new Date()) =>
    new Intl.DateTimeFormat('en-CA', {
        timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(date);

/**
 * Minutos desde medianoche (0..1439) en la zona dada. Para evaluar la franja horaria.
 */
export const localMinutes = (tz = DEFAULT_TZ, date = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(date);
    const h = Number(parts.find(p => p.type === 'hour').value);
    const m = Number(parts.find(p => p.type === 'minute').value);
    return h * 60 + m;
};

/** Suma `days` a un "YYYY-MM-DD" y devuelve otro "YYYY-MM-DD" (estable ante husos). */
export const addDaysStr = (dateStr, days = 1) => {
    const d = new Date(`${dateStr}T12:00:00`);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
};

/** "HH:MM[:SS]" → minutos desde medianoche. */
export const timeToMinutes = (t) => {
    if (!t || typeof t !== 'string') return null;
    const [h, m] = t.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
};
