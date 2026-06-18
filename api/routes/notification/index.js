import { Router } from 'express';
import { param } from 'express-validator';
import validateToken from '../../middlewares/validate-token.js';
import { listMyNotifications, markRead } from '../../controllers/notification/notification.controllers.js';
import { validate } from '../../utils/helpers.js';

const notification = Router();

notification.use(validateToken);

notification.get('/', listMyNotifications);
notification.patch('/:id/read', validate([param('id').isInt().withMessage('ID no válido')]), markRead);

export default notification;
