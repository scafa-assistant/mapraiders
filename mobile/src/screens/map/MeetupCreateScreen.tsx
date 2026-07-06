import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, MapPressEvent, type MapViewRef } from '@components/map';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocationStore } from '../../store/locationStore';
import { meetupApi } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import { getMapStyle } from '../../utils/mapStyles';
import { useSettingsStore } from '../../store/settingsStore';
import { Theme, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import type { MeetupCreateScreenProps } from '../../navigation/types';
import { strings as S } from '../../i18n';

const { width } = Dimensions.get('window');

interface Category {
  key: string;
  label: string;
  emoji: string;
  color: string;
}

const getCategories = (): Category[] => [
  { key: 'dog_walk', label: S.map.meetupCreate.categoryDogWalk, emoji: '\uD83D\uDC15', color: '#F5A623' },
  { key: 'sport', label: S.map.meetupCreate.categorySport, emoji: '\uD83C\uDFC3', color: '#1B9E5A' },
  { key: 'party', label: S.map.meetupCreate.categoryParty, emoji: '\uD83C\uDF89', color: '#FF69B4' },
  { key: 'gaming', label: S.map.meetupCreate.categoryGaming, emoji: '\uD83C\uDFAE', color: '#1558F0' },
  { key: 'meetup', label: S.map.meetupCreate.categoryMeetup, emoji: '\uD83E\uDD1D', color: '#1558F0' },
  { key: 'other', label: S.map.meetupCreate.categoryOther, emoji: '\uD83D\uDCCC', color: '#7A7470' },
];

export default function MeetupCreateScreen({ navigation }: MeetupCreateScreenProps) {
  const theme = useTheme();
  const { settings } = useSettingsStore();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const categories = useMemo(getCategories, []);
  const { currentLocation } = useLocationStore();
  const mapRef = useRef<MapViewRef>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  // Date picker state — simple day/month/year/hour/minute selectors
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const [day, setDay] = useState(tomorrow.getDate());
  const [month, setMonth] = useState(tomorrow.getMonth() + 1);
  const [year, setYear] = useState(tomorrow.getFullYear());
  const [hour, setHour] = useState(20);
  const [minute, setMinute] = useState(0);
  const [category, setCategory] = useState<string>('meetup');
  const [maxAttendees, setMaxAttendees] = useState('');
  const [pinLocation, setPinLocation] = useState<{ latitude: number; longitude: number } | null>(
    currentLocation
      ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude }
      : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [address, setAddress] = useState('');

  // Reverse geocode pin location to get address
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const Location = await import('expo-location');
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results.length > 0) {
        const r = results[0];
        const parts = [r.street, r.streetNumber, r.postalCode, r.city].filter(Boolean);
        setAddress(parts.join(', ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  // Auto-set pin when GPS becomes available
  React.useEffect(() => {
    if (!pinLocation && currentLocation) {
      setPinLocation({ latitude: currentLocation.latitude, longitude: currentLocation.longitude });
      reverseGeocode(currentLocation.latitude, currentLocation.longitude);
    }
  }, [currentLocation, pinLocation]);

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setPinLocation({ latitude, longitude });
    reverseGeocode(latitude, longitude);
    try { require('expo-haptics').selectionAsync(); } catch {}
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert(S.map.meetupCreate.missingNameTitle, S.map.meetupCreate.missingNameMsg);
      return;
    }
    // Use pin location or fall back to current GPS
    const eventLocation = pinLocation || (currentLocation ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude } : null);
    if (!eventLocation) {
      Alert.alert(S.map.meetupCreate.missingLocationTitle, S.map.meetupCreate.missingLocationMsg);
      return;
    }
    // Build date from picker values
    const eventDate = new Date(year, month - 1, day, hour, minute);

    if (eventDate.getTime() <= Date.now()) {
      Alert.alert(S.map.meetupCreate.pastDateTitle, S.map.meetupCreate.pastDateMsg);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        lat: eventLocation.latitude,
        lng: eventLocation.longitude,
        event_date: eventDate.toISOString(),
        max_attendees: maxAttendees.trim() ? parseInt(maxAttendees, 10) : undefined,
      };

      await meetupApi.create(payload);
      Alert.alert(S.map.meetupCreate.createdTitle, S.map.meetupCreate.createdMsg, [
        { text: S.common.ok, onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert(S.common.error, err.message || S.map.meetupCreate.createFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => c.key === category) ?? categories[3];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{S.map.meetupCreate.headerTitle}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Map Picker */}
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.mapPicker}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              customMapStyle={getMapStyle(settings.darkMapStyle)}
              initialRegion={
                currentLocation
                  ? {
                      latitude: currentLocation.latitude,
                      longitude: currentLocation.longitude,
                      latitudeDelta: 0.008,
                      longitudeDelta: 0.008,
                    }
                  : {
                      latitude: 44.4268,
                      longitude: 26.1025,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }
              }
              onPress={handleMapPress}
              showsUserLocation
              rotateEnabled={false}
            >
              {pinLocation && (
                <Marker coordinate={pinLocation}>
                  <View style={styles.pinMarker}>
                    <Ionicons name="location" size={28} color="#FF69B4" />
                  </View>
                </Marker>
              )}
            </MapView>
            <Text style={styles.mapHint}>{S.map.meetupCreate.mapHint}</Text>
            {address ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6, paddingHorizontal: 4 }}>
                <Ionicons name="location-outline" size={14} color="#F5A623" />
                <Text style={{ color: '#F5A623', fontSize: 12, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                  {address}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Name Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{S.map.meetupCreate.nameLabel}</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={(text) => setName(text.slice(0, 100))}
              placeholder={S.map.meetupCreate.namePlaceholder}
              placeholderTextColor={theme.textSecondary}
              maxLength={100}
            />
            <Text style={styles.charCount}>{name.length}/100</Text>
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{S.map.meetupCreate.descriptionLabel}</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={description}
              onChangeText={setDescription}
              placeholder={S.map.meetupCreate.descriptionPlaceholder}
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Date & Time Picker */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{S.map.meetupCreate.dateTimeLabel}</Text>
            <View style={styles.datePickerRow}>
              <View style={styles.datePickerUnit}>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setDay(d => Math.min(31, d + 1))}>
                  <Ionicons name="chevron-up" size={18} color={theme.primary} />
                </TouchableOpacity>
                <Text style={styles.dateValue}>{String(day).padStart(2, '0')}</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setDay(d => Math.max(1, d - 1))}>
                  <Ionicons name="chevron-down" size={18} color={theme.primary} />
                </TouchableOpacity>
                <Text style={styles.dateUnitLabel}>{S.map.meetupCreate.unitDay}</Text>
              </View>
              <Text style={styles.dateSep}>.</Text>
              <View style={styles.datePickerUnit}>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setMonth(m => m >= 12 ? 1 : m + 1)}>
                  <Ionicons name="chevron-up" size={18} color={theme.primary} />
                </TouchableOpacity>
                <Text style={styles.dateValue}>{String(month).padStart(2, '0')}</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setMonth(m => m <= 1 ? 12 : m - 1)}>
                  <Ionicons name="chevron-down" size={18} color={theme.primary} />
                </TouchableOpacity>
                <Text style={styles.dateUnitLabel}>{S.map.meetupCreate.unitMonth}</Text>
              </View>
              <Text style={styles.dateSep}>.</Text>
              <View style={styles.datePickerUnit}>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setYear(y => y + 1)}>
                  <Ionicons name="chevron-up" size={18} color={theme.primary} />
                </TouchableOpacity>
                <Text style={styles.dateValue}>{year}</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setYear(y => Math.max(2026, y - 1))}>
                  <Ionicons name="chevron-down" size={18} color={theme.primary} />
                </TouchableOpacity>
                <Text style={styles.dateUnitLabel}>{S.map.meetupCreate.unitYear}</Text>
              </View>
              <View style={{ width: 16 }} />
              <View style={styles.datePickerUnit}>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setHour(h => h >= 23 ? 0 : h + 1)}>
                  <Ionicons name="chevron-up" size={18} color={theme.warning} />
                </TouchableOpacity>
                <Text style={styles.dateValue}>{String(hour).padStart(2, '0')}</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setHour(h => h <= 0 ? 23 : h - 1)}>
                  <Ionicons name="chevron-down" size={18} color={theme.warning} />
                </TouchableOpacity>
                <Text style={styles.dateUnitLabel}>{S.map.meetupCreate.unitHour}</Text>
              </View>
              <Text style={styles.dateSep}>:</Text>
              <View style={styles.datePickerUnit}>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setMinute(m => m >= 55 ? 0 : m + 5)}>
                  <Ionicons name="chevron-up" size={18} color={theme.warning} />
                </TouchableOpacity>
                <Text style={styles.dateValue}>{String(minute).padStart(2, '0')}</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setMinute(m => m <= 0 ? 55 : m - 5)}>
                  <Ionicons name="chevron-down" size={18} color={theme.warning} />
                </TouchableOpacity>
                <Text style={styles.dateUnitLabel}>{S.map.meetupCreate.unitMinute}</Text>
              </View>
            </View>
          </View>

          {/* Category */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{S.map.meetupCreate.categoryLabel}</Text>
            <View style={styles.categoryRow}>
              {categories.map((cat) => {
                const isSelected = category === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected ? `${cat.color}30` : theme.surface,
                        borderColor: isSelected ? cat.color : theme.border,
                      },
                    ]}
                    onPress={() => setCategory(cat.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                    <Text
                      style={[
                        styles.categoryLabel,
                        { color: isSelected ? cat.color : theme.textSecondary },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Max Attendees */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{S.map.meetupCreate.maxAttendeesLabel}</Text>
            <TextInput
              style={styles.textInput}
              value={maxAttendees}
              onChangeText={(text) => setMaxAttendees(text.replace(/[^0-9]/g, ''))}
              placeholder={S.map.meetupCreate.unlimitedPlaceholder}
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
            />
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={[
              styles.createBtn,
              { backgroundColor: selectedCategory.color },
              isSubmitting && styles.createBtnDisabled,
            ]}
            onPress={handleCreate}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color={theme.bg} />
            ) : (
              <>
                <Ionicons name="calendar" size={20} color={theme.bg} />
                <Text style={styles.createBtnText}>{S.map.meetupCreate.createEventBtn}</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: SPACING.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: theme.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  mapContainer: {
    marginTop: SPACING.lg,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
  },
  mapPicker: {
    width: '100%',
    height: 250,
  },
  mapHint: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(246, 244, 241, 0.85)',
    color: theme.textSecondary,
    fontSize: FONT_SIZE.xs,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  pinMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldGroup: {
    marginTop: SPACING.xl,
  },
  fieldLabel: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: theme.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    color: theme.text,
    fontSize: FONT_SIZE.md,
    borderWidth: 1,
    borderColor: theme.border,
  },
  multilineInput: {
    minHeight: 90,
    paddingTop: SPACING.md,
  },
  charCount: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: 4,
    textAlign: 'right',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    gap: 6,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xxl,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  createBtnDisabled: {
    opacity: 0.6,
  },
  createBtnText: {
    color: theme.bg,
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
    letterSpacing: 1,
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  datePickerUnit: {
    alignItems: 'center',
    minWidth: 44,
  },
  dateBtn: {
    padding: 6,
  },
  dateValue: {
    color: theme.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  dateUnitLabel: {
    color: theme.textSecondary,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  dateSep: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    marginBottom: 16,
  },
});
