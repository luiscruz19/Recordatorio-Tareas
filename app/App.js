import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, Linking, LayoutAnimation, UIManager, Platform } from 'react-native';
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

// Animaciones de layout (entrar/salir/reordenar) suaves en toda la app.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}
function animate() {
    try {
        LayoutAnimation.configureNext(
            LayoutAnimation.create(240, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
        );
    } catch { /* no-op */ }
}

// Recalcula pendientes/hechas/contadores desde una lista plana.
function splitToday(prev, all) {
    const pending = all.filter((t) => t.status === 'pending');
    const done = all.filter((t) => t.status === 'done');
    return { ...prev, pending, done, pending_count: pending.length, done_count: done.length };
}

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
    const [loaded, setLoaded] = useState(false);     // primer load de Hoy completado
    const [carryover, setCarryover] = useState([]);
    const [settings, setSettings] = useState(null);
    const [notis, setNotis] = useState([]);
    const [notifStatus, setNotifStatus] = useState('undetermined');

    const [screen, setScreen] = useState('hoy');
    const [addOpen, setAddOpen] = useState(false);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [notisOpen, setNotisOpen] = useState(false);
    const [pendingAdd, setPendingAdd] = useState(false);

    const unread = notis.filter((n) => !n.read_at).length;

    const guard = useCallback(async (fn) => {
        try { return await fn(); }
        catch (e) {
            if (e?.status === 401) { await api.clearToken(); await goToLogin(); }
            return null;
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

    // Reconciliación silenciosa con el servidor (sin spinner ni animación): trae la verdad
    // luego de una acción optimista (ids reales, orden, etc.).
    const reconcileToday = useCallback(async () => {
        const r = await guard(() => api.getToday());
        if (r?.data) { setToday(r.data); syncSideEffects(r.data, settings); }
    }, [guard, settings, syncSideEffects]);

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

    const loadAll = useCallback(async () => {
        const me = await guard(() => api.getMe());
        const set = me?.data?.settings || null;
        if (set) setSettings(set);

        const td = await guard(() => api.getToday());
        if (td?.data) { setToday(td.data); syncSideEffects(td.data, set); }
        setLoaded(true);

        const co = await guard(() => api.getCarryover());
        setCarryover(co?.data || []);

        const nt = await guard(() => api.listNotifications());
        setNotis(nt?.data || []);

        if ((co?.data || []).length > 0) setReviewOpen(true);
        localNotifs.getPermissionStatus().then(setNotifStatus);
    }, [guard, syncSideEffects]);

    // Boot
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

    useEffect(() => {
        if (session === 'active') { setLoaded(false); loadAll(); syncDevice(); }
    }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

    // Acciones desde la push (Marcar hecha / Posponer).
    useEffect(() => {
        if (IS_EXPO_GO || session !== 'active') return;
        let sub;
        try {
            const N = require('expo-notifications');
            sub = N.addNotificationResponseReceivedListener(async (resp) => {
                const action = resp?.actionIdentifier;
                const first = (today.pending || [])[0];
                if (action === 'DONE' && first) { await guard(() => api.setTaskStatus(first.id, 'done')); }
                else if (action === 'SNOOZE' && first) { await guard(() => api.snoozeTask(first.id)); }
                await reconcileToday();
            });
        } catch { /* no-op */ }
        return () => { try { sub && sub.remove(); } catch { /* no-op */ } };
    }, [session, today.pending, guard, reconcileToday]);

    // Deep links del widget: recordatorios://add abre el formulario.
    useEffect(() => {
        const handle = (url) => {
            if (!url) return;
            if (url.includes('add')) setPendingAdd(true);
            setScreen('hoy');
        };
        Linking.getInitialURL().then(handle).catch(() => {});
        const sub = Linking.addEventListener('url', (e) => handle(e?.url));
        return () => { try { sub && sub.remove(); } catch { /* no-op */ } };
    }, []);
    useEffect(() => {
        if (session === 'active' && pendingAdd) { setAddOpen(true); setPendingAdd(false); }
    }, [session, pendingAdd]);

    // ─── Auth (email → PIN, delegado a fichada) ───────────────────────────────
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

    // ─── Acciones de tareas (UI OPTIMISTA: feedback inmediato + animación) ─────
    const onToggle = (task) => {
        const done = task.status !== 'done';
        animate();
        setToday((prev) => {
            const all = [...prev.pending, ...prev.done].map((t) =>
                t.id === task.id ? { ...t, status: done ? 'done' : 'pending', done_at: done ? new Date().toISOString() : null } : t
            );
            const next = splitToday(prev, all);
            syncSideEffects(next, settings);
            return next;
        });
        guard(() => api.setTaskStatus(task.id, done ? 'done' : 'pending')).then(reconcileToday);
    };

    const onDelete = (task) => {
        animate();
        setToday((prev) => {
            const all = [...prev.pending, ...prev.done].filter((t) => t.id !== task.id);
            const next = splitToday(prev, all);
            syncSideEffects(next, settings);
            return next;
        });
        guard(() => api.deleteTask(task.id)).then(reconcileToday);
    };

    const onSnooze = (task) => {
        animate();
        setToday((prev) => {
            const all = [...prev.pending, ...prev.done].filter((t) => t.id !== task.id);
            const next = splitToday(prev, all);
            syncSideEffects(next, settings);
            return next;
        });
        guard(() => api.snoozeTask(task.id)).then(reconcileToday);
    };

    const onSubmitAdd = (text, task_date) => {
        setAddOpen(false);
        const isToday = !task_date || task_date === todayISO();
        if (isToday) {
            animate();
            setToday((prev) => {
                const temp = { id: `tmp-${Date.now()}`, text, status: 'pending', task_date: todayISO() };
                const next = splitToday(prev, [...prev.pending, ...prev.done, temp]);
                syncSideEffects(next, settings);
                return next;
            });
        }
        guard(() => api.createTask(text, task_date)).then(reconcileToday);
    };

    const onChangeSettings = async (patch) => {
        const next = { ...(settings || {}), ...patch };
        setSettings(next);
        const r = await guard(() => api.updateSettings(patch));
        const eff = r?.data || next;
        if (r?.data) setSettings(r.data);
        syncSideEffects(today, eff);
    };

    // ─── Revisión de inicio del día (optimista) ────────────────────────────────
    const stepCarryover = (id, apiCall) => {
        animate();
        setCarryover((prev) => {
            const next = prev.filter((t) => t.id !== id);
            if (next.length === 0) { setReviewOpen(false); }
            return next;
        });
        guard(apiCall).then(() => { reconcileToday(); });
    };
    const onReviewToday = (id) => stepCarryover(id, () => api.updateTask(id, { task_date: todayISO() }));
    const onReviewDone = (id) => stepCarryover(id, () => api.setTaskStatus(id, 'done'));
    const onReviewDelete = (id) => stepCarryover(id, () => api.deleteTask(id));
    const onAllToday = () => {
        animate();
        setCarryover([]); setReviewOpen(false);
        guard(() => api.allCarryoverToday()).then(reconcileToday);
    };

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
    const onMarkAllRead = () => {
        const ids = notis.filter((n) => !n.read_at).map((n) => n.id);
        if (!ids.length) return;
        const now = new Date().toISOString();
        setNotis((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
        ids.forEach((id) => { guard(() => api.markNotificationRead(id)); });
    };

    const onRefresh = async () => {
        const r = await guard(() => api.getToday());
        if (r?.data) { setToday(r.data); syncSideEffects(r.data, settings); }
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
                            loading={!loaded}
                            unread={unread}
                            onToggle={onToggle}
                            onSnooze={onSnooze}
                            onDelete={onDelete}
                            onAdd={() => setAddOpen(true)}
                            onOpenSettings={() => setScreen('ajustes')}
                            onOpenNotis={onOpenNotis}
                            onRefresh={onRefresh}
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
