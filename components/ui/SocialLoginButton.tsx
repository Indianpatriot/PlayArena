import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet, Animated, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Radius, Spacing } from '@/constants/theme';

interface SocialLoginButtonProps {
  provider: 'google' | 'apple';
  onPress: () => void;
}

export const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
  provider,
  onPress,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
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

  const config = {
    google: {
      icon: 'google' as const,
      label: 'Google',
      iconColor: '#EA4335',
      borderColor: 'rgba(234,67,53,0.3)',
      bg: 'rgba(234,67,53,0.06)',
    },
    apple: {
      icon: 'apple' as const,
      label: 'Apple',
      iconColor: '#FFFFFF',
      borderColor: 'rgba(255,255,255,0.2)',
      bg: 'rgba(255,255,255,0.06)',
    },
  };

  const cfg = config[provider];

  return (
    <Animated.View style={[{ transform: [{ scale }] }, styles.wrapper]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          styles.button,
          { backgroundColor: cfg.bg, borderColor: cfg.borderColor },
        ]}
        hitSlop={4}
      >
        <MaterialCommunityIcons
          name={cfg.icon}
          size={22}
          color={cfg.iconColor}
        />
        <Text style={styles.label}>Continue with {cfg.label}</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 10,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '600',
  },
});
