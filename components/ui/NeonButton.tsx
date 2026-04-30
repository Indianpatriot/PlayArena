import React, { useRef } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Radius, Spacing } from '@/constants/theme';

interface NeonButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
  size = 'lg',
  icon,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const heights = { sm: 44, md: 50, lg: 58 };
  const fontSizes = { sm: 14, md: 15, lg: 16 };
  const height = heights[size];
  const fontSize = fontSizes[size];

  return (
    <Animated.View
      style={[
        styles.wrapper,
        fullWidth && styles.fullWidth,
        { transform: [{ scale }] },
        disabled && styles.disabled,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || loading}
        style={[styles.pressable]}
        hitSlop={8}
      >
        {variant === 'primary' && (
          <LinearGradient
            colors={['#00FF88', '#00D4AA', '#00BFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradient, { height }]}
          >
            {loading ? (
              <ActivityIndicator color="#080C10" size="small" />
            ) : (
              <View style={styles.innerRow}>
                {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
                <Text style={[styles.textPrimary, { fontSize }]}>{title}</Text>
              </View>
            )}
          </LinearGradient>
        )}

        {variant === 'secondary' && (
          <View style={[styles.secondaryContainer, { height }]}>
            <View style={styles.secondaryBg} />
            {loading ? (
              <ActivityIndicator color={Colors.electricBlue} size="small" />
            ) : (
              <View style={styles.innerRow}>
                {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
                <Text style={[styles.textSecondary, { fontSize }]}>{title}</Text>
              </View>
            )}
          </View>
        )}

        {variant === 'outline' && (
          <View
            style={[
              styles.outlineContainer,
              { height, borderColor: Colors.neonGreen },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={Colors.neonGreen} size="small" />
            ) : (
              <View style={styles.innerRow}>
                {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
                <Text style={[styles.textOutline, { fontSize }]}>{title}</Text>
              </View>
            )}
          </View>
        )}

        {variant === 'ghost' && (
          <View style={[styles.ghostContainer, { height }]}>
            {loading ? (
              <ActivityIndicator color={Colors.textSecondary} size="small" />
            ) : (
              <View style={styles.innerRow}>
                {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
                <Text style={[styles.textGhost, { fontSize }]}>{title}</Text>
              </View>
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  fullWidth: {
    width: '100%',
  },
  pressable: {
    width: '100%',
  },
  gradient: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  textPrimary: {
    color: '#080C10',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,191,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,191,255,0.4)',
  },
  secondaryBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.full,
  },
  textSecondary: {
    color: Colors.electricBlue,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  outlineContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  textOutline: {
    color: Colors.neonGreen,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  ghostContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  textGhost: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    marginRight: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
