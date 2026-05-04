import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SportEntry {
  key: string;
  icon: string;
  color: string;
  type: 'predefined' | 'custom';
  isPool?: boolean;
}

const CUSTOM_SPORTS_KEY = '@playarena_custom_sports';

export const PREDEFINED_SPORTS: SportEntry[] = [
  { key: 'Football',    icon: 'soccer',         color: '#00FF88', type: 'predefined' },
  { key: 'Cricket',     icon: 'cricket',        color: '#FFB800', type: 'predefined' },
  { key: 'Badminton',   icon: 'badminton',      color: '#C084FC', type: 'predefined' },
  { key: 'Volleyball',  icon: 'volleyball',     color: '#00BFFF', type: 'predefined' },
  { key: 'Tennis',      icon: 'tennis',         color: '#FF6B6B', type: 'predefined' },
  { key: 'Basketball',  icon: 'basketball',     color: '#F97316', type: 'predefined' },
  { key: 'Table Tennis',icon: 'table-tennis',   color: '#FB923C', type: 'predefined' },
  { key: 'Swimming',    icon: 'swim',           color: '#38BDF8', type: 'predefined', isPool: true },
];

export function getSportByKey(key: string): SportEntry | undefined {
  return PREDEFINED_SPORTS.find((s) => s.key === key);
}

export async function loadCustomSports(): Promise<SportEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_SPORTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SportEntry[];
  } catch {
    return [];
  }
}

export async function saveCustomSport(
  name: string,
  existing: SportEntry[]
): Promise<SportEntry[] | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const isDuplicate =
    existing.some((s) => s.key.toLowerCase() === trimmed.toLowerCase()) ||
    PREDEFINED_SPORTS.some((s) => s.key.toLowerCase() === trimmed.toLowerCase());
  if (isDuplicate) return null;
  const entry: SportEntry = {
    key: trimmed,
    icon: 'dots-horizontal-circle',
    color: '#A78BFA',
    type: 'custom',
  };
  const updated = [...existing, entry];
  await AsyncStorage.setItem(CUSTOM_SPORTS_KEY, JSON.stringify(updated));
  return updated;
}
