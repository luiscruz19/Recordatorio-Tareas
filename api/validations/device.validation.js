import { body } from 'express-validator';

export const registerDeviceValidation = [
    body('device_uuid').notEmpty().withMessage('El identificador del dispositivo es obligatorio'),
    body('platform').optional().isIn(['ios', 'android']).withMessage('Plataforma no válida'),
];

export const updatePushTokenValidation = [
    body('device_uuid').notEmpty().withMessage('El identificador del dispositivo es obligatorio'),
    body('push_token').notEmpty().withMessage('El push token es obligatorio'),
];
