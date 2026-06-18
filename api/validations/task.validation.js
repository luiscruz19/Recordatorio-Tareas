import { body, param } from 'express-validator';

export const createTaskValidation = [
    body('text').notEmpty().withMessage('El texto es obligatorio').bail().isString(),
    body('task_date').optional().isISO8601().withMessage('Fecha no válida'),
];

export const updateTaskValidation = [
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    body('text').optional().isString(),
    body('task_date').optional().isISO8601().withMessage('Fecha no válida'),
    body('status').optional().isIn(['pending', 'done']).withMessage('Estado no válido'),
];

export const idValidation = [
    param('id').isInt().withMessage('El ID debe ser un número entero'),
];
