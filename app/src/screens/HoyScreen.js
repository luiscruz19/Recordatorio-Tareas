import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Settings, Plus, Check, Clock3, Trash2 } from 'lucide-react-native';
import { C, F, R, GRAD_HEADER, GRAD_FAB, shadowHeader, shadowCard, shadowFab } from '../theme';
import { Ring } from '../components';
import { fmtDateLong } from '../helpers';

export function HoyScreen({ data, loading = false, onToggle, onSnooze, onDelete, onAdd, onOpenSettings, onOpenNotis, onRefresh, unread = 0 }) {
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState(false);
    const doRefresh = async () => {
        setRefreshing(true);
        try { await onRefresh?.(); } finally { setRefreshing(false); }
    };
    const pending = data?.pending || [];
    const done = data?.done || [];
    const total = pending.length + done.length;
    const pct = total > 0 ? Math.round((done.length / total) * 100) : 0;

    let progressLabel;
    if (loading) progressLabel = 'Cargando tus tareas…';
    else if (total === 0) progressLabel = 'Sin tareas para hoy';
    else if (pending.length === 0) progressLabel = '¡Completaste todo!';
    else progressLabel = `Te ${pending.length === 1 ? 'queda' : 'quedan'} ${pending.length} ${pending.length === 1 ? 'tarea' : 'tareas'} por hacer`;

    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            {/* HEADER */}
            <LinearGradient
                colors={GRAD_HEADER} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ paddingTop: insets.top + 14, paddingHorizontal: 22, paddingBottom: 30, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden', ...shadowHeader }}
            >
                <View style={{ position: 'absolute', top: -70, right: -40, width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(255,255,255,0.07)' }} />
                <View style={{ position: 'absolute', bottom: -80, left: -50, width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(255,255,255,0.05)' }} />

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: F.semi, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.70)' }}>
                        {fmtDateLong()}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 9 }}>
                        <RoundBtn onPress={onOpenNotis}>
                            <Bell size={20} color="#fff" strokeWidth={1.7} />
                            {unread > 0 && <View style={{ position: 'absolute', top: 8, right: 8, width: 9, height: 9, borderRadius: 5, backgroundColor: '#FF6B6B' }} />}
                        </RoundBtn>
                        <RoundBtn onPress={onOpenSettings}>
                            <Settings size={21} color="#fff" strokeWidth={1.7} />
                        </RoundBtn>
                    </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                        <Text style={{ fontFamily: F.bold, fontSize: 36, color: '#fff', letterSpacing: -1, lineHeight: 38 }}>Hoy</Text>
                        <Text style={{ fontFamily: F.med, fontSize: 15, color: 'rgba(255,255,255,0.78)', marginTop: 9, lineHeight: 20 }}>
                            {progressLabel}
                        </Text>
                    </View>
                    <Ring size={78} stroke={7} pct={pct} color="#fff" track="rgba(255,255,255,0.20)">
                        <Text style={{ fontFamily: F.bold, fontSize: 21, color: '#fff' }}>{pct}%</Text>
                    </Ring>
                </View>
            </LinearGradient>

            {/* LISTA */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 22, paddingBottom: 130 + insets.bottom }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={doRefresh} tintColor={C.accent} colors={[C.accent]} />}
            >
                {loading && <SkeletonList />}

                {!loading && pending.length > 0 && (
                    <>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingBottom: 12 }}>
                            <Text style={sectionLabel}>Pendientes</Text>
                            <Text style={{ fontFamily: F.semi, fontSize: 13, color: C.accent, backgroundColor: C.accentTint, paddingHorizontal: 11, paddingVertical: 3, borderRadius: 20, overflow: 'hidden' }}>
                                {pending.length} {pending.length === 1 ? 'tarea' : 'tareas'}
                            </Text>
                        </View>
                        {pending.map((t) => (
                            <PendingRow key={t.id} task={t} onToggle={onToggle} onSnooze={onSnooze} onDelete={onDelete} />
                        ))}
                    </>
                )}

                {!loading && pending.length === 0 && (
                    <View style={{ alignItems: 'center', paddingTop: 56, paddingHorizontal: 24 }}>
                        <LinearGradient colors={[C.accentTint, '#DCE3F1']} style={{ width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 22, ...shadowCard }}>
                            <Check size={38} color={C.accent} strokeWidth={2.4} />
                        </LinearGradient>
                        <Text style={{ fontFamily: F.bold, fontSize: 21, color: C.ink }}>¡Todo listo por hoy!</Text>
                        <Text style={{ fontFamily: F.med, fontSize: 15, color: C.ink3, marginTop: 9, textAlign: 'center', lineHeight: 21 }}>
                            No te queda nada pendiente. Tocá el botón + si surge algo nuevo.
                        </Text>
                    </View>
                )}

                {!loading && done.length > 0 && (
                    <View style={{ marginTop: pending.length > 0 ? 26 : 34 }}>
                        <Text style={[sectionLabel, { paddingHorizontal: 6, paddingBottom: 12 }]}>Completadas</Text>
                        {done.map((t) => (
                            <DoneRow key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} />
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* FAB */}
            <Pressable
                onPress={onAdd}
                style={({ pressed }) => ({ position: 'absolute', right: 20, bottom: 28 + insets.bottom, transform: [{ scale: pressed ? 0.95 : 1 }] })}
            >
                <LinearGradient colors={GRAD_FAB} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={{ height: 58, paddingLeft: 18, paddingRight: 22, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 9, ...shadowFab }}>
                    <Plus size={22} color="#fff" strokeWidth={2.8} />
                    <Text style={{ fontFamily: F.semi, fontSize: 16, color: '#fff', letterSpacing: 0.2 }}>Agregar</Text>
                </LinearGradient>
            </Pressable>
        </View>
    );
}

function RoundBtn({ onPress, children }) {
    return (
        <Pressable onPress={onPress} style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, backgroundColor: pressed ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' })}>
            {children}
        </Pressable>
    );
}

function PendingRow({ task, onToggle, onSnooze, onDelete }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: C.surface, borderRadius: R.lg, paddingVertical: 15, paddingLeft: 16, paddingRight: 14, marginBottom: 11, ...shadowCard }}>
            <Pressable onPress={() => onToggle(task)} hitSlop={8} style={({ pressed }) => ({ width: 28, height: 28, borderRadius: 14, borderWidth: 2.5, borderColor: C.circle, transform: [{ scale: pressed ? 0.85 : 1 }] })} />
            <Text style={{ flex: 1, fontFamily: F.med, fontSize: 16, lineHeight: 22, color: C.ink }}>{task.text}</Text>
            <Pressable onPress={() => onSnooze(task)} hitSlop={6} style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 11, backgroundColor: pressed ? '#E5EAF2' : C.inputBg, alignItems: 'center', justifyContent: 'center' })}>
                <Clock3 size={19} color={C.ink2} strokeWidth={1.8} />
            </Pressable>
            <Pressable onPress={() => onDelete(task)} hitSlop={6} style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 11, backgroundColor: pressed ? C.dangerTintPress : C.dangerTint, alignItems: 'center', justifyContent: 'center' })}>
                <Trash2 size={19} color={C.danger} strokeWidth={1.8} />
            </Pressable>
        </View>
    );
}

