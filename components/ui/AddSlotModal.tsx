// PlayArena — Add Slot Modal (Ground Owner)
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { FacilitiesRulesSheet, FacilitiesRulesData } from './FacilitiesRulesSheet';
import { PREDEFINED_SPORTS, SportEntry, loadCustomSports, saveCustomSport } from '@/constants/sports';
import { supabase } from '@/services/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────
interface TimeSlotRow {
  id: string;
  startTime: string;
  endTime: string;
  courts: string;
  prices: string[];
  samePrice: boolean;
  commonPrice: string;
}

export interface SlotData {
  sport: string;
  courtName: string;
  slotDate: string;
  slots: {
    startTime: string;
    endTime: string;
    courts: { label: string; price: string }[];
  }[];
  facilities: string[];
  rules: string[];
}

interface AddSlotModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: SlotData) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const OTHERS_KEY = '__others__';
const SPORTS_WITH_OTHERS = [
  ...PREDEFINED_SPORTS,
  { key: OTHERS_KEY, icon: 'dots-horizontal-circle', color: '#A78BFA', type: 'predefined' as const },
];

// Preset times every 30 min: 5:00 AM → 11:00 PM
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

// Parse manual time entry — supports "6:35 AM", "10:15pm", "6:35AM"
function parseManualTime(raw: string): string | null {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, ' ');
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const period = match[3];
  if (h < 1 || h > 12 || m < 0 || m > 59) return null;
  return `${h}:${m < 10 ? '0' + m : m} ${period}`;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function makeRow(): TimeSlotRow {
  return {
    id: uid(),
    startTime: '',
    endTime: '',
    courts: '1',
    prices: [''],
    samePrice: true,
    commonPrice: '',
  };
}

// ── Time Picker ────────────────────────────────────────────────────────────────
interface TimePickerProps {
  visible: boolean;
  selected: string;
  onSelect: (t: string) => void;
  onClose: () => void;
  title: string;
  minTime?: string;
}

