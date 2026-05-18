import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '@/components';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';

const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed', 'completed'];

type PaymentMethod = 'upi' | 'card';

interface CheckoutSlot {
  id: string;
  ownerId: string;
  name: string;
  city: string;
  courtName: string;
  sport: string;
  price: number;
  pricePerHour: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  rules: string[];
}

function parseSlotParam(value: string | string[] | undefined): CheckoutSlot | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CheckoutSlot;
  } catch {
    return null;
  }
}

function formatDate(date: string): string {
  if (!date) return '';
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function parseTimeOnDate(date: string, time: string): Date | null {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!date || !match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;

  parsed.setHours(hours, minutes, 0, 0);
  return parsed;
}

function getDuration(date: string, startTime: string, endTime: string): string {
  const start = parseTimeOnDate(date, startTime);
  const end = parseTimeOnDate(date, endTime);
  if (!start || !end || end <= start) return '';

  const totalMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const slot = useMemo(() => parseSlotParam(params.slot), [params.slot]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [processing, setProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing payment...');
  const [profile, setProfile] = useState({ name: user?.name ?? '', phone: '' });

  const duration = slot ? getDuration(slot.slotDate, slot.startTime, slot.endTime) : '';
  const totalAmount = slot?.price ?? 0;

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      const phone = authUser?.user_metadata?.phone ?? '';
      let name = user?.name ?? authUser?.user_metadata?.name ?? '';

      if (authUser?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', authUser.id)
          .maybeSingle();

        name = data?.full_name ?? name;
      }

      if (mounted) {
        setProfile({ name, phone });
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [user?.name]);

  const isSlotBooked = async () => {
    if (!slot?.id) return true;

    const { data, error } = await supabase
      .from('bookings')
      .select('id')
      .eq('slot_id', slot.id)
      .in('status', ACTIVE_BOOKING_STATUSES)
      .limit(1);

    if (error) throw error;
    return (data ?? []).length > 0;
  };

  const showUnavailable = () => {
    Alert.alert('Slot Unavailable', 'This slot is no longer available', [
      { text: 'OK', onPress: () => router.replace('/dashboard') },
    ]);
  };

  const handlePay = async () => {
    if (!slot || processing) return;

    try {
      if (!user?.id) {
        Alert.alert('Login Required', 'Please login before booking a slot.');
        return;
      }

      if (await isSlotBooked()) {
        showUnavailable();
        return;
      }

      setProcessing(true);
      setProcessingMessage('Processing payment...');

      setTimeout(() => {
        setProcessingMessage('Confirming booking...');
      }, 1500);

      setTimeout(async () => {
        try {
          if (await isSlotBooked()) {
            setProcessing(false);
            showUnavailable();
            return;
          }

          const { error } = await supabase.from('bookings').insert({
            player_id: user?.id,
            slot_id: slot.id,
            owner_id: slot.ownerId,
            payment_status: 'paid',
            status: 'confirmed',
          });

          if (error) {
            if (error.code === '23505') {
              setProcessing(false);
              showUnavailable();
              return;
            }

            throw error;
          }

          setProcessing(false);
          Alert.alert('Booking Confirmed', 'Your slot has been booked successfully.', [
            { text: 'Done', onPress: () => router.replace('/dashboard') },
          ]);
        } catch (err: any) {
          setProcessing(false);
          Alert.alert('Payment Failed', err.message ?? 'Could not confirm booking.');
        }
      }, 3000);
    } catch (err: any) {
      setProcessing(false);
      Alert.alert('Checkout Error', err.message ?? 'Could not start checkout.');
    }
  };

  if (!slot) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.emptyTitle}>Checkout details not found</Text>
        <Pressable style={styles.secondaryButton} onPress={() => router.replace('/dashboard')}>
          <Text style={styles.secondaryButtonText}>Back to Dashboard</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#080C10', '#0D1419']} style={StyleSheet.absoluteFillObject} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => router.back()} disabled={processing}>
            <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.screenTitle}>Checkout</Text>
          <View style={styles.topSpacer} />
        </View>

        <View style={styles.hero}>
          <LinearGradient colors={['#0F2A1C', '#12324A']} style={styles.heroImage}>
            <MaterialCommunityIcons name="stadium-variant" size={58} color={Colors.neonGreen} />
          </LinearGradient>
          <View style={styles.heroInfo}>
            <Text style={styles.sport}>{slot.sport}</Text>
            <Text style={styles.courtName}>{slot.courtName}</Text>
            <Text style={styles.turfName}>{slot.name}</Text>
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={15} color={Colors.textSecondary} />
              <Text style={styles.locationText}>{slot.city}</Text>
            </View>
          </View>
        </View>

        <GlassCard padding={18} style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          <View style={styles.detailRow}>
            <MaterialIcons name="calendar-today" size={18} color={Colors.neonGreen} />
            <View>
              <Text style={styles.detailPrimary}>
                {formatDate(slot.slotDate)} | {slot.startTime} - {slot.endTime}
              </Text>
              {duration ? <Text style={styles.detailSecondary}>Duration {duration}</Text> : null}
            </View>
          </View>
        </GlassCard>

        <View style={styles.priceHighlight}>
          <Text style={styles.priceLabel}>Total Amount</Text>
          <Text style={styles.priceValue}>₹{totalAmount}</Text>
          <Text style={styles.priceMeta}>{slot.pricePerHour}</Text>
        </View>

        <GlassCard padding={18} style={styles.section}>
          <Text style={styles.sectionTitle}>Things to Know</Text>
          {(slot.rules?.length ? slot.rules : ['Booking must be paid in advance']).map((rule) => (
            <View key={rule} style={styles.ruleRow}>
              <View style={styles.ruleDot} />
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </GlassCard>

        <GlassCard padding={18} style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <SummaryRow label="Slot Price" value={`₹${totalAmount}`} />
          <SummaryRow label="Platform Fee" value="₹0" />
          <View style={styles.divider} />
          <SummaryRow label="Total Amount" value={`₹${totalAmount}`} strong />
        </GlassCard>

        <GlassCard padding={18} style={styles.section}>
          <Text style={styles.sectionTitle}>Your Details</Text>
          <ReadonlyField icon="person" label="Name" value={profile.name || 'Player'} />
          <ReadonlyField icon="phone" label="Phone" value={profile.phone || 'Not added'} />
        </GlassCard>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.methodGrid}>
            <PaymentOption
              label="UPI"
              icon="qrcode"
              selected={paymentMethod === 'upi'}
              onPress={() => setPaymentMethod('upi')}
            />
            <PaymentOption
              label="Card"
              icon="credit-card-outline"
              selected={paymentMethod === 'card'}
              onPress={() => setPaymentMethod('card')}
            />
          </View>
        </View>

        <Pressable style={styles.payButton} onPress={handlePay} disabled={processing}>
          <LinearGradient colors={['#00FF88', '#00CC6A']} style={styles.payGradient}>
            {processing ? (
              <>
                <ActivityIndicator size="small" color="#080C10" />
                <Text style={styles.payText}>{processingMessage}</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="lock" size={18} color="#080C10" />
                <Text style={styles.payText}>Pay ₹{totalAmount}</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, strong && styles.summaryStrong]}>{label}</Text>
      <Text style={[styles.summaryValue, strong && styles.summaryStrong]}>{value}</Text>
    </View>
  );
}

function ReadonlyField({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.readonlyField}>
      <MaterialIcons name={icon} size={18} color={Colors.textSecondary} />
      <View>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
    </View>
  );
}

function PaymentOption({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: any;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.methodCard, selected && styles.methodCardSelected]} onPress={onPress}>
      <MaterialCommunityIcons
        name={icon}
        size={24}
        color={selected ? Colors.neonGreen : Colors.textSecondary}
      />
      <Text style={[styles.methodText, selected && styles.methodTextSelected]}>{label}</Text>
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  content: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgGlass,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  screenTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.lg,
    fontWeight: '800',
  },
  topSpacer: {
    width: 42,
  },
  hero: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroImage: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: {
    padding: Spacing.md,
    gap: 5,
  },
  sport: {
    color: Colors.neonGreen,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  courtName: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.xl,
    fontWeight: '900',
  },
  turfName: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.base,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.sm,
  },
  section: {
    borderRadius: Radius.xl,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.md,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  detailPrimary: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.base,
    fontWeight: '800',
  },
  detailSecondary: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.sm,
    marginTop: 3,
  },
  priceHighlight: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    backgroundColor: 'rgba(0,255,136,0.1)',
    padding: Spacing.lg,
  },
  priceLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
  },
  priceValue: {
    color: Colors.neonGreen,
    fontSize: Typography.fontSizes.xxxl,
    fontWeight: '900',
    marginTop: 2,
  },
  priceMeta: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
  },
  ruleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
    marginTop: Spacing.sm,
  },
  ruleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.neonGreen,
    marginTop: 7,
  },
  ruleText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.sm,
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  summaryLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '600',
  },
  summaryValue: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '800',
  },
  summaryStrong: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.base,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginTop: Spacing.md,
  },
  readonlyField: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  fieldValue: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '800',
    marginTop: 2,
  },
  methodGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  methodCard: {
    flex: 1,
    minHeight: 78,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  methodCardSelected: {
    borderColor: Colors.neonGreen,
    backgroundColor: 'rgba(0,255,136,0.08)',
  },
  methodText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '800',
  },
  methodTextSelected: {
    color: Colors.textPrimary,
  },
  radioOuter: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.neonGreen,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.neonGreen,
  },
  payButton: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  payGradient: {
    minHeight: 54,
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  payText: {
    color: '#080C10',
    fontSize: Typography.fontSizes.base,
    fontWeight: '900',
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.lg,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  secondaryButton: {
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '800',
  },
});
