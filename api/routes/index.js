import { Router } from 'express';
import authProxy from './auth/index.js';
import tasks from './task/index.js';
import settings from './setting/index.js';
import devices from './device/index.js';
import notifications from './notification/index.js';

const api = Router();

api.get('/', (req, res) => res.json({ status: 1, service: 'recordatorios-api' }));

api.use('/auth', authProxy);
api.use('/tasks', tasks);
api.use('/settings', settings);
api.use('/devices', devices);
api.use('/notifications', notifications);

export default api;
