import { Router } from 'express';
import validateToken from '../../middlewares/validate-token.js';
import { getSettings, updateSettings } from '../../controllers/setting/setting.controllers.js';
import { updateSettingsValidation } from '../../validations/setting.validation.js';
import { validate } from '../../utils/helpers.js';

const setting = Router();

setting.use(validateToken);

setting.get('/', getSettings);
setting.put('/', validate(updateSettingsValidation), updateSettings);

export default setting;
