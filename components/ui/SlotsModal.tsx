// PlayArena — Slots Modal (Ground Owner: view, edit, delete)
import React, { useEffect, useState, useCallback } from 'react';
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
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';

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

// ── Edit Sheet (sub-component) ────────────────────────────────────────────────
interface EditSheetProps {
  slot: Slot;
  onCancel: () => void;
  onSaved: (updated: Slot) => void;
}

function EditSheet({ slot, onCancel, onSaved }: EditSheetProps) {
  const [courtName, setCourtName] = useState(slot.court_name);
  const [slotDate, setSlotDate] = useState(formatDate(slot.slot_date));
  const [price, setPrice] = useState(slot.price);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!courtName.trim()) {
      Alert.alert('Validation', 'Court name is required.');
      return;
    }
    if (!slotDate.trim()) {
      Alert.alert('Validation', 'Date is required.');
      return;
    }
    const parts = slotDate.split('/');
    if (parts.length !== 3 || parts.some((p) => isNaN(Number(p)))) {
      Alert.alert('Validation', 'Date format must be DD/MM/YYYY.');
      return;
    }
    const [d, m, y] = parts;
    const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;

    setSaving(true);
    const { data, error } = await supabase
      .from('slots')
      .update({ court_name: courtName.trim(), slot_date: iso, price: price.trim() })
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
        />
      </View>

      <Text style={es.label}>Booking Date (DD/MM/YYYY)</Text>
      <View style={es.inputRow}>
        <MaterialIcons name="calendar-today" size={16} color={Colors.electricBlue} />
        <TextInput
          style={es.input}
          value={slotDate}
          onChangeText={setSlotDate}
          placeholder="DD/MM/YYYY"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          maxLength={10}
        />
      </View>

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
        />
      </View>

      <View style={es.actions}>
        <Pressable style={es.cancelBtn} onPress={onCancel}>
          <Text style={es.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable style={es.saveBtn} onPress={handleSave} disabled={saving}>
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
          <MaterialIcons name="people" size={12} color={Colors.electricBlue} />
          <Text style={sc.slotCountText}>{slot.total_slots} slot{slot.total_slots !== 1 ? 's' : ''}</Text>
        </View>
        {facilities.length > 0 && (
          <View style={sc.facilitiesChip}>
            <MaterialIcons name="sports" size={12} color='#A78BFA' />
            <Text style={sc.facilitiesText}>{facilities.length} facilit{facilities.length > 1 ? 'ies' : 'y'}</Text>
          </View>
        )}
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
      {!isEditing && (
        <View style={sc.actions}>
          <Pressable style={sc.editBtn} onPress={() => onEdit(slot)} hitSlop={6}>
            <MaterialIcons name="edit" size={14} color={Colors.electricBlue} />
            <Text style={sc.editText}>Edit</Text>
          </Pressable>
          <Pressable style={sc.deleteBtn} onPress={() => onDelete(slot.id)} hitSlop={6}>
            <MaterialIcons name="delete-outline" size={14} color={Colors.error} />
            <Text style={sc.deleteText}>Delete</Text>
          </Pressable>
        </View>
      )}

      {/* Inline edit form */}
      {isEditing && (
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
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('slots')
      .select('*')
      .eq('owner_id', user.id)
      .order('slot_date', { ascending: true });
    setLoading(false);
    if (error) {
      Alert.alert('Error', `Could not load slots: ${error.message}`);
      return;
    }
    setSlots((data ?? []) as Slot[]);
  }, [user?.id]);

  useEffect(() => {
    if (visible) {
      setEditingId(null);
      fetchSlots();
    }
  }, [visible, fetchSlots]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete Slot', 'This slot will be permanently removed. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('slots').delete().eq('id', id);
          if (error) {
            Alert.alert('Delete Failed', error.message);
          } else {
            setSlots((prev) => prev.filter((s) => s.id !== id));
          }
        },
      },
    ]);
  }, []);

  const handleEditSaved = useCallback((updated: Slot) => {
    setSlots((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
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
                {slots.length > 0 ? `${slots.length} slot${slots.length > 1 ? 's' : ''} found` : 'All saved slots'}
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
                  Add your first slot using the "Add Slot" button on the dashboard.
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
