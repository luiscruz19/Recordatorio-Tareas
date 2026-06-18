import { Op } from 'sequelize';
import Task from '../../models/Task.js';
import { successMessage, errorMessage } from '../../utils/messages.js';
import { localDateStr, addDaysStr } from '../../utils/helpers.js';

// ==================== HOY (pendientes + hechas del día) ====================
export async function listToday(req, res) {
    try {
        const today = localDateStr();
        const tasks = await Task.findAll({
            where: { user_id: req.user.id, task_date: today },
            order: [['createdAt', 'ASC']],
        });
        const pending = tasks.filter(t => t.status === 'pending');
        const done = tasks.filter(t => t.status === 'done');
        return res.status(200).json(successMessage({
            extra: {
                data: {
                    date: today,
                    pending,
                    done,
                    pending_count: pending.length,
                    done_count: done.length,
                }
            }
        }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al obtener las tareas de hoy', extra: { error: error.message }
        }));
    }
}

// ==================== CARRY-OVER (pendientes de días anteriores) ====================
export async function listCarryover(req, res) {
    try {
        const today = localDateStr();
        const tasks = await Task.findAll({
            where: { user_id: req.user.id, status: 'pending', task_date: { [Op.lt]: today } },
            order: [['task_date', 'ASC'], ['createdAt', 'ASC']],
        });
        return res.status(200).json(successMessage({ extra: { data: tasks } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al obtener las tareas pendientes', extra: { error: error.message }
        }));
    }
}

// ==================== CREAR ====================
export async function createTask(req, res) {
    try {
        const text = String(req.body.text || '').trim();
        const task_date = req.body.task_date || localDateStr();
        const task = await Task.create({
            user_id: req.user.id, text, task_date, status: 'pending',
        });
        return res.status(201).json(successMessage({ message: 'Tarea creada', extra: { data: task } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al crear la tarea', extra: { error: error.message }
        }));
    }
}

// ==================== ACTUALIZAR (toggle done / editar texto / mover de día) ====================
export async function updateTask(req, res) {
    try {
        const task = await Task.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!task) return res.status(404).json(errorMessage({ message: 'Tarea no encontrada' }));

        const updates = {};
        if (req.body.text !== undefined) updates.text = String(req.body.text).trim();
        if (req.body.task_date !== undefined) updates.task_date = req.body.task_date;
        if (req.body.status !== undefined) {
            updates.status = req.body.status;
            updates.done_at = req.body.status === 'done' ? new Date() : null;
        }

        await task.update(updates);
        return res.status(200).json(successMessage({ message: 'Tarea actualizada', extra: { data: task } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al actualizar la tarea', extra: { error: error.message }
        }));
    }
}

// ==================== POSPONER (al día siguiente) ====================
export async function snoozeTask(req, res) {
    try {
        const task = await Task.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!task) return res.status(404).json(errorMessage({ message: 'Tarea no encontrada' }));

        const today = localDateStr();
        const base = task.task_date && String(task.task_date) > today ? String(task.task_date) : today;
        await task.update({ task_date: addDaysStr(base, 1), status: 'pending', done_at: null });
        return res.status(200).json(successMessage({ message: 'Tarea pospuesta', extra: { data: task } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al posponer la tarea', extra: { error: error.message }
        }));
    }
}

// ==================== ELIMINAR (soft-delete) ====================
export async function deleteTask(req, res) {
    try {
        const task = await Task.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!task) return res.status(404).json(errorMessage({ message: 'Tarea no encontrada' }));
        await task.destroy();
        return res.status(200).json(successMessage({ message: 'Tarea eliminada' }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al eliminar la tarea', extra: { error: error.message }
        }));
    }
}

// ==================== PASAR TODAS A HOY (revisión de inicio del día) ====================
export async function allCarryoverToday(req, res) {
    try {
        const today = localDateStr();
        const [moved] = await Task.update(
            { task_date: today },
            { where: { user_id: req.user.id, status: 'pending', task_date: { [Op.lt]: today } } }
        );
        return res.status(200).json(successMessage({ message: 'Tareas pasadas a hoy', extra: { data: { moved } } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al pasar las tareas a hoy', extra: { error: error.message }
        }));
    }
}
