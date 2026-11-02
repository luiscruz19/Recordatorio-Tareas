import { Router } from 'express';
import { login, me, hasPin, loginPin, setPin } from '../../controllers/auth/proxy.controllers.js';
import validateToken from '../../middlewares/validate-token.js';

const auth = Router();

// Credenciales delegadas a fichada_api: mismos usuarios y mismo PIN.
auth.post('/login', login);
auth.post('/login-pin', loginPin);
auth.get('/has-pin', hasPin);
auth.post('/set-pin', setPin);

auth.get('/me', validateToken, me);

export default auth;
