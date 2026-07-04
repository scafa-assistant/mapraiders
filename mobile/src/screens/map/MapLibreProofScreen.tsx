// ============================================================
// MapLibre 3D , Phase A Proof (2026-07-04, one-layer 3D milestone)
// Isolated screen that proves the MapLibre engine lives in the build:
//   - OpenFreeMap vector tiles rendered in the MapRaiders radar style
//     (white land, blue water, green woods, no labels)
//   - tiltable camera (pitch) so 3D reads
//   - a test territory polygon at Sundern
//   - three FillExtrusion blocks at tier heights (I/II/III)
// It touches NO production map code. Once this renders on-device, the real
// MapScreen migration (Phase B/C) follows with confidence. See
// _docs/gdd/VISION_OneLayer_3D_Weltkarte.md.
// ============================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Map, Camera, GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import type { MapLibreProofScreenProps } from '../../navigation/types';
import radarStyle from '../../../assets/map/radar-style.json';

// Brand palette (white/blue, no purple).
const ACCENT = '#1558F0';
const AMBER = '#F5A623';
const TEXT = '#141210';
const SURFACE = '#FFFFFF';
const BORDER = '#C0BAB4';

// Sundern test area (DopeRunner territory neighborhood, ~51.32 / 8.00).
const CENTER: [number, number] = [8.0, 51.32];

/** Axis-aligned square polygon of `half` degrees around [lng, lat]. */
function square(lng: number, lat: number, halfLng: number, halfLat: number): number[][][] {
  return [[
    [lng - halfLng, lat - halfLat],
    [lng + halfLng, lat - halfLat],
    [lng + halfLng, lat + halfLat],
    [lng - halfLng, lat + halfLat],
    [lng - halfLng, lat - halfLat],
  ]];
}

// Test territory outline (~700 x 450 m rectangle).
const TERRITORY = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: square(8.0, 51.32, 0.0035, 0.002) } },
  ],
} as const;

// Three buildings at tier heights, colored like the Struktur-Codex.
const BUILDINGS = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { height: 18, color: ACCENT }, geometry: { type: 'Polygon', coordinates: square(7.9988, 51.3198, 0.00016, 0.0001) } },
    { type: 'Feature', properties: { height: 40, color: ACCENT }, geometry: { type: 'Polygon', coordinates: square(8.0, 51.3201, 0.0002, 0.00013) } },
    { type: 'Feature', properties: { height: 72, color: AMBER }, geometry: { type: 'Polygon', coordinates: square(8.0014, 51.3199, 0.00018, 0.00011) } },
  ],
} as const;

export default function MapLibreProofScreen({ navigation }: MapLibreProofScreenProps) {
  const insets = useSafeAreaInsets();
  const [pitched, setPitched] = useState(true);

  return (
    <View style={styles.container}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={radarStyle as any}
        touchPitch
        compass={false}
        logo={false}
      >
        <Camera
          center={CENTER}
          zoom={16}
          pitch={pitched ? 55 : 0}
          bearing={20}
          duration={600}
        />

        {/* Test territory: blue outline + faint fill */}
        <GeoJSONSource id="terr" data={TERRITORY as any}>
          <Layer id="terr-fill" type="fill" source="terr" paint={{ 'fill-color': ACCENT, 'fill-opacity': 0.1 }} />
          <Layer id="terr-line" type="line" source="terr" paint={{ 'line-color': ACCENT, 'line-width': 2.5 }} />
        </GeoJSONSource>

        {/* Buildings as real 3D extrusions, height from feature property */}
        <GeoJSONSource id="bld" data={BUILDINGS as any}>
          <Layer
            id="bld-ext"
            type="fill-extrusion"
            source="bld"
            paint={{
              'fill-extrusion-color': ['get', 'color'],
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': 0.92,
            }}
          />
        </GeoJSONSource>
      </Map>

      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerWrap} pointerEvents="box-none">
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={TEXT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MapLibre 3D · Phase A</Text>
          <View style={styles.headerBtn} />
        </View>
      </SafeAreaView>

      {/* What to look for */}
      <View style={[styles.hint, { top: insets.top + 60 }]} pointerEvents="none">
        <Text style={styles.hintText}>
          Weißes Land · blaues Wasser · echte 3D-Klötze (I/II/III). OpenFreeMap-Vektor,
          kein Satellit. Zwei Finger zum Kippen.
        </Text>
      </View>

      {/* Flat / 3D toggle */}
      <TouchableOpacity
        style={[styles.toggle, { bottom: insets.bottom + 24 }]}
        onPress={() => setPitched((p) => !p)}
        activeOpacity={0.85}
      >
        <Ionicons name={pitched ? 'square-outline' : 'cube-outline'} size={18} color="#FFFFFF" />
        <Text style={styles.toggleText}>{pitched ? 'Flach' : '3D kippen'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F4F1' },
  headerWrap: { position: 'absolute', top: 0, left: 0, right: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '800',
    backgroundColor: SURFACE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  hint: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  hintText: { color: TEXT, fontSize: 12, fontWeight: '600', lineHeight: 17 },
  toggle: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ACCENT,
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 24,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  toggleText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
});
