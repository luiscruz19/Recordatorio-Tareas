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
import { syncDevice } from './src/device';
import * as localNotifs from './src/notifications';
import { saveWidgetData, refreshWidget } from './src/widget/data';
import { todayISO } from './src/helpers';

import { LoginScreen } from './src/screens/AccessScreens';
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

const EMPTY_TODAY = { pending: [], done: [], pending_count: 0, done_count: 0, date: todayISO() };

export default function App() {
    const [fontsLoaded] = useFonts({
        SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
    });

    const [session, setSession] = useState('boot');     // boot | login | active
    const [loginErr, setLoginErr] = useState(null);
    const [loginLoading, setLoginLoading] = useState(false);

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

    // Envuelve llamadas al api: si vuelve 401, cierra sesión.
    const guard = useCallback(async (fn) => {
        try { return await fn(); }
        catch (e) {
            if (e?.status === 401) { await api.clearToken(); setSession('login'); }
            return null;
        }
    }, []);

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
            const tok = await api.loadToken();
            if (!tok) { setSession('login'); return; }
            const me = await api.getMe().catch(() => null);
            if (!me) { await api.clearToken(); setSession('login'); return; }
            setSession('active');
        })();
    }, []);

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

    // ─── Handlers ────────────────────────────────────────────────────────────
    const onLogin = async (email, password) => {
        setLoginErr(null); setLoginLoading(true);
        try { await api.login(email, password); setSession('active'); }
        catch (e) { setLoginErr(e?.message || 'No se pudo iniciar sesión'); }
        finally { setLoginLoading(false); }
    };

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

    // Revisión de inicio del día
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

    return (
        <SafeAreaProvider>
            <StatusBar style={session === 'active' ? 'light' : 'dark'} />
            {session === 'login' ? (
                <LoginScreen onLogin={onLogin} loading={loginLoading} error={loginErr} />
            ) : (
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
            )}
        </SafeAreaProvider>
    );
}
