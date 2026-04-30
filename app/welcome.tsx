// PlayArena — Welcome Screen
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { LogoBadge } from '@/components';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(40)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const card1Scale = useRef(new Animated.Value(0.9)).current;
  const card2Scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(heroOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(contentY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      ]),
      Animated.stagger(100, [
        Animated.spring(card1Scale, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }),
        Animated.spring(card2Scale, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Hero Image */}
      <Animated.View style={[styles.heroWrap, { opacity: heroOpacity }]}>
        <Image
          source={require('@/assets/images/welcome-hero.jpg')}
          style={styles.heroImage}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['rgba(8,12,16,0.1)', 'rgba(8,12,16,0.5)', 'rgba(8,12,16,0.98)']}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Sports Stats Strip */}
        <View style={[styles.statsStrip, { top: insets.top + 16 }]}>
          <LogoBadge size="sm" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>LIVE</Text>
            <View style={styles.liveDot} />
          </View>
        </View>

        {/* Floating Sport Tags */}
        <View style={styles.floatingTags}>
          {['⚽ Football', '🏏 Cricket', '🎾 Tennis', '🏀 Basketball'].map((tag, i) => (
            <View key={i} style={styles.sportTag}>
              <Text style={styles.sportTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            paddingBottom: insets.bottom + Spacing.xl,
            opacity: contentOpacity,
            transform: [{ translateY: contentY }],
          },
        ]}
      >
        <Text style={styles.heading}>
          Your Game,{'\n'}
          <Text style={styles.headingAccent}>Your Arena.</Text>
        </Text>
        <Text style={styles.subheading}>
          Find and book premium sports venues instantly
        </Text>

        {/* Role Cards */}
        <View style={styles.cardsRow}>
          {/* Player Card */}
          <Animated.View style={[styles.cardWrap, { transform: [{ scale: card1Scale }] }]}>
            <RoleCard
              icon="run-fast"
              label="Player"
              description="Browse & book"
              gradient={['#00FF88', '#00D4AA']}
              onPress={() => router.push('/player-login')}
            />
          </Animated.View>

          {/* Owner Card */}
          <Animated.View style={[styles.cardWrap, { transform: [{ scale: card2Scale }] }]}>
            <RoleCard
              icon="stadium-variant"
              label="Ground Owner"
              description="Manage & earn"
              gradient={['#00BFFF', '#0080CC']}
              onPress={() => router.push('/owner-login')}
            />
          </Animated.View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerStat}>
            <Text style={styles.footerStatNum}>1,200+</Text>
            <Text style={styles.footerStatLabel}>Venues</Text>
          </View>
          <View style={styles.footerDivider} />
          <View style={styles.footerStat}>
            <Text style={styles.footerStatNum}>50K+</Text>
            <Text style={styles.footerStatLabel}>Players</Text>
          </View>
          <View style={styles.footerDivider} />
          <View style={styles.footerStat}>
            <Text style={styles.footerStatNum}>15+</Text>
            <Text style={styles.footerStatLabel}>Sports</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

interface RoleCardProps {
  icon: string;
  label: string;
  description: string;
  gradient: string[];
  onPress: () => void;
}

function RoleCard({ icon, label, description, gradient, onPress }: RoleCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, tension: 300, friction: 10 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.roleCard}
      >
        <LinearGradient
          colors={[gradient[0] + '22', gradient[1] + '08']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.roleIconWrap, { backgroundColor: gradient[0] + '22' }]}>
          <LinearGradient
            colors={gradient as [string, string]}
            style={styles.roleIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name={icon as any} size={28} color="#080C10" />
          </LinearGradient>
        </View>
        <Text style={styles.roleLabel}>{label}</Text>
        <Text style={styles.roleDescription}>{description}</Text>
        <View style={styles.roleArrow}>
          <MaterialIcons name="arrow-forward" size={16} color={gradient[0]} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  heroWrap: {
    height: height * 0.52,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  statsStrip: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,71,87,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,71,87,0.5)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#FF4757',
    fontSize: Typography.fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF4757',
  },
  floatingTags: {
    position: 'absolute',
    bottom: 60,
    left: Spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportTag: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sportTagText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.xs,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  heading: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: Typography.fontSizes.xxl * 1.2,
  },
  headingAccent: {
    color: Colors.neonGreen,
  },
  subheading: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 6,
    marginBottom: Spacing.lg,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  cardWrap: {
    flex: 1,
  },
  roleCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
    backgroundColor: Colors.bgCard,
    padding: Spacing.md,
    minHeight: 160,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  roleIconWrap: {
    alignSelf: 'flex-start',
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
  },
  roleIconGradient: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleLabel: {
    fontSize: Typography.fontSizes.base,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  roleDescription: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  roleArrow: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.lg,
  },
  footerStat: {
    alignItems: 'center',
  },
  footerStatNum: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  footerStatLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  footerDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
});
