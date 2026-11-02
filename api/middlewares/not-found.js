import { errorMessage } from '../utils/messages.js';

const notFound = (req, res) => {
    return res.status(404).json(errorMessage({
        message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
    }));
};

export default notFound;
