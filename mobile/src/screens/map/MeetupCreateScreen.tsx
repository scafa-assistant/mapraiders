import React, { useState, useRef } from 'react';
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
import MapView, { Marker, PROVIDER_GOOGLE, MapPressEvent } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocationStore } from '../../store/locationStore';
import { meetupApi } from '../../services/api';
import { THEME, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import type { MeetupCreateScreenProps } from '../../navigation/types';

const { width } = Dimensions.get('window');

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0A0E17' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0A0E17' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#555E78' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1A2340' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#141B2D' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0D1220' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0F1A1A' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
];

interface Category {
  key: string;
  label: string;
  emoji: string;
  color: string;
}

const CATEGORIES: Category[] = [
  { key: 'party', label: 'Party', emoji: '\uD83C\uDF89', color: '#FF69B4' },
  { key: 'sport', label: 'Sport', emoji: '\uD83C\uDFC3', color: '#00FF88' },
  { key: 'gaming', label: 'Gaming', emoji: '\uD83C\uDFAE', color: '#7B61FF' },
  { key: 'meetup', label: 'Meetup', emoji: '\uD83E\uDD1D', color: '#00D4FF' },
  { key: 'other', label: 'Other', emoji: '\uD83D\uDCCC', color: '#8892B0' },
];

export default function MeetupCreateScreen({ navigation }: MeetupCreateScreenProps) {
  const { currentLocation } = useLocationStore();
  const mapRef = useRef<MapView>(null);

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

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setPinLocation({ latitude, longitude });
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter an event name.');
      return;
    }
    // Use pin location or fall back to current GPS
    const eventLocation = pinLocation || (currentLocation ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude } : null);
    if (!eventLocation) {
      Alert.alert('Missing Location', 'GPS not available. Please tap the map to set a location.');
      return;
    }
    // Build date from picker values
    const eventDate = new Date(year, month - 1, day, hour, minute);

    if (eventDate.getTime() <= Date.now()) {
      Alert.alert('Past Date', 'The event date must be in the future.');
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
      Alert.alert('Event Created!', 'Your event is now visible on the map.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = CATEGORIES.find((c) => c.key === category) ?? CATEGORIES[3];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={THEME.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Event</Text>
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
              customMapStyle={DARK_MAP_STYLE}
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
            <Text style={styles.mapHint}>Tap to set event location</Text>
          </View>

          {/* Name Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Event Name *</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={(t) => setName(t.slice(0, 100))}
              placeholder="What's the event called?"
              placeholderTextColor={THEME.textSecondary}
              maxLength={100}
            />
            <Text style={styles.charCount}>{name.length}/100</Text>
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Tell people what to expect..."
              placeholderTextColor={THEME.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Date & Time Picker */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Date & Time *</Text>
            <View style={styles.datePickerRow}>
              <View style={styles.datePickerUnit}>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setDay(d => Math.min(31, d + 1))}>
                  <Ionicons name="chevron-up" size={18} color={THEME.primary} />
                </TouchableOpacity>
                <Text style={styles.dateValue}>{String(day).padStart(2, '0')}</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setDay(d => Math.max(1, d - 1))}>
                  <Ionicons name="chevron-down" size={18} color={THEME.primary} />
                </TouchableOpacity>
                <Text style={styles.dateUnitLabel}>Day</Text>
              </View>
              <Text style={styles.dateSep}>.</Text>
              <View style={styles.datePickerUnit}>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setMonth(m => m >= 12 ? 1 : m + 1)}>
                  <Ionicons name="chevron-up" size={18} color={THEME.primary} />
                </TouchableOpacity>
                <Text style={styles.dateValue}>{String(month).padStart(2, '0')}</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setMonth(m => m <= 1 ? 12 : m - 1)}>
                  <Ionicons name="chevron-down" size={18} color={THEME.primary} />
                </TouchableOpacity>
                <Text style={styles.dateUnitLabel}>Mon</Text>
              </View>
              <Text style={styles.dateSep}>.</Text>
              <View style={styles.datePickerUnit}>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setYear(y => y + 1)}>
                  <Ionicons name="chevron-up" size={18} color={THEME.primary} />
                </TouchableOpacity>
                <Text style={styles.dateValue}>{year}</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setYear(y => Math.max(2026, y - 1))}>
                  <Ionicons name="chevron-down" size={18} color={THEME.primary} />
                </TouchableOpacity>
                <Text style={styles.dateUnitLabel}>Year</Text>
              </View>
              <View style={{ width: 16 }} />
              <View style={styles.datePickerUnit}>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setHour(h => h >= 23 ? 0 : h + 1)}>
                  <Ionicons name="chevron-up" size={18} color={THEME.warning} />
                </TouchableOpacity>
                <Text style={styles.dateValue}>{String(hour).padStart(2, '0')}</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setHour(h => h <= 0 ? 23 : h - 1)}>
                  <Ionicons name="chevron-down" size={18} color={THEME.warning} />
                </TouchableOpacity>
                <Text style={styles.dateUnitLabel}>Hr</Text>
              </View>
              <Text style={styles.dateSep}>:</Text>
              <View style={styles.datePickerUnit}>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setMinute(m => m >= 55 ? 0 : m + 5)}>
                  <Ionicons name="chevron-up" size={18} color={THEME.warning} />
                </TouchableOpacity>
                <Text style={styles.dateValue}>{String(minute).padStart(2, '0')}</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setMinute(m => m <= 0 ? 55 : m - 5)}>
                  <Ionicons name="chevron-down" size={18} color={THEME.warning} />
                </TouchableOpacity>
                <Text style={styles.dateUnitLabel}>Min</Text>
              </View>
            </View>
          </View>

          {/* Category */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected ? `${cat.color}30` : THEME.surface,
                        borderColor: isSelected ? cat.color : THEME.border,
                      },
                    ]}
                    onPress={() => setCategory(cat.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                    <Text
                      style={[
                        styles.categoryLabel,
                        { color: isSelected ? cat.color : THEME.textSecondary },
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
            <Text style={styles.fieldLabel}>Max Attendees</Text>
            <TextInput
              style={styles.textInput}
              value={maxAttendees}
              onChangeText={(t) => setMaxAttendees(t.replace(/[^0-9]/g, ''))}
              placeholder="Unlimited"
              placeholderTextColor={THEME.textSecondary}
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
              <ActivityIndicator color={THEME.bg} />
            ) : (
              <>
                <Ionicons name="calendar" size={20} color={THEME.bg} />
                <Text style={styles.createBtnText}>CREATE EVENT</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
    marginRight: SPACING.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: THEME.text,
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
    borderColor: THEME.border,
  },
  mapPicker: {
    width: '100%',
    height: 180,
  },
  mapHint: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(10, 14, 23, 0.85)',
    color: THEME.textSecondary,
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
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    color: THEME.text,
    fontSize: FONT_SIZE.md,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  multilineInput: {
    minHeight: 90,
    paddingTop: SPACING.md,
  },
  charCount: {
    color: THEME.textSecondary,
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
    color: THEME.bg,
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
    color: THEME.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  dateUnitLabel: {
    color: THEME.textSecondary,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  dateSep: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    marginBottom: 16,
  },
});
