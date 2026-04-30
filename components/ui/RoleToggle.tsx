import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Radius, Spacing } from '@/constants/theme';

interface RoleToggleProps {
  value: 'player' | 'owner';
  onChange: (role: 'player' | 'owner') => void;
}

export const RoleToggle: React.FC<RoleToggleProps> = ({ value, onChange }) => {
  const slideAnim = useRef(new Animated.Value(value === 'player' ? 0 : 1)).current;

  const onSelect = (role: 'player' | 'owner') => {
    Animated.spring(slideAnim, {
      toValue: role === 'player' ? 0 : 1,
      useNativeDriver: false,
      tension: 200,
      friction: 15,
    }).start();
    onChange(role);
  };

  const indicatorLeft = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['2%', '50%'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.indicator, { left: indicatorLeft }]}>
        <LinearGradient
          colors={['#00FF88', '#00BFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Pressable style={styles.tab} onPress={() => onSelect('player')} hitSlop={4}>
        <Text style={[styles.tabText, value === 'player' && styles.tabTextActive]}>
          Player
        </Text>
      </Pressable>

      <Pressable style={styles.tab} onPress={() => onSelect('owner')} hitSlop={4}>
        <Text style={[styles.tabText, value === 'owner' && styles.tabTextActive]}>
          Ground Owner
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.full,
    height: 48,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    width: '48%',
    height: '100%',
    borderRadius: Radius.full,
    overflow: 'hidden',
    top: 3,
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: '#080C10',
  },
});
