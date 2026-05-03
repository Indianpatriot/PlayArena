// PlayArena — Splash Screen
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { LogoBadge } from '@/components';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(20)).current;
  const dotScale1 = useRef(new Animated.Value(0)).current;
  const dotScale2 = useRef(new Animated.Value(0)).current;
  const dotScale3 = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    StatusBar.setBarStyle('light-content');

    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(taglineY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 120,
          friction: 10,
        }),
      ]),
      Animated.delay(300),
      Animated.stagger(150, [
        Animated.spring(dotScale1, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
        Animated.spring(dotScale2, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
        Animated.spring(dotScale3, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
      ]),
    ]).start();

    const timer = setTimeout(() => {
      router.replace('/player-login');
    }, 3200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background Image */}
      <Image
        source={require('@/assets/images/splash-bg.jpg')}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={0}
      />

      {/* Dark Overlay */}
      <LinearGradient
        colors={['rgba(8,12,16,0.3)', 'rgba(8,12,16,0.65)', 'rgba(8,12,16,0.92)']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Neon Glow Blob */}
      <Animated.View style={[styles.glowBlob, { opacity: glowOpacity }]} />

      {/* Main Content */}
      <View style={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoWrap,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Animated.View style={[styles.logoGlow, { opacity: glowOpacity }]} />
          <LogoBadge size="xl" showText={false} />
        </Animated.View>

        {/* Brand Name */}
        <Animated.View style={{ opacity: logoOpacity, marginTop: Spacing.lg }}>
          <Text style={styles.brandText}>
            Play<Text style={styles.brandAccent}>Arena</Text>
          </Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View
          style={[
            styles.taglineWrap,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineY }],
            },
          ]}
        >
          <View style={styles.taglineDividerLeft} />
          <Text style={styles.tagline}>Book. Play. Compete.</Text>
          <View style={styles.taglineDividerRight} />
        </Animated.View>

        {/* Loading Dots */}
        <View style={styles.dotsRow}>
          {[dotScale1, dotScale2, dotScale3].map((dot, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                i === 1 && styles.dotMiddle,
                { transform: [{ scale: dot }] },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Bottom Tagline */}
      <Animated.View
        style={[
          styles.bottomTag,
          { paddingBottom: insets.bottom + 24, opacity: taglineOpacity },
        ]}
      >
        <Text style={styles.bottomText}>Powered by the sports community</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowBlob: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0,255,136,0.12)',
    top: height * 0.25,
    alignSelf: 'center',
    // Blur simulation via shadow
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 80,
    elevation: 0,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  logoWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0,255,136,0.15)',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 0,
  },
  brandText: {
    fontSize: 52,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -1.5,
    textAlign: 'center',
  },
  brandAccent: {
    color: Colors.neonGreen,
  },
  taglineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: -8,
  },
  taglineDividerLeft: {
    width: 32,
    height: 1,
    backgroundColor: Colors.neonGreen,
    opacity: 0.5,
  },
  taglineDividerRight: {
    width: 32,
    height: 1,
    backgroundColor: Colors.neonGreen,
    opacity: 0.5,
  },
  tagline: {
    fontSize: Typography.fontSizes.base,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
  },
  dotMiddle: {
    backgroundColor: Colors.neonGreen,
    width: 24,
    borderRadius: 4,
    shadowColor: Colors.neonGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  bottomTag: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  bottomText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
});
