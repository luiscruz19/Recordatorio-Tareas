import { validationResult } from 'express-validator';
import { errorMessage } from './messages.js';

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

export const DEFAULT_TZ = 'America/Argentina/Buenos_Aires';

const BEARER_PREFIX = 'Bearer ';

export const tokenFromRequest = (req) => {
    const { token, authorization } = req.headers;
    if (token) return token;
    return typeof authorization === 'string' && authorization.startsWith(BEARER_PREFIX)
        ? authorization.slice(BEARER_PREFIX.length).trim()
        : null;
};

// en-CA formatea la fecha como YYYY-MM-DD.
export const localDateStr = (tz = DEFAULT_TZ, date = new Date()) =>
    new Intl.DateTimeFormat('en-CA', {
        timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(date);

export const localMinutes = (tz = DEFAULT_TZ, date = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(date);
    const h = Number(parts.find(p => p.type === 'hour').value);
    const m = Number(parts.find(p => p.type === 'minute').value);
    return h * 60 + m;
};

// Se parte del mediodía para que el huso no cambie la fecha al pasar a UTC.
export const addDaysStr = (dateStr, days = 1) => {
    const d = new Date(`${dateStr}T12:00:00`);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
};

export const timeToMinutes = (t) => {
    if (!t || typeof t !== 'string') return null;
    const [h, m] = t.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
};
