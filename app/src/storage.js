import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// En nativo usamos SecureStore (cifrado). En web caemos a localStorage para poder probar.
const isWeb = Platform.OS === 'web';

export async function getItem(key) {
    if (isWeb) return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    return SecureStore.getItemAsync(key);
}

export async function setItem(key, value) {
    if (isWeb) {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
        return;
    }
    return SecureStore.setItemAsync(key, value);
}

export async function deleteItem(key) {
    if (isWeb) {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
        return;
    }
    return SecureStore.deleteItemAsync(key);
}

export const IS_WEB = isWeb;
