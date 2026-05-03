// PlayArena — Facilities & Rules Bottom Sheet
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface FacilitiesRulesData {
  facilities: string[];
  rules: string[];
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (data: FacilitiesRulesData) => void;
  initial?: FacilitiesRulesData;
}

// ── Presets ───────────────────────────────────────────────────────────────────
const PRESET_FACILITIES = [
  { label: 'Shower', icon: 'shower' },
  { label: 'Parking', icon: 'local-parking' },
  { label: 'Changing Room', icon: 'door-sliding' },
  { label: 'Drinking Water', icon: 'water-drop' },
  { label: 'Floodlights', icon: 'highlight' },
  { label: 'Cafeteria', icon: 'local-cafe' },
  { label: 'First Aid', icon: 'medical-services' },
  { label: 'WiFi', icon: 'wifi' },
];

const PRESET_RULES = [
  'Non-marking shoes only',
  'No outside food or drinks',
  'Nylon clothes required',
  'Booking must be paid in advance',
  'No smoking inside premises',
  'Respect other players',
  'Report equipment damage immediately',
  'Children must be supervised',
];

const TEMPLATE_KEY = '@playarena_fr_templates';

interface Template {
  id: string;
  name: string;
  facilities: string[];
  rules: string[];
}

// ── Chip ──────────────────────────────────────────────────────────────────────
function Chip({
  label,
  selected,
  onPress,
  color = Colors.neonGreen,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
  icon?: string;
}) {
  return (
    <Pressable
      style={[styles.chip, selected && { borderColor: color, backgroundColor: color + '18' }]}
      onPress={onPress}
    >
      {selected && (
        <LinearGradient
          colors={[color + '20', color + '06']}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      {icon ? (
        <MaterialIcons name={icon as any} size={14} color={selected ? color : Colors.textMuted} />
      ) : null}
      <Text style={[styles.chipText, selected && { color }]}>{label}</Text>
      {selected && <MaterialIcons name="check" size={12} color={color} />}
    </Pressable>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export const FacilitiesRulesSheet: React.FC<Props> = ({ visible, onClose, onSave, initial }) => {
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'facilities' | 'rules'>('facilities');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>(initial?.facilities ?? []);
  const [selectedRules, setSelectedRules] = useState<string[]>(initial?.rules ?? []);
  const [customFacility, setCustomFacility] = useState('');
  const [customRule, setCustomRule] = useState('');
  const [customFacilities, setCustomFacilities] = useState<string[]>([]);
  const [customRules, setCustomRules] = useState<string[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [saveTemplateName, setSaveTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Load templates on mount
  React.useEffect(() => {
    if (!visible) return;
    AsyncStorage.getItem(TEMPLATE_KEY).then((raw) => {
      if (raw) setTemplates(JSON.parse(raw));
    }).catch(() => {});
  }, [visible]);

  const toggleFacility = useCallback((f: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  }, []);

  const toggleRule = useCallback((r: string) => {
    setSelectedRules((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  }, []);

  const addCustomFacility = useCallback(() => {
    const val = customFacility.trim();
    if (!val) return;
    setCustomFacilities((prev) => [...prev, val]);
    setSelectedFacilities((prev) => [...prev, val]);
    setCustomFacility('');
  }, [customFacility]);

  const addCustomRule = useCallback(() => {
    const val = customRule.trim();
    if (!val) return;
    setCustomRules((prev) => [...prev, val]);
    setSelectedRules((prev) => [...prev, val]);
    setCustomRule('');
  }, [customRule]);

  const saveTemplate = useCallback(async () => {
    const name = saveTemplateName.trim();
    if (!name) return;
    const t: Template = {
      id: Date.now().toString(),
      name,
      facilities: selectedFacilities,
      rules: selectedRules,
    };
    const updated = [...templates, t];
    setTemplates(updated);
    await AsyncStorage.setItem(TEMPLATE_KEY, JSON.stringify(updated));
    setSaveTemplateName('');
    setShowSaveTemplate(false);
  }, [saveTemplateName, selectedFacilities, selectedRules, templates]);

  const applyTemplate = useCallback((t: Template) => {
    setSelectedFacilities(t.facilities);
    setSelectedRules(t.rules);
    setShowTemplates(false);
  }, []);

  const handleSave = useCallback(() => {
    onSave({ facilities: selectedFacilities, rules: selectedRules });
    onClose();
  }, [selectedFacilities, selectedRules, onSave, onClose]);

  const handleClose = useCallback(() => {
    setShowSaveTemplate(false);
    setShowTemplates(false);
    onClose();
  }, [onClose]);

  const allFacilities = [...PRESET_FACILITIES.map((f) => f.label), ...customFacilities];
  const allRules = [...PRESET_RULES, ...customRules];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Facilities & Rules</Text>
              <Text style={styles.subtitle}>Configure venue details for players</Text>
            </View>
            <Pressable onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>

          {/* Templates row */}
          <View style={styles.templateRow}>
            <Pressable style={styles.templateBtn} onPress={() => setShowTemplates(!showTemplates)}>
              <MaterialIcons name="bookmark" size={14} color={Colors.electricBlue} />
              <Text style={styles.templateBtnText}>Saved Presets ({templates.length})</Text>
            </Pressable>
            <Pressable style={styles.templateBtn} onPress={() => setShowSaveTemplate(!showSaveTemplate)}>
              <MaterialIcons name="save" size={14} color={Colors.warning} />
              <Text style={[styles.templateBtnText, { color: Colors.warning }]}>Save as Preset</Text>
            </Pressable>
          </View>

          {/* Saved templates list */}
          {showTemplates && templates.length > 0 && (
            <View style={styles.templateList}>
              <Text style={styles.templateListTitle}>Apply a saved preset:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.templateChips}>
                  {templates.map((t) => (
                    <Pressable key={t.id} style={styles.templateChip} onPress={() => applyTemplate(t)}>
                      <MaterialIcons name="bookmark" size={12} color={Colors.electricBlue} />
                      <Text style={styles.templateChipText}>{t.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Save template name input */}
          {showSaveTemplate && (
            <View style={styles.saveTemplateRow}>
              <TextInput
                style={styles.saveTemplateInput}
                value={saveTemplateName}
                onChangeText={setSaveTemplateName}
                placeholder="Preset name (e.g. Cricket Setup)"
                placeholderTextColor={Colors.textMuted}
              />
              <Pressable style={styles.saveTemplateBtn} onPress={saveTemplate}>
                <LinearGradient colors={['#FFB800', '#FF8C00']} style={styles.saveTemplateBtnGrad}>
                  <Text style={styles.saveTemplateBtnText}>Save</Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}

          {/* Tab bar */}
          <View style={styles.tabBar}>
            {(['facilities', 'rules'] as const).map((tab) => {
              const active = activeTab === tab;
              const count = tab === 'facilities' ? selectedFacilities.length : selectedRules.length;
              return (
                <Pressable
                  key={tab}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  {active && (
                    <LinearGradient
                      colors={['rgba(0,255,136,0.15)', 'rgba(0,255,136,0.05)']}
                      style={StyleSheet.absoluteFillObject}
                    />
                  )}
                  <MaterialIcons
                    name={tab === 'facilities' ? 'sports' : 'rule'}
                    size={16}
                    color={active ? Colors.neonGreen : Colors.textMuted}
                  />
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {tab === 'facilities' ? 'Facilities' : 'Rules'}
                  </Text>
                  {count > 0 && (
                    <View style={[styles.tabBadge, active && { backgroundColor: Colors.neonGreen }]}>
                      <Text style={[styles.tabBadgeText, active && { color: Colors.bgPrimary }]}>{count}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

            {/* ── Facilities Tab ────────────────────────────────────────────── */}
            {activeTab === 'facilities' && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionLabel}>Predefined Facilities</Text>
                <View style={styles.chipGrid}>
                  {PRESET_FACILITIES.map((f) => (
                    <Chip
                      key={f.label}
                      label={f.label}
                      selected={selectedFacilities.includes(f.label)}
                      onPress={() => toggleFacility(f.label)}
                      icon={f.icon}
                    />
                  ))}
                </View>

                {customFacilities.length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>Custom Added</Text>
                    <View style={styles.chipGrid}>
                      {customFacilities.map((f) => (
                        <Chip
                          key={f}
                          label={f}
                          selected={selectedFacilities.includes(f)}
                          onPress={() => toggleFacility(f)}
                          color={Colors.electricBlue}
                        />
                      ))}
                    </View>
                  </>
                )}

                <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>Add Custom Facility</Text>
                <View style={styles.customInputRow}>
                  <TextInput
                    style={styles.customInput}
                    value={customFacility}
                    onChangeText={setCustomFacility}
                    placeholder="e.g. Swimming Pool"
                    placeholderTextColor={Colors.textMuted}
                    onSubmitEditing={addCustomFacility}
                    returnKeyType="done"
                  />
                  <Pressable style={styles.addBtn} onPress={addCustomFacility}>
                    <LinearGradient colors={['#00BFFF', '#0099CC']} style={styles.addBtnGrad}>
                      <MaterialIcons name="add" size={20} color="#fff" />
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}

            {/* ── Rules Tab ─────────────────────────────────────────────────── */}
            {activeTab === 'rules' && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionLabel}>Predefined Rules</Text>
                <View style={styles.rulesList}>
                  {PRESET_RULES.map((r) => {
                    const selected = selectedRules.includes(r);
                    return (
                      <Pressable
                        key={r}
                        style={[styles.ruleItem, selected && styles.ruleItemSelected]}
                        onPress={() => toggleRule(r)}
                      >
                        {selected && (
                          <LinearGradient
                            colors={['rgba(0,255,136,0.1)', 'rgba(0,255,136,0.03)']}
                            style={StyleSheet.absoluteFillObject}
                          />
                        )}
                        <View style={[styles.ruleCheck, selected && styles.ruleCheckActive]}>
                          {selected && <MaterialIcons name="check" size={12} color={Colors.bgPrimary} />}
                        </View>
                        <Text style={[styles.ruleText, selected && styles.ruleTextSelected]}>{r}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                {customRules.length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>Custom Rules</Text>
                    <View style={styles.rulesList}>
                      {customRules.map((r) => {
                        const selected = selectedRules.includes(r);
                        return (
                          <Pressable
                            key={r}
                            style={[styles.ruleItem, selected && styles.ruleItemSelected, { borderColor: Colors.electricBlue + '40' }]}
                            onPress={() => toggleRule(r)}
                          >
                            <View style={[styles.ruleCheck, selected && { backgroundColor: Colors.electricBlue, borderColor: Colors.electricBlue }]}>
                              {selected && <MaterialIcons name="check" size={12} color={Colors.bgPrimary} />}
                            </View>
                            <Text style={[styles.ruleText, selected && { color: Colors.electricBlue }]}>{r}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                )}

                <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>Add Custom Rule</Text>
                <View style={styles.customInputRow}>
                  <TextInput
                    style={styles.customInput}
                    value={customRule}
                    onChangeText={setCustomRule}
                    placeholder="e.g. Helmets mandatory"
                    placeholderTextColor={Colors.textMuted}
                    onSubmitEditing={addCustomRule}
                    returnKeyType="done"
                    multiline={false}
                  />
                  <Pressable style={styles.addBtn} onPress={addCustomRule}>
                    <LinearGradient colors={['#00BFFF', '#0099CC']} style={styles.addBtnGrad}>
                      <MaterialIcons name="add" size={20} color="#fff" />
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Summary + Save */}
          <View style={styles.footer}>
            <View style={styles.footerSummary}>
              <View style={styles.summaryChip}>
                <MaterialIcons name="sports" size={12} color={Colors.neonGreen} />
                <Text style={styles.summaryChipText}>{selectedFacilities.length} facilities</Text>
              </View>
              <View style={styles.summaryChip}>
                <MaterialIcons name="rule" size={12} color={Colors.electricBlue} />
                <Text style={[styles.summaryChipText, { color: Colors.electricBlue }]}>{selectedRules.length} rules</Text>
              </View>
            </View>
            <Pressable style={styles.saveBtn} onPress={handleSave}>
              <LinearGradient colors={['#00FF88', '#00CC6A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtnGrad}>
                <MaterialIcons name="check" size={18} color={Colors.bgPrimary} />
                <Text style={styles.saveBtnText}>Apply</Text>
              </LinearGradient>
            </Pressable>
          </View>
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
    maxHeight: '90%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
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
  // Templates
  templateRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  templateBtnText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.electricBlue,
    fontWeight: '600',
  },
  templateList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  templateListTitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  templateChips: {
    flexDirection: 'row',
    gap: 8,
  },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0,191,255,0.3)',
    backgroundColor: 'rgba(0,191,255,0.08)',
  },
  templateChipText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.electricBlue,
    fontWeight: '600',
  },
  saveTemplateRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  saveTemplateInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.sm,
  },
  saveTemplateBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  saveTemplateBtnGrad: {
    height: 40,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveTemplateBtnText: {
    color: Colors.bgPrimary,
    fontWeight: '800',
    fontSize: Typography.fontSizes.sm,
  },
  // Tabs
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    overflow: 'hidden',
  },
  tabActive: {
    borderColor: 'rgba(0,255,136,0.3)',
  },
  tabText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.neonGreen,
  },
  tabBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  // Content
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  tabContent: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    overflow: 'hidden',
  },
  chipText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  rulesList: {
    gap: 6,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    overflow: 'hidden',
  },
  ruleItemSelected: {
    borderColor: 'rgba(0,255,136,0.3)',
  },
  ruleCheck: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ruleCheckActive: {
    backgroundColor: Colors.neonGreen,
    borderColor: Colors.neonGreen,
  },
  ruleText: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  ruleTextSelected: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  customInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  customInput: {
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
  addBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  addBtnGrad: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerSummary: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,255,136,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.2)',
  },
  summaryChipText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.neonGreen,
    fontWeight: '700',
  },
  saveBtn: {
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  saveBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  saveBtnText: {
    color: Colors.bgPrimary,
    fontWeight: '800',
    fontSize: Typography.fontSizes.base,
  },
});