function TimePicker({ visible, selected, onSelect, onClose, title, minTime }: TimePickerProps) {
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
      setManualError('Format: H:MM AM or PM  (e.g. 6:35 AM)');
      return;
    }
    if (timeToMinutes(parsed) <= (minTime ? timeToMinutes(minTime) : -Infinity)) {
      setManualError('Must be after the start time');
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
      <View style={tp.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />
        <View style={[tp.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={tp.header}>
            <Text style={tp.title}>{title}</Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>

          {/* Manual input */}
          <View style={tp.manualRow}>
            <TextInput
              style={[tp.manualInput, manualError ? tp.manualInputError : null]}
              value={manualInput}
              onChangeText={(v) => { setManualInput(v); setManualError(''); }}
              placeholder="Custom: e.g. 6:35 AM"
              placeholderTextColor={Colors.textMuted}
              onSubmitEditing={handleManualSubmit}
              returnKeyType="done"
            />
            <Pressable style={tp.manualBtn} onPress={handleManualSubmit}>
              <LinearGradient colors={['#00FF88', '#00CC6A']} style={tp.manualBtnGrad}>
                <MaterialIcons name="check" size={16} color={Colors.bgPrimary} />
              </LinearGradient>
            </Pressable>
          </View>
          {manualError ? <Text style={tp.manualError}>{manualError}</Text> : null}

          <View style={tp.orRow}>
            <View style={tp.orLine} />
            <Text style={tp.orText}>or pick preset</Text>
            <View style={tp.orLine} />
          </View>

          <FlatList
            data={filteredTimes}
            keyExtractor={(t) => t}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
            renderItem={({ item }) => {
              const isSelected = item === selected;
              return (
                <Pressable
                  style={[tp.option, isSelected && tp.optionSelected]}
                  onPress={() => { onSelect(item); handleClose(); }}
                >
                  {isSelected && (
                    <LinearGradient
                      colors={['rgba(0,255,136,0.15)', 'rgba(0,255,136,0.05)']}
                      style={StyleSheet.absoluteFillObject}
                    />
                  )}
                  <Text style={[tp.optionText, isSelected && tp.optionTextSelected]}>{item}</Text>
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

const tp = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
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

// ── Slot Row ──────────────────────────────────────────────────────────────────
interface SlotRowProps {
  row: TimeSlotRow;
  index: number;
  canRemove: boolean;
  onUpdate: (id: string, patch: Partial<TimeSlotRow>) => void;
  onRemove: (id: string) => void;
  isPool?: boolean;
}

function SlotRow({ row, index, canRemove, onUpdate, onRemove, isPool }: SlotRowProps) {
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);

  const courtsNum = Math.max(1, Math.min(10, parseInt(row.courts || '1', 10) || 1));

  const handleCourtsChange = (val: string) => {
    const n = parseInt(val, 10);
    const num = isNaN(n) ? 1 : Math.max(1, Math.min(10, n));
    const prices = Array.from({ length: num }, (_, i) => row.prices[i] ?? row.commonPrice ?? '');
    onUpdate(row.id, { courts: val === '' ? '' : String(num), prices });
  };

  const handleCommonPriceChange = (val: string) => {
    const prices = Array.from({ length: courtsNum }, () => val);
    onUpdate(row.id, { commonPrice: val, prices });
  };

  const handleCourtPriceChange = (courtIdx: number, val: string) => {
    const prices = [...row.prices];
    prices[courtIdx] = val;
    onUpdate(row.id, { prices });
  };

  return (
    <View style={sr.card}>
      <LinearGradient
        colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.01)']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={sr.cardHeader}>
        <View style={sr.slotBadge}>
          <Text style={sr.slotBadgeText}>Slot {index + 1}</Text>
        </View>
        {canRemove && (
          <Pressable onPress={() => onRemove(row.id)} hitSlop={8} style={sr.removeBtn}>
            <MaterialIcons name="remove-circle" size={20} color={Colors.error} />
          </Pressable>
        )}
      </View>

      {/* Time row */}
      <View style={sr.timeRow}>
        <Pressable style={sr.timeBtn} onPress={() => setStartPickerOpen(true)}>
          <MaterialIcons name="access-time" size={16} color={Colors.neonGreen} />
          <Text style={[sr.timeBtnText, !row.startTime && sr.timePlaceholder]}>
            {row.startTime || 'Start Time'}
          </Text>
          <MaterialIcons name="expand-more" size={16} color={Colors.textMuted} />
        </Pressable>

        <View style={sr.timeArrow}>
          <MaterialIcons name="arrow-forward" size={14} color={Colors.textMuted} />
        </View>

        <Pressable style={sr.timeBtn} onPress={() => setEndPickerOpen(true)}>
          <MaterialIcons name="access-time" size={16} color={Colors.electricBlue} />
          <Text style={[sr.timeBtnText, !row.endTime && sr.timePlaceholder]}>
            {row.endTime || 'End Time'}
          </Text>
          <MaterialIcons name="expand-more" size={16} color={Colors.textMuted} />
        </Pressable>
      </View>

      {/* Courts / Lanes count */}
      <View style={sr.courtsRow}>
        <Text style={sr.label}>
          {isPool
            ? courtsNum > 1 ? 'Lanes Available' : 'Pool Session'
            : courtsNum > 1 ? 'Courts Available' : 'Slots Available'}
        </Text>
        <View style={sr.courtsCounter}>
          <Pressable
            hitSlop={8}
            onPress={() => handleCourtsChange(String(Math.max(1, courtsNum - 1)))}
            style={sr.counterBtn}
          >
            <MaterialIcons name="remove" size={16} color={courtsNum <= 1 ? Colors.textMuted : Colors.textPrimary} />
          </Pressable>
          <TextInput
            style={sr.courtsInput}
            value={row.courts}
            onChangeText={handleCourtsChange}
            keyboardType="numeric"
            maxLength={2}
            textAlign="center"
          />
          <Pressable
            hitSlop={8}
            onPress={() => handleCourtsChange(String(Math.min(10, courtsNum + 1)))}
            style={sr.counterBtn}
          >
            <MaterialIcons name="add" size={16} color={courtsNum >= 10 ? Colors.textMuted : Colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {/* Price */}
      <View style={sr.priceSection}>
        <View style={sr.priceTitleRow}>
          <Text style={sr.label}>Pricing</Text>
          {courtsNum > 1 && (
            <Pressable
              style={sr.sameToggle}
              onPress={() => {
                const next = !row.samePrice;
                const prices = next
                  ? Array.from({ length: courtsNum }, () => row.commonPrice)
                  : Array.from({ length: courtsNum }, (_, i) => row.prices[i] ?? '');
                onUpdate(row.id, { samePrice: next, prices });
              }}
            >
              <View style={[sr.checkbox, row.samePrice && sr.checkboxActive]}>
                {row.samePrice && <MaterialIcons name="check" size={10} color={Colors.bgPrimary} />}
              </View>
              <Text style={sr.sameToggleText}>Same price for all</Text>
            </Pressable>
          )}
        </View>

        {row.samePrice || courtsNum === 1 ? (
          <View style={sr.inputWrap}>
            <Text style={sr.rupee}>₹</Text>
            <TextInput
              style={sr.priceInput}
              value={row.commonPrice}
              onChangeText={handleCommonPriceChange}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              maxLength={6}
            />
            <Text style={sr.perHour}>/ hr</Text>
          </View>
        ) : (
          <View style={sr.courtPriceGrid}>
            {Array.from({ length: courtsNum }, (_, i) => (
              <View key={i} style={sr.courtPriceRow}>
                <Text style={sr.courtLabel}>Court {i + 1}</Text>
                <View style={[sr.inputWrap, { flex: 1 }]}>
                  <Text style={sr.rupee}>₹</Text>
                  <TextInput
                    style={sr.priceInput}
                    value={row.prices[i] ?? ''}
                    onChangeText={(v) => handleCourtPriceChange(i, v)}
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    maxLength={6}
                  />
                  <Text style={sr.perHour}>/ hr</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {courtsNum > 1 && (
        <View style={sr.courtsPreview}>
          {Array.from({ length: courtsNum }, (_, i) => (
            <View key={i} style={sr.courtChip}>
              <Text style={sr.courtChipText}>{isPool ? `Lane ${i + 1}` : `Court ${i + 1}`}</Text>
            </View>
          ))}
        </View>
      )}

      <TimePicker
        visible={startPickerOpen}
        selected={row.startTime}
        onSelect={(t) => onUpdate(row.id, { startTime: t, endTime: '' })}
        onClose={() => setStartPickerOpen(false)}
        title="Select Start Time"
      />
      <TimePicker
        visible={endPickerOpen}
        selected={row.endTime}
        onSelect={(t) => onUpdate(row.id, { endTime: t })}
        onClose={() => setEndPickerOpen(false)}
        title="Select End Time"
        minTime={row.startTime}
      />
    </View>
  );
}

const sr = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: Colors.bgCard,
    padding: Spacing.md,
    gap: Spacing.md,
    overflow: 'hidden',
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotBadge: {
    backgroundColor: 'rgba(0,255,136,0.12)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.25)',
  },
  slotBadgeText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.neonGreen,
    fontWeight: '700',
  },
  removeBtn: { padding: 2 },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: 10,
    height: 44,
  },
  timeBtnText: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  timePlaceholder: {
    color: Colors.textMuted,
    fontWeight: '400',
  },
  timeArrow: {
    width: 20,
    alignItems: 'center',
  },
  courtsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  courtsCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 4,
    height: 40,
  },
  counterBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  courtsInput: {
    width: 32,
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: Typography.fontSizes.base,
  },
  priceSection: { gap: Spacing.sm },
  priceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sameToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.neonGreen,
    borderColor: Colors.neonGreen,
  },
  sameToggleText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
    gap: 6,
  },
  rupee: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.base,
    fontWeight: '700',
  },
  priceInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.base,
    fontWeight: '700',
  },
  perHour: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizes.xs,
  },
  courtPriceGrid: { gap: 8 },
  courtPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  courtLabel: {
    width: 52,
    fontSize: Typography.fontSizes.sm,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  courtsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  courtChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,191,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,191,255,0.25)',
  },
  courtChipText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.electricBlue,
    fontWeight: '600',
  },
});

