// PlayArena — Forgot Password Screen (OTP Flow)
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { NeonButton, InputField } from '@/components';
import { useAlert } from '@/template';
import { AuthService } from '@/services/auth';

type Step = 'email' | 'otp' | 'newPassword' | 'success';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const params = useLocalSearchParams<{ email?: string }>();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(params.email ?? '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resendTimer, setResendTimer] = useState(0);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(20)).current;
  const otpRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(contentY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
    ]).start();
  }, [step]);

  // Resend OTP countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const animateTransition = useCallback((cb: () => void) => {
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(contentY, { toValue: 10, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      contentY.setValue(20);
      cb();
    });
  }, [contentOpacity, contentY]);

  // ── Step 1: Send OTP ───────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }
    if (!email.includes('@')) {
      setErrors({ email: 'Enter a valid email address' });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await AuthService.forgotPassword(email.trim());
      animateTransition(() => {
        setStep('otp');
        setResendTimer(RESEND_COOLDOWN);
      });
    } catch (err: any) {
      showAlert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ─────────────────────────────────────────────────────
  const handleOTPChange = (val: string, idx: number) => {
    const cleaned = val.replace(/[^0-9]/g, '').slice(0, 1);
    const next = [...otp];
    next[idx] = cleaned;
    setOtp(next);
    if (cleaned && idx < OTP_LENGTH - 1) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOTPKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setErrors({ otp: 'Enter the complete 6-digit OTP' });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await AuthService.verifyOTP(email, code);
      animateTransition(() => setStep('newPassword'));
    } catch (err: any) {
      showAlert('Invalid OTP', err.message);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await AuthService.forgotPassword(email);
      setOtp(['', '', '', '', '', '']);
      setResendTimer(RESEND_COOLDOWN);
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      showAlert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Reset Password ─────────────────────────────────────────────────
  const handleResetPassword = async () => {
    const errs: Record<string, string> = {};
    if (!newPassword) errs.newPassword = 'Password is required';
    else if (newPassword.length < 8) errs.newPassword = 'Minimum 8 characters';
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await AuthService.resetPassword(email, otp.join(''), newPassword);
      animateTransition(() => setStep('success'));
    } catch (err: any) {
      showAlert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step metadata ──────────────────────────────────────────────────────────
  const stepMeta = {
    email: { title: 'Forgot Password', subtitle: 'Enter your registered email to receive an OTP.' },
    otp: { title: 'Verify OTP', subtitle: `A 6-digit code was sent to\n${email}` },
    newPassword: { title: 'New Password', subtitle: 'Create a strong new password for your account.' },
    success: { title: 'Password Reset!', subtitle: 'Your password has been reset successfully.' },
  };

  const meta = stepMeta[step];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A1A0F', '#080C10', '#080C10']} style={StyleSheet.absoluteFillObject} />
      <View style={styles.glowCircle} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <Pressable style={styles.backBtn} onPress={() => (step === 'email' ? router.back() : animateTransition(() => {
            if (step === 'otp') setStep('email');
            else if (step === 'newPassword') setStep('otp');
            else router.back();
          }))} hitSlop={12}>
            <MaterialIcons name="arrow-back-ios" size={18} color={Colors.textPrimary} />
          </Pressable>

          {/* Progress dots */}
          {step !== 'success' && (
            <View style={styles.progressDots}>
              {(['email', 'otp', 'newPassword'] as Step[]).map((s, i) => {
                const stepIdx = ['email', 'otp', 'newPassword'].indexOf(step);
                const done = i < stepIdx;
                const active = s === step;
                return (
                  <View key={s} style={[styles.dot, active && styles.dotActive, done && styles.dotDone]} />
                );
              })}
            </View>
          )}

          <Animated.View style={[styles.animContainer, { opacity: contentOpacity, transform: [{ translateY: contentY }] }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.iconBadge, step === 'success' && styles.iconBadgeSuccess]}>
                <LinearGradient
                  colors={step === 'success' ? ['#00FF88', '#00CC6A'] : ['#1A2A1F', '#111820']}
                  style={styles.iconBadgeGrad}
                >
                  <MaterialIcons
                    name={step === 'email' ? 'email' : step === 'otp' ? 'sms' : step === 'newPassword' ? 'lock-reset' : 'check-circle'}
                    size={28}
                    color={step === 'success' ? '#080C10' : Colors.neonGreen}
                  />
                </LinearGradient>
              </View>
              <Text style={styles.title}>{meta.title}</Text>
              <Text style={styles.subtitle}>{meta.subtitle}</Text>
            </View>

            {/* ── Email Step ──────────────────────────────────────────────── */}
            {step === 'email' && (
              <View style={styles.card}>
                <InputField
                  label="Email Address"
                  icon="alternate-email"
                  value={email}
                  onChangeText={(v) => { setEmail(v); setErrors({}); }}
                  error={errors.email}
                  placeholder="your@email.com"
                  keyboardType="email-address"
                />
                <NeonButton title="Send OTP" onPress={handleSendOTP} loading={loading} variant="primary" />
                <Pressable style={styles.backToLogin} onPress={() => router.back()}>
                  <Text style={styles.backToLoginText}>Back to Login</Text>
                </Pressable>
              </View>
            )}

            {/* ── OTP Step ────────────────────────────────────────────────── */}
            {step === 'otp' && (
              <View style={styles.card}>
                <Text style={styles.otpLabel}>Enter 6-Digit OTP</Text>
                <View style={styles.otpRow}>
                  {otp.map((digit, idx) => (
                    <TextInput
                      key={idx}
                      ref={(r) => { otpRefs.current[idx] = r; }}
                      style={[styles.otpBox, digit && styles.otpBoxFilled, errors.otp ? styles.otpBoxError : null]}
                      value={digit}
                      onChangeText={(v) => handleOTPChange(v, idx)}
                      onKeyPress={(e) => handleOTPKeyPress(e, idx)}
                      keyboardType="numeric"
                      maxLength={1}
                      textAlign="center"
                      selectTextOnFocus
                      autoFocus={idx === 0}
                    />
                  ))}
                </View>
                {errors.otp ? <Text style={styles.errorText}>{errors.otp}</Text> : null}

                <NeonButton title="Verify OTP" onPress={handleVerifyOTP} loading={loading} variant="primary" />

                <Pressable
                  style={[styles.resendBtn, resendTimer > 0 && styles.resendBtnDisabled]}
                  onPress={handleResendOTP}
                  disabled={resendTimer > 0 || loading}
                >
                  <MaterialIcons name="refresh" size={14} color={resendTimer > 0 ? Colors.textMuted : Colors.neonGreen} />
                  <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* ── New Password Step ────────────────────────────────────────── */}
            {step === 'newPassword' && (
              <View style={styles.card}>
                <InputField
                  label="New Password"
                  icon="lock-outline"
                  value={newPassword}
                  onChangeText={(v) => { setNewPassword(v); setErrors((e) => ({ ...e, newPassword: '' })); }}
                  error={errors.newPassword}
                  placeholder="Min. 8 characters"
                  isPassword
                />
                <InputField
                  label="Confirm Password"
                  icon="lock-outline"
                  value={confirmPassword}
                  onChangeText={(v) => { setConfirmPassword(v); setErrors((e) => ({ ...e, confirmPassword: '' })); }}
                  error={errors.confirmPassword}
                  placeholder="Re-enter password"
                  isPassword
                />

                {/* Password strength hint */}
                {newPassword.length > 0 && (
                  <View style={styles.strengthRow}>
                    {[1, 2, 3, 4].map((i) => {
                      const len = newPassword.length;
                      const filled = i <= (len >= 12 ? 4 : len >= 10 ? 3 : len >= 8 ? 2 : len >= 6 ? 1 : 0);
                      const color = filled ? (len >= 12 ? Colors.neonGreen : len >= 8 ? '#FFB800' : Colors.error) : Colors.border;
                      return <View key={i} style={[styles.strengthBar, { backgroundColor: color }]} />;
                    })}
                    <Text style={styles.strengthLabel}>
                      {newPassword.length >= 12 ? 'Strong' : newPassword.length >= 8 ? 'Medium' : 'Weak'}
                    </Text>
                  </View>
                )}

                <NeonButton title="Reset Password" onPress={handleResetPassword} loading={loading} variant="primary" />
              </View>
            )}

            {/* ── Success Step ─────────────────────────────────────────────── */}
            {step === 'success' && (
              <View style={[styles.card, styles.successCard]}>
                <View style={styles.successIconWrap}>
                  <LinearGradient colors={['#00FF88', '#00CC6A']} style={styles.successIcon}>
                    <MaterialIcons name="check" size={36} color="#080C10" />
                  </LinearGradient>
                </View>
                <Text style={styles.successTitle}>All Done!</Text>
                <Text style={styles.successText}>
                  Your password has been reset. You can now log in with your new password.
                </Text>
                <NeonButton
                  title="Back to Login"
                  onPress={() => router.replace('/player-login')}
                  variant="primary"
                />
              </View>
            )}
          </Animated.View>
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
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0,255,136,0.06)',
    top: -60,
    right: -40,
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
  progressDots: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'flex-start',
    marginLeft: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.neonGreen,
  },
  dotDone: {
    backgroundColor: Colors.neonGreenDim,
  },
  animContainer: {
    gap: Spacing.lg,
  },
  header: {
    gap: Spacing.sm,
  },
  iconBadge: {
    alignSelf: 'flex-start',
  },
  iconBadgeSuccess: {},
  iconBadgeGrad: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.2)',
  },
  title: {
    fontSize: Typography.fontSizes.xxxl,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.fontSizes.sm * 1.6,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  backToLogin: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  backToLoginText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '600',
  },
  // OTP
  otpLabel: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.xl,
    fontWeight: '800',
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: Colors.neonGreen,
    backgroundColor: 'rgba(0,255,136,0.06)',
  },
  otpBoxError: {
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.fontSizes.xs,
    textAlign: 'center',
    fontWeight: '600',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.xs,
  },
  resendBtnDisabled: { opacity: 0.5 },
  resendText: {
    color: Colors.neonGreen,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: Colors.textMuted,
  },
  // Password strength
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -Spacing.xs,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    width: 42,
  },
  // Success
  successCard: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  successIconWrap: {
    marginTop: Spacing.md,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.neonGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  successTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: '900',
    color: Colors.neonGreen,
  },
  successText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.fontSizes.sm * 1.6,
  },
});
