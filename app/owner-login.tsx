// PlayArena — Ground Owner Login Screen
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { NeonButton, InputField, GlassCard } from '@/components';
import { useAlert } from '@/template';
import { AuthService } from '@/services/auth';
import { useAuth } from '@/hooks/useAuth';

export default function OwnerLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { setUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const formY = useRef(new Animated.Value(30)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const statsY = useRef(new Animated.Value(20)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(formY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10, delay: 200 }),
      Animated.timing(formOpacity, { toValue: 1, duration: 500, useNativeDriver: true, delay: 200 }),
      Animated.spring(statsY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10, delay: 400 }),
      Animated.timing(statsOpacity, { toValue: 1, duration: 500, useNativeDriver: true, delay: 400 }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1.3, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Business email is required';
    else if (!email.includes('@')) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Minimum 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await AuthService.login({ email, password }, 'owner');
      setUser(user);
      router.replace('/dashboard');
    } catch (err: any) {
      if (err.code === 'account_not_found') {
        showAlert('Account Not Found', err.message, [
          { text: 'Register Venue', onPress: () => router.push('/signup') },
          { text: 'Try Again', style: 'cancel' },
        ]);
      } else {
        showAlert('Login Failed', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0F1A', '#080C10', '#080C10']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Blue glow top right */}
      <Animated.View
        style={[styles.glowBlue, { transform: [{ scale: glowPulse }] }]}
      />
      <View style={styles.gridOverlay}>
        {[...Array(8)].map((_, i) => (
          <View key={i} style={styles.gridLine} />
        ))}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <Animated.View style={{ opacity: headerOpacity }}>
            <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
              <MaterialIcons name="arrow-back-ios" size={18} color={Colors.textPrimary} />
            </Pressable>
          </Animated.View>

          {/* Header */}
          <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
            <View style={styles.ownerBadge}>
              <LinearGradient
                colors={['#00BFFF', '#0080CC']}
                style={styles.badgeGradient}
              >
                <MaterialCommunityIcons name="stadium-variant" size={22} color="#FFF" />
              </LinearGradient>
              <View style={styles.ownerBadgeLabel}>
                <Text style={styles.ownerBadgeLabelText}>GROUND OWNER</Text>
              </View>
            </View>
            <Text style={styles.heading}>Owner Dashboard</Text>
            <Text style={styles.subheading}>
              Manage your turf bookings efficiently. Access analytics, scheduling, and revenue tools.
            </Text>
          </Animated.View>

          {/* Analytics Preview Card */}
          <Animated.View
            style={{ opacity: statsOpacity, transform: [{ translateY: statsY }] }}
          >
            <GlassCard variant="blue" padding={16}>
              <View style={styles.analyticsHeader}>
                <MaterialCommunityIcons name="chart-line" size={16} color={Colors.electricBlue} />
                <Text style={styles.analyticsTitle}>Dashboard Preview</Text>
                <View style={styles.liveChip}>
                  <Text style={styles.liveChipText}>LIVE DATA</Text>
                </View>
              </View>
              <View style={styles.statsGrid}>
                {[
                  { label: 'Bookings Today', value: '24', trend: '+12%' },
                  { label: 'Revenue', value: '₹18.4K', trend: '+8%' },
                  { label: 'Slots Free', value: '6', trend: '' },
                  { label: 'Rating', value: '4.8★', trend: '' },
                ].map((stat, i) => (
                  <View key={i} style={styles.statItem}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                    {stat.trend ? (
                      <Text style={styles.statTrend}>{stat.trend}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
              {/* Mock bar chart */}
              <View style={styles.barChart}>
                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                  <View key={i} style={styles.barWrap}>
                    <LinearGradient
                      colors={['#00BFFF', '#0060AA']}
                      style={[styles.bar, { height: (h / 100) * 48 }]}
                    />
                  </View>
                ))}
              </View>
              <Text style={styles.chartLabel}>Weekly booking performance</Text>
            </GlassCard>
          </Animated.View>

          {/* Form */}
          <Animated.View
            style={[
              styles.formCard,
              { opacity: formOpacity, transform: [{ translateY: formY }] },
            ]}
          >
            <Text style={styles.formTitle}>Business Account Login</Text>

            <InputField
              label="Business Email"
              icon="business"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              placeholder="owner@yourvenue.com"
              keyboardType="email-address"
            />
            <InputField
              label="Password"
              icon="lock-outline"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              placeholder="Enter your password"
              isPassword
            />

            <Pressable
              style={styles.forgotWrap}
              onPress={() => router.push({ pathname: '/forgot-password', params: { email } })}
              hitSlop={8}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </Pressable>

            <NeonButton
              title="Access Owner Dashboard"
              onPress={handleLogin}
              loading={loading}
              variant="secondary"
              icon={<MaterialCommunityIcons name="shield-check" size={18} color={Colors.electricBlue} />}
            />

            <View style={styles.signupRow}>
              <Text style={styles.signupText}>No owner account? </Text>
              <Pressable onPress={() => router.push('/signup')} hitSlop={8}>
                <Text style={[styles.signupLink, { color: Colors.electricBlue }]}>Register venue</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Trust Badges */}
          <View style={styles.trustRow}>
            {[
              { icon: 'verified-user', text: 'Verified' },
              { icon: 'lock', text: 'Encrypted' },
              { icon: 'support-agent', text: '24/7 Support' },
            ].map((t, i) => (
              <View key={i} style={styles.trustItem}>
                <MaterialIcons name={t.icon as any} size={14} color={Colors.textMuted} />
                <Text style={styles.trustText}>{t.text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  glowBlue: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(0,191,255,0.07)',
    shadowColor: '#00BFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 60,
    top: -100,
    left: -60,
    elevation: 0,
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    opacity: 0.04,
  },
  gridLine: {
    height: 1,
    backgroundColor: Colors.electricBlue,
    marginHorizontal: 0,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    gap: Spacing.sm,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badgeGradient: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00BFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  ownerBadgeLabel: {
    backgroundColor: 'rgba(0,191,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0,191,255,0.3)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ownerBadgeLabelText: {
    color: Colors.electricBlue,
    fontSize: Typography.fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heading: {
    fontSize: Typography.fontSizes.xxxl,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: Spacing.xs,
  },
  subheading: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.fontSizes.sm * 1.6,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  analyticsTitle: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '600',
  },
  liveChip: {
    backgroundColor: 'rgba(0,191,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0,191,255,0.3)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  liveChipText: {
    color: Colors.electricBlue,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  statItem: {
    width: '47%',
    backgroundColor: 'rgba(0,191,255,0.06)',
    borderRadius: Radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,191,255,0.12)',
  },
  statValue: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statTrend: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.neonGreen,
    fontWeight: '600',
    marginTop: 2,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 56,
    gap: 6,
    marginBottom: 4,
  },
  barWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 56,
  },
  bar: {
    width: '100%',
    borderRadius: 3,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,191,255,0.15)',
    shadowColor: '#00BFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  formTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.md,
    marginTop: -Spacing.sm,
  },
  forgotText: {
    color: Colors.electricBlue,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '600',
  },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  signupText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.sm,
  },
  signupLink: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
  },
});
