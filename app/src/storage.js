import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// En web no hay SecureStore: se usa localStorage para poder probar.
export const IS_WEB = Platform.OS === 'web';

export async function getItem(key) {
    if (IS_WEB) return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    return SecureStore.getItemAsync(key);
}

export async function setItem(key, value) {
    if (IS_WEB) {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
        return;
    }
    return SecureStore.setItemAsync(key, value);
}

export async function deleteItem(key) {
    if (IS_WEB) {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
        return;
    }
    return SecureStore.deleteItemAsync(key);
}
