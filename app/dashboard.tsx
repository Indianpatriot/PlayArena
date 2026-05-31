// PlayArena — Dashboard (Post-Login Landing)
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { GlassCard, LogoBadge, LocationPicker, ProfileMenu, AddSlotModal, SlotData, SlotsModal } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { LocationData } from '@/services/location';
import { PREDEFINED_SPORTS } from '@/constants/sports';
import { supabase } from '@/services/supabase';

const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed', 'completed'];

// ── Sport category definitions ────────────────────────────────────────────────
const SPORT_CATEGORIES = [
  ...PREDEFINED_SPORTS.map((s) => ({ icon: s.icon, label: s.key, color: s.color })),
  { icon: 'dots-horizontal', label: 'Others', color: '#A78BFA' },
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface Venue {
  id: string;
  name: string;
  sport: string;
  rating: number;
  pricePerHour: string;
  price: number;
  distance: string;
  freeSlots: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  city: string;
  courtName: string;
  ownerId: string;
  rules: string[];
}

// ── Placeholder loading skeleton ──────────────────────────────────────────────
function VenueSkeleton() {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonIcon} />
      <View style={styles.skeletonLines}>
        <View style={styles.skeletonLine1} />
        <View style={styles.skeletonLine2} />
      </View>
    </Animated.View>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyVenuesState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="stadium-variant" size={48} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>No venues found</Text>
      <Text style={styles.emptySubtitle}>
        No sports venues available in your selected location yet.
      </Text>
      <Pressable style={styles.retryBtn} onPress={onRetry} hitSlop={8}>
        <Text style={styles.retryText}>Try another location</Text>
      </Pressable>
    </View>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const router = useRouter();

  const [location, setLocation] = useState<LocationData | null>(null);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [addSlotVisible, setAddSlotVisible] = useState(false);
  const [slotsVisible, setSlotsVisible] = useState(false);
  const [bookingsVisible, setBookingsVisible] = useState(false);
  const [savedSlots, setSavedSlots] = useState<SlotData[]>([]);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(contentY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      ]),
    ]).start();
  }, []);

  // Fetch only player-visible slots. Booked slots stay visible in owner views/history.
  const fetchVenues = useCallback(async () => {
    setLoadingVenues(true);

    try {
      const { data: bookedSlots, error: bookingsError } = await supabase
        .from('bookings')
        .select('slot_id')
        .in('status', ACTIVE_BOOKING_STATUSES);

      if (bookingsError) {
        throw bookingsError;
      }

      const bookedSlotIds = (bookedSlots ?? [])
        .map((booking: any) => booking.slot_id)
        .filter(Boolean);

      let slotsQuery = supabase
        .from('slots')
        .select(`
          *,
          owner:profiles!slots_owner_id_fkey (
            turf_name,
            location
          )
        `);

      if (bookedSlotIds.length > 0) {
        slotsQuery = slotsQuery.not('id', 'in', `(${bookedSlotIds.join(',')})`);
      }

      const { data, error } = await slotsQuery;

      if (error) {
        throw error;
      }

      const mappedVenues = (data || []).map((slot: any) => ({
        id: slot.id,
        ownerId: slot.owner_id,
        name: slot.owner?.turf_name || 'Sports Arena',
        city: slot.owner?.location || 'Unknown Location',
        courtName: slot.court_name,
        sport: slot.sport,
        rating: 4.5,
        price: Number(slot.price || 0),
        pricePerHour: `₹${slot.price || 0}/hr`,
        distance: 'Available',
        freeSlots: slot.total_slots || 0,
        slotDate: slot.slot_date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        rules: slot.rules || [],
      }));

      setVenues(mappedVenues);
    } catch (err) {
      console.error('Fetch venues error:', err);
      setVenues([]);
    } finally {
      setLoadingVenues(false);
    }
  }, []);


  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const handleSlotSave = useCallback((data: SlotData) => {
    setSavedSlots((prev) => [...prev, data]);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/welcome');
  }, [logout, router]);

  const isOwner = user?.role === 'owner';
  const handleBookSlot = async (venue: Venue) => {
    router.push({
      pathname: '/checkout' as any,
      params: {
        slot: JSON.stringify(venue),
      },
    });
  };

  useEffect(() => {
    if (isOwner) return;

    const channelName = `player-slot-availability-${user?.id ?? 'guest'}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchVenues();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchVenues, isOwner, user?.id]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0F10', '#080C10']} style={StyleSheet.absoluteFillObject} />

      {/* Sticky Header */}
      <Animated.View
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing.sm, opacity: headerOpacity },
        ]}
      >
        <LinearGradient
          colors={['#0D1A12', '#080C10']}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.headerTop}>
          <LogoBadge size="sm" />

          {/* Avatar → opens ProfileMenu (no logout on tap) */}
          <Pressable
            style={styles.avatarBtn}
            onPress={() => setProfileMenuVisible(true)}
            hitSlop={12}
          >
            <LinearGradient
              colors={isOwner ? ['#00BFFF', '#0080CC'] : ['#00FF88', '#00CC6A']}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Greeting + Location */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeGreeting}>
            {isOwner ? 'Welcome back, Owner' : 'Good day,'}
          </Text>
          <Text style={styles.welcomeName}>{user?.name ?? 'Player'} 👋</Text>
          {!isOwner ? (
            <LocationPicker location={location} onLocationChange={setLocation} />
          ) : null}
        </View>

        {/* Search Bar — players only */}
        {!isOwner ? (
          <Pressable style={styles.searchBar} hitSlop={4}>
            <MaterialIcons name="search" size={20} color={Colors.textMuted} />
            <Text style={styles.searchPlaceholder}>
              Search venues, sports, locations...
            </Text>
            <View style={styles.filterBtn}>
              <MaterialIcons name="tune" size={16} color={Colors.neonGreen} />
            </View>
          </Pressable>
        ) : null}
      </Animated.View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        bounces
      >
        <Animated.View
          style={{ opacity: contentOpacity, transform: [{ translateY: contentY }] }}
        >
          {isOwner ? (
            <OwnerDashboard
              onAddSlot={() => setAddSlotVisible(true)}
              onViewSlots={() => setSlotsVisible(true)}
              onViewBookings={() => setBookingsVisible(true)}
            />
          ) : (
            <PlayerDashboard
              selectedSport={selectedSport}
              onSelectSport={(s) => setSelectedSport(s === selectedSport ? null : s)}
              venues={venues}
              loadingVenues={loadingVenues}
              locationSelected={!!location}
              onRetry={fetchVenues}
              onBookSlot={handleBookSlot}
            />
          )}
        </Animated.View>
      </ScrollView>

      {/* Add Slot Modal */}
      <AddSlotModal
        visible={addSlotVisible}
        onClose={() => setAddSlotVisible(false)}
        onSave={handleSlotSave}
      />

      {/* Slots Modal */}
      <SlotsModal
        visible={slotsVisible}
        onClose={() => setSlotsVisible(false)}
      />

      <OwnerBookingsModal
        visible={bookingsVisible}
        onClose={() => setBookingsVisible(false)}
        ownerId={user?.id}
      />

      {/* Profile Menu */}
      <ProfileMenu
        visible={profileMenuVisible}
        onClose={() => setProfileMenuVisible(false)}
        user={user}
        onLogout={handleLogout}
      />
    </View>
    
  );
}

// ── Player Dashboard ──────────────────────────────────────────────────────────
interface PlayerDashboardProps {
  selectedSport: string | null;
  onSelectSport: (sport: string) => void;
  venues: Venue[];
  loadingVenues: boolean;
  locationSelected: boolean;
  onRetry: () => void;
  onBookSlot: (venue: Venue) => void;

}

function PlayerDashboard({
  selectedSport,
  onSelectSport,
  venues,
  loadingVenues,
  locationSelected,
  onRetry,
  onBookSlot,
}: PlayerDashboardProps) {
  return (
    <View>
      {/* Sport Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Browse by Sport</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          nestedScrollEnabled
        >
          {SPORT_CATEGORIES.map((sport) => {
            const isActive = selectedSport === sport.label;
            return (
              <Pressable
                key={sport.label}
                style={[
                  styles.sportChip,
                  { borderColor: isActive ? sport.color : sport.color + '40' },
                  isActive && { backgroundColor: sport.color + '18' },
                ]}
                onPress={() => onSelectSport(sport.label)}
              >
                <LinearGradient
                  colors={[sport.color + (isActive ? '22' : '10'), sport.color + '05']}
                  style={StyleSheet.absoluteFillObject}
                />
                <MaterialCommunityIcons
                  name={sport.icon as any}
                  size={26}
                  color={isActive ? sport.color : sport.color + 'AA'}
                />
                <Text style={[styles.sportChipLabel, isActive && { color: sport.color }]}>
                  {sport.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Venues Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedSport ? `${selectedSport} Venues` : 'Nearby Venues'}
          </Text>
          {selectedSport ? (
            <Pressable hitSlop={8} onPress={() => onSelectSport(selectedSport)}>
              <Text style={styles.clearFilter}>Clear</Text>
            </Pressable>
          ) : null}
        </View>

        {false ? (
          <GlassCard variant="neon" padding={20}>
            <View style={styles.locationPrompt}>
              <MaterialIcons name="location-on" size={32} color={Colors.neonGreen} />
              <Text style={styles.locationPromptTitle}>Select your location</Text>
              <Text style={styles.locationPromptSub}>
                Tap the location bar above to find venues near you.
              </Text>
            </View>
          </GlassCard>
        ) : loadingVenues ? (
          <View style={styles.skeletonList}>
            <VenueSkeleton />
            <VenueSkeleton />
            <VenueSkeleton />
          </View>
        ) : venues.length === 0 ? (
  <EmptyVenuesState onRetry={onRetry} />
) : (
  <>
    <Text style={{ color: 'white', marginBottom: 10 }}>
      Venues count: {venues.length}
    </Text>

    {venues.map((venue) => (
    <VenueCard
      key={venue.id}
      venue={venue}
      onBook={() =>
        onBookSlot(venue)
      }
    />
))}
  </>
)}
      </View>
    </View>
  );
}

// ── Venue Card ────────────────────────────────────────────────────────────────
const VenueCard = React.memo(function VenueCard({ venue, onBook, }: { venue: Venue;  onBook: () => void }) {
  return (
    <Pressable style={styles.venueCard}>
      <LinearGradient
        colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
        style={StyleSheet.absoluteFillObject}
      />
<View style={{ flex: 1, marginLeft: 12 }}>
  {/* Top section */}
    <Text style={styles.venueName}>
      {venue.name}
    </Text>

    <Text
      style={{
        color: Colors.textMuted,
        fontSize: 13,
        marginBottom: 6,
      }}
    >
      📍 {venue.city}
    </Text>

    <Text
      style={{
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
      }}
    >
      {venue.courtName}
    </Text>

  <Text style={styles.venueSport}>
    {venue.sport}
  </Text>

  <Text
    style={{
      color: Colors.textMuted,
      fontSize: 12,
      marginTop: 4,
    }}
  >
    📅 {venue.slotDate}
  </Text>

  <Text
    style={{
      color: Colors.textMuted,
      fontSize: 12,
    }}
  >
    🕒 {venue.startTime} - {venue.endTime}
  </Text>

  {/* Bottom row */}
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16,
    }}
  >
    <View>
      <Text
        style={{
          color: '#fff',
          fontWeight: '800',
          fontSize: 22,
        }}
      >
        {venue.pricePerHour}
      </Text>

      <Text
        style={{
          color: Colors.neonGreen,
          fontSize: 13,
        }}
      >
        {venue.freeSlots} slots free
      </Text>
    </View>

    <Pressable
      style={styles.bookBtn}
      onPress={onBook}
    >
      <LinearGradient
        colors={['#00FF88', '#00CC6A']}
        style={styles.bookBtnGradient}
      >
        <Text style={styles.bookBtnText}>
          Book Now
        </Text>
      </LinearGradient>
    </Pressable>
  </View>
</View>
    </Pressable>
  );
});

// ── Owner Dashboard ───────────────────────────────────────────────────────────
function OwnerBookingsModal({ visible, onClose, ownerId }: { visible: boolean; onClose: () => void; ownerId?: string }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    const { data, error } = await supabase
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
      .eq('owner_id', ownerId)
      .order('booking_date', { ascending: false });
    setLoading(false);

    setBookings(error ? [] : data ?? []);
  }, [ownerId]);

  useEffect(() => {
    if (visible) fetchBookings();
  }, [visible, fetchBookings]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.ownerBookingsOverlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.ownerBookingsSheet}>
          <View style={styles.ownerBookingsHeader}>
            <View>
              <Text style={styles.ownerBookingsTitle}>Bookings</Text>
              <Text style={styles.ownerBookingsSubtitle}>{bookings.length} booking{bookings.length === 1 ? '' : 's'}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.ownerBookingsClose} hitSlop={12}>
              <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.ownerBookingsContent} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.ownerBookingsEmpty}>
                <ActivityIndicator color={Colors.neonGreen} />
                <Text style={styles.ownerBookingsEmptyText}>Loading bookings...</Text>
              </View>
            ) : bookings.length === 0 ? (
              <View style={styles.ownerBookingsEmpty}>
                <MaterialIcons name="event-busy" size={42} color={Colors.textMuted} />
                <Text style={styles.ownerBookingsEmptyText}>No bookings yet</Text>
              </View>
            ) : (
              bookings.map((booking) => (
                <View key={booking.id} style={styles.ownerBookingCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ownerBookingPlayer}>{booking.player?.full_name ?? 'Player'}</Text>
                    <Text style={styles.ownerBookingSport}>{booking.slots?.sport ?? 'Sport'}</Text>
                    <Text style={styles.ownerBookingMeta}>{booking.slots?.court_name ?? 'Court'} - {booking.slots?.slot_date}</Text>
                    <Text style={styles.ownerBookingMeta}>{booking.slots?.start_time} - {booking.slots?.end_time}</Text>
                  </View>
                  <View style={styles.ownerBookingRight}>
                    <Text style={styles.ownerBookingPrice}>Rs {booking.slots?.price ?? '--'}</Text>
                    <Text style={styles.ownerBookingStatus}>{booking.status ?? 'booked'}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function OwnerDashboard({ onAddSlot, onViewSlots, onViewBookings }: { onAddSlot: () => void; onViewSlots: () => void; onViewBookings: () => void }) {
  const stats = [
    { label: 'Today Bookings', value: '—', icon: 'calendar-today', color: '#00FF88' },
    { label: "Today's Revenue", value: '—', icon: 'trending-up', color: '#00BFFF' },
    { label: 'Free Slots', value: '—', icon: 'access-time', color: '#FFB800' },
    { label: 'Avg Rating', value: '—', icon: 'star', color: '#FF6B6B' },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Overview</Text>

      <View style={styles.statsGrid}>
        {stats.map((s) => (
          <View key={s.label} style={[styles.statCard, { borderColor: s.color + '30' }]}>
            <LinearGradient
              colors={[s.color + '15', s.color + '05']}
              style={StyleSheet.absoluteFillObject}
            />
            <MaterialIcons name={s.icon as any} size={20} color={s.color} />
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <GlassCard variant="blue" padding={16}>
        <View style={styles.apiNotice}>
          <MaterialIcons name="info-outline" size={18} color={Colors.electricBlue} />
          <Text style={styles.apiNoticeText}>
            Live booking data will appear here once connected to the backend.
          </Text>
        </View>
      </GlassCard>

      <View style={styles.ownerActions}>
        {[
          { icon: 'add-circle-outline', label: 'Add Slot', color: Colors.neonGreen, onPress: onAddSlot },
          { icon: 'event-note', label: 'Slots', color: Colors.electricBlue, onPress: onViewSlots },
          { icon: 'people', label: 'Bookings', color: '#FFB800', onPress: onViewBookings },
          { icon: 'settings', label: 'Settings', color: Colors.textSecondary, onPress: undefined as any },
        ].map((a) => (
          <Pressable key={a.label} style={styles.ownerActionBtn} onPress={a.onPress}>
            <View
              style={[styles.ownerActionIcon, { backgroundColor: a.color + '18' }]}
            >
              <MaterialIcons name={a.icon as any} size={22} color={a.color} />
            </View>
            <Text style={styles.ownerActionLabel}>{a.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  header: {
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
    overflow: 'hidden',
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarBtn: {
    // Pressable wraps the gradient — keep it simple
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#080C10',
    fontWeight: '800',
    fontSize: Typography.fontSizes.base,
  },
  welcomeSection: {
    gap: 4,
  },
  welcomeGreeting: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
  },
  welcomeName: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    height: 50,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchPlaceholder: {
    flex: 1,
    color: Colors.textMuted,
    fontSize: Typography.fontSizes.sm,
  },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,255,136,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  // Sections
  section: {
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  clearFilter: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.error,
    fontWeight: '600',
  },
  horizontalList: {
    gap: 12,
    paddingRight: Spacing.lg,
  },
  sportChip: {
    width: 100,
    height: 110,
    borderRadius: Radius.xl,
    borderWidth: 1,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  sportChipLabel: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  // Venue card
  venueCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
    backgroundColor: Colors.bgCard,
    overflow: 'hidden',
  },
  venueCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  venueIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(0,255,136,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.2)',
  },
  venueInfo: {
    flex: 1,
    gap: 4,
  },
  venueName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  venueSport: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
  },
  venueBottom: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255,184,0,0.12)',
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingText: {
    fontSize: 10,
    color: '#FFB800',
    fontWeight: '700',
  },
  slotsChip: {
    backgroundColor: 'rgba(0,255,136,0.1)',
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  slotsText: {
    fontSize: 10,
    color: Colors.neonGreen,
    fontWeight: '600',
  },
  venuePrice: {
    alignItems: 'flex-end',
    gap: 8,
  },
  priceText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    color: Colors.neonGreen,
  },
  bookBtn: {
    borderRadius: 24,
    overflow: 'hidden',
    minWidth: 100,
  },

  bookBtnGradient: {
    minHeight: 44,
    paddingHorizontal: 24,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },

  bookBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  // Skeleton
  skeletonList: {
    gap: 12,
  },
  skeletonCard: {
    borderRadius: Radius.xl,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    height: 80,
  },
  skeletonIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  skeletonLines: {
    flex: 1,
    gap: 10,
  },
  skeletonLine1: {
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: '70%',
  },
  skeletonLine2: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    width: '45%',
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
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    lineHeight: Typography.fontSizes.sm * 1.6,
  },
  retryBtn: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.neonGreen + '60',
    backgroundColor: 'rgba(0,255,136,0.08)',
  },
  retryText: {
    color: Colors.neonGreen,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
  },
  // Location prompt
  locationPrompt: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  locationPromptTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  locationPromptSub: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: Typography.fontSizes.sm * 1.6,
  },
  // Owner stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: Radius.xl,
    borderWidth: 1,
    backgroundColor: Colors.bgCard,
    padding: Spacing.md,
    gap: 6,
    overflow: 'hidden',
  },
  statValue: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
  },
  apiNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  apiNoticeText: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.fontSizes.sm * 1.5,
  },
  ownerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ownerActionBtn: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  ownerActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  ownerActionLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  ownerBookingsOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  ownerBookingsSheet: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    maxHeight: '82%',
    backgroundColor: '#0E1620',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingBottom: Spacing.lg,
  },
  ownerBookingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ownerBookingsTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  ownerBookingsSubtitle: {
    marginTop: 2,
    fontSize: Typography.fontSizes.sm,
    color: Colors.textMuted,
  },
  ownerBookingsClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  ownerBookingsContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  ownerBookingsEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  ownerBookingsEmptyText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '600',
  },
  ownerBookingCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  ownerBookingPlayer: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '800',
  },
  ownerBookingSport: {
    color: Colors.neonGreen,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    marginTop: 4,
  },
  ownerBookingMeta: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizes.xs,
    marginTop: 4,
  },
  ownerBookingRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  ownerBookingPrice: {
    color: Colors.neonGreen,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '900',
  },
  ownerBookingStatus: {
    color: '#FFB800',
    fontSize: Typography.fontSizes.xs,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
});
