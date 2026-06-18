import { Router } from 'express';
import validateToken from '../../middlewares/validate-token.js';
import {
    listToday, listCarryover, createTask, updateTask, snoozeTask, deleteTask, allCarryoverToday,
} from '../../controllers/task/task.controllers.js';
import { createTaskValidation, updateTaskValidation, idValidation } from '../../validations/task.validation.js';
import { validate } from '../../utils/helpers.js';

const task = Router();

// Todas las rutas operan sobre las tareas del usuario autenticado (identidad = JWT de fichada).
task.use(validateToken);

task.get('/today', listToday);
task.get('/carryover', listCarryover);
task.post('/carryover/all-today', allCarryoverToday);
task.post('/', validate(createTaskValidation), createTask);
task.patch('/:id', validate(updateTaskValidation), updateTask);
task.post('/:id/snooze', validate(idValidation), snoozeTask);
task.delete('/:id', validate(idValidation), deleteTask);

export default task;
