import { View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { C } from './theme';

export function Isotipo({ size = 40, color = C.accent, stroke = 9 }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Path d="M50 8 a42 42 0 1 1 -29.7 12.3" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
            <Path d="M34 51l12 12 24-27" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

export function Ring({ size = 78, stroke = 7, pct = 0, color = '#fff', track = 'rgba(255,255,255,0.20)', children }) {
    const radius = size / 2 - stroke;
    const circumference = 2 * Math.PI * radius;
    const clamped = Math.max(0, Math.min(100, pct));
    const offset = circumference * (1 - clamped / 100);
    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
                <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
                <Circle
                    cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
                    strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={offset}
                />
            </Svg>
            <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
                {children}
            </View>
        </View>
    );
}
