import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import {
    useFonts,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';

import { C } from './src/theme';
import * as api from './src/api';
import { getItem, setItem } from './src/storage';
import { syncDevice } from './src/device';
import * as localNotifs from './src/notifications';
import { saveWidgetData, refreshWidget } from './src/widget/data';
import { todayISO } from './src/helpers';

import { EmailScreen, PasswordScreen, PinScreen } from './src/screens/AccessScreens';
import { HoyScreen } from './src/screens/HoyScreen';
import { AjustesScreen } from './src/screens/AjustesScreen';
import { AgregarSheet } from './src/screens/AgregarSheet';
import { RevisionScreen } from './src/screens/RevisionScreen';
import { NotisSheet } from './src/screens/NotisSheet';

// Handler de cómo se muestran las push con la app abierta (fuera de Expo Go).
const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';
if (!IS_EXPO_GO) {
    try {
        const N = require('expo-notifications');
        N.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
            }),
        });
    } catch { /* no-op */ }
}

const EMAIL_KEY = 'recordatorios_email';
const EMPTY_TODAY = { pending: [], done: [], pending_count: 0, done_count: 0, date: todayISO() };

export default function App() {
    const [fontsLoaded] = useFonts({
        SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
    });

    // boot | emailEntry | loginPassword | createPin | confirmPin | loginPin | active
    const [session, setSession] = useState('boot');
    const [email, setEmail] = useState('');
    const [pinDraft, setPinDraft] = useState('');
    const [authError, setAuthError] = useState(null);
    const [busy, setBusy] = useState(false);

    const [today, setToday] = useState(EMPTY_TODAY);
    const [carryover, setCarryover] = useState([]);
    const [settings, setSettings] = useState(null);
    const [notis, setNotis] = useState([]);
    const [notifStatus, setNotifStatus] = useState('undetermined');

    const [screen, setScreen] = useState('hoy');         // hoy | ajustes
    const [addOpen, setAddOpen] = useState(false);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [notisOpen, setNotisOpen] = useState(false);

    const unread = notis.filter((n) => !n.read_at).length;

    // Lleva a la pantalla de ingreso correcta: si este teléfono ya usó una cuenta con PIN,
    // va directo a pedir el PIN; si no, pide el email.
    const goToLogin = useCallback(async () => {
        const last = await getItem(EMAIL_KEY);
        if (!last) { setSession('emailEntry'); return; }
        setEmail(last);
        try {
            const res = await api.hasPin(last);
            setSession(res?.has_pin ? 'loginPin' : 'loginPassword');
        } catch {
            setSession('emailEntry');
        }
    }, []);

    // Envuelve llamadas al api: si vuelve 401, vuelve al login.
    const guard = useCallback(async (fn) => {
        try { return await fn(); }
        catch (e) {
            if (e?.status === 401) { await api.clearToken(); await goToLogin(); }
            return null;
        }
    }, [goToLogin]);

    // Efectos colaterales tras cambios en "hoy": widget + notificaciones locales.
    const syncSideEffects = useCallback((td, set) => {
        const pending = td?.pending || [];
        const done = td?.done || [];
        saveWidgetData({
            pending: pending.map((t) => ({ id: t.id, text: t.text })),
            done: done.length,
            total: pending.length + done.length,
        }).then(refreshWidget).catch(() => {});
        if (set) localNotifs.reschedule(set, pending.length);
    }, []);

    const loadToday = useCallback(async (set) => {
        const r = await guard(() => api.getToday());
        if (r?.data) { setToday(r.data); syncSideEffects(r.data, set || settings); }
        return r?.data;
    }, [guard, settings, syncSideEffects]);

    const loadAll = useCallback(async () => {
        const me = await guard(() => api.getMe());
        const set = me?.data?.settings || null;
        if (set) setSettings(set);

        const td = await guard(() => api.getToday());
        if (td?.data) setToday(td.data);

        const co = await guard(() => api.getCarryover());
        setCarryover(co?.data || []);

        const nt = await guard(() => api.listNotifications());
        setNotis(nt?.data || []);

        if (td?.data) syncSideEffects(td.data, set);
        if ((co?.data || []).length > 0) setReviewOpen(true);
        localNotifs.getPermissionStatus().then(setNotifStatus);
    }, [guard, syncSideEffects]);

    // Boot: ¿hay sesión válida?
    useEffect(() => {
        (async () => {
            await localNotifs.setupCategory();
            const tk = await api.loadToken();
            if (tk) {
                const me = await api.getMe().catch(() => null);
                if (me) { setSession('active'); return; }
                await api.clearToken();
            }
            await goToLogin();
        })();
    }, [goToLogin]);

    // Al entrar a "active": cargar todo + registrar dispositivo.
    useEffect(() => {
        if (session === 'active') { loadAll(); syncDevice(); }
    }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

    // Acciones desde la push (Marcar hecha / Posponer) — best-effort sobre la 1ª pendiente.
    useEffect(() => {
        if (IS_EXPO_GO || session !== 'active') return;
        let sub;
        try {
            const N = require('expo-notifications');
            sub = N.addNotificationResponseReceivedListener(async (resp) => {
                const action = resp?.actionIdentifier;
                const first = (today.pending || [])[0];
                if (action === 'DONE' && first) await guard(() => api.setTaskStatus(first.id, 'done'));
                else if (action === 'SNOOZE' && first) await guard(() => api.snoozeTask(first.id));
                await loadToday();
            });
        } catch { /* no-op */ }
        return () => { try { sub && sub.remove(); } catch { /* no-op */ } };
    }, [session, today.pending, guard, loadToday]);

    // ─── Auth (email → PIN, calco del flujo de fichada) ───────────────────────
    const onContinueEmail = async (em) => {
        const e = String(em || '').trim().toLowerCase();
        if (!e) { setAuthError('Ingresá tu email'); return; }
        setEmail(e); setAuthError(null); setBusy(true);
        try {
            await setItem(EMAIL_KEY, e);
            const res = await api.hasPin(e);
            setSession(res?.has_pin ? 'loginPin' : 'loginPassword');
        } catch {
            setAuthError('No se pudo conectar con el servidor');
        } finally {
            setBusy(false);
        }
    };

    const onLoginPassword = async (password) => {
        setAuthError(null); setBusy(true);
        try { await api.login(email, password); setSession('createPin'); }
        catch (e) { setAuthError(e?.message || 'No se pudo iniciar sesión'); }
        finally { setBusy(false); }
    };

    const onPin = async (mode, value) => {
        if (mode === 'create') {
            setPinDraft(value); setAuthError(null); setSession('confirmPin');
        } else if (mode === 'confirm') {
            if (value !== pinDraft) { setAuthError('El PIN no coincide'); setSession('createPin'); return; }
            setBusy(true);
            try { await api.setPinRemote(value); setAuthError(null); setSession('active'); }
            catch { setAuthError('No se pudo guardar el PIN'); setSession('createPin'); }
            finally { setBusy(false); }
        } else if (mode === 'login') {
            setBusy(true);
            try { await api.loginPin(email, value); setAuthError(null); setSession('active'); }
            catch (e) { setAuthError(e?.message || 'PIN incorrecto'); }
            finally { setBusy(false); }
        }
    };

    const onBackEmail = () => { setAuthError(null); setSession('emailEntry'); };

    // ─── Handlers de la app ────────────────────────────────────────────────────
    const onToggle = async (task) => {
        await guard(() => api.setTaskStatus(task.id, task.status === 'done' ? 'pending' : 'done'));
        await loadToday();
    };
    const onSnooze = async (task) => { await guard(() => api.snoozeTask(task.id)); await loadToday(); };
    const onDelete = async (task) => { await guard(() => api.deleteTask(task.id)); await loadToday(); };
    const onSubmitAdd = async (text, task_date) => {
        setAddOpen(false);
        await guard(() => api.createTask(text, task_date));
        await loadToday();
    };

    const onChangeSettings = async (patch) => {
        const next = { ...(settings || {}), ...patch };
        setSettings(next);
        const r = await guard(() => api.updateSettings(patch));
        const eff = r?.data || next;
        if (r?.data) setSettings(r.data);
        syncSideEffects(today, eff);
    };

    const afterReviewStep = (id) => {
        setCarryover((prev) => {
            const next = prev.filter((t) => t.id !== id);
            if (next.length === 0) { setReviewOpen(false); loadToday(); }
            return next;
        });
    };
    const onReviewToday = async (id) => { await guard(() => api.updateTask(id, { task_date: todayISO() })); afterReviewStep(id); };
    const onReviewDone = async (id) => { await guard(() => api.setTaskStatus(id, 'done')); afterReviewStep(id); };
    const onReviewDelete = async (id) => { await guard(() => api.deleteTask(id)); afterReviewStep(id); };
    const onAllToday = async () => { await guard(() => api.allCarryoverToday()); setCarryover([]); setReviewOpen(false); await loadToday(); };

    const onSimulateReview = async () => {
        const co = await guard(() => api.getCarryover());
        setCarryover(co?.data || []);
        setScreen('hoy');
        if ((co?.data || []).length) setReviewOpen(true);
    };

    const onOpenNotis = async () => {
        setNotisOpen(true);
        const nt = await guard(() => api.listNotifications());
        setNotis(nt?.data || []);
    };
    const onMarkAllRead = async () => {
        const ids = notis.filter((n) => !n.read_at).map((n) => n.id);
        for (const id of ids) await guard(() => api.markNotificationRead(id));
        const nt = await guard(() => api.listNotifications());
        setNotis(nt?.data || []);
    };

    // ─── Render ──────────────────────────────────────────────────────────────
    if (!fontsLoaded || session === 'boot') {
        return (
            <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={C.accent} size="large" />
            </View>
        );
    }

    let authScreen = null;
    if (session === 'emailEntry') {
        authScreen = <EmailScreen onContinue={onContinueEmail} busy={busy} error={authError} initialEmail={email} />;
    } else if (session === 'loginPassword') {
        authScreen = <PasswordScreen email={email} onLogin={onLoginPassword} onBack={onBackEmail} error={authError} busy={busy} />;
    } else if (session === 'createPin') {
        authScreen = <PinScreen mode="create" onComplete={(v) => onPin('create', v)} error={authError} />;
    } else if (session === 'confirmPin') {
        authScreen = <PinScreen mode="confirm" onComplete={(v) => onPin('confirm', v)} error={authError} />;
    } else if (session === 'loginPin') {
        authScreen = <PinScreen mode="login" email={email} onComplete={(v) => onPin('login', v)} onBack={onBackEmail} error={authError} />;
    }

    return (
        <SafeAreaProvider>
            <StatusBar style={session === 'active' ? 'light' : 'dark'} />
            {session === 'active' ? (
                <View style={{ flex: 1, backgroundColor: C.bg }}>
                    {screen === 'hoy' ? (
                        <HoyScreen
                            data={today}
                            unread={unread}
                            onToggle={onToggle}
                            onSnooze={onSnooze}
                            onDelete={onDelete}
                            onAdd={() => setAddOpen(true)}
                            onOpenSettings={() => setScreen('ajustes')}
                            onOpenNotis={onOpenNotis}
                        />
                    ) : (
                        <AjustesScreen
                            settings={settings}
                            notifStatus={notifStatus}
                            onBack={() => setScreen('hoy')}
                            onChange={onChangeSettings}
                            onSimulateReview={onSimulateReview}
                        />
                    )}

                    <AgregarSheet visible={addOpen} onClose={() => setAddOpen(false)} onSubmit={onSubmitAdd} />
                    <NotisSheet visible={notisOpen} onClose={() => setNotisOpen(false)} items={notis} onMarkAllRead={onMarkAllRead} />
                    <RevisionScreen
                        visible={reviewOpen}
                        tasks={carryover}
                        onToday={onReviewToday}
                        onDone={onReviewDone}
                        onDelete={onReviewDelete}
                        onAllToday={onAllToday}
                    />
                </View>
            ) : authScreen}
        </SafeAreaProvider>
    );
}
