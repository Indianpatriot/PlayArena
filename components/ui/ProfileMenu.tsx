// PlayArena — Profile Menu Bottom Sheet
import React, {useState,useCallback,useEffect,} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { AuthUser } from '@/services/auth';
import { supabase } from '@/services/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ProfileMenuProps {
  visible: boolean;
  onClose: () => void;
  user: AuthUser | null;
  onLogout: () => void;
}

type SubScreen =
  | null
  | 'playerProfile'
  | 'playerBookings'
  | 'ownerProfile'
  | 'ownerOrders'
  | 'ownerSports';

// ── Booking/Order mock structures ─────────────────────────────────────────────
interface Booking {
  id: string;
  venueName: string;
  sport: string;
  date: string;
  time: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  amount: string;
}

interface Order {
  id: string;
  customerName: string;
  sport: string;
  date: string;
  time: string;
  revenue: string;
  status: 'confirmed' | 'completed' | 'cancelled';
}



const OWNER_SPORTS = [
  { key: 'cricket', label: 'Cricket', icon: 'cricket', color: '#FFB800' },
  { key: 'football', label: 'Football', icon: 'soccer', color: '#00FF88' },
  { key: 'badminton', label: 'Badminton', icon: 'badminton', color: '#C084FC' },
  { key: 'volleyball', label: 'Volleyball', icon: 'volleyball', color: '#00BFFF' },
];

function slotEndDate(slot?: { slot_date?: string; end_time?: string } | null) {
  if (!slot?.slot_date || !slot?.end_time) return new Date(NaN);
  const match = slot.end_time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  const [y, m, d] = slot.slot_date.split('-').map(Number);
  if (!match || !y || !m || !d) return new Date(NaN);
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return new Date(y, m - 1, d, hours, minutes);
}

// ── Avatar circle ─────────────────────────────────────────────────────────────
function AvatarCircle({ name, role, size = 64 }: { name: string; role: string; size?: number }) {
  const isOwner = role === 'owner';
  return (
    <LinearGradient
      colors={isOwner ? ['#00BFFF', '#0080CC'] : ['#00FF88', '#00CC6A']}
      style={[styles.avatarCircle, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[styles.avatarInitial, { fontSize: size * 0.38 }]}>
        {name?.charAt(0)?.toUpperCase() ?? 'U'}
      </Text>
    </LinearGradient>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: 'confirmed' | 'completed' | 'cancelled' }) {
  const config = {
    confirmed: { color: Colors.electricBlue, bg: 'rgba(0,191,255,0.12)', label: 'Confirmed' },
    completed: { color: Colors.neonGreen, bg: 'rgba(0,255,136,0.12)', label: 'Completed' },
    cancelled: { color: Colors.error, bg: 'rgba(255,71,87,0.12)', label: 'Cancelled' },
  };
  const c = config[status];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

// ── Section Header (inside sub-screens) ──────────────────────────────────────
function SubScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.subHeader}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
        <MaterialIcons name="arrow-back-ios" size={16} color={Colors.textPrimary} />
      </Pressable>
      <Text style={styles.subHeaderTitle}>{title}</Text>
      <View style={{ width: 32 }} />
    </View>
  );
}

