import jwt from 'jsonwebtoken';
import CONFIG from '../config/config.js';
import messages from '../config/messages.js';
import { errorMessage } from '../utils/messages.js';
import { tokenFromRequest } from '../utils/helpers.js';

const { SECRET_KEY } = CONFIG;
const { generic } = messages;

// Alcanza con verificar la firma: no se consulta a fichada en cada pedido.
export default (req, res, next) => {
    const token = tokenFromRequest(req);

    if (!token) {
        return res.status(401).json(errorMessage({ message: generic.token_not_found }));
    }

    try {
        req.user = jwt.verify(token, SECRET_KEY);
        next();
    } catch (e) {
        const message = e.name === 'TokenExpiredError'
            ? generic.token_expirated
            : generic.token_invalid;
        return res.status(401).json(errorMessage({ message }));
    }
};
