// PlayArena — Slots Modal (Ground Owner: view, edit, delete)
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
  FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';

const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed'];

// ── Types ─────────────────────────────────────────────────────────────────────
interface Slot {
  id: string;
  sport: string;
  court_name: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  total_slots: number;
  price: string;
  facilities: string[] | null;
  rules: string[] | null;
  bookings?: { status: string | null }[] | null;
}

interface SlotsModalProps {
  visible: boolean;
  onClose: () => void;
}

// ── Helper: format YYYY-MM-DD → DD/MM/YYYY ────────────────────────────────────
function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function dateToIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

function isValidIsoDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function timeToMinutes(t: string): number {
  const parts = t.trim().toUpperCase().split(' ');
  if (parts.length < 2) return 0;
  const [timePart, period] = parts;
  const [hStr, mStr] = timePart.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return 0;
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

function parseManualTime(raw: string): string | null {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, ' ');
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 1 || h > 12 || m < 0 || m > 59) return null;
  return `${h}:${m < 10 ? '0' + m : m} ${match[3]}`;
}

function isExpiredSlot(slot: Slot, now = Date.now()): boolean {
  const [y, m, d] = slot.slot_date.split('-').map(Number);
  if (!y || !m || !d) return false;
  const endMinutes = timeToMinutes(slot.end_time);
  const endAt = new Date(y, m - 1, d, Math.floor(endMinutes / 60), endMinutes % 60);
  return endAt.getTime() < now;
}

function availabilityColor(free: number, total: number) {
  if (free <= 0) return Colors.error;
  return free / Math.max(1, total) > 0.5 ? Colors.neonGreen : Colors.warning;
}

// ── Time Picker Modal ──────────────────────────────────────────────────────────
const TIME_OPTIONS: string[] = (() => {
  const opts: string[] = [];
  for (let h = 5; h <= 23; h++) {
    for (const m of [0, 30]) {
      if (h === 23 && m === 30) break;
      const period = h < 12 ? 'AM' : 'PM';
      const display = h % 12 === 0 ? 12 : h % 12;
      opts.push(`${display}:${m === 0 ? '00' : '30'} ${period}`);
    }
  }
  return opts;
})();

interface TimePickerModalProps {
  visible: boolean;
  value: string;
  onSelect: (time: string) => void;
  onClose: () => void;
  title: string;
  minTime?: string;
}

