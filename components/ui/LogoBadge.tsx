import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Radius } from '@/constants/theme';

interface LogoBadgeProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
}

export const LogoBadge: React.FC<LogoBadgeProps> = ({
  size = 'md',
  showText = true,
  textColor = Colors.textPrimary,
}) => {
  const iconSizes = { sm: 20, md: 28, lg: 36, xl: 48 };
  const containerSizes = { sm: 44, md: 60, lg: 80, xl: 100 };
  const titleSizes = { sm: 18, md: 22, lg: 28, xl: 36 };
  const radius = { sm: 12, md: 16, lg: 22, xl: 28 };

  const iconSize = iconSizes[size];
  const containerSize = containerSizes[size];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#00FF88', '#00D4AA', '#00BFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.iconContainer,
          { width: containerSize, height: containerSize, borderRadius: radius[size] },
        ]}
      >
        <MaterialCommunityIcons
          name="stadium-variant"
          size={iconSize}
          color="#080C10"
        />
      </LinearGradient>
      {showText && (
        <View style={styles.textGroup}>
          <Text style={[styles.title, { fontSize: titleSizes[size], color: textColor }]}>
            Play<Text style={styles.titleAccent}>Arena</Text>
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  textGroup: {
    flexDirection: 'column',
  },
  title: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  titleAccent: {
    color: Colors.neonGreen,
  },
});
