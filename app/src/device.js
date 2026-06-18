import { Platform } from 'react-native';
import * as ExpoDevice from 'expo-device';
import Constants from 'expo-constants';
import { getItem, setItem } from './storage';
import { registerDevice } from './api';

// En Expo Go (SDK 53+) las push de Android no están disponibles → no las pedimos.
const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';

const UUID_KEY = 'recordatorios_device_uuid';

// Identificador estable del dispositivo: se genera una vez y persiste.
async function getDeviceUuid() {
    let id = await getItem(UUID_KEY);
    if (!id) {
        id = `${Platform.OS}-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
        await setItem(UUID_KEY, id);
    }
    return id;
}

// Push token de Expo (best-effort: requiere permisos y projectId/EAS; si falla, null).
async function getPushToken() {
    if (IS_EXPO_GO) return null;
    const Notifications = require('expo-notifications');
    try {
        let { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
        if (status !== 'granted') return null;
        const tok = await Notifications.getExpoPushTokenAsync();
        return tok?.data || null;
    } catch {
        return null;
    }
}

/**
 * Registra/actualiza este dispositivo en el backend (push token para el recordatorio del servidor).
 * No es crítico: si falla, la app sigue funcionando con las notificaciones locales.
 */
export async function syncDevice() {
    try {
        const device_uuid = await getDeviceUuid();
        const push_token = await getPushToken();
        await registerDevice({
            device_uuid,
            platform: Platform.OS,
            model: ExpoDevice.modelName || null,
            push_token,
        });
    } catch (e) {
        // offline o sin permiso: las notificaciones locales cubren el recordatorio.
    }
}
