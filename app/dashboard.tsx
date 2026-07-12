// PlayArena — Dashboard (Post-Login Landing)
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { GlassCard, LogoBadge, LocationPicker, ProfileMenu, AddSlotModal, SlotData, SlotsModal } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { LocationData } from '@/services/location';
import { PREDEFINED_SPORTS } from '@/constants/sports';
import { supabase } from '@/services/supabase';

const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed'];
const UPCOMING_BOOKING_STATUSES = ['pending', 'confirmed'];

const dashboardPalettes = {
  dark: {
    bg: Colors.bgPrimary,
    bgGradient: ['#0A0F10', '#080C10'] as [string, string],
    headerGradient: ['#0D1A12', '#080C10'] as [string, string],
    card: Colors.bgCard,
    cardAlt: 'rgba(255,255,255,0.06)',
    border: Colors.bgGlassBorder,
    borderSoft: Colors.border,
    text: Colors.textPrimary,
    textSecondary: Colors.textSecondary,
    textMuted: Colors.textMuted,
    inputBg: 'rgba(255,255,255,0.06)',
    iconButtonBg: 'rgba(255,255,255,0.06)',
    iconButtonBorder: Colors.border,
    subtleGradientEnd: 'rgba(255,255,255,0.03)',
    progressTrack: 'rgba(255,255,255,0.1)',
  },
  light: {
    bg: '#F6F8FB',
    bgGradient: ['#FDFEFF', '#EEF5F2'] as [string, string],
    headerGradient: ['#FFFFFF', '#EAF7F1'] as [string, string],
    card: '#FFFFFF',
    cardAlt: '#F3F7FA',
    border: 'rgba(17,24,39,0.10)',
    borderSoft: 'rgba(17,24,39,0.12)',
    text: '#111827',
    textSecondary: '#344054',
    textMuted: '#667085',
    inputBg: '#FFFFFF',
    iconButtonBg: '#FFFFFF',
    iconButtonBorder: 'rgba(17,24,39,0.12)',
    subtleGradientEnd: 'rgba(17,24,39,0.02)',
    progressTrack: 'rgba(17,24,39,0.12)',
  },
};

type DashboardPalette = typeof dashboardPalettes.dark;

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
  totalSlots: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  city: string;
  courtName: string;
  ownerId: string;
  rules: string[];
}

interface UpcomingGame {
  id: string;
  sport: string;
  turfName: string;
  courtName: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  location: string;
  status?: string;
  isCompleted?: boolean;
}

function slotEndDate(slotDate: string, endTime: string) {
  const match = endTime?.trim().match(/^(\d{1,2}):(\d{1,2})\s*(AM|PM)$/i);
  const [y, m, d] = slotDate?.trim().split('-').map(Number);
  if (!match || !y || !m || !d) return new Date(NaN);
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return new Date(y, m - 1, d, hours, minutes);
}

function todayIsoDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function sportMeta(sport: string) {
  return SPORT_CATEGORIES.find((item) => item.label === sport) ?? SPORT_CATEGORIES[SPORT_CATEGORIES.length - 1];
}