function TimePickerModal({ visible, value, onSelect, onClose, title, minTime }: TimePickerModalProps) {
  const insets = useSafeAreaInsets();
  const minMinutes = minTime ? timeToMinutes(minTime) + 1 : -Infinity;
  const [manualInput, setManualInput] = useState('');
  const [manualError, setManualError] = useState('');

  const filteredTimes = useMemo(
    () => TIME_OPTIONS.filter((t) => timeToMinutes(t) >= minMinutes),
    [minMinutes]
  );

  const handleManualSubmit = () => {
    const parsed = parseManualTime(manualInput);
    if (!parsed) {
      setManualError('Format: H:MM AM or PM (e.g. 6:35 AM)');
      return;
    }
    if (timeToMinutes(parsed) <= (minTime ? timeToMinutes(minTime) : -Infinity)) {
      setManualError('Must be after the minimum time');
      return;
    }
    setManualError('');
    setManualInput('');
    onSelect(parsed);
    handleClose();
  };

  const handleClose = () => {
    setManualInput('');
    setManualError('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={tpm.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />
        <View style={[tpm.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={tpm.header}>
            <Text style={tpm.title}>{title}</Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>

          {/* Manual input */}
          <View style={tpm.manualRow}>
            <TextInput
              style={[tpm.manualInput, manualError ? tpm.manualInputError : null]}
              value={manualInput}
              onChangeText={(v) => { setManualInput(v); setManualError(''); }}
              placeholder="e.g. 6:35 AM"
              placeholderTextColor={Colors.textMuted}
              onSubmitEditing={handleManualSubmit}
              returnKeyType="done"
            />
            <Pressable style={tpm.manualBtn} onPress={handleManualSubmit}>
              <LinearGradient colors={['#00FF88', '#00CC6A']} style={tpm.manualBtnGrad}>
                <MaterialIcons name="check" size={16} color={Colors.bgPrimary} />
              </LinearGradient>
            </Pressable>
          </View>
          {manualError ? <Text style={tpm.manualError}>{manualError}</Text> : null}

          <View style={tpm.orRow}>
            <View style={tpm.orLine} />
            <Text style={tpm.orText}>or pick preset</Text>
            <View style={tpm.orLine} />
          </View>

          <FlatList
            data={filteredTimes}
            keyExtractor={(t) => t}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
            renderItem={({ item }) => {
              const isSelected = item === value;
              return (
                <Pressable
                  style={[tpm.option, isSelected && tpm.optionSelected]}
                  onPress={() => { onSelect(item); handleClose(); }}
                >
                  {isSelected && (
                    <LinearGradient
                      colors={['rgba(0,255,136,0.15)', 'rgba(0,255,136,0.05)']}
                      style={StyleSheet.absoluteFillObject}
                    />
                  )}
                  <Text style={[tpm.optionText, isSelected && tpm.optionTextSelected]}>{item}</Text>
                  {isSelected && (
                    <MaterialIcons name="check" size={18} color={Colors.neonGreen} />
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

// ── Edit Sheet (sub-component) ────────────────────────────────────────────────
interface EditSheetProps {
  slot: Slot;
  onCancel: () => void;
  onSaved: (updated: Slot) => void;
}

function EditSheet({ slot, onCancel, onSaved }: EditSheetProps) {
  const [courtName, setCourtName] = useState(slot.court_name);
  const [slotDate, setSlotDate] = useState(slot.slot_date);
  const [startTime, setStartTime] = useState(slot.start_time);
  const [endTime, setEndTime] = useState(slot.end_time);
  const [price, setPrice] = useState(slot.price);
  const [saving, setSaving] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [startTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [endTimePickerVisible, setEndTimePickerVisible] = useState(false);
  const expired = isExpiredSlot(slot);

  const handleSave = async () => {
    if (!courtName.trim()) {
      Alert.alert('Validation', 'Court name is required.');
      return;
    }
    if (!slotDate.trim()) {
      Alert.alert('Validation', 'Date is required.');
      return;
    }
    if (!isValidIsoDate(slotDate)) {
      Alert.alert('Validation', 'Please select a valid date.');
      return;
    }
    const parsedStartTime = parseManualTime(startTime);
    const parsedEndTime = parseManualTime(endTime);
    if (!parsedStartTime) {
      Alert.alert('Validation', 'Enter a valid start time (e.g. 6:30 AM).');
      return;
    }
    if (!parsedEndTime) {
      Alert.alert('Validation', 'Enter a valid end time (e.g. 7:30 PM).');
      return;
    }
    if (timeToMinutes(parsedEndTime) <= timeToMinutes(parsedStartTime)) {
      Alert.alert('Validation', 'End time must be after start time.');
      return;
    }

    setSaving(true);
    const { data, error } = await supabase
      .from('slots')
      .update({ 
        court_name: courtName.trim(), 
        slot_date: slotDate, 
        start_time: parsedStartTime,
        end_time: parsedEndTime, 
        price: String(price || '').trim() 
      })
      .eq('id', slot.id)
      .select()
      .single();
    setSaving(false);

    if (error) {
      Alert.alert('Update Failed', error.message);
      return;
    }
    onSaved(data as Slot);
  };

  return (
    <View style={es.container}>
      <LinearGradient
        colors={['rgba(0,191,255,0.06)', 'rgba(0,191,255,0.01)']}
        style={StyleSheet.absoluteFillObject}
      />
      <Text style={es.title}>Edit Slot</Text>

      <Text style={es.label}>Court / Lane Name</Text>
      <View style={es.inputRow}>
        <MaterialCommunityIcons name="door-open" size={16} color={Colors.textMuted} />
        <TextInput
          style={es.input}
          value={courtName}
          onChangeText={setCourtName}
          placeholder="e.g. Court 1, Turf A"
          placeholderTextColor={Colors.textMuted}
          maxLength={50}
          editable={!expired}
        />
      </View>

      <Text style={es.label}>Booking Date</Text>
      <View style={es.inputRow}>
        <MaterialIcons name="calendar-today" size={16} color={Colors.electricBlue} />
        {Platform.OS === 'web' ? (
          <TextInput
            {...({ type: 'date' } as any)}
            style={es.input}
            value={slotDate}
            onChangeText={setSlotDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.textMuted}
            editable={!expired}
          />
        ) : (
          <Pressable
            style={[es.input, { justifyContent: 'center' }]}
            onPress={() => !expired && setDatePickerVisible(true)}
            disabled={expired}
          >
            <Text style={{ color: slotDate ? Colors.textPrimary : Colors.textMuted, fontWeight: '600' }}>
              {slotDate || 'YYYY-MM-DD'}
            </Text>
          </Pressable>
        )}
      </View>
      {Platform.OS !== 'web' && datePickerVisible && (
        <DateTimePicker
          value={slotDate ? isoToDate(slotDate) : new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(_, selectedDate) => {
            if (Platform.OS !== 'ios') setDatePickerVisible(false);
            if (selectedDate) setSlotDate(dateToIso(selectedDate));
          }}
        />
      )}

      <Text style={es.label}>Start Time</Text>
      <View style={es.inputRow}>
        <MaterialIcons name="access-time" size={16} color={Colors.neonGreen} />
        {Platform.OS === 'web' ? (
          <TextInput
            style={es.input}
            value={startTime}
            onChangeText={setStartTime}
            placeholder="e.g. 6:30 AM"
            placeholderTextColor={Colors.textMuted}
            maxLength={8}
            editable={!expired}
          />
        ) : (
          <Pressable 
            style={[es.input, { justifyContent: 'center' }]} 
            onPress={() => !expired && setStartTimePickerVisible(true)}
            disabled={expired}
          >
            <Text style={{ color: startTime ? Colors.textPrimary : Colors.textMuted, fontWeight: '600' }}>
              {startTime || 'Select time'}
            </Text>
          </Pressable>
        )}
      </View>
      {Platform.OS !== 'web' && startTimePickerVisible && (
        <TimePickerModal
          visible={startTimePickerVisible}
          value={startTime}
          onSelect={setStartTime}
          onClose={() => setStartTimePickerVisible(false)}
          title="Select Start Time"
        />
      )}

      <Text style={es.label}>End Time</Text>
      <View style={es.inputRow}>
        <MaterialIcons name="access-time" size={16} color={Colors.electricBlue} />
        {Platform.OS === 'web' ? (
          <TextInput
            style={es.input}
            value={endTime}
            onChangeText={setEndTime}
            placeholder="e.g. 7:30 PM"
            placeholderTextColor={Colors.textMuted}
            maxLength={8}
            editable={!expired}
          />
        ) : (
          <Pressable 
            style={[es.input, { justifyContent: 'center' }]} 
            onPress={() => !expired && setEndTimePickerVisible(true)}
            disabled={expired}
          >
            <Text style={{ color: endTime ? Colors.textPrimary : Colors.textMuted, fontWeight: '600' }}>
              {endTime || 'Select time'}
            </Text>
          </Pressable>
        )}
      </View>
      {Platform.OS !== 'web' && endTimePickerVisible && (
        <TimePickerModal
          visible={endTimePickerVisible}
          value={endTime}
          onSelect={setEndTime}
          onClose={() => setEndTimePickerVisible(false)}
          title="Select End Time"
          minTime={startTime}
        />
      )}

      <Text style={es.label}>Price</Text>
      <View style={es.inputRow}>
        <Text style={es.rupee}>₹</Text>
        <TextInput
          style={es.input}
          value={price}
          onChangeText={setPrice}
          placeholder="Amount"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          maxLength={10}
          editable={!expired}
        />
      </View>

      <View style={es.actions}>
        <Pressable style={es.cancelBtn} onPress={onCancel}>
          <Text style={es.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable style={es.saveBtn} onPress={handleSave} disabled={saving || expired}>
          <LinearGradient colors={['#00FF88', '#00CC6A']} style={es.saveBtnGrad}>
            {saving ? (
              <ActivityIndicator size="small" color={Colors.bgPrimary} />
            ) : (
              <>
                <MaterialIcons name="check" size={16} color={Colors.bgPrimary} />
                <Text style={es.saveText}>Save</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const tpm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    backgroundColor: '#0E1620',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    maxHeight: 460,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSizes.base,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  manualRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 4,
  },
  manualInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.sm,
  },
  manualInputError: {
    borderColor: Colors.error,
  },
  manualBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  manualBtnGrad: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualError: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.error,
    marginBottom: 4,
    fontWeight: '600',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: Spacing.sm,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  orText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  optionSelected: { borderRadius: Radius.md },
  optionText: {
    fontSize: Typography.fontSizes.base,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: Colors.neonGreen,
    fontWeight: '700',
  },
});

const es = StyleSheet.create({
  container: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,191,255,0.25)',
    padding: Spacing.md,
    gap: 10,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '800',
    color: Colors.electricBlue,
    marginBottom: 2,
  },
  label: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '600',
  },
  rupee: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.base,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  saveBtnGrad: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.bgPrimary,
    fontWeight: '800',
  },
});

// ── Slot Card ─────────────────────────────────────────────────────────────────
interface SlotCardProps {
  slot: Slot;
  onEdit: (slot: Slot) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
  onEditSaved: (updated: Slot) => void;
  onEditCancel: () => void;
}

function SlotCard({ slot, onEdit, onDelete, isEditing, onEditSaved, onEditCancel }: SlotCardProps) {
  const facilities = slot.facilities ?? [];
  const rules = slot.rules ?? [];
  const bookingStatus = slot.bookings?.[0]?.status;
  const bookedCount = (slot.bookings ?? []).filter((b) => b.status && ACTIVE_BOOKING_STATUSES.includes(b.status)).length;
  const freeSpots = Math.max(0, Number(slot.total_slots || 1) - bookedCount);
  const spotColor = availabilityColor(freeSpots, Number(slot.total_slots || 1));
  const expired = isExpiredSlot(slot);
  const hasAnyBookings = (slot.bookings ?? []).length > 0;

  return (
    <View style={sc.card}>
      <LinearGradient
        colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.01)']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Sport + Date header */}
      <View style={sc.header}>
        <View style={sc.sportBadge}>
          <MaterialCommunityIcons name="whistle" size={14} color={Colors.neonGreen} />
          <Text style={sc.sportText}>{slot.sport}</Text>
        </View>
        <View style={sc.dateBadge}>
          <MaterialIcons name="calendar-today" size={12} color={Colors.electricBlue} />
          <Text style={sc.dateText}>{formatDate(slot.slot_date)}</Text>
        </View>
      </View>

      {/* Court name */}
      <View style={sc.row}>
        <MaterialCommunityIcons name="door-open" size={14} color={Colors.textMuted} />
        <Text style={sc.courtName}>{slot.court_name}</Text>
      </View>

      {/* Time */}
      <View style={sc.row}>
        <MaterialIcons name="access-time" size={14} color={Colors.textMuted} />
        <Text style={sc.detail}>
          {slot.start_time}
          <Text style={sc.arrow}> → </Text>
          {slot.end_time}
        </Text>
      </View>

      {/* Price + slots */}
      <View style={sc.chipRow}>
        <View style={sc.priceChip}>
          <Text style={sc.priceText}>₹{slot.price}</Text>
          <Text style={sc.perHr}>/hr</Text>
        </View>
        <View style={sc.slotCountChip}>
          <MaterialIcons name="people" size={12} color={spotColor} />
          <Text style={[sc.slotCountText, { color: spotColor }]}>
            {freeSpots > 0 ? `${freeSpots}/${slot.total_slots} spots left` : 'Fully Booked'}
          </Text>
        </View>
        {facilities.length > 0 && (
          <View style={sc.facilitiesChip}>
            <MaterialIcons name="sports" size={12} color='#A78BFA' />
            <Text style={sc.facilitiesText}>{facilities.length} facilit{facilities.length > 1 ? 'ies' : 'y'}</Text>
          </View>
        )}
        {bookingStatus ? (
          <View style={sc.statusChip}>
            <MaterialIcons name="event-available" size={12} color="#FFB800" />
            <Text style={sc.statusText}>{bookingStatus}</Text>
          </View>
        ) : null}
      </View>

      {/* Facilities & Rules */}
      {(facilities.length > 0 || rules.length > 0) && (
        <View style={sc.tagsRow}>
          {facilities.slice(0, 3).map((f) => (
            <View key={f} style={sc.tag}>
              <Text style={sc.tagText}>{f}</Text>
            </View>
          ))}
          {rules.slice(0, 2).map((r) => (
            <View key={r} style={[sc.tag, sc.ruleTag]}>
              <Text style={[sc.tagText, sc.ruleTagText]}>{r}</Text>
            </View>
          ))}
          {facilities.length + rules.length > 5 && (
            <View style={sc.tag}>
              <Text style={sc.tagText}>+{facilities.length + rules.length - 5} more</Text>
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      {!isEditing && !expired && (
        <View style={sc.actions}>
          <Pressable style={sc.editBtn} onPress={() => onEdit(slot)} hitSlop={6}>
            <MaterialIcons name="edit" size={14} color={Colors.electricBlue} />
            <Text style={sc.editText}>Edit</Text>
          </Pressable>
          <Pressable
            style={[sc.deleteBtn, hasAnyBookings && { opacity: 0.5 }]}
            onPress={() => {
              if (hasAnyBookings) {
                Alert.alert('Cannot Delete', 'This slot has bookings. Deleting it may affect booking history.');
                return;
              }
              onDelete(slot.id);
            }}
            hitSlop={6}
            disabled={hasAnyBookings}
          >
            <MaterialIcons name="delete-outline" size={14} color={Colors.error} />
            <Text style={sc.deleteText}>Delete</Text>
          </Pressable>
        </View>
      )}

      {/* Inline edit form */}
      {isEditing && !expired && (
        <EditSheet slot={slot} onCancel={onEditCancel} onSaved={onEditSaved} />
      )}
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: Colors.bgCard,
    padding: Spacing.md,
    gap: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,255,136,0.1)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.2)',
  },
  sportText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.neonGreen,
    fontWeight: '700',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,191,255,0.1)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,191,255,0.2)',
  },
  dateText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.electricBlue,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  courtName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  detail: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  arrow: {
    color: Colors.textMuted,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  priceChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(0,255,136,0.08)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.2)',
    gap: 2,
  },
  priceText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.neonGreen,
    fontWeight: '800',
  },
  perHr: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
  },
  slotCountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,191,255,0.08)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,191,255,0.2)',
  },
  slotCountText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.electricBlue,
    fontWeight: '600',
  },
  facilitiesChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(167,139,250,0.1)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.2)',
  },
  facilitiesText: {
    fontSize: Typography.fontSizes.xs,
    color: '#A78BFA',
    fontWeight: '600',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,184,0,0.1)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.22)',
  },
  statusText: {
    fontSize: Typography.fontSizes.xs,
    color: '#FFB800',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  ruleTag: {
    backgroundColor: 'rgba(255,107,107,0.08)',
    borderColor: 'rgba(255,107,107,0.2)',
  },
  ruleTagText: {
    color: '#FF6B6B',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(0,191,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,191,255,0.2)',
  },
  editText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.electricBlue,
    fontWeight: '700',
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,107,107,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.2)',
  },
  deleteText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.error,
    fontWeight: '700',
  },
});

