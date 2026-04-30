// PlayArena — Location Picker Component
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { LocationData, LocationService, POPULAR_CITIES } from '@/services/location';

interface LocationPickerProps {
  location: LocationData | null;
  onLocationChange: (location: LocationData) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  location,
  onLocationChange,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const insets = useSafeAreaInsets();

  const filteredCities = search.trim()
    ? POPULAR_CITIES.filter((c) =>
        c.toLowerCase().includes(search.toLowerCase())
      )
    : POPULAR_CITIES;

  const handleAutoDetect = async () => {
    setDetecting(true);
    setPermissionDenied(false);
    try {
      const loc = await LocationService.getCurrentLocation();
      onLocationChange(loc);
      setModalVisible(false);
    } catch {
      setPermissionDenied(true);
    } finally {
      setDetecting(false);
    }
  };

  const handleSelectCity = (city: string) => {
    onLocationChange({ city, area: '', isAutoDetected: false });
    setModalVisible(false);
    setSearch('');
  };

  const displayLabel = location
    ? location.area
      ? `${location.area}, ${location.city}`
      : location.city
    : 'Select Location';

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setModalVisible(true)} hitSlop={4}>
        <MaterialIcons name="location-on" size={14} color={Colors.neonGreen} />
        <Text style={styles.triggerText} numberOfLines={1}>
          {displayLabel}
        </Text>
        {location?.isAutoDetected ? (
          <View style={styles.gpsBadge}>
            <MaterialIcons name="gps-fixed" size={9} color={Colors.neonGreen} />
          </View>
        ) : null}
        <MaterialIcons name="keyboard-arrow-down" size={14} color={Colors.textMuted} />
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Title */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Choose Location</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={12}>
                <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {/* Auto Detect */}
            <Pressable
              style={[styles.autoDetectBtn, permissionDenied && styles.autoDetectDenied]}
              onPress={handleAutoDetect}
              disabled={detecting}
            >
              <LinearGradient
                colors={
                  permissionDenied
                    ? ['rgba(255,71,87,0.12)', 'rgba(255,71,87,0.06)']
                    : ['rgba(0,255,136,0.12)', 'rgba(0,255,136,0.04)']
                }
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.autoDetectIcon}>
                {detecting ? (
                  <ActivityIndicator size="small" color={Colors.neonGreen} />
                ) : (
                  <MaterialIcons
                    name={permissionDenied ? 'location-disabled' : 'my-location'}
                    size={20}
                    color={permissionDenied ? Colors.error : Colors.neonGreen}
                  />
                )}
              </View>
              <View style={styles.autoDetectText}>
                <Text style={[styles.autoDetectTitle, permissionDenied && { color: Colors.error }]}>
                  {detecting
                    ? 'Detecting location...'
                    : permissionDenied
                    ? 'Permission denied'
                    : 'Use current location'}
                </Text>
                <Text style={styles.autoDetectSub}>
                  {permissionDenied
                    ? 'Enable location in device settings'
                    : 'Auto-detect via GPS'}
                </Text>
              </View>
              {!detecting ? (
                <MaterialIcons
                  name="chevron-right"
                  size={18}
                  color={permissionDenied ? Colors.error : Colors.neonGreen}
                />
              ) : null}
            </Pressable>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or select city</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Search */}
            <View style={styles.searchBar}>
              <MaterialIcons name="search" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search city..."
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
              {search.length > 0 ? (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <MaterialIcons name="close" size={16} color={Colors.textMuted} />
                </Pressable>
              ) : null}
            </View>

            {/* City List */}
            <FlatList
              data={filteredCities}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              style={styles.cityList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = location?.city === item && !location.isAutoDetected;
                return (
                  <Pressable
                    style={[styles.cityItem, isSelected && styles.cityItemSelected]}
                    onPress={() => handleSelectCity(item)}
                  >
                    <MaterialIcons
                      name="location-city"
                      size={16}
                      color={isSelected ? Colors.neonGreen : Colors.textMuted}
                    />
                    <Text style={[styles.cityName, isSelected && styles.cityNameSelected]}>
                      {item}
                    </Text>
                    {isSelected ? (
                      <MaterialIcons name="check" size={16} color={Colors.neonGreen} />
                    ) : null}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptySearch}>
                  <Text style={styles.emptySearchText}>No city found for "{search}"</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 200,
  },
  triggerText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
    flexShrink: 1,
  },
  gpsBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(0,255,136,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    backgroundColor: '#111820',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  autoDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.25)',
    padding: Spacing.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  autoDetectDenied: {
    borderColor: 'rgba(255,71,87,0.25)',
  },
  autoDetectIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,255,136,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoDetectText: {
    flex: 1,
    gap: 2,
  },
  autoDetectTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    color: Colors.neonGreen,
  },
  autoDetectSub: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
  },
  divider: {
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 46,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.sm,
  },
  cityList: {
    maxHeight: 300,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    borderRadius: Radius.md,
  },
  cityItemSelected: {
    backgroundColor: 'rgba(0,255,136,0.06)',
  },
  cityName: {
    flex: 1,
    fontSize: Typography.fontSizes.base,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  cityNameSelected: {
    color: Colors.neonGreen,
    fontWeight: '700',
  },
  emptySearch: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptySearchText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizes.sm,
  },
});
