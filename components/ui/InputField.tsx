import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  TextInputProps,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Radius, Spacing } from '@/constants/theme';

interface InputFieldProps extends TextInputProps {
  label: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  error?: string;
  rightElement?: React.ReactNode;
  isPassword?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  icon,
  error,
  rightElement,
  isPassword = false,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const [secureText, setSecureText] = useState(isPassword);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    props.onFocus?.({} as any);
  };

  const onBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    props.onBlur?.({} as any);
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? Colors.error : Colors.inputBorder,
      error ? Colors.error : Colors.inputBorderFocus,
    ],
  });

  const glowOpacity = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View
        style={[
          styles.inputWrapper,
          { borderColor },
        ]}
      >
        {icon ? (
          <MaterialIcons
            name={icon}
            size={20}
            color={focused ? Colors.neonGreen : Colors.textMuted}
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          {...props}
          style={[styles.input, icon ? styles.inputWithIcon : null]}
          placeholderTextColor={Colors.textMuted}
          onFocus={onFocus}
          onBlur={onBlur}
          secureTextEntry={secureText}
          autoCapitalize={props.autoCapitalize ?? 'none'}
          autoCorrect={props.autoCorrect ?? false}
        />

        {isPassword ? (
          <Pressable
            onPress={() => setSecureText(!secureText)}
            hitSlop={8}
            style={styles.rightIcon}
          >
            <MaterialIcons
              name={secureText ? 'visibility-off' : 'visibility'}
              size={20}
              color={Colors.textMuted}
            />
          </Pressable>
        ) : rightElement ? (
          <View style={styles.rightIcon}>{rightElement}</View>
        ) : null}

        {focused && !error && (
          <Animated.View
            style={[styles.glow, { opacity: glowOpacity }]}
            pointerEvents="none"
          />
        )}
      </Animated.View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderRadius: Radius.lg,
    height: 56,
    paddingHorizontal: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.base,
    fontWeight: '500',
    includeFontPadding: false,
  },
  inputWithIcon: {
    marginLeft: Spacing.sm,
  },
  leftIcon: {
    marginRight: 2,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
    padding: 4,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,255,136,0.04)',
    borderRadius: Radius.lg,
  },
  error: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
});
