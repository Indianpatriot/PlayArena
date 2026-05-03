// PlayArena — Player Login Screen
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
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { NeonButton, InputField, SocialLoginButton } from '@/components';
import { useAlert } from '@/template';
import { AuthService } from '@/services/auth';
import { useAuth } from '@/hooks/useAuth';

export default function PlayerLoginScreen() {
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
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(formY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10, delay: 200 }),
      Animated.timing(formOpacity, { toValue: 1, duration: 500, useNativeDriver: true, delay: 200 }),
    ]).start();

    // Glow pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required';
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
      const user = await AuthService.login({ email, password }, 'player');
      setUser(user);
      router.replace('/dashboard');
    } catch (err: any) {
      showAlert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider: 'google' | 'apple') => {
    setLoading(true);
    try {
      const user = await AuthService.socialLogin(provider);
      setUser(user);
      router.replace('/dashboard');
    } catch (err: any) {
      showAlert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#0A1A0F', '#080C10', '#080C10']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative glow elements */}
      <Animated.View
        style={[styles.glowCircle, styles.glowTop, { transform: [{ scale: pulseAnim }] }]}
      />
      <View style={styles.turfLines}>
        {[...Array(6)].map((_, i) => (
          <View key={i} style={[styles.turfLine, { opacity: 0.04 + i * 0.01 }]} />
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
            <View style={styles.playerBadge}>
              <LinearGradient
                colors={['#00FF88', '#00D4AA']}
                style={styles.badgeGradient}
              >
                <MaterialCommunityIcons name="run-fast" size={22} color="#080C10" />
              </LinearGradient>
            </View>
            <Text style={styles.heading}>Player Login</Text>
            <Text style={styles.subheading}>Ready to hit the field? Sign in to book your game.</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            style={[
              styles.formCard,
              { opacity: formOpacity, transform: [{ translateY: formY }] },
            ]}
          >
            {/* Social Login */}
            <View style={styles.socialRow}>
              <SocialLoginButton provider="google" onPress={() => handleSocial('google')} />
              <SocialLoginButton provider="apple" onPress={() => handleSocial('apple')} />
            </View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with email</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Inputs */}
            <InputField
              label="Email / Phone"
              icon="alternate-email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              placeholder="your@email.com"
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

            {/* Forgot Password */}
            <Pressable
              style={styles.forgotWrap}
              onPress={() => router.push({ pathname: '/forgot-password', params: { email } })}
              hitSlop={8}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </Pressable>

            {/* Login CTA */}
            <NeonButton
              title="Sign In to Play"
              onPress={handleLogin}
              loading={loading}
              variant="primary"
            />

            {/* Signup Link */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>New player? </Text>
              <Pressable onPress={() => router.push('/signup')} hitSlop={8}>
                <Text style={styles.signupLink}>Create account</Text>
              </Pressable>
            </View>

            {/* Ground Owner Link */}
            <View style={styles.ownerRow}>
              <View style={styles.ownerDivider} />
              <Text style={styles.ownerDividerText}>Are you a Ground Owner?</Text>
              <View style={styles.ownerDivider} />
            </View>
            <Pressable style={styles.ownerBtn} onPress={() => router.push('/owner-login')}>
              <MaterialCommunityIcons name="stadium-variant" size={16} color={Colors.electricBlue} />
              <Text style={styles.ownerBtnText}>Ground Owner Login</Text>
              <MaterialIcons name="arrow-forward-ios" size={12} color={Colors.electricBlue} />
            </Pressable>
          </Animated.View>

          {/* Bottom security note */}
          <View style={styles.securityRow}>
            <MaterialIcons name="verified-user" size={12} color={Colors.textMuted} />
            <Text style={styles.securityText}>SSL Secured · Your data is safe</Text>
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
  glowCircle: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(0,255,136,0.08)',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 60,
    elevation: 0,
  },
  glowTop: {
    top: -80,
    right: -60,
  },
  turfLines: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    gap: 30,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  turfLine: {
    height: 1.5,
    backgroundColor: Colors.neonGreen,
    marginHorizontal: -20,
    transform: [{ scaleX: 1.2 }],
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
  playerBadge: {
    alignSelf: 'flex-start',
  },
  badgeGradient: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
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
  formCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    gap: 0,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.md,
    marginTop: -Spacing.sm,
  },
  forgotText: {
    color: Colors.neonGreen,
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
    color: Colors.neonGreen,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.xs,
  },
  ownerDivider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  ownerDividerText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  ownerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0,191,255,0.3)',
    backgroundColor: 'rgba(0,191,255,0.06)',
    marginBottom: Spacing.xs,
  },
  ownerBtnText: {
    color: Colors.electricBlue,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  securityText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
  },
});
