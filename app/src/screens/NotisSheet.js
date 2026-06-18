import React from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Check } from 'lucide-react-native';
import { C, F, R } from '../theme';

// Panel de notificaciones (lista de recordatorios recibidos del servidor).
export function NotisSheet({ visible, onClose, items, onMarkAllRead }) {
    const insets = useSafeAreaInsets();
    const list = items || [];
    const hasUnread = list.some((n) => !n.read_at);
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                <Pressable style={{ position: 'absolute', inset: 0, backgroundColor: C.overlay }} onPress={onClose} />
                <View style={{ backgroundColor: C.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 30 + insets.bottom, maxHeight: '78%' }}>
                    <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: C.bgTint2, alignSelf: 'center', marginBottom: 18 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <Text style={{ fontFamily: F.bold, fontSize: 22, color: C.ink, letterSpacing: -0.3 }}>Notificaciones</Text>
                        {hasUnread && (
                            <Pressable onPress={onMarkAllRead}>
                                <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.accent }}>Marcar leídas</Text>
                            </Pressable>
                        )}
                    </View>

                    {list.length === 0 ? (
                        <View style={{ alignItems: 'center', paddingVertical: 44 }}>
                            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.iconBg, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                                <Bell size={28} color={C.accent} strokeWidth={1.7} />
                            </View>
                            <Text style={{ fontFamily: F.semi, fontSize: 16, color: C.ink }}>No tenés notificaciones</Text>
                            <Text style={{ fontFamily: F.med, fontSize: 13.5, color: C.ink3, marginTop: 5 }}>Te avisamos cuando tengas pendientes.</Text>
                        </View>
                    ) : (
                        <ScrollView>
                            {list.map((n) => (
                                <View key={n.id} style={{ flexDirection: 'row', gap: 12, paddingVertical: 13, borderTopWidth: 1, borderTopColor: C.hairline }}>
                                    <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: n.read_at ? C.surfaceMuted : C.iconBg, alignItems: 'center', justifyContent: 'center' }}>
                                        <Bell size={18} color={n.read_at ? C.muted : C.accent} strokeWidth={1.7} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontFamily: F.semi, fontSize: 15, color: C.ink }}>{n.title || 'Recordatorio'}</Text>
                                        {!!n.body && <Text style={{ fontFamily: F.reg, fontSize: 13.5, color: C.ink2, marginTop: 2, lineHeight: 19 }}>{n.body}</Text>}
                                    </View>
                                    {!n.read_at && <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: C.accent, marginTop: 4 }} />}
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
}