// ── Main Modal ────────────────────────────────────────────────────────────────
export const SlotsModal: React.FC<SlotsModalProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'active' | 'previous'>('active');
  const [nowTick, setNowTick] = useState(Date.now());

  const slots = useMemo(() => {
    const filtered = allSlots.filter((slot) => viewMode === 'active' ? !isExpiredSlot(slot, nowTick) : isExpiredSlot(slot, nowTick));
    return filtered.sort((a, b) => {
      const diff = isoToDate(a.slot_date).getTime() - isoToDate(b.slot_date).getTime();
      return viewMode === 'active' ? diff : -diff;
    });
  }, [allSlots, viewMode, nowTick]);

  const fetchSlots = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
        .from('slots')
        .select(`
          *,
          bookings (
            status
          ),
          profiles!slots_owner_id_fkey (
            turf_name,
            location
          )
        `)
      .eq('owner_id', user.id)
      .order('slot_date', { ascending: true });
    setLoading(false);
    if (error) {
      Alert.alert('Error', `Could not load slots: ${error.message}`);
      return;
    }
    setAllSlots((data ?? []) as Slot[]);
  }, [user?.id]);

  useEffect(() => {
    if (visible) {
      setEditingId(null);
      setViewMode('active');
      fetchSlots();
    }
  }, [visible, fetchSlots]);

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(id);
  }, [visible]);

  const handleDelete = useCallback((id: string) => {
    const slot = allSlots.find((s) => s.id === id);
    if (slot && isExpiredSlot(slot, nowTick)) {
      Alert.alert('Not Allowed', 'Previous/expired slots cannot be deleted.');
      return;
    }

    Alert.alert('Delete this slot?', 'This slot will be permanently removed. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!user?.id) {
            Alert.alert('Not Allowed', 'You must be logged in as an owner.');
            return;
          }

          // Include owner_id for RLS/ownership policies.
          const { error } = await supabase
            .from('slots')
            .delete()
            .eq('id', id)
            .eq('owner_id', user.id);
          if (error) {
            Alert.alert('Delete Failed', error.message);
          } else {
            setAllSlots((prev) => prev.filter((s) => s.id !== id));
          }
        },
      },
    ]);
  }, [allSlots, nowTick, user?.id]);

  const handleEditSaved = useCallback((updated: Slot) => {
    setAllSlots((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
    setEditingId(null);
  }, []);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>My Slots</Text>
              <Text style={styles.subtitle}>
                {slots.length > 0 ? `${slots.length} ${viewMode} slot${slots.length > 1 ? 's' : ''}` : viewMode === 'active' ? 'Upcoming active slots' : 'Expired slots'}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <Pressable style={styles.refreshBtn} onPress={fetchSlots} hitSlop={10}>
                <MaterialIcons name="refresh" size={18} color={Colors.neonGreen} />
              </Pressable>
              <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          <View style={styles.modeTabs}>
            <Pressable
              style={[styles.modeTab, viewMode === 'active' && styles.modeTabActive]}
              onPress={() => setViewMode('active')}
            >
              <Text style={[styles.modeTabText, viewMode === 'active' && styles.modeTabTextActive]}>Active Slots</Text>
            </Pressable>
            <Pressable
              style={[styles.modeTab, viewMode === 'previous' && styles.modeTabActive]}
              onPress={() => setViewMode('previous')}
            >
              <Text style={[styles.modeTabText, viewMode === 'previous' && styles.modeTabTextActive]}>Previous Slots</Text>
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              slots.length === 0 && !loading && styles.scrollCentered,
            ]}
          >
            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={Colors.neonGreen} />
                <Text style={styles.loadingText}>Loading slots...</Text>
              </View>
            ) : slots.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="calendar-blank" size={52} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No slots yet</Text>
                <Text style={styles.emptySub}>
                  {viewMode === 'active'
                    ? 'Add your first slot using the "Add Slot" button on the dashboard.'
                    : 'Expired slots will appear here automatically.'}
                </Text>
              </View>
            ) : (
              slots.map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  onEdit={(s) => setEditingId(s.id)}
                  onDelete={handleDelete}
                  isEditing={editingId === slot.id}
                  onEditSaved={handleEditSaved}
                  onEditCancel={() => setEditingId(null)}
                />
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    backgroundColor: '#0E1620',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    maxHeight: '92%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,255,136,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  modeTab: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  modeTabActive: {
    borderColor: 'rgba(0,191,255,0.35)',
    backgroundColor: 'rgba(0,191,255,0.12)',
  },
  modeTabText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: Colors.electricBlue,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  scrollCentered: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  emptySub: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
