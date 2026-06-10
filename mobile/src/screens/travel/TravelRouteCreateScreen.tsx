import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, MapPressEvent } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { travelApi } from '../../services/api';
import { useLocationStore } from '../../store/locationStore';
import { strings as S, t } from '../../i18n';
import { TravelRouteCreateScreenProps } from '../../navigation/types';

const { width } = Dimensions.get('window');

interface SpotDraft {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  photoUri?: string;
}

export default function TravelRouteCreateScreen({
  navigation,
}: TravelRouteCreateScreenProps) {
  const { currentLocation } = useLocationStore();
  const mapRef = useRef<MapView>(null);

  const [routeName, setRouteName] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [spots, setSpots] = useState<SpotDraft[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [editingSpotIndex, setEditingSpotIndex] = useState<number | null>(null);

  const handleMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const newSpot: SpotDraft = {
      id: `spot_${Date.now()}_${spots.length}`,
      name: t(S.travel.create.defaultSpotName, { number: spots.length + 1 }),
      description: '',
      latitude,
      longitude,
    };
    setSpots([...spots, newSpot]);
    setEditingSpotIndex(spots.length);
  };

  const updateSpot = (index: number, updates: Partial<SpotDraft>) => {
    const updated = [...spots];
    updated[index] = { ...updated[index], ...updates };
    setSpots(updated);
  };

  const removeSpot = (index: number) => {
    const updated = spots.filter((_, i) => i !== index);
    setSpots(updated);
    setEditingSpotIndex(null);
  };

  const pickPhoto = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (!result.canceled && result.assets[0]) {
      updateSpot(index, { photoUri: result.assets[0].uri });
    }
  };

  const moveSpot = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= spots.length) return;
    const updated = [...spots];
    [updated[fromIndex], updated[toIndex]] = [updated[toIndex], updated[fromIndex]];
    setSpots(updated);
    setEditingSpotIndex(toIndex);
  };

  const handlePublish = async () => {
    if (!routeName.trim()) {
      Alert.alert(S.travel.create.missingNameTitle, S.travel.create.missingNameMsg);
      return;
    }
    if (spots.length < 2) {
      Alert.alert(S.travel.create.notEnoughSpotsTitle, S.travel.create.notEnoughSpotsMsg);
      return;
    }

    setPublishing(true);
    try {
      const payload = {
        name: routeName.trim(),
        description: routeDescription.trim(),
        spots: spots.map((spot, index) => ({
          name: spot.name,
          description: spot.description,
          latitude: spot.latitude,
          longitude: spot.longitude,
          order: index,
        })),
      };
      await travelApi.create(payload);
      Alert.alert(S.travel.create.publishedTitle, S.travel.create.publishedMsg, [
        { text: S.common.ok, onPress: () => navigation.goBack() },
      ]);
    } catch (_err) {
      Alert.alert(S.common.error, S.travel.create.publishFailed);
    } finally {
      setPublishing(false);
    }
  };

  const polylineCoords = spots.map((s) => ({
    latitude: s.latitude,
    longitude: s.longitude,
  }));

  const initialRegion = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: 48.2082,
        longitude: 16.3738,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={22} color="#8892B0" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{S.travel.create.title}</Text>
          </View>

          {/* Route Name */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>{S.travel.create.nameLabel}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={S.travel.create.namePlaceholder}
              placeholderTextColor="#555E78"
              value={routeName}
              onChangeText={setRouteName}
              maxLength={60}
            />
          </View>

          {/* Description */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>{S.travel.create.descriptionLabel}</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder={S.travel.create.descriptionPlaceholder}
              placeholderTextColor="#555E78"
              value={routeDescription}
              onChangeText={setRouteDescription}
              multiline
              numberOfLines={3}
              maxLength={500}
              textAlignVertical="top"
            />
          </View>

          {/* Map */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              {t(S.travel.create.mapLabel, { count: spots.length })}
            </Text>
            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                style={styles.map}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                initialRegion={initialRegion}
                showsUserLocation
                showsMyLocationButton={false}
                onPress={handleMapPress}
              >
                {/* Route line */}
                {polylineCoords.length >= 2 && (
                  <Polyline
                    coordinates={polylineCoords}
                    strokeColor="#00FF88"
                    strokeWidth={3}
                    lineDashPattern={[8, 6]}
                  />
                )}

                {/* Spot markers */}
                {spots.map((spot, index) => (
                  <Marker
                    key={spot.id}
                    coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
                    anchor={{ x: 0.5, y: 0.5 }}
                    onPress={() => setEditingSpotIndex(index)}
                  >
                    <View
                      style={[
                        styles.spotMarker,
                        editingSpotIndex === index && styles.spotMarkerSelected,
                      ]}
                    >
                      <Text style={styles.spotMarkerText}>{index + 1}</Text>
                    </View>
                  </Marker>
                ))}
              </MapView>
            </View>
          </View>

          {/* Spot List / Editor */}
          {spots.length > 0 && (
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>{S.travel.create.spotsLabel}</Text>
              {spots.map((spot, index) => {
                const isEditing = editingSpotIndex === index;

                return (
                  <View
                    key={spot.id}
                    style={[
                      styles.spotCard,
                      isEditing && styles.spotCardEditing,
                    ]}
                  >
                    <View style={styles.spotCardHeader}>
                      <View style={styles.spotNumberBadge}>
                        <Text style={styles.spotNumberText}>{index + 1}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.spotCardHeaderAction}
                        onPress={() =>
                          setEditingSpotIndex(isEditing ? null : index)
                        }
                      >
                        <Ionicons
                          name={isEditing ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color="#8892B0"
                        />
                      </TouchableOpacity>

                      {/* Reorder buttons */}
                      <TouchableOpacity
                        onPress={() => moveSpot(index, 'up')}
                        disabled={index === 0}
                        style={[
                          styles.reorderButton,
                          index === 0 && styles.reorderButtonDisabled,
                        ]}
                      >
                        <Ionicons
                          name="arrow-up"
                          size={16}
                          color={index === 0 ? '#2A3450' : '#8892B0'}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => moveSpot(index, 'down')}
                        disabled={index === spots.length - 1}
                        style={[
                          styles.reorderButton,
                          index === spots.length - 1 && styles.reorderButtonDisabled,
                        ]}
                      >
                        <Ionicons
                          name="arrow-down"
                          size={16}
                          color={index === spots.length - 1 ? '#2A3450' : '#8892B0'}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => removeSpot(index)}
                        style={styles.removeButton}
                      >
                        <Ionicons name="trash-outline" size={16} color="#FF4757" />
                      </TouchableOpacity>
                    </View>

                    {/* Spot name (always visible) */}
                    {isEditing ? (
                      <View style={styles.spotEditFields}>
                        <TextInput
                          style={styles.spotInput}
                          placeholder={S.travel.create.spotNamePlaceholder}
                          placeholderTextColor="#555E78"
                          value={spot.name}
                          onChangeText={(text) => updateSpot(index, { name: text })}
                          maxLength={60}
                        />
                        <TextInput
                          style={[styles.spotInput, styles.spotTextArea]}
                          placeholder={S.travel.create.spotDescPlaceholder}
                          placeholderTextColor="#555E78"
                          value={spot.description}
                          onChangeText={(text) =>
                            updateSpot(index, { description: text })
                          }
                          multiline
                          numberOfLines={2}
                          maxLength={300}
                          textAlignVertical="top"
                        />
                        <TouchableOpacity
                          style={styles.photoButton}
                          onPress={() => pickPhoto(index)}
                        >
                          <Ionicons
                            name={spot.photoUri ? 'image' : 'image-outline'}
                            size={18}
                            color={spot.photoUri ? '#00FF88' : '#8892B0'}
                          />
                          <Text
                            style={[
                              styles.photoButtonText,
                              spot.photoUri && styles.photoButtonTextActive,
                            ]}
                          >
                            {spot.photoUri ? S.travel.create.photoAdded : S.travel.create.addPhoto}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={styles.spotNamePreview} numberOfLines={1}>
                        {spot.name}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Publish Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.publishButton,
              (publishing || spots.length < 2 || !routeName.trim()) &&
                styles.publishButtonDisabled,
            ]}
            onPress={handlePublish}
            disabled={publishing || spots.length < 2 || !routeName.trim()}
            activeOpacity={0.8}
          >
            {publishing ? (
              <ActivityIndicator color="#0A0E17" size="small" />
            ) : (
              <>
                <Ionicons name="globe" size={22} color="#0A0E17" />
                <Text style={styles.publishButtonText}>{S.travel.create.publishRoute}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#141B2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputLabel: {
    color: '#8892B0',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: '#141B2D',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1A2340',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
  },
  mapContainer: {
    width: width - 40,
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1A2340',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  spotMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00FF88',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  spotMarkerSelected: {
    backgroundColor: '#00D4FF',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
  },
  spotMarkerText: {
    color: '#0A0E17',
    fontSize: 12,
    fontWeight: '900',
  },
  spotCard: {
    backgroundColor: '#141B2D',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1A2340',
  },
  spotCardEditing: {
    borderColor: '#00D4FF',
  },
  spotCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  spotNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  spotNumberText: {
    color: '#00FF88',
    fontSize: 13,
    fontWeight: '800',
  },
  spotCardHeaderAction: {
    flex: 1,
  },
  reorderButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#0A0E17',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderButtonDisabled: {
    opacity: 0.3,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spotEditFields: {
    gap: 8,
  },
  spotInput: {
    backgroundColor: '#0A0E17',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1A2340',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  spotTextArea: {
    minHeight: 60,
    paddingTop: 10,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  photoButtonText: {
    color: '#8892B0',
    fontSize: 13,
    fontWeight: '600',
  },
  photoButtonTextActive: {
    color: '#00FF88',
  },
  spotNamePreview: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 14, 23, 0.95)',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: '#1A2340',
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00D4FF',
    borderRadius: 16,
    height: 56,
    gap: 10,
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  publishButtonDisabled: {
    opacity: 0.5,
  },
  publishButtonText: {
    color: '#0A0E17',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
