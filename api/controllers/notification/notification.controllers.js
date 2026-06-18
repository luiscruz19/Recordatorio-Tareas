import Notification from '../../models/Notification.js';
import { successMessage, errorMessage } from '../../utils/messages.js';

// ==================== MIS NOTIFICACIONES ====================
export async function listMyNotifications(req, res) {
    try {
        const notifications = await Notification.findAll({
            where: { user_id: req.user.id },
            order: [['createdAt', 'DESC']],
            limit: 100,
        });
        return res.status(200).json(successMessage({ extra: { data: notifications } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al obtener las notificaciones', extra: { error: error.message }
        }));
    }
}

// ==================== MARCAR COMO LEÍDA ====================
export async function markRead(req, res) {
    try {
        const notification = await Notification.findOne({
            where: { id: req.params.id, user_id: req.user.id }
        });
        if (!notification) return res.status(404).json(errorMessage({ message: 'Notificación no encontrada' }));

        await notification.update({ read_at: new Date() });
        return res.status(200).json(successMessage({ message: 'Notificación marcada como leída', extra: { data: notification } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al marcar la notificación', extra: { error: error.message }
        }));
    }
}
