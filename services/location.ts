// PlayArena — Location Service
import * as ExpoLocation from 'expo-location';

export interface LocationData {
  city: string;
  area: string;
  coords?: { latitude: number; longitude: number };
  isAutoDetected: boolean;
}

export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export const LocationService = {
  async requestPermission(): Promise<LocationPermissionStatus> {
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    return status as LocationPermissionStatus;
  },

  async checkPermission(): Promise<LocationPermissionStatus> {
    const { status } = await ExpoLocation.getForegroundPermissionsAsync();
    return status as LocationPermissionStatus;
  },

  async getCurrentLocation(): Promise<LocationData> {
    const status = await this.requestPermission();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    const position = await ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.Balanced,
    });

    const [geocode] = await ExpoLocation.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });

    const city = geocode?.city ?? geocode?.subregion ?? 'Unknown City';
    const area = geocode?.district ?? geocode?.name ?? '';

    return {
      city,
      area,
      coords: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      isAutoDetected: true,
    };
  },
};

// Popular cities for manual selection
export const POPULAR_CITIES: string[] = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Surat',
  'Lucknow',
  'Chandigarh',
];
