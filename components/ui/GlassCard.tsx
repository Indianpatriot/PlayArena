import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'neon' | 'blue';
  padding?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 20,
}) => {
  const borderColors = {
    default: Colors.bgGlassBorder,
    neon: 'rgba(0,255,136,0.3)',
    blue: 'rgba(0,191,255,0.3)',
  };

  const gradientColors = {
    default: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'] as [string, string],
    neon: ['rgba(0,255,136,0.1)', 'rgba(0,255,136,0.02)'] as [string, string],
    blue: ['rgba(0,191,255,0.1)', 'rgba(0,191,255,0.02)'] as [string, string],
  };

  return (
    <View
      style={[
        styles.card,
        { borderColor: borderColors[variant] },
        style,
      ]}
    >
      <LinearGradient
        colors={gradientColors[variant]}
        style={[styles.gradient, { padding }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {children}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  gradient: {
    width: '100%',
  },
});
