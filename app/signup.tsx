// PlayArena — Shared Signup Screen
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
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { NeonButton, InputField, RoleToggle } from '@/components';
import { useAlert } from '@/template';
import { AuthService } from '@/services/auth';
import { useAuth } from '@/hooks/useAuth';

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { setUser } = useAuth();

  const [role, setRole] = useState<'player' | 'owner'>('player');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    turfName: '',
    location: '',
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const formY = useRef(new Animated.Value(30)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const ownerFieldsHeight = useRef(new Animated.Value(0)).current;
  const ownerFieldsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(formY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10, delay: 150 }),
      Animated.timing(formOpacity, { toValue: 1, duration: 500, useNativeDriver: true, delay: 150 }),
    ]).start();
  }, []);

  useEffect(() => {
    if (role === 'owner') {
      Animated.parallel([
        Animated.spring(ownerFieldsHeight, { toValue: 1, useNativeDriver: false, tension: 80, friction: 10 }),
        Animated.timing(ownerFieldsOpacity, { toValue: 1, duration: 300, useNativeDriver: false }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(ownerFieldsHeight, { toValue: 0, useNativeDriver: false, tension: 120, friction: 12 }),
        Animated.timing(ownerFieldsOpacity, { toValue: 0, duration: 200, useNativeDriver: false }),
      ]).start();
    }
  }, [role]);

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.includes('@')) e.email = 'Enter a valid email';
    if (!form.phone.trim() || form.phone.length < 8) e.phone = 'Enter a valid phone number';
    if (form.password.length < 8) e.password = 'Minimum 8 characters required';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (role === 'owner') {
      if (!form.turfName.trim()) e.turfName = 'Turf name is required';
      if (!form.location.trim()) e.location = 'Location is required';
    }
    if (!termsAccepted) e.terms = 'Please accept terms & conditions';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await AuthService.signup({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role,
        turfName: form.turfName,
        location: form.location,
      });
      setUser(user);
      router.replace('/dashboard');
    } catch (err: any) {
      showAlert('Signup Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const ownerFieldsMaxHeight = ownerFieldsHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 280],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0C0A14', '#080C10']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

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
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>CREATE ACCOUNT</Text>
            </View>
            <Text style={styles.heading}>Join the{'\n'}Arena</Text>
            <Text style={styles.subheading}>
              Set up your profile and start booking in minutes.
            </Text>
          </Animated.View>

          {/* Role Toggle */}
          <Animated.View style={{ opacity: formOpacity, transform: [{ translateY: formY }] }}>
            <Text style={styles.roleLabel}>I am a...</Text>
            <RoleToggle value={role} onChange={setRole} />
          </Animated.View>

          {/* Form */}
          <Animated.View
            style={[
              styles.formCard,
              { opacity: formOpacity, transform: [{ translateY: formY }] },
            ]}
          >
            {/* Common Fields */}
            <InputField
              label="Full Name"
              icon="person-outline"
              value={form.name}
              onChangeText={(v) => updateField('name', v)}
              error={errors.name}
              placeholder="Your full name"
              autoCapitalize="words"
            />
            <InputField
              label="Email Address"
              icon="alternate-email"
              value={form.email}
              onChangeText={(v) => updateField('email', v)}
              error={errors.email}
              placeholder="you@example.com"
              keyboardType="email-address"
            />
            <InputField
              label="Phone Number"
              icon="phone"
              value={form.phone}
              onChangeText={(v) => updateField('phone', v)}
              error={errors.phone}
              placeholder="+91 9876543210"
              keyboardType="phone-pad"
            />
            <InputField
              label="Password"
              icon="lock-outline"
              value={form.password}
              onChangeText={(v) => updateField('password', v)}
              error={errors.password}
              placeholder="Min. 8 characters"
              isPassword
            />
            <InputField
              label="Confirm Password"
              icon="lock-outline"
              value={form.confirmPassword}
              onChangeText={(v) => updateField('confirmPassword', v)}
              error={errors.confirmPassword}
              placeholder="Repeat your password"
              isPassword
            />

            {/* Owner-Only Fields (Animated) */}
            <Animated.View
              style={{ maxHeight: ownerFieldsMaxHeight, opacity: ownerFieldsOpacity, overflow: 'hidden' }}
            >
              <View style={styles.ownerSectionHeader}>
                <View style={styles.ownerSectionLine} />
                <Text style={styles.ownerSectionText}>Venue Details</Text>
                <View style={styles.ownerSectionLine} />
              </View>
              <InputField
                label="Turf / Venue Name"
                icon="stadium"
                value={form.turfName}
                onChangeText={(v) => updateField('turfName', v)}
                error={errors.turfName}
                placeholder="Green Turf Arena"
                autoCapitalize="words"
              />
              <InputField
                label="Location / City"
                icon="location-on"
                value={form.location}
                onChangeText={(v) => updateField('location', v)}
                error={errors.location}
                placeholder="Mumbai, Maharashtra"
                autoCapitalize="words"
              />
            </Animated.View>
          </Animated.View>

          {/* Terms & Conditions */}
          <Animated.View
            style={[
              styles.termsRow,
              { opacity: formOpacity },
            ]}
          >
            <Pressable
              style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}
              onPress={() => {
                setTermsAccepted(!termsAccepted);
                if (errors.terms) setErrors((prev) => ({ ...prev, terms: '' }));
              }}
              hitSlop={8}
            >
              {termsAccepted ? (
                <MaterialIcons name="check" size={14} color="#080C10" />
              ) : null}
            </Pressable>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text
                style={styles.termsLink}
                onPress={() => showAlert('Terms & Conditions', 'PlayArena terms apply to all users.')}
              >
                Terms of Service
              </Text>
              {' & '}
              <Text
                style={styles.termsLink}
                onPress={() => showAlert('Privacy Policy', 'Your data is safe with PlayArena.')}
              >
                Privacy Policy
              </Text>
            </Text>
          </Animated.View>
          {errors.terms ? (
            <Text style={styles.termsError}>{errors.terms}</Text>
          ) : null}

          {/* CTA */}
          <Animated.View style={{ opacity: formOpacity }}>
            <NeonButton
              title="Create Account"
              onPress={handleSignup}
              loading={loading}
              variant="primary"
              icon={<MaterialCommunityIcons name="account-plus" size={18} color="#080C10" />}
            />
          </Animated.View>

          {/* Login Link */}
          <Animated.View style={[styles.loginRow, { opacity: formOpacity }]}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text style={styles.loginLink}>Sign In</Text>
            </Pressable>
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
  decorCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0,255,136,0.06)',
    top: -50,
    right: -50,
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 0,
  },
  decorCircle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0,191,255,0.05)',
    bottom: 100,
    left: -40,
    shadowColor: '#00BFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 0,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
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
  headerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,255,136,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.3)',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  headerBadgeText: {
    color: Colors.neonGreen,
    fontSize: Typography.fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heading: {
    fontSize: Typography.fontSizes.xxxl,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: Typography.fontSizes.xxxl * 1.1,
  },
  subheading: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
  },
  roleLabel: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
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
  },
  ownerSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  ownerSectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,191,255,0.2)',
  },
  ownerSectionText: {
    color: Colors.electricBlue,
    fontSize: Typography.fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: Colors.neonGreen,
    borderColor: Colors.neonGreen,
  },
  termsText: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.fontSizes.sm * 1.5,
  },
  termsLink: {
    color: Colors.neonGreen,
    fontWeight: '600',
  },
  termsError: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.error,
    marginLeft: 30,
    marginTop: -Spacing.sm,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.sm,
  },
  loginLink: {
    color: Colors.neonGreen,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
  },
});