function DoneRow({ task, onToggle, onDelete }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: C.surfaceMuted, borderRadius: R.lg, paddingVertical: 14, paddingLeft: 16, paddingRight: 14, marginBottom: 10 }}>
            <Pressable onPress={() => onToggle(task)} hitSlop={8} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Check size={15} color="#fff" strokeWidth={2.6} />
            </Pressable>
            <Text style={{ flex: 1, fontFamily: F.reg, fontSize: 16, lineHeight: 22, color: '#9AA3B5', textDecorationLine: 'line-through' }}>{task.text}</Text>
            <Pressable onPress={() => onDelete(task)} hitSlop={6} style={{ width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={18} color="#AFB7C6" strokeWidth={1.8} />
            </Pressable>
        </View>
    );
}

function SkeletonList() {
    const op = useRef(new Animated.Value(0.5)).current;
    useEffect(() => {
        const loop = Animated.loop(Animated.sequence([
            Animated.timing(op, { toValue: 1, duration: 650, useNativeDriver: true }),
            Animated.timing(op, { toValue: 0.5, duration: 650, useNativeDriver: true }),
        ]));
        loop.start();
        return () => loop.stop();
    }, [op]);
    return (
        <Animated.View style={{ opacity: op }}>
            <View style={{ height: 13, width: 110, borderRadius: 7, backgroundColor: '#DDE3EE', marginLeft: 6, marginBottom: 16 }} />
            {[0, 1, 2, 3].map((i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: C.surface, borderRadius: R.lg, paddingVertical: 19, paddingHorizontal: 16, marginBottom: 11, ...shadowCard }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#E3E8F1' }} />
                    <View style={{ flex: 1 }}>
                        <View style={{ height: 12, borderRadius: 6, backgroundColor: '#E8ECF3', width: i % 2 ? '64%' : '88%' }} />
                    </View>
                </View>
            ))}
        </Animated.View>
    );
}

const sectionLabel = { fontFamily: F.semi, fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase', color: C.muted };
