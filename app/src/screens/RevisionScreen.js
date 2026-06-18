import React from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Check, Trash2, History } from 'lucide-react-native';
import { C, F, R, GRAD_HEADER, shadowHeader, shadowCard } from '../theme';

// Revisión obligatoria de inicio del día: por cada tarea que quedó pendiente de días anteriores,
// decidir Pasar a hoy / Hecha / Eliminar. No se puede cerrar hasta resolver todas.
export function RevisionScreen({ visible, tasks, onToday, onDone, onDelete, onAllToday }) {
    const count = tasks?.length || 0;
    return (
        <Modal visible={visible} animationType="slide" onRequestClose={() => {}}>
            <View style={{ flex: 1, backgroundColor: C.bg }}>
                <LinearGradient
                    colors={GRAD_HEADER} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={{ paddingTop: 54, paddingHorizontal: 24, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, ...shadowHeader }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                        <History size={18} color="rgba(255,255,255,0.85)" strokeWidth={1.9} />
                        <Text style={{ fontFamily: F.semi, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.82)' }}>
                            Inicio del día
                        </Text>
                    </View>
                    <Text style={{ fontFamily: F.bold, fontSize: 25, color: '#fff', letterSpacing: -0.4, marginTop: 14, lineHeight: 30 }}>
                        Quedaron tareas de ayer
                    </Text>
                    <Text style={{ fontFamily: F.med, fontSize: 15, color: 'rgba(255,255,255,0.82)', marginTop: 8, lineHeight: 21 }}>
                        Tenés {count} {count === 1 ? 'tarea' : 'tareas'} sin resolver. Decidí qué hacer con cada una para empezar el día.
                    </Text>
                </LinearGradient>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18, paddingBottom: 12 }}>
                    {tasks?.map((t) => (
                        <View key={t.id} style={{ backgroundColor: C.surface, borderRadius: R.lg, padding: 17, marginBottom: 13, ...shadowCard }}>
                            <Text style={{ fontFamily: F.med, fontSize: 16, color: C.ink, lineHeight: 22 }}>{t.text}</Text>
                            <View style={{ flexDirection: 'row', gap: 9, marginTop: 15 }}>
                                <Pressable
                                    onPress={() => onToday(t.id)}
                                    style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: C.accent, paddingVertical: 13, borderRadius: R.sm, transform: [{ scale: pressed ? 0.97 : 1 }] })}
                                >
                                    <ArrowRight size={18} color="#fff" strokeWidth={2} />
                                    <Text style={{ fontFamily: F.semi, fontSize: 15, color: '#fff' }}>Pasar a hoy</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => onDone(t.id)}
                                    style={({ pressed }) => ({ width: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? C.accentTintPress : C.accentTint, borderRadius: R.sm })}
                                >
                                    <Check size={20} color={C.accent} strokeWidth={2.2} />
                                </Pressable>
                                <Pressable
                                    onPress={() => onDelete(t.id)}
                                    style={({ pressed }) => ({ width: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? C.dangerTintPress : C.dangerTint, borderRadius: R.sm })}
                                >
                                    <Trash2 size={19} color={C.danger} strokeWidth={1.9} />
                                </Pressable>
                            </View>
                        </View>
                    ))}
                </ScrollView>

                <View style={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: 28, borderTopWidth: 1, borderTopColor: C.hairline2 }}>
                    <Pressable
                        onPress={onAllToday}
                        style={({ pressed }) => ({ backgroundColor: pressed ? C.accentTintPress : C.accentTint, paddingVertical: 16, borderRadius: R.md, alignItems: 'center' })}
                    >
                        <Text style={{ fontFamily: F.semi, fontSize: 16, color: C.accent }}>Pasar todas a hoy</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}
