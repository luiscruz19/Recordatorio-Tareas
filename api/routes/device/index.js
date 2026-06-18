import { Router } from 'express';
import validateToken from '../../middlewares/validate-token.js';
import { registerDevice, updatePushToken } from '../../controllers/device/device.controllers.js';
import { registerDeviceValidation, updatePushTokenValidation } from '../../validations/device.validation.js';
import { validate } from '../../utils/helpers.js';

const device = Router();

device.use(validateToken);

device.post('/register', validate(registerDeviceValidation), registerDevice);
device.patch('/push-token', validate(updatePushTokenValidation), updatePushToken);

export default device;
