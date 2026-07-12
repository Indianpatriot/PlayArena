import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { supabase } from '@/services/supabase';

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

export default function TicketScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ticketRef = useRef<View>(null);
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, status, player:profiles!bookings_player_id_fkey(full_name), slots!inner(sport, court_name, slot_date, start_time, end_time, price, owner:profiles!slots_owner_id_fkey(turf_name, location))')
        .eq('id', bookingId)
        .maybeSingle();
      if (error) Alert.alert('Ticket Error', error.message);
      setBooking(data);
      setLoading(false);
    }
    load();
  }, [bookingId]);

  const downloadTicket = async () => {
    if (!ticketRef.current) return;
    try {
      const uri = await captureRef(ticketRef, { format: 'png', quality: 1 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
      else Alert.alert('Ticket Image', uri);
    } catch (err: any) {
      Alert.alert('Download Failed', err.message ?? 'Could not save ticket image.');
    }
  };

  const slot = booking?.slots;
  const expired = slot ? slotEndDate(slot.slot_date, slot.end_time) <= new Date() : false;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#080C10', '#111B22']} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={styles.topBar}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}><MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} /></Pressable>
          <Text style={styles.title}>Game Ticket</Text>
          <Pressable style={styles.iconBtn} onPress={downloadTicket} disabled={!booking || expired}><MaterialIcons name="file-download" size={22} color={expired ? Colors.textMuted : Colors.neonGreen} /></Pressable>
        </View>

        {loading ? <ActivityIndicator color={Colors.neonGreen} /> : !booking || !slot ? (
          <Text style={styles.empty}>Ticket not found</Text>
        ) : expired ? (
          <Text style={styles.empty}>Ticket expired after slot end time.</Text>
        ) : (
          <ViewShot ref={ticketRef} options={{ format: 'png', quality: 1 }}>
            <View style={styles.ticket}>
              <LinearGradient colors={['#123524', '#0D1F2A']} style={StyleSheet.absoluteFillObject} />
              <View style={styles.ticketHeader}>
                <View>
                  <Text style={styles.league}>PLAYARENA PASS</Text>
                  <Text style={styles.sport}>{slot.sport}</Text>
                </View>
                <View style={styles.qrMock}>
                  {Array.from({ length: 16 }).map((_, i) => <View key={i} style={[styles.qrCell, i % 3 === 0 && styles.qrCellOn]} />)}
                </View>
              </View>
              <Text style={styles.turf}>{slot.owner?.turf_name ?? 'Sports Arena'}</Text>
              <Text style={styles.meta}>{slot.court_name}</Text>
              <View style={styles.divider} />
              <TicketRow label="Date" value={slot.slot_date} />
              <TicketRow label="Time" value={`${slot.start_time} - ${slot.end_time}`} />
              <TicketRow label="Location" value={slot.owner?.location ?? 'Unknown Location'} />
              <TicketRow label="Booking ID" value={booking.id} />
              <TicketRow label="Price" value={`Rs ${slot.price ?? 0}`} />
              <TicketRow label="Player" value={booking.player?.full_name ?? 'Player'} />
              <TicketRow label="Status" value={booking.status ?? 'confirmed'} />
            </View>
          </ViewShot>
        )}
      </ScrollView>
    </View>
  );
}

function TicketRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  content: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: Spacing.md, gap: Spacing.md },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgGlass, borderWidth: 1, borderColor: Colors.border },
  title: { color: Colors.textPrimary, fontSize: Typography.fontSizes.lg, fontWeight: '900' },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xl },
  ticket: { borderRadius: Radius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', overflow: 'hidden', padding: Spacing.lg, gap: Spacing.sm, backgroundColor: '#102018' },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  league: { color: Colors.neonGreen, fontSize: 11, fontWeight: '900' },
  sport: { color: Colors.textPrimary, fontSize: 30, fontWeight: '900', marginTop: 4 },
  turf: { color: Colors.textPrimary, fontSize: Typography.fontSizes.xl, fontWeight: '900', marginTop: Spacing.md },
  meta: { color: Colors.textSecondary, fontSize: Typography.fontSizes.base, fontWeight: '700' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginVertical: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, paddingVertical: 6 },
  rowLabel: { color: Colors.textMuted, fontSize: Typography.fontSizes.sm, fontWeight: '700' },
  rowValue: { flex: 1, textAlign: 'right', color: Colors.textPrimary, fontSize: Typography.fontSizes.sm, fontWeight: '800' },
  qrMock: { width: 62, height: 62, flexDirection: 'row', flexWrap: 'wrap', padding: 5, gap: 3, backgroundColor: '#EAFBF1', borderRadius: 8 },
  qrCell: { width: 10, height: 10, backgroundColor: 'transparent' },
  qrCellOn: { backgroundColor: '#08110D' },
});
