import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';

function slotEndDate(slotDate: string, endTime: string) {
  const match = endTime?.trim().match(/^(\d{1,2}):(\d{1,2})\s*(AM|PM)$/i);
  const [y, m, d] = slotDate?.split('-').map(Number);
  if (!match || !y || !m || !d) return new Date(NaN);
  let h = Number(match[1]);
  const min = Number(match[2]);
  if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12;
  if (match[3].toUpperCase() === 'AM' && h === 12) h = 0;
  return new Date(y, m - 1, d, h, min);
}

export default function GameFeedbackScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      console.log('BOOKING ID:', bookingId);
      const { data, error } = await supabase
        .from('bookings')
        .select('id, player_id, owner_id, slot_id, slots!inner(sport, court_name, slot_date, start_time, end_time, owner:profiles!slots_owner_id_fkey(turf_name))')
        .eq('id', bookingId)
        .maybeSingle();
      console.log('BOOKING DATA:', data);
      if (error) Alert.alert('Feedback Error', error.message);
      setBooking(data);
      if (data?.id) {
        const { data: existing, error: existingError } = await supabase
          .from('feedbacks')
          .select('id, rating, feedback_text')
          .eq('booking_id', data.id)
          .maybeSingle();
        console.log('FEEDBACK DATA:', existing);
        console.log('FEEDBACK ERROR:', existingError);
        if (existingError) Alert.alert('Feedback Error', existingError.message);
        if (existing) {
          setRating(Number(existing.rating || 0));
          setText(existing.feedback_text ?? '');
          setSubmitted(true);
        }
      }
      setLoading(false);
    }
    load();
  }, [bookingId]);
  
  const submit = async () => {
    if (!booking || !user?.id || saving) return;
    if (submitted) {
      Alert.alert('Feedback Already Submitted', 'You have already submitted feedback for this booking.');
      return;
    }
    if (rating < 1 || rating > 5) {
      Alert.alert('Rating Required', 'Please select a star rating.');
      return;
    }
    if (slotEndDate(booking.slots.slot_date, booking.slots.end_time) > new Date()) {
      Alert.alert('Not Yet Available', 'Feedback is allowed only after the slot end time.');
      return;
    }
    setSaving(true);
    const { data: duplicate, error: duplicateError } = await supabase
      .from('feedbacks')
      .select('id')
      .eq('booking_id', booking.id)
      .maybeSingle();
    if (duplicateError) {
      setSaving(false);
      Alert.alert('Save Failed', duplicateError.message);
      return;
    }
    if (duplicate) {
      setSaving(false);
      setSubmitted(true);
      Alert.alert('Feedback Already Submitted', 'You have already submitted feedback for this booking.');
      return;
    }

    const { data, error } = await supabase
      .from('feedbacks')
      .insert({
        player_id: user.id,
        booking_id: booking.id,
        owner_id: booking.owner_id,
        slot_id: booking.slot_id,
        rating,
        feedback_text: text.trim() || null,
        created_at: new Date().toISOString(),
      })
      .select();

    console.log('FEEDBACK INSERT DATA:', data);
    console.log('FEEDBACK INSERT ERROR:', error);
    setSaving(false);
    if (error) {
      console.log('FULL ERROR:', JSON.stringify(error, null, 2));
      Alert.alert('Save Failed', error.message);
      return;
    }
    setSubmitted(true);
    Alert.alert('Success', 'Feedback submitted successfully', [{ text: 'OK', onPress: () => router.back() }]);
  };

  const slot = booking?.slots;
  const allowed = slot ? slotEndDate(slot.slot_date, slot.end_time) <= new Date() : false;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#080C10', '#121820']} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={styles.topBar}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}><MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} /></Pressable>
          <Text style={styles.title}>Game Feedback</Text>
          <View style={styles.iconBtn} />
        </View>
        {loading ? <ActivityIndicator color={Colors.neonGreen} /> : !booking ? (
          <Text style={styles.empty}>Booking not found</Text>
        ) : !allowed ? (
          <Text style={styles.empty}>Feedback opens after {slot.end_time} on {slot.slot_date}.</Text>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sport}>{slot.sport}</Text>
            <Text style={styles.turf}>{slot.owner?.turf_name ?? 'Sports Arena'}</Text>
            <Text style={styles.meta}>{slot.court_name} - {slot.slot_date}</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => !submitted && setRating(star)} hitSlop={8} disabled={submitted}>
                  <MaterialIcons name={star <= rating ? 'star' : 'star-border'} size={40} color="#FFB800" />
                </Pressable>
              ))}
            </View>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Write feedback (optional)"
              placeholderTextColor={Colors.textMuted}
              multiline
              editable={!submitted}
            />
            <Pressable style={[styles.submit, submitted && { opacity: 0.5 }]} onPress={submit} disabled={saving || submitted}>
              <LinearGradient colors={['#00FF88', '#00CC6A']} style={styles.submitGrad}>
                {saving ? <ActivityIndicator color={Colors.bgPrimary} /> : <Text style={styles.submitText}>{submitted ? 'Feedback Submitted' : 'Submit Feedback'}</Text>}
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  content: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: Spacing.md, gap: Spacing.md },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgGlass, borderWidth: 1, borderColor: Colors.border },
  title: { color: Colors.textPrimary, fontSize: Typography.fontSizes.lg, fontWeight: '900' },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xl },
  card: { borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard, padding: Spacing.lg, gap: Spacing.md },
  sport: { color: Colors.neonGreen, fontSize: Typography.fontSizes.sm, fontWeight: '900', textTransform: 'uppercase' },
  turf: { color: Colors.textPrimary, fontSize: Typography.fontSizes.xl, fontWeight: '900' },
  meta: { color: Colors.textSecondary, fontSize: Typography.fontSizes.sm, fontWeight: '700' },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: Spacing.md },
  input: { minHeight: 120, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.inputBg, color: Colors.textPrimary, padding: Spacing.md, textAlignVertical: 'top' },
  submit: { borderRadius: Radius.full, overflow: 'hidden' },
  submitGrad: { height: 52, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: Colors.bgPrimary, fontSize: Typography.fontSizes.base, fontWeight: '900' },
});
