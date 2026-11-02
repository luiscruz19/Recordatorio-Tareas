import { useState, useEffect, useCallback, useRef } from 'react';
import { View, ActivityIndicator, Linking, LayoutAnimation, UIManager, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
import * as biometry from './src/biometry';
import * as localNotifs from './src/notifications';
import { saveWidgetData, refreshWidget } from './src/widget/data';
import { todayISO } from './src/helpers';
import { IS_EXPO_GO } from './src/runtime';
import * as haptics from './src/haptics';

import { EmailScreen, PasswordScreen, PinScreen } from './src/screens/AccessScreens';
import { HoyScreen } from './src/screens/HoyScreen';
import { AjustesScreen } from './src/screens/AjustesScreen';
import { AgregarSheet } from './src/screens/AgregarSheet';
import { RevisionScreen } from './src/screens/RevisionScreen';
import { NotisSheet } from './src/screens/NotisSheet';

const LAYOUT_ANIMATION_MS = 240;
const EMAIL_KEY = 'recordatorios_email';
const EMPTY_TODAY = { pending: [], done: [], pending_count: 0, done_count: 0, date: todayISO() };

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}
function animate() {
    try {
        LayoutAnimation.configureNext(
            LayoutAnimation.create(LAYOUT_ANIMATION_MS, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
        );
    } catch {}
}

function splitToday(prev, all) {
    const pending = all.filter((t) => t.status === 'pending');
    const done = all.filter((t) => t.status === 'done');
    return { ...prev, pending, done, pending_count: pending.length, done_count: done.length };
}

if (!IS_EXPO_GO) {
    try {
        const Notifications = require('expo-notifications');
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
            }),
        });
    } catch {}
}

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
    const [canBio, setCanBio] = useState(false);
    const bioTried = useRef(false);

    const [today, setToday] = useState(EMPTY_TODAY);
    const [todayLoaded, setTodayLoaded] = useState(false);
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

    const goToLogin = useCallback(async () => {
        const lastEmail = await getItem(EMAIL_KEY);
        if (!lastEmail) { setSession('emailEntry'); return; }
        setEmail(lastEmail);
        const localPin = await biometry.getLocalPin();
        setCanBio(!!localPin && await biometry.hwEnrolled());
        // Con PIN local no hace falta consultar al servidor: funciona sin conexión.
        if (localPin) { setSession('loginPin'); return; }
        try {
            const res = await api.hasPin(lastEmail);
            setSession(res?.has_pin ? 'loginPin' : 'loginPassword');
        } catch {
            setSession('emailEntry');
        }
    }, []);

    const guard = useCallback(async (fn) => {
        try { return await fn(); }
        catch (e) {
            if (e?.status === 401) { await api.clearToken(); await goToLogin(); }
            return null;
        }
    }, [goToLogin]);

    const syncSideEffects = useCallback((todayData, currentSettings) => {
        const pending = todayData?.pending || [];
        const done = todayData?.done || [];
        saveWidgetData({
            pending: pending.map((t) => ({ id: t.id, text: t.text })),
            done: done.length,
            total: pending.length + done.length,
        }).then(refreshWidget).catch(() => {});
        if (currentSettings) localNotifs.reschedule(currentSettings, pending.length, pending.length + done.length);
    }, []);

    // Tras una acción optimista trae del servidor los ids reales y el orden.
    const reconcileToday = useCallback(async () => {
        const res = await guard(() => api.getToday());
        if (res?.data) { setToday(res.data); syncSideEffects(res.data, settings); }
    }, [guard, settings, syncSideEffects]);

    const loadAll = useCallback(async () => {
        const me = await guard(() => api.getMe());
        const loadedSettings = me?.data?.settings || null;
        if (loadedSettings) setSettings(loadedSettings);

        const todayRes = await guard(() => api.getToday());
        if (todayRes?.data) { setToday(todayRes.data); syncSideEffects(todayRes.data, loadedSettings); }
        setTodayLoaded(true);

        const carryoverRes = await guard(() => api.getCarryover());
        setCarryover(carryoverRes?.data || []);

        const notisRes = await guard(() => api.listNotifications());
        setNotis(notisRes?.data || []);

        if ((carryoverRes?.data || []).length > 0) setReviewOpen(true);
        localNotifs.getPermissionStatus().then(setNotifStatus);
    }, [guard, syncSideEffects]);

    useEffect(() => {
        (async () => {
            await localNotifs.setupCategory();
            const storedToken = await api.loadToken();
            if (storedToken) {
                const me = await api.getMe().catch(() => null);
                if (me) { setSession('active'); return; }
                await api.clearToken();
            }
            await goToLogin();
        })();
    }, [goToLogin]);

    useEffect(() => {
        if (session === 'active') { setTodayLoaded(false); loadAll(); syncDevice(); }
    }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

    // La push no identifica una tarea: la acción se aplica a la primera pendiente.
    useEffect(() => {
        if (IS_EXPO_GO || session !== 'active') return;
        let subscription;
        try {
            const Notifications = require('expo-notifications');
            subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
                const action = response?.actionIdentifier;
                const first = (today.pending || [])[0];
                if (action === 'DONE' && first) { await guard(() => api.setTaskStatus(first.id, 'done')); }
                else if (action === 'SNOOZE' && first) { await guard(() => api.snoozeTask(first.id)); }
                await reconcileToday();
            });
        } catch {}
        return () => { try { subscription?.remove(); } catch {} };
    }, [session, today.pending, guard, reconcileToday]);

    // Deep links del widget: recordatorios://add abre el formulario.
    useEffect(() => {
        const handle = (url) => {
            if (!url) return;
            if (url.includes('add')) setPendingAdd(true);
            setScreen('hoy');
        };
        Linking.getInitialURL().then(handle).catch(() => {});
        const subscription = Linking.addEventListener('url', (e) => handle(e?.url));
        return () => { try { subscription?.remove(); } catch {} };
    }, []);
    useEffect(() => {
        if (session === 'active' && pendingAdd) { setAddOpen(true); setPendingAdd(false); }
    }, [session, pendingAdd]);

    const onContinueEmail = async (rawEmail) => {
        const normalizedEmail = String(rawEmail || '').trim().toLowerCase();
        if (!normalizedEmail) { setAuthError('Ingresá tu email'); return; }
        setEmail(normalizedEmail); setAuthError(null); setBusy(true);
        try {
            await setItem(EMAIL_KEY, normalizedEmail);
            const res = await api.hasPin(normalizedEmail);
            if (res?.has_pin) {
                const localPin = await biometry.getLocalPin();
                setCanBio(!!localPin && await biometry.hwEnrolled());
                setSession('loginPin');
            } else {
                setSession('loginPassword');
            }
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
            try {
                await api.setPinRemote(value);
                await biometry.saveLocalPin(value);
                setAuthError(null); setSession('active');
            }
            catch { setAuthError('No se pudo guardar el PIN'); setSession('createPin'); }
            finally { setBusy(false); }
        } else if (mode === 'login') {
            setBusy(true);
            try {
                await api.loginPin(email, value);
                await biometry.saveLocalPin(value);
                setAuthError(null); setSession('active');
            }
            catch (e) { setAuthError(e?.message || 'PIN incorrecto'); }
            finally { setBusy(false); }
        }
    };

    const onBio = async () => {
        try {
            const ok = await biometry.authenticate();
            if (!ok) return;
            const localPin = await biometry.getLocalPin();
            if (!localPin) return;
            setBusy(true);
            await api.loginPin(email, localPin);
            setAuthError(null); setSession('active');
        } catch (e) {
            setAuthError(e?.message || 'No se pudo validar la biometría');
        } finally {
            setBusy(false);
        }
    };

    // La biometría se dispara una sola vez al llegar al PIN; si se cancela, queda el teclado.
    useEffect(() => {
        if (session === 'loginPin' && canBio && !bioTried.current) {
            bioTried.current = true;
            onBio();
        }
        if (session !== 'loginPin') bioTried.current = false;
    }, [session, canBio]); // eslint-disable-line react-hooks/exhaustive-deps

    const onBackEmail = () => { setAuthError(null); setSession('emailEntry'); };

    const onLock = async () => {
        setScreen('hoy'); setAuthError(null);
        const localPin = await biometry.getLocalPin();
        setCanBio(!!localPin && await biometry.hwEnrolled());
        setSession('loginPin');
    };

    const onLogout = async () => {
        setScreen('hoy'); setAuthError(null);
        await api.clearToken();
        await biometry.clearLocalPin();
        await goToLogin();
    };

    const updateTodayOptimistically = (transform) => {
        animate();
        setToday((prev) => {
            const next = splitToday(prev, transform([...prev.pending, ...prev.done]));
            syncSideEffects(next, settings);
            return next;
        });
    };

    const onToggle = (task) => {
        const done = task.status !== 'done';
        (done ? haptics.success : haptics.tap)();
        updateTodayOptimistically((all) => all.map((t) =>
            t.id === task.id ? { ...t, status: done ? 'done' : 'pending', done_at: done ? new Date().toISOString() : null } : t
        ));
        guard(() => api.setTaskStatus(task.id, done ? 'done' : 'pending')).then(reconcileToday);
    };

    const onDelete = (task) => {
        haptics.tapMedium();
        updateTodayOptimistically((all) => all.filter((t) => t.id !== task.id));
        guard(() => api.deleteTask(task.id)).then(reconcileToday);
    };

    const onSnooze = (task) => {
        haptics.tap();
        updateTodayOptimistically((all) => all.filter((t) => t.id !== task.id));
        guard(() => api.snoozeTask(task.id)).then(reconcileToday);
    };

    const onSubmitAdd = (text, taskDate) => {
        setAddOpen(false);
        haptics.tap();
        if (!taskDate || taskDate === todayISO()) {
            updateTodayOptimistically((all) => [
                ...all,
                { id: `tmp-${Date.now()}`, text, status: 'pending', task_date: todayISO() },
            ]);
        }
        guard(() => api.createTask(text, taskDate)).then(reconcileToday);
    };

    const onChangeSettings = async (patch) => {
        const next = { ...(settings || {}), ...patch };
        setSettings(next);
        const res = await guard(() => api.updateSettings(patch));
        if (res?.data) setSettings(res.data);
        syncSideEffects(today, res?.data || next);
    };

    const stepCarryover = (id, apiCall) => {
        haptics.tap();
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
        haptics.success();
        animate();
        setCarryover([]); setReviewOpen(false);
        guard(() => api.allCarryoverToday()).then(reconcileToday);
    };

    const onSimulateReview = async () => {
        const res = await guard(() => api.getCarryover());
        setCarryover(res?.data || []);
        setScreen('hoy');
        if ((res?.data || []).length) setReviewOpen(true);
    };

    const reloadNotis = async () => {
        const res = await guard(() => api.listNotifications());
        setNotis(res?.data || []);
    };

    const onOpenNotis = async () => {
        setNotisOpen(true);
        await reloadNotis();
    };

    const onMarkAllRead = () => {
        const ids = notis.filter((n) => !n.read_at).map((n) => n.id);
        if (!ids.length) return;
        const now = new Date().toISOString();
        setNotis((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
        ids.forEach((id) => { guard(() => api.markNotificationRead(id)); });
    };

    const onRefresh = async () => {
        await reconcileToday();
        await reloadNotis();
    };

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
        authScreen = <PinScreen mode="login" email={email} onComplete={(v) => onPin('login', v)} onBio={canBio ? onBio : undefined} onBack={onBackEmail} error={authError} />;
    }

    return (
        <SafeAreaProvider>
            <StatusBar style={session === 'active' ? 'light' : 'dark'} />
            {session === 'active' ? (
                <View style={{ flex: 1, backgroundColor: C.bg }}>
                    {screen === 'hoy' ? (
                        <HoyScreen
                            data={today}
                            loading={!todayLoaded}
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
                            onLock={onLock}
                            onLogout={onLogout}
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