function availabilityColor(free: number, total: number) {
  if (free <= 0) return Colors.error;
  return free / Math.max(1, total) > 0.5 ? Colors.neonGreen : Colors.warning;
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
  const { isLightMode, toggleColorMode } = useTheme();
  const router = useRouter();
  const palette = isLightMode ? dashboardPalettes.light : dashboardPalettes.dark;

  const [location, setLocation] = useState<LocationData | null>(null);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<UpcomingGame[]>([]);
  const [completedGames, setCompletedGames] = useState<UpcomingGame[]>([]);
  const [loadingUpcomingGames, setLoadingUpcomingGames] = useState(false);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [addSlotVisible, setAddSlotVisible] = useState(false);
  const [slotsVisible, setSlotsVisible] = useState(false);
  const [bookingsVisible, setBookingsVisible] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
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
      // For players: hide slots already booked by the current player (even if capacity > 1),
      // so the booked slot disappears immediately after successful booking.
      const { data: myBookings, error: myBookingsError } = user?.id && user.role !== 'owner'
        ? await supabase
            .from('bookings')
            .select('slot_id')
            .eq('player_id', user.id)
            .in('status', ACTIVE_BOOKING_STATUSES)
        : { data: [], error: null };
      if (myBookingsError) throw myBookingsError;
      const myBookedSlotIds = new Set((myBookings ?? []).map((b: any) => b.slot_id).filter(Boolean));

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
      const bookedCounts = bookedSlotIds.reduce((acc: Record<string, number>, id: string) => {
        acc[id] = (acc[id] ?? 0) + 1;
        return acc;
      }, {});

      let slotsQuery = supabase
        .from('slots')
        .select(`
          *,
          owner:profiles!slots_owner_id_fkey (
            turf_name,
            location
          )
        `)
        .gte('slot_date', todayIsoDate())
        .order('slot_date', { ascending: true });

      const { data, error } = await slotsQuery;

      if (error) {
        throw error;
      }

      const now = new Date();
      const mappedVenues = (data || [])
        .map((slot: any) => {
          const totalSlots = Math.max(1, Number(slot.total_slots || 1));
          const freeSlots = Math.max(0, totalSlots - (bookedCounts[slot.id] ?? 0));
          return {
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
            freeSlots,
            totalSlots,
            slotDate: slot.slot_date,
            startTime: slot.start_time,
            endTime: slot.end_time,
            rules: slot.rules || [],
          };
        })
        .filter((slot: Venue) => (user?.id && user.role !== 'owner' ? !myBookedSlotIds.has(slot.id) : true))
        .filter((slot: Venue) => slotEndDate(slot.slotDate, slot.endTime) > now);

      setVenues(mappedVenues);
    } catch (err) {
      console.error('Fetch venues error:', err);
      setVenues([]);
    } finally {
      setLoadingVenues(false);
    }
  }, [user?.id, user?.role]);

  const fetchUpcomingGames = useCallback(async () => {
    if (!user?.id || user.role === 'owner') return;

    setLoadingUpcomingGames(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          slots!inner (
            sport,
            court_name,
            slot_date,
            start_time,
            end_time,
            owner:profiles!slots_owner_id_fkey (
              turf_name,
              location
            )
          )
        `)
        .eq('player_id', user.id)
        .in('status', UPCOMING_BOOKING_STATUSES)
        .order('slot_date', { foreignTable: 'slots', ascending: true })
        .limit(30);

      if (error) throw error;

      const now = new Date();
      const allGames = (data ?? []).filter((booking: any) => booking.slots);
      const games = allGames
        .filter((booking: any) => slotEndDate(booking.slots.slot_date, booking.slots.end_time) > now)
        .sort((a: any, b: any) =>
          slotEndDate(a.slots.slot_date, a.slots.end_time).getTime() -
          slotEndDate(b.slots.slot_date, b.slots.end_time).getTime()
        )
        .slice(0, 5)
        .map((booking: any) => ({
          id: booking.id,
          sport: booking.slots.sport,
          turfName: booking.slots.owner?.turf_name ?? 'Sports Arena',
          courtName: booking.slots.court_name,
          slotDate: booking.slots.slot_date,
          startTime: booking.slots.start_time,
          endTime: booking.slots.end_time,
          location: booking.slots.owner?.location ?? 'Unknown Location',
          status: booking.status,
          isCompleted: false,
        }));

      const completed = allGames
        .filter((booking: any) => slotEndDate(booking.slots.slot_date, booking.slots.end_time) <= now)
        .sort((a: any, b: any) =>
          slotEndDate(b.slots.slot_date, b.slots.end_time).getTime() -
          slotEndDate(a.slots.slot_date, a.slots.end_time).getTime()
        )
        .slice(0, 5)
        .map((booking: any) => ({
          id: booking.id,
          sport: booking.slots.sport,
          turfName: booking.slots.owner?.turf_name ?? 'Sports Arena',
          courtName: booking.slots.court_name,
          slotDate: booking.slots.slot_date,
          startTime: booking.slots.start_time,
          endTime: booking.slots.end_time,
          location: booking.slots.owner?.location ?? 'Unknown Location',
          status: booking.status,
          isCompleted: true,
        }));

      setUpcomingGames(games);
      setCompletedGames(completed);
    } catch (err) {
      console.error('Fetch upcoming games error:', err);
      setUpcomingGames([]);
      setCompletedGames([]);
    } finally {
      setLoadingUpcomingGames(false);
    }
  }, [user?.id, user?.role]);


  useEffect(() => {
    fetchVenues();
    fetchUpcomingGames();
  }, [fetchUpcomingGames, fetchVenues]);

  const handleSlotSave = useCallback((data: SlotData) => {
    setSavedSlots((prev) => [...prev, data]);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/welcome');
  }, [logout, router]);

  const isOwner = user?.role === 'owner';
  const visibleVenues = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return venues.filter((venue) => {
      const sportMatch = selectedSport ? venue.sport === selectedSport : true;
      if (!sportMatch) return false;
      if (!q) return true;
      return [
        venue.sport,
        venue.name,
        venue.courtName,
        venue.city,
      ].some((value) => String(value ?? '').toLowerCase().includes(q));
    });
  }, [searchQuery, selectedSport, venues]);

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
        fetchUpcomingGames();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUpcomingGames, fetchVenues, isOwner, user?.id]);

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <LinearGradient colors={palette.bgGradient} style={StyleSheet.absoluteFillObject} />

      {/* Sticky Header */}
      <Animated.View
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing.sm, opacity: headerOpacity },
        ]}
      >
        <LinearGradient
          colors={palette.headerGradient}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.headerTop}>
          <LogoBadge size="sm" textColor={palette.text} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
            style={[
              styles.themeToggle,
              {
                backgroundColor: palette.iconButtonBg,
                borderColor: palette.iconButtonBorder,
              },
            ]}
            onPress={toggleColorMode}
            hitSlop={12}
          >
            <MaterialIcons
              name={isLightMode ? 'dark-mode' : 'light-mode'}
              size={20}
              color={isLightMode ? '#111827' : Colors.neonGreen}
            />
          </Pressable>

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
          <Text style={[styles.welcomeGreeting, { color: palette.textSecondary }]}>
            {isOwner ? 'Welcome back, Owner' : 'Good day,'}
          </Text>
          <Text style={[styles.welcomeName, { color: palette.text }]}>{user?.name ?? 'Player'} 👋</Text>
          {!isOwner ? (
            <LocationPicker location={location} onLocationChange={setLocation} />
          ) : null}
        </View>

        {/* Search Bar — players only */}
        {!isOwner ? (
          <View style={[styles.searchBar, { backgroundColor: palette.inputBg, borderColor: palette.borderSoft }]}>
            <MaterialIcons name="search" size={20} color={palette.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: palette.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search sport, turf, court, city..."
              placeholderTextColor={palette.textMuted}
              returnKeyType="search"
            />
            <View style={styles.filterBtn}>
              <MaterialIcons name="tune" size={16} color={Colors.neonGreen} />
            </View>
          </View>
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
              palette={palette}
              onAddSlot={() => setAddSlotVisible(true)}
              onViewSlots={() => setSlotsVisible(true)}
              onViewBookings={() => setBookingsVisible(true)}
              onViewFeedback={() => setFeedbackVisible(true)}
            />
          ) : (
            <PlayerDashboard
              palette={palette}
              selectedSport={selectedSport}
              onSelectSport={(s) => setSelectedSport(s === selectedSport ? null : s)}
              venues={venues}
              filteredVenues={visibleVenues}
              upcomingGames={upcomingGames}
              completedGames={completedGames}
              loadingUpcomingGames={loadingUpcomingGames}
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

      <OwnerFeedbackModal
        visible={feedbackVisible}
        onClose={() => setFeedbackVisible(false)}
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
  palette: DashboardPalette;
  selectedSport: string | null;
  onSelectSport: (sport: string) => void;
  venues: Venue[];
  filteredVenues: Venue[];
  upcomingGames: UpcomingGame[];
  completedGames: UpcomingGame[];
  loadingUpcomingGames: boolean;
  loadingVenues: boolean;
  locationSelected: boolean;
  onRetry: () => void;
  onBookSlot: (venue: Venue) => void;

}

function PlayerDashboard({
  palette,
  selectedSport,
  onSelectSport,
  venues,
  filteredVenues,
  upcomingGames,
  completedGames,
  loadingUpcomingGames,
  loadingVenues,
  locationSelected,
  onRetry,
  onBookSlot,
}: PlayerDashboardProps) {
  return (
    <View>
      <UpcomingGamesSection games={upcomingGames} loading={loadingUpcomingGames} palette={palette} />
      <CompletedGamesSection games={completedGames} loading={loadingUpcomingGames} palette={palette} />

      {/* Sport Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Browse by Sport</Text>
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
                  { backgroundColor: palette.card },
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
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
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
        ) : filteredVenues.length === 0 ? (
  <EmptyVenuesState onRetry={onRetry} />
) : (
  <>
    <Text style={{ color: palette.text, marginBottom: 10 }}>
      Venues count: {filteredVenues.length}
    </Text>

    {filteredVenues.map((venue) => (
    <VenueCard
      key={venue.id}
      venue={venue}
      palette={palette}
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
function UpcomingGamesSection({ games, loading, palette }: { games: UpcomingGame[]; loading: boolean; palette: DashboardPalette }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Upcoming Games</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={Colors.neonGreen} />
      ) : games.length === 0 ? (
        <Text style={[styles.upcomingEmpty, { color: palette.textMuted }]}>No upcoming games</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          nestedScrollEnabled
        >
          {games.map((game) => (
            <UpcomingGameCard key={game.id} game={game} palette={palette} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function UpcomingGameCard({ game, palette }: { game: UpcomingGame; palette: DashboardPalette }) {
  const meta = sportMeta(game.sport);
  const router = useRouter();

  return (
    <Pressable
      style={[styles.upcomingCard, { backgroundColor: palette.card, borderColor: palette.border }]}
      onPress={() => router.push({ pathname: '/ticket' as any, params: { bookingId: game.id } })}
    >
      <LinearGradient colors={['rgba(0,255,136,0.10)', palette.subtleGradientEnd]} style={StyleSheet.absoluteFillObject} />
      <View style={styles.upcomingTopRow}>
        <View style={[styles.upcomingIcon, { borderColor: meta.color + '55', backgroundColor: meta.color + '18' }]}>
          <MaterialCommunityIcons name={meta.icon as any} size={20} color={meta.color} />
        </View>
        <View style={styles.upcomingBadge}>
          <Text style={styles.upcomingBadgeText}>Upcoming</Text>
        </View>
      </View>
      <Text style={[styles.upcomingSport, { color: palette.text }]}>{game.sport}</Text>
      <Text style={[styles.upcomingTurf, { color: palette.textSecondary }]} numberOfLines={1}>{game.turfName}</Text>
      <Text style={[styles.upcomingMeta, { color: palette.textMuted }]} numberOfLines={1}>{game.courtName}</Text>
      <Text style={[styles.upcomingMeta, { color: palette.textMuted }]} numberOfLines={1}>{game.slotDate}</Text>
      <Text style={[styles.upcomingMeta, { color: palette.textMuted }]} numberOfLines={1}>{game.startTime} - {game.endTime}</Text>
      <Text style={[styles.upcomingMeta, { color: palette.textMuted }]} numberOfLines={1}>{game.location}</Text>
    </Pressable>
  );
}

function CompletedGamesSection({ games, loading, palette }: { games: UpcomingGame[]; loading: boolean; palette: DashboardPalette }) {
  if (loading || games.length === 0) return null;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Completed Games</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList} nestedScrollEnabled>
        {games.map((game) => (
          <CompletedGameCard key={game.id} game={game} palette={palette} />
        ))}
      </ScrollView>
    </View>
  );
}

function CompletedGameCard({ game, palette }: { game: UpcomingGame; palette: DashboardPalette }) {
  const router = useRouter();
  const meta = sportMeta(game.sport);
  return (
    <Pressable
      style={[styles.upcomingCard, { backgroundColor: palette.card, borderColor: palette.border }]}
      onPress={() => router.push({ pathname: '/game-feedback' as any, params: { bookingId: game.id } })}
    >
      <LinearGradient colors={['rgba(255,184,0,0.10)', palette.subtleGradientEnd]} style={StyleSheet.absoluteFillObject} />
      <View style={styles.upcomingTopRow}>
        <View style={[styles.upcomingIcon, { borderColor: meta.color + '55', backgroundColor: meta.color + '18' }]}>
          <MaterialCommunityIcons name={meta.icon as any} size={20} color={meta.color} />
        </View>
        <View style={[styles.upcomingBadge, { backgroundColor: 'rgba(255,184,0,0.12)' }]}>
          <Text style={[styles.upcomingBadgeText, { color: '#FFB800' }]}>Feedback</Text>
        </View>
      </View>
      <Text style={[styles.upcomingSport, { color: palette.text }]}>{game.sport}</Text>
      <Text style={[styles.upcomingTurf, { color: palette.textSecondary }]} numberOfLines={1}>{game.turfName}</Text>
      <Text style={[styles.upcomingMeta, { color: palette.textMuted }]} numberOfLines={1}>{game.courtName}</Text>
      <Text style={[styles.upcomingMeta, { color: palette.textMuted }]} numberOfLines={1}>{game.slotDate}</Text>
      <Text style={[styles.upcomingMeta, { color: palette.textMuted }]} numberOfLines={1}>{game.startTime} - {game.endTime}</Text>
    </Pressable>
  );
}

const VenueCard = React.memo(function VenueCard({ venue, onBook, palette, }: { venue: Venue; onBook: () => void; palette: DashboardPalette }) {
  const availability = availabilityColor(venue.freeSlots, venue.totalSlots);
  const sportEntry = PREDEFINED_SPORTS.find((s) => s.key.toLowerCase() === venue.sport?.toLowerCase());
  const isPool = !!sportEntry?.isPool;
  const capacityPercent = Math.round((venue.freeSlots / Math.max(1, venue.totalSlots)) * 100);
  
  return (
    <Pressable style={[styles.venueCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <LinearGradient
        colors={['rgba(0,255,136,0.04)', palette.subtleGradientEnd]}
        style={StyleSheet.absoluteFillObject}
      />
<View style={{ flex: 1, marginLeft: 12 }}>
  {/* Top section */}
    <Text style={[styles.venueName, { color: palette.text }]}>
      {venue.name}
    </Text>

    <Text
      style={{
        color: palette.textMuted,
        fontSize: 13,
        marginBottom: 6,
      }}
    >
      📍 {venue.city}
    </Text>

    <Text
      style={{
        color: palette.text,
        fontWeight: '700',
        fontSize: 16,
      }}
    >
      {venue.courtName}
    </Text>

  <Text style={[styles.venueSport, { color: palette.textMuted }]}>
    {venue.sport}
  </Text>

  <Text
    style={{
      color: palette.textMuted,
      fontSize: 12,
      marginTop: 4,
    }}
  >
    📅 {venue.slotDate}
  </Text>

  <Text
    style={{
      color: palette.textMuted,
      fontSize: 12,
    }}
  >
    🕒 {venue.startTime} - {venue.endTime}
  </Text>

  {/* Pool capacity indicator */}
  {isPool && (
    <View style={{ marginTop: 10, marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 12, color: palette.textMuted }}>Pool Capacity</Text>
        <Text style={{ fontSize: 12, fontWeight: '700', color: availability }}>
          {venue.freeSlots}/{venue.totalSlots} spots left
        </Text>
      </View>
      <View style={{
        height: 6,
        backgroundColor: palette.progressTrack,
        borderRadius: 3,
        overflow: 'hidden',
      }}>
        <View
          style={{
            height: '100%',
            width: `${capacityPercent}%`,
            backgroundColor: availability,
          }}
        />
      </View>
    </View>
  )}

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
          color: palette.text,
          fontWeight: '800',
          fontSize: 22,
        }}
      >
        {venue.pricePerHour}
      </Text>

      <Text
        style={{
          color: availability,
          fontSize: 13,
        }}
      >
        {venue.freeSlots > 0
          ? isPool
            ? `${venue.freeSlots}/${venue.totalSlots} spots left`
            : `${venue.freeSlots} slots left`
          : 'Fully Booked'}
      </Text>
    </View>

    <Pressable
      style={[styles.bookBtn, venue.freeSlots <= 0 && { opacity: 0.45 }]}
      onPress={onBook}
      disabled={venue.freeSlots <= 0}
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

    if (error) {
      Alert.alert('Bookings Error', error.message);
      setBookings([]);
      return;
    }
    setBookings(data ?? []);
  }, [ownerId]);

  useEffect(() => {
    if (visible) fetchBookings();
  }, [visible, fetchBookings]);

  const groupedBookings = useMemo(() => {
    const groups: Record<string, any[]> = {};
    bookings.forEach((booking) => {
      const sport = booking.slots?.sport ?? 'Other';
      groups[sport] = [...(groups[sport] ?? []), booking];
    });
    return Object.entries(groups);
  }, [bookings]);

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
              groupedBookings.map(([sport, sportBookings]) => (
                <View key={sport} style={styles.ownerBookingGroup}>
                  <Text style={styles.ownerBookingGroupTitle}>{sport}</Text>
                  {sportBookings.map((booking) => (
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
                  ))}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function OwnerFeedbackModal({ visible, onClose, ownerId }: { visible: boolean; onClose: () => void; ownerId?: string }) {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'new' | 'reviewed'>('new');

  const fetchFeedback = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('feedbacks')
      .select('id, rating, feedback_text, created_at, player:profiles!feedbacks_player_id_fkey(full_name), slots!feedbacks_slot_id_fkey(sport, owner:profiles!slots_owner_id_fkey(turf_name))')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) {
      Alert.alert('Feedback Error', error.message);
      setFeedback([]);
      return;
    }
    setFeedback(data ?? []);
  }, [ownerId]);

  useEffect(() => {
    if (visible) fetchFeedback();
  }, [visible, fetchFeedback]);

  const markReviewed = async (id: string) => {
    Alert.alert('Review Not Available', 'The feedbacks table does not include a reviewed column.');
  };

  const avg = feedback.length
    ? (feedback.reduce((sum, item) => sum + Number(item.rating || 0), 0) / feedback.length).toFixed(1)
    : '--';
  const visibleFeedback = feedback.filter((item) => tab === 'reviewed' ? !!item.reviewed : !item.reviewed);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.ownerBookingsOverlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.ownerBookingsSheet}>
          <View style={styles.ownerBookingsHeader}>
            <View>
              <Text style={styles.ownerBookingsTitle}>Feedback</Text>
              <Text style={styles.ownerBookingsSubtitle}>{avg === '--' ? 'No ratings yet' : `${avg} average rating`}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.ownerBookingsClose} hitSlop={12}>
              <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.feedbackTabs}>
            {[
              { key: 'new', label: 'New Feedback' },
              { key: 'reviewed', label: 'Reviewed Feedback' },
            ].map((item) => (
              <Pressable key={item.key} style={[styles.feedbackTab, tab === item.key && styles.feedbackTabActive]} onPress={() => setTab(item.key as any)}>
                <Text style={[styles.feedbackTabText, tab === item.key && styles.feedbackTabTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.ownerBookingsContent} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.ownerBookingsEmpty}>
                <ActivityIndicator color={Colors.neonGreen} />
                <Text style={styles.ownerBookingsEmptyText}>Loading feedback...</Text>
              </View>
            ) : visibleFeedback.length === 0 ? (
              <View style={styles.ownerBookingsEmpty}>
                <MaterialIcons name="rate-review" size={42} color={Colors.textMuted} />
                <Text style={styles.ownerBookingsEmptyText}>No {tab === 'new' ? 'new' : 'reviewed'} feedback</Text>
              </View>
            ) : (
              visibleFeedback.map((item) => (
                <View key={item.id} style={styles.feedbackCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ownerBookingPlayer}>{item.player?.full_name ?? 'Player'}</Text>
                    <Text style={styles.ownerBookingSport}>{item.slots?.sport ?? 'Sport'}</Text>
                    <Text style={styles.ownerBookingMeta}>Turf: {item.slots?.owner?.turf_name ?? 'Turf'}</Text>
                    <Text style={styles.ownerBookingMeta}>{item.feedback_text || 'No written feedback'}</Text>
                    <Text style={styles.ownerBookingMeta}>{item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : ''}</Text>
                  </View>
                  <View style={styles.ownerBookingRight}>
                    <View style={styles.ratingPill}>
                      <MaterialIcons name="star" size={14} color="#FFB800" />
                      <Text style={styles.ratingPillText}>{item.rating}</Text>
                    </View>
                    {!item.reviewed ? (
                      <Pressable style={styles.markReviewedBtn} onPress={() => markReviewed(item.id)}>
                        <Text style={styles.markReviewedText}>Mark Reviewed</Text>
                      </Pressable>
                    ) : null}
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

function OwnerDashboard({
  palette,
  onAddSlot,
  onViewSlots,
  onViewBookings,
  onViewFeedback,
}: {
  palette: DashboardPalette;
  onAddSlot: () => void;
  onViewSlots: () => void;
  onViewBookings: () => void;
  onViewFeedback: () => void;
}) {
  const { user } = useAuth();
  const [overview, setOverview] = useState({ bookings: '0', revenue: 'Rs 0', freeSlots: '0', avgRating: '--' });
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(false);

  const loadOwnerData = useCallback(async () => {
    if (!user?.id) return;
    setLoadingOverview(true);
    const today = todayIsoDate();
    const [bookingsRes, slotsRes, feedbackRes, ratingsRes] = await Promise.all([
      supabase.from('bookings').select('id, status, slots!inner(slot_date, price)').eq('owner_id', user.id).eq('slots.slot_date', today),
      supabase.from('slots').select('id, total_slots, slot_date, end_time, bookings(status)').eq('owner_id', user.id).eq('slot_date', today),
      supabase
        .from('feedbacks')
        .select('*, player:profiles!feedbacks_player_id_fkey(full_name), slots!feedbacks_slot_id_fkey(sport, court_name, owner:profiles!slots_owner_id_fkey(turf_name))')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase.from('feedbacks').select('rating').eq('owner_id', user.id),
    ]);
    const bookings = bookingsRes.data ?? [];
    const revenue = bookings
      .filter((booking: any) => booking.status === 'confirmed')
      .reduce((sum: number, booking: any) => sum + Number(booking.slots?.price || 0), 0);
    const freeSlots = (slotsRes.data ?? [])
      .filter((slot: any) => slotEndDate(slot.slot_date, slot.end_time) > new Date())
      .reduce((sum: number, slot: any) => {
        const booked = (slot.bookings ?? []).filter((b: any) => ACTIVE_BOOKING_STATUSES.includes(b.status)).length;
        return sum + Math.max(0, Number(slot.total_slots || 1) - booked);
      }, 0);
    const feedbackRows = feedbackRes.data ?? [];
    const ratingRows = ratingsRes.data ?? [];
    const avg = ratingRows.length ? ratingRows.reduce((sum: number, item: any) => sum + Number(item.rating || 0), 0) / ratingRows.length : 0;
    setOverview({ bookings: String(bookings.length), revenue: `Rs ${revenue}`, freeSlots: String(freeSlots), avgRating: avg ? avg.toFixed(1) : '--' });
    setFeedback(feedbackRows);
    setLoadingOverview(false);
  }, [user?.id]);

  useEffect(() => {
    loadOwnerData();
  }, [loadOwnerData]);

  const liveStats = [
    { label: 'Today Bookings', value: overview.bookings, icon: 'calendar-today', color: '#00FF88' },
    { label: "Today's Revenue", value: overview.revenue, icon: 'trending-up', color: '#00BFFF' },
    { label: 'Free Slots', value: overview.freeSlots, icon: 'access-time', color: '#FFB800' },
    { label: 'Avg Rating', value: overview.avgRating, icon: 'star', color: '#FF6B6B' },
  ];

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: palette.text }]}>Quick Overview</Text>

      <View style={styles.statsGrid}>
        {liveStats.map((s) => (
          <View key={s.label} style={[styles.statCard, { borderColor: s.color + '30', backgroundColor: palette.card }]}>
            <LinearGradient
              colors={[s.color + '15', s.color + '05']}
              style={StyleSheet.absoluteFillObject}
            />
            <MaterialIcons name={s.icon as any} size={20} color={s.color} />
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: palette.textMuted }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {loadingOverview ? <ActivityIndicator color={Colors.neonGreen} /> : null}

      <View style={styles.ownerActions}>
        {[
          { icon: 'add-circle-outline', label: 'Add Slot', color: Colors.neonGreen, onPress: onAddSlot },
          { icon: 'event-note', label: 'Slots', color: Colors.electricBlue, onPress: onViewSlots },
          { icon: 'people', label: 'Bookings', color: '#FFB800', onPress: onViewBookings },
          { icon: 'rate-review', label: 'Feedback', color: Colors.textSecondary, onPress: onViewFeedback },
        ].map((a) => (
          <Pressable key={a.label} style={styles.ownerActionBtn} onPress={a.onPress}>
            <View
              style={[styles.ownerActionIcon, { backgroundColor: a.color + '18' }]}
            >
              <MaterialIcons name={a.icon as any} size={22} color={a.color} />
            </View>
            <Text style={[styles.ownerActionLabel, { color: palette.textSecondary }]}>{a.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.feedbackSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Player Feedback</Text>
          <Text style={styles.feedbackAvg}>{overview.avgRating === '--' ? 'No ratings' : `${overview.avgRating} avg`}</Text>
        </View>
        {feedback.length === 0 ? (
          <Text style={[styles.upcomingEmpty, { color: palette.textMuted }]}>No feedback yet</Text>
        ) : (
          feedback.map((item) => (
            <View key={item.id} style={[styles.feedbackCard, { backgroundColor: palette.card, borderColor: palette.borderSoft }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.ownerBookingPlayer, { color: palette.text }]}>{item.player?.full_name ?? 'Player'}</Text>
                <Text style={styles.ownerBookingSport}>{item.slots?.sport ?? 'Sport'} - {item.slots?.owner?.turf_name ?? 'Turf'}</Text>
                <Text style={[styles.ownerBookingMeta, { color: palette.textMuted }]}>{item.feedback_text || 'No written feedback'}</Text>
                <Text style={[styles.ownerBookingMeta, { color: palette.textMuted }]}>{item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : ''}</Text>
              </View>
              <View style={styles.ratingPill}>
                <MaterialIcons name="star" size={14} color="#FFB800" />
                <Text style={styles.ratingPillText}>{item.rating}</Text>
              </View>
            </View>
          ))
        )}
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
  themeToggle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.sm,
    paddingVertical: 0,
    outlineStyle: 'none' as any,
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
  upcomingEmpty: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizes.sm,
  },
  upcomingCard: {
    width: 210,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
    backgroundColor: Colors.bgCard,
    padding: Spacing.md,
    overflow: 'hidden',
    gap: 5,
  },
  upcomingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  upcomingIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingBadge: {
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,255,136,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  upcomingBadgeText: {
    color: Colors.neonGreen,
    fontSize: 10,
    fontWeight: '800',
  },
  upcomingSport: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '800',
  },
  upcomingTurf: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
  },
  upcomingMeta: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizes.xs,
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
  feedbackSection: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  feedbackAvg: {
    color: '#FFB800',
    fontSize: Typography.fontSizes.xs,
    fontWeight: '800',
  },
  feedbackCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 3,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,184,0,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingPillText: {
    color: '#FFB800',
    fontSize: Typography.fontSizes.xs,
    fontWeight: '900',
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
  ownerBookingGroup: {
    gap: Spacing.sm,
  },
  ownerBookingGroupTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.base,
    fontWeight: '900',
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
  feedbackTabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  feedbackTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  feedbackTabActive: {
    borderColor: Colors.neonGreen + '70',
    backgroundColor: 'rgba(0,255,136,0.10)',
  },
  feedbackTabText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizes.xs,
    fontWeight: '800',
  },
  feedbackTabTextActive: {
    color: Colors.neonGreen,
  },
  markReviewedBtn: {
    marginTop: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.neonGreen + '55',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  markReviewedText: {
    color: Colors.neonGreen,
    fontSize: 10,
    fontWeight: '900',
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
