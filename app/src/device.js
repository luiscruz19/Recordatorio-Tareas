import { Platform } from 'react-native';
import * as ExpoDevice from 'expo-device';
import { IS_EXPO_GO } from './runtime';
import { getItem, setItem } from './storage';
import { registerDevice } from './api';

const UUID_KEY = 'recordatorios_device_uuid';

async function getDeviceUuid() {
    let id = await getItem(UUID_KEY);
    if (!id) {
        id = `${Platform.OS}-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
        await setItem(UUID_KEY, id);
    }
    return id;
}

async function getPushToken() {
    // En Expo Go (SDK 53+) las push de Android no están disponibles.
    if (IS_EXPO_GO) return null;
    const Notifications = require('expo-notifications');
    try {
        let { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
        if (status !== 'granted') return null;
        const pushToken = await Notifications.getExpoPushTokenAsync();
        return pushToken?.data || null;
    } catch {
        return null;
    }
}

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
    } catch {
        // Sin conexión o sin permiso: las notificaciones locales cubren el recordatorio.
    }
}