// ── Player Profile Sub-screen ─────────────────────────────────────────────────
function PlayerProfileScreen({ user, onBack }: { user: AuthUser | null; onBack: () => void }) {
  const [name, setName] = useState(user?.name ?? '');
  const [age, setAge] = useState('');
  const [sports, setSports] = useState<string[]>(['Football', 'Cricket']);

  const allSports = ['Football', 'Cricket', 'Badminton', 'Tennis', 'Basketball', 'Table Tennis'];

  const toggleSport = (s: string) => {
    setSports((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  return (
    <View style={styles.subScreen}>
      <SubScreenHeader title="My Profile" onBack={onBack} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.subContent}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <AvatarCircle name={name} role="player" size={80} />
          <Pressable style={styles.editAvatarBtn}>
            <MaterialIcons name="photo-camera" size={14} color={Colors.bgPrimary} />
          </Pressable>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        {/* Fields */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Full Name</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor={Colors.textMuted}
              placeholder="Enter your name"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Age</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="e.g. 24"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Email</Text>
          <View style={[styles.inputWrap, styles.inputDisabled]}>
            <Text style={styles.inputDisabledText}>{user?.email ?? '—'}</Text>
          </View>
        </View>

        {/* Preferred Sports */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Preferred Sports</Text>
          <View style={styles.sportsGrid}>
            {allSports.map((s) => {
              const active = sports.includes(s);
              return (
                <Pressable
                  key={s}
                  style={[styles.sportTag, active && styles.sportTagActive]}
                  onPress={() => toggleSport(s)}
                >
                  <Text style={[styles.sportTagText, active && styles.sportTagTextActive]}>{s}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Save */}
        <Pressable style={styles.saveBtn}>
          <LinearGradient colors={['#00FF88', '#00CC6A']} style={styles.saveBtnGrad}>
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ── Player Bookings Sub-screen ────────────────────────────────────────────────
function PlayerBookingsScreen({
  onBack,
  user,
}: {
  onBack: () => void;
  user: AuthUser | null;
}) {
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      if (!user?.id) return;

      const {
        data,
        error,
      } = await supabase
        .from('bookings')
        .select(`
          *,
          slots (
            sport,
            court_name,
            slot_date,
            start_time,
            end_time,
            price
          ),
          player:profiles!bookings_player_id_fkey (
            full_name
          )
        `)
        .eq(
          user.role === 'owner'
            ? 'owner_id'
            : 'player_id',
          user.id
        )
        .order(
          'booking_date',
          {
            ascending: false,
          }
        );

      if (error)
        throw error;

      setAllBookings(data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const upcomingBookings = allBookings.filter(
    (booking: any) =>
      booking.slots &&
      slotEndDate(booking.slots) > now &&
      booking.status !== 'cancelled'
  );
  
  const previousBookings = allBookings.filter(
    (booking: any) =>
      booking.status === 'completed' || 
      (booking.slots && slotEndDate(booking.slots) < now)
  );

  const displayBookings = tabIndex === 0 ? upcomingBookings : previousBookings;

  const renderBookingCard = (b: any) => (
    <View key={b.id} style={styles.historyCard}>
      <View style={styles.historyCardRow}>
        <View style={styles.historyInfo}>
          <Text style={styles.historyVenue}>
            {user?.role === 'owner'
              ? b.player?.full_name
              : b.slots?.court_name}
          </Text>
          <Text style={styles.historySport}>
            {b.slots?.sport}
          </Text>
          <Text style={styles.historyDateTime}>
            {b.slots?.slot_date}
          </Text>
          <Text style={styles.historyDateTime}>
            {b.slots?.start_time} - {b.slots?.end_time}
          </Text>
        </View>
        <View style={styles.historyRight}>
          <Text style={styles.historyAmount}>
            ₹{b.slots?.price}
          </Text>
          <StatusBadge status={b.status} />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.subScreen}>
      <SubScreenHeader
        title={tabIndex === 0 ? 'Upcoming Bookings' : 'Previous Bookings'}
        onBack={onBack}
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { label: 'Upcoming', icon: 'schedule' },
          { label: 'Previous', icon: 'history' },
        ].map((tab, idx) => (
          <Pressable
            key={tab.label}
            style={[
              styles.tab,
              tabIndex === idx && styles.tabActive,
            ]}
            onPress={() => setTabIndex(idx)}
          >
            <MaterialIcons
              name={tab.icon as any}
              size={16}
              color={tabIndex === idx ? Colors.neonGreen : Colors.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                tabIndex === idx && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.subContent}
      >
        {loading ? (
          <Text style={{ color: 'white' }}>
            Loading...
          </Text>
        ) : displayBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons
              name={tabIndex === 0 ? 'schedule' : 'history'}
              size={32}
              color={Colors.textMuted}
            />
            <Text style={styles.emptyTitle}>
              {tabIndex === 0
                ? 'No upcoming bookings'
                : 'No previous bookings'}
            </Text>
          </View>
        ) : (
          displayBookings.map(renderBookingCard)
        )}
      </ScrollView>
    </View>
  );
}

// ── Owner Profile Sub-screen ──────────────────────────────────────────────────
function OwnerProfileScreen({ user, onBack }: { user: AuthUser | null; onBack: () => void }) {
  const [ownerName, setOwnerName] = useState(user?.name ?? '');
  const [turfName, setTurfName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, turf_name, location, phone')
        .eq('id', user.id)
        .maybeSingle();
      if (error) {
        Alert.alert('Profile Error', error.message);
        return;
      }
      setOwnerName(data?.full_name ?? user.name ?? '');
      setTurfName(data?.turf_name ?? '');
      setLocation(data?.location ?? '');
      setPhone(data?.phone ?? '');
    }
    loadProfile();
  }, [user?.id, user?.name]);

  const saveProfile = async () => {
    if (!user?.id || saving) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: ownerName.trim() || null,
        turf_name: turfName.trim() || null,
        location: location.trim() || null,
        phone: phone.trim() || null,
      })
      .eq('id', user.id);
    setSaving(false);
    if (error) Alert.alert('Save Failed', error.message);
    else Alert.alert('Saved', 'Owner details updated.');
  };

  return (
    <View style={styles.subScreen}>
      <SubScreenHeader title="Owner Profile" onBack={onBack} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.subContent}>
        <View style={styles.avatarSection}>
          <AvatarCircle name={ownerName} role="owner" size={80} />
          <Pressable style={[styles.editAvatarBtn, { backgroundColor: Colors.electricBlue }]}>
            <MaterialIcons name="photo-camera" size={14} color={Colors.bgPrimary} />
          </Pressable>
          <Text style={styles.avatarHint}>Business profile photo</Text>
        </View>

        <Text style={styles.sectionGroupLabel}>Owner Details</Text>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Full Name</Text>
          <View style={styles.inputWrap}>
            <TextInput style={styles.input} value={ownerName} onChangeText={setOwnerName} placeholder="Owner name" placeholderTextColor={Colors.textMuted} />
          </View>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Phone</Text>
          <View style={styles.inputWrap}>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+91 XXXXX XXXXX" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />
          </View>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Email</Text>
          <View style={[styles.inputWrap, styles.inputDisabled]}>
            <Text style={styles.inputDisabledText}>{user?.email ?? '—'}</Text>
          </View>
        </View>

        <Text style={[styles.sectionGroupLabel, { marginTop: Spacing.lg }]}>Turf Details</Text>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Ground Name</Text>
          <View style={styles.inputWrap}>
            <TextInput style={styles.input} value={turfName} onChangeText={setTurfName} placeholder="e.g. Green Arena" placeholderTextColor={Colors.textMuted} />
          </View>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Location</Text>
          <View style={styles.inputWrap}>
            <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="City, Area" placeholderTextColor={Colors.textMuted} />
          </View>
        </View>

        <Pressable style={styles.saveBtn} onPress={saveProfile} disabled={saving}>
          <LinearGradient colors={['#00BFFF', '#0099CC']} style={styles.saveBtnGrad}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

    

// ── Owner Sports Managed ──────────────────────────────────────────────────────
function OwnerSportsScreen({ onBack }: { onBack: () => void }) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    cricket: true,
    football: true,
    badminton: false,
    volleyball: false,
  });

  return (
    <View style={styles.subScreen}>
      <SubScreenHeader title="Sports Managed" onBack={onBack} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.subContent}>
        <Text style={styles.sportsInfo}>
          Enable the sports available at your ground. Players will see these options when booking.
        </Text>
        {OWNER_SPORTS.map((s) => {
          const isOn = enabled[s.key] ?? false;
          return (
            <View key={s.key} style={[styles.sportToggleRow, { borderColor: isOn ? s.color + '30' : Colors.border }]}>
              <LinearGradient
                colors={isOn ? [s.color + '10', s.color + '04'] : ['transparent', 'transparent']}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={[styles.sportToggleIcon, { backgroundColor: s.color + '15', borderColor: s.color + '30' }]}>
                <MaterialCommunityIcons name={s.icon as any} size={24} color={s.color} />
              </View>
              <View style={styles.sportToggleInfo}>
                <Text style={[styles.sportToggleName, isOn && { color: s.color }]}>{s.label}</Text>
                <Text style={styles.sportToggleStatus}>{isOn ? 'Active on your ground' : 'Not listed'}</Text>
              </View>
              <Switch
                value={isOn}
                onValueChange={(val) => setEnabled((prev) => ({ ...prev, [s.key]: val }))}
                trackColor={{ false: Colors.border, true: s.color + '60' }}
                thumbColor={isOn ? s.color : Colors.textMuted}
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── Main ProfileMenu ──────────────────────────────────────────────────────────
export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  visible,
  onClose,
  user,
  onLogout,
}) => {
  const insets = useSafeAreaInsets();
  const [subScreen, setSubScreen] = useState<SubScreen>(null);
  const isOwner = user?.role === 'owner';

  const handleClose = useCallback(() => {
    setSubScreen(null);
    onClose();
  }, [onClose]);

  const handleLogout = useCallback(() => {
    handleClose();
    onLogout();
  }, [handleClose, onLogout]);

  // ── Player menu items ──────────────────────────────────────────────────────
  const playerItems = [
    {
      icon: 'person-outline',
      label: 'Profile',
      sub: 'Edit name, age, preferred sports',
      color: Colors.neonGreen,
      onPress: () => setSubScreen('playerProfile'),
    },
    {
      icon: 'history',
      label: 'Previous Bookings',
      sub: 'View booking history & details',
      color: Colors.electricBlue,
      onPress: () => setSubScreen('playerBookings'),
    },
  ];

  // ── Owner menu items ───────────────────────────────────────────────────────
  const ownerItems = [
    {
      icon: 'business',
      label: 'Owner Profile',
      sub: 'Edit owner & turf details',
      color: Colors.electricBlue,
      onPress: () => setSubScreen('ownerProfile'),
    },
    {
      icon: 'receipt-long',
      label: 'Previous Bookings',
      sub: 'Player booking history',
      color: Colors.warning,
      onPress: () =>
        setSubScreen(
          'playerBookings'
        ),
    },
    {
      icon: 'sports',
      label: 'Sports Managed',
      sub: 'Cricket, Football, Badminton...',
      color: '#C084FC',
      onPress: () => setSubScreen('ownerSports'),
    },
  ];

  const menuItems = isOwner ? ownerItems : playerItems;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* ── Sub-screens ─────────────────────────────────────────────────── */}
          {subScreen !== null ? (
            <View
              style={{
                flex: 1,
                paddingBottom: insets.bottom + 20,
              }}
            >
              {subScreen === 'playerProfile' && (
                <PlayerProfileScreen
                  user={user}
                  onBack={() => setSubScreen(null)}
                />
              )}

              {subScreen ===
                'playerBookings' && (
                <PlayerBookingsScreen
                  user={user}
                  onBack={() =>
                    setSubScreen(null)
                  }
                />
              )}

              {subScreen === 'ownerProfile' && (
                <OwnerProfileScreen
                  user={user}
                  onBack={() => setSubScreen(null)}
                />
              )}



              {subScreen === 'ownerSports' && (
                <OwnerSportsScreen
                  onBack={() => setSubScreen(null)}
                />
              )}
            </View>
          ) : null}

          {/* ── Main Menu ───────────────────────────────────────────────────── */}
          {subScreen === null ? (
            <>
              {/* User header */}
              <View style={styles.userHeader}>
                <AvatarCircle name={user?.name ?? 'U'} role={user?.role ?? 'player'} size={60} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
                  <View style={styles.roleChip}>
                    <View style={[styles.roleDot, { backgroundColor: isOwner ? Colors.electricBlue : Colors.neonGreen }]} />
                    <Text style={[styles.roleText, { color: isOwner ? Colors.electricBlue : Colors.neonGreen }]}>
                      {isOwner ? 'Ground Owner' : 'Player'}
                    </Text>
                  </View>
                  <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.menuDivider} />

              {/* Menu items */}
              <View style={styles.menuList}>
                {menuItems.map((item) => (
                  <Pressable
                    key={item.label}
                    style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                    onPress={item.onPress}
                    hitSlop={4}
                  >
                    <View style={[styles.menuIconWrap, { backgroundColor: item.color + '15' }]}>
                      <MaterialIcons name={item.icon as any} size={20} color={item.color} />
                    </View>
                    <View style={styles.menuItemText}>
                      <Text style={styles.menuItemLabel}>{item.label}</Text>
                      <Text style={styles.menuItemSub}>{item.sub}</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={18} color={Colors.textMuted} />
                  </Pressable>
                ))}
              </View>

              {/* Divider */}
              <View style={styles.menuDivider} />

              {/* Logout */}
              <Pressable
                style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}
                onPress={handleLogout}
                hitSlop={4}
              >
                <View style={styles.logoutIconWrap}>
                  <MaterialIcons name="logout" size={20} color={Colors.error} />
                </View>
                <Text style={styles.logoutText}>Logout</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const StyleSheet_create = StyleSheet.create;
const styles = StyleSheet_create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheet: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    backgroundColor: '#0E1620',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    height: '88%',
    overflow: 'hidden',
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
  // User header
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingBottom: Spacing.md,
  },
  avatarCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#080C10',
    fontWeight: '900',
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  roleText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userEmail: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  // Menu
  menuList: {
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  menuIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    flex: 1,
    gap: 2,
  },
  menuItemLabel: {
    fontSize: Typography.fontSizes.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  menuItemSub: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
  },
  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
  },
  logoutIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,71,87,0.12)',
  },
  logoutText: {
    fontSize: Typography.fontSizes.base,
    fontWeight: '700',
    color: Colors.error,
  },
  // Sub-screens
    subScreen: {
      minHeight: 400,
      maxHeight: '85%',
    },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subHeaderTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subContent: {
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.neonGreen,
  },
  tabLabel: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: Colors.neonGreen,
    fontWeight: '700',
  },
  // Avatar edit
  avatarSection: {
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
    position: 'relative',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 28,
    right: '35%',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.neonGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0E1620',
  },
  avatarHint: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
  },
  // Form fields
  sectionGroupLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    marginTop: Spacing.sm,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.md,
    height: 48,
    justifyContent: 'center',
  },
  input: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.base,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  inputDisabledText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.base,
  },
  // Sports selector
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  sportTag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
  },
  sportTagActive: {
    borderColor: Colors.neonGreen + '60',
    backgroundColor: 'rgba(0,255,136,0.1)',
  },
  sportTagText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  sportTagTextActive: {
    color: Colors.neonGreen,
  },
  // Save button
  saveBtn: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  saveBtnGrad: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: Colors.bgPrimary,
    fontWeight: '800',
    fontSize: Typography.fontSizes.base,
  },
  // History cards
  historyCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
    backgroundColor: Colors.bgCard,
    overflow: 'hidden',
    marginBottom: 4,
  },
  historyCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    gap: Spacing.md,
    padding: Spacing.md,
  },
  historyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(0,255,136,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: {
    flex: 1,
    gap: 3,
  },
  historyVenue: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  historySport: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.neonGreen,
    fontWeight: '600',
  },
  historyDateTime: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  historyAmount: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '800',
    color: Colors.neonGreen,
  },
  // Badge
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  // Revenue summary
  revenueSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,191,255,0.2)',
    padding: Spacing.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  revenueSummaryLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
  },
  revenueSummaryValue: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: '900',
    color: Colors.electricBlue,
  },
  revenueCount: {
    marginLeft: 'auto',
    alignItems: 'center',
  },
  revenueCountNum: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  revenueCountLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
  },
  // Sports managed
  sportsInfo: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textMuted,
    lineHeight: Typography.fontSizes.sm * 1.6,
    marginBottom: Spacing.sm,
  },
  sportToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    overflow: 'hidden',
    marginBottom: 4,
  },
  sportToggleIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportToggleInfo: {
    flex: 1,
    gap: 3,
  },
  sportToggleName: {
    fontSize: Typography.fontSizes.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sportToggleStatus: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  emptyText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
