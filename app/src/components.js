import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { C, F } from './theme';

// Isotipo de marca: anillo abierto + check (del sistema de marca de Claude Design).
export function Isotipo({ size = 40, color = C.accent, stroke = 9 }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Path d="M50 8 a42 42 0 1 1 -29.7 12.3" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
            <Path d="M34 51l12 12 24-27" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

// Logo horizontal: isotipo + "Recordatorio Tareas".
export function Logo({ size = 46, color = C.inkStrong, accent = C.accent }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
            <Isotipo size={size} color={accent} />
            <View>
                <Text style={{ fontFamily: F.bold, fontSize: size * 0.42, color, letterSpacing: -0.5, lineHeight: size * 0.46 }}>
                    Recordatorio
                </Text>
                <Text style={{ fontFamily: F.med, fontSize: size * 0.42, color: accent, letterSpacing: -0.3, lineHeight: size * 0.5 }}>
                    Tareas
                </Text>
            </View>
        </View>
    );
}

// Anillo de progreso (porcentaje completado). El contenido va centrado encima.
export function Ring({ size = 78, stroke = 7, pct = 0, color = '#fff', track = 'rgba(255,255,255,0.20)', children }) {
    const r = size / 2 - stroke;
    const circ = 2 * Math.PI * r;
    const clamped = Math.max(0, Math.min(100, pct));
    const offset = circ * (1 - clamped / 100);
    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
                <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
                <Circle
                    cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                    strokeLinecap="round" strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset}
                />
            </Svg>
            <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
                {children}
            </View>
        </View>
    );
}