// ── Main Modal ────────────────────────────────────────────────────────────────
export const AddSlotModal: React.FC<AddSlotModalProps> = ({ visible, onClose, onSave }) => {
  const insets = useSafeAreaInsets();
  const [selectedSport, setSelectedSport] = useState('');
  const [rows, setRows] = useState<TimeSlotRow[]>([makeRow()]);
  const [facilitiesRules, setFacilitiesRules] = useState<FacilitiesRulesData>({ facilities: [], rules: [] });
  const [frSheetVisible, setFrSheetVisible] = useState(false);
  const [customSports, setCustomSports] = useState<SportEntry[]>([]);
  const [customSportName, setCustomSportName] = useState('');
  const [customSportError, setCustomSportError] = useState('');
  const [courtName, setCourtName] = useState('');
  const [slotDate, setSlotDate] = useState('');

  React.useEffect(() => {
    if (visible) loadCustomSports().then(setCustomSports).catch(() => {});
  }, [visible]);

  const reset = useCallback(() => {
    setSelectedSport('');
    setRows([makeRow()]);
    setFacilitiesRules({ facilities: [], rules: [] });
    setCustomSportName('');
    setCustomSportError('');
    setCourtName('');
    setSlotDate('');
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const updateRow = useCallback((id: string, patch: Partial<TimeSlotRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, makeRow()]);
  }, []);

  const effectiveSport = selectedSport === OTHERS_KEY ? customSportName.trim() : selectedSport;
  const selectedSportEntry = SPORTS_WITH_OTHERS.find((s) => s.key === selectedSport)
    ?? customSports.find((s) => s.key === selectedSport);
  const isPool = selectedSportEntry?.isPool ?? false;

  const validate = useCallback((): string | null => {
    if (!selectedSport) return 'Please select a sport.';
    if (selectedSport === OTHERS_KEY && !customSportName.trim()) return 'Please enter a custom sport name.';
    if (!courtName.trim()) return 'Please enter a court / lane name.';
    if (!slotDate.trim()) return 'Please enter a booking date.';
    const dateParts = slotDate.split('/');
    if (dateParts.length !== 3 || dateParts.some((p) => isNaN(Number(p)))) {
      return 'Date format must be DD/MM/YYYY (e.g. 25/06/2025).';
    }
    const [d, m, y] = dateParts.map(Number);
    if (m < 1 || m > 12 || d < 1 || d > 31 || y < 2024) {
      return 'Please enter a valid date in DD/MM/YYYY format.';
    }
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.startTime) return `Slot ${i + 1}: Select a start time.`;
      if (!r.endTime) return `Slot ${i + 1}: Select an end time.`;
      if (timeToMinutes(r.endTime) <= timeToMinutes(r.startTime))
        return `Slot ${i + 1}: End time must be after start time.`;
      const n = parseInt(r.courts, 10);
      if (isNaN(n) || n < 1) return `Slot ${i + 1}: Enter a valid courts count.`;
      if (r.samePrice || n === 1) {
        if (!r.commonPrice || isNaN(parseFloat(r.commonPrice)))
          return `Slot ${i + 1}: Enter a valid price.`;
      } else {
        for (let c = 0; c < n; c++) {
          if (!r.prices[c] || isNaN(parseFloat(r.prices[c])))
            return `Slot ${i + 1}, Court ${c + 1}: Enter a valid price.`;
        }
      }
    }
    for (let i = 0; i < rows.length - 1; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        const a = rows[i], b = rows[j];
        if (!a.startTime || !b.startTime) continue;
        const aStart = timeToMinutes(a.startTime), aEnd = timeToMinutes(a.endTime);
        const bStart = timeToMinutes(b.startTime), bEnd = timeToMinutes(b.endTime);
        if (aStart < bEnd && bStart < aEnd) {
          return `Slots ${i + 1} and ${j + 1} have overlapping times.`;
        }
      }
    }
    return null;
  }, [selectedSport, customSportName, rows]);

  const handleSave = useCallback(async () => {
    const err = validate();
    if (err) {
      Alert.alert('Validation Error', err);
      return;
    }

    let sportName = effectiveSport;
    if (selectedSport === OTHERS_KEY && customSportName.trim()) {
      const updated = await saveCustomSport(customSportName.trim(), customSports);
      if (updated) setCustomSports(updated);
    }

    // Convert DD/MM/YYYY → YYYY-MM-DD for Supabase
    const [day, month, year] = slotDate.split('/');
    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    // Get current user id
    const { data: userData } = await supabase.auth.getUser();
    const ownerId = userData?.user?.id;

    // Build insert rows (one per time slot row)
    const inserts = rows.map((r) => {
      const n = parseInt(r.courts, 10);
      const priceVal =
        r.samePrice || n === 1 ? r.commonPrice : r.prices.filter(Boolean).join(',');
      return {
        owner_id: ownerId,
        sport: sportName,
        court_name: courtName.trim(),
        slot_date: formattedDate,
        start_time: r.startTime,
        end_time: r.endTime,
        total_slots: n,
        price: priceVal,
        facilities: facilitiesRules.facilities,
        rules: facilitiesRules.rules,
      };
    });

    const { error: dbError } = await supabase.from('slots').insert(inserts);
    if (dbError) {
      Alert.alert('Save Failed', `Could not save slot: ${dbError.message}`);
      return;
    }

    // Notify parent
    const data: SlotData = {
      sport: sportName,
      courtName: courtName.trim(),
      slotDate,
      slots: rows.map((r) => {
        const n = parseInt(r.courts, 10);
        const unitLabel = isPool
          ? n > 1 ? 'Lane' : 'Pool Session'
          : n > 1 ? 'Court' : 'Slot';
        const courts = Array.from({ length: n }, (_, i) => ({
          label: n > 1 ? `${unitLabel} ${i + 1}` : unitLabel,
          price:
            r.samePrice || n === 1
              ? `₹${r.commonPrice}/hr`
              : `₹${r.prices[i] ?? r.commonPrice}/hr`,
        }));
        return { startTime: r.startTime, endTime: r.endTime, courts };
      }),
      facilities: facilitiesRules.facilities,
      rules: facilitiesRules.rules,
    };
    onSave(data);
    reset();
    onClose();
  }, [
    validate, effectiveSport, selectedSport, customSportName, customSports,
    courtName, slotDate, rows, isPool, facilitiesRules, onSave, onClose, reset,
  ]);

  const allSportsForDisplay = [
    ...SPORTS_WITH_OTHERS,
    ...customSports.filter((cs) => !PREDEFINED_SPORTS.some((p) => p.key === cs.key)),
  ];
  const sport = allSportsForDisplay.find((s) => s.key === selectedSport);
  const frCount = facilitiesRules.facilities.length + facilitiesRules.rules.length;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Add New Slot</Text>
              <Text style={styles.subtitle}>Sport · Date · Court · Time · Pricing</Text>
            </View>
            <Pressable onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Sport Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Sport</Text>
              <View style={styles.sportsGrid}>
                {allSportsForDisplay.map((s) => {
                  const isActive = selectedSport === s.key;
                  const displayLabel = s.key === OTHERS_KEY ? 'Others' : s.key;
                  return (
                    <Pressable
                      key={s.key}
                      style={[
                        styles.sportCard,
                        { borderColor: isActive ? s.color : s.color + '30', backgroundColor: isActive ? s.color + '18' : Colors.bgCard },
                      ]}
                      onPress={() => {
                        setSelectedSport(s.key);
                        setCustomSportName('');
                        setCustomSportError('');
                      }}
                    >
                      {isActive && (
                        <LinearGradient colors={[s.color + '20', s.color + '06']} style={StyleSheet.absoluteFillObject} />
                      )}
                      <MaterialCommunityIcons name={s.icon as any} size={28} color={isActive ? s.color : s.color + '80'} />
                      <Text style={[styles.sportCardLabel, isActive && { color: s.color }]}>{displayLabel}</Text>
                      {isActive && (
                        <View style={[styles.sportCheck, { backgroundColor: s.color }]}>
                          <MaterialIcons name="check" size={10} color={Colors.bgPrimary} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Others — custom sport name input */}
              {selectedSport === OTHERS_KEY && (
                <View style={styles.othersInputWrap}>
                  <View style={styles.othersInputRow}>
                    <TextInput
                      style={[styles.othersInput, customSportError ? { borderColor: Colors.error } : null]}
                      value={customSportName}
                      onChangeText={(v) => { setCustomSportName(v); setCustomSportError(''); }}
                      placeholder="Enter sport name (e.g. Pickleball)"
                      placeholderTextColor={Colors.textMuted}
                      returnKeyType="done"
                      maxLength={40}
                    />
                    <MaterialCommunityIcons name="pencil" size={16} color={Colors.textMuted} style={{ marginRight: 4 }} />
                  </View>
                  {customSportError ? (
                    <Text style={styles.othersError}>{customSportError}</Text>
                  ) : null}
                  {/* Previously saved custom sports as suggestions */}
                  {customSports.length > 0 && (
                    <View style={styles.suggestionsWrap}>
                      <Text style={styles.suggestionsLabel}>Recent:</Text>
                      <View style={styles.suggestionsRow}>
                        {customSports.map((cs) => (
                          <Pressable
                            key={cs.key}
                            style={styles.suggestionChip}
                            onPress={() => setCustomSportName(cs.key)}
                          >
                            <Text style={styles.suggestionChipText}>{cs.key}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Slot rows */}
            {selectedSport && (selectedSport !== OTHERS_KEY || effectiveSport) ? (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>
                    {selectedSport === OTHERS_KEY ? effectiveSport : (sport?.key ?? selectedSport)} Time Slots
                  </Text>
                  <View style={[styles.sportDot, { backgroundColor: sport?.color ?? '#A78BFA' }]} />
                </View>

                {/* Court / Lane Name */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Court / Lane Name</Text>
                  <View style={[styles.othersInputRow, { borderColor: courtName.trim() ? 'rgba(0,255,136,0.35)' : Colors.border }]}>
                    <MaterialCommunityIcons name="door-open" size={16} color={Colors.textMuted} />
                    <TextInput
                      style={[styles.othersInput, { marginLeft: 8 }]}
                      value={courtName}
                      onChangeText={setCourtName}
                      placeholder="e.g. Court 1, Turf A, Swimming Lane 2"
                      placeholderTextColor={Colors.textMuted}
                      returnKeyType="done"
                      maxLength={50}
                    />
                  </View>
                </View>

                {/* Booking Date */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Booking Date</Text>
                  <View style={[styles.othersInputRow, { borderColor: slotDate.trim() ? 'rgba(0,191,255,0.35)' : Colors.border }]}>
                    <MaterialIcons name="calendar-today" size={16} color={Colors.electricBlue} />
                    <TextInput
                      style={[styles.othersInput, { marginLeft: 8, flex: 1 }]}
                      value={slotDate}
                      onChangeText={setSlotDate}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      maxLength={10}
                      returnKeyType="done"
                    />
                    <Pressable
                      hitSlop={8}
                      onPress={() => {
                        const now = new Date();
                        const dd = String(now.getDate()).padStart(2, '0');
                        const mm = String(now.getMonth() + 1).padStart(2, '0');
                        const yyyy = now.getFullYear();
                        setSlotDate(`${dd}/${mm}/${yyyy}`);
                      }}
                    >
                      <Text style={{ fontSize: 11, color: Colors.neonGreen, fontWeight: '700', paddingRight: 4 }}>Today</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.slotList}>
                  {rows.map((row, idx) => (
                    <SlotRow
                      key={row.id}
                      row={row}
                      index={idx}
                      canRemove={rows.length > 1}
                      onUpdate={updateRow}
                      onRemove={removeRow}
                      isPool={isPool}
                    />
                  ))}
                </View>

                {rows.length < 6 && (
                  <Pressable style={styles.addMoreBtn} onPress={addRow}>
                    <MaterialIcons name="add" size={18} color={Colors.neonGreen} />
                    <Text style={styles.addMoreText}>Add Another Time Slot</Text>
                  </Pressable>
                )}

                {/* Facilities & Rules */}
                <Pressable style={styles.frBtn} onPress={() => setFrSheetVisible(true)}>
                  <LinearGradient
                    colors={['rgba(0,191,255,0.08)', 'rgba(0,191,255,0.02)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={styles.frIconWrap}>
                    <MaterialIcons name="sports" size={20} color={Colors.electricBlue} />
                  </View>
                  <View style={styles.frBtnContent}>
                    <Text style={styles.frBtnTitle}>Facilities &amp; Rules</Text>
                    <Text style={styles.frBtnSub}>
                      {frCount > 0
                        ? `${facilitiesRules.facilities.length} facilities · ${facilitiesRules.rules.length} rules configured`
                        : 'Add amenities and booking rules for players'}
                    </Text>
                  </View>
                  {frCount > 0 && (
                    <View style={styles.frBadge}>
                      <Text style={styles.frBadgeText}>{frCount}</Text>
                    </View>
                  )}
                  <MaterialIcons name="chevron-right" size={18} color={Colors.textMuted} />
                </Pressable>
              </View>
            ) : (
              <View style={styles.sportHint}>
                <MaterialCommunityIcons name="arrow-up" size={20} color={Colors.textMuted} />
                <Text style={styles.sportHintText}>Select a sport above to configure time slots</Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.saveBtn, !selectedSport && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!selectedSport}
            >
              <LinearGradient colors={['#00FF88', '#00CC6A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtnGrad}>
                <MaterialIcons name="check" size={18} color={Colors.bgPrimary} />
                <Text style={styles.saveText}>Save Slot</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Facilities & Rules Sheet */}
      <FacilitiesRulesSheet
        visible={frSheetVisible}
        onClose={() => setFrSheetVisible(false)}
        onSave={setFacilitiesRules}
        initial={facilitiesRules}
      />
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
    backgroundColor: '#0E1620',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    maxHeight: '94%',
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
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  section: { gap: Spacing.md },
  sectionTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sportDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sportCard: {
    width: '30%',
    minWidth: 90,
    flex: 1,
    aspectRatio: 1,
    maxHeight: 90,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  sportCardLabel: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sportCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  othersInputWrap: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  othersInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: '#A78BFA40',
    paddingHorizontal: Spacing.md,
  },
  othersInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: Typography.fontSizes.sm,
    color: Colors.textPrimary,
  },
  othersError: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.error,
    marginLeft: 4,
  },
  suggestionsWrap: {
    gap: 6,
    marginTop: 4,
  },
  suggestionsLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionChip: {
    backgroundColor: 'rgba(167,139,250,0.14)',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#A78BFA40',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  suggestionChipText: {
    fontSize: Typography.fontSizes.xs,
    color: '#A78BFA',
    fontWeight: '600',
  },
  slotList: { gap: Spacing.sm },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.25)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(0,255,136,0.04)',
  },
  addMoreText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.neonGreen,
    fontWeight: '700',
  },
  // Facilities & Rules button
  frBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,191,255,0.25)',
    padding: Spacing.md,
    overflow: 'hidden',
  },
  frIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0,191,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frBtnContent: {
    flex: 1,
    gap: 2,
  },
  frBtnTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  frBtnSub: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  frBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.electricBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frBadgeText: {
    fontSize: 11,
    color: Colors.bgPrimary,
    fontWeight: '800',
  },
  sportHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.xl,
  },
  sportHintText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    fontSize: Typography.fontSizes.base,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnGrad: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveText: {
    fontSize: Typography.fontSizes.base,
    color: Colors.bgPrimary,
    fontWeight: '800',
  },
});
