// ============================================================
// MapLibre , "Echte Gebäude werden Spielgebäude" Proof
// (2026-07-06, one-layer 3D milestone, Renés Reskin-Idee)
//
// Beweist Renés Kern-Idee: die ECHTEN OSM-Gebäude der Umgebung (aus dem
// OpenFreeMap-Vektorlayer `building`) werden als UNSERE Spielgebäude gerendert
// , gleiche Position, gleiche Grundfläche, gleiche echte Höhe, nur in unserer
// Optik (Marken-Blau, 3D-extrudiert). Antippen wählt ein reales Haus aus und
// färbt es amber = "dieses echte Gebäude beanspruchen/umfunktionieren".
// Dazu echte Straßen aus dem `transportation`-Layer, nach Klasse eingefärbt
// (deutet die Straßen-Ausbaustufen an: Pfad → Nebenstraße → Hauptstraße).
//
// Das ist der Machbarkeits-Beweis dafür, dass wir NICHT jedes Gebäude selbst
// modellieren müssen, sondern die reale Welt "klemmen und umfunktionieren".
// Berührt KEINEN produktiven Karten-Code. Siehe
// _docs/gdd/VISION_OneLayer_3D_Weltkarte.md.
// ============================================================

import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { NativeSyntheticEvent } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Map, Camera, GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import type { MapRef } from '@maplibre/maplibre-react-native';
import type { MapLibreProofScreenProps } from '../../navigation/types';
import radarStyle from '../../../assets/map/radar-style.json';

// Brand palette (white/blue, no purple).
const ACCENT = '#1558F0';
const AMBER = '#F5A623';
const TEXT = '#141210';
const SURFACE = '#FFFFFF';
const BORDER = '#C0BAB4';

// Sundern-Hachen village center (dense OSM building coverage near Renés Revier).
const CENTER: [number, number] = [7.9895, 51.3577];

const EMPTY_FC = { type: 'FeatureCollection', features: [] } as const;

export default function MapLibreProofScreen({ navigation }: MapLibreProofScreenProps) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapRef>(null);
  const [pitched, setPitched] = useState(true);
  // The real building the player tapped, echoed back as an amber "claimed" solid.
  const [selected, setSelected] = useState<GeoJSON.FeatureCollection>(EMPTY_FC as any);
  const [tappedName, setTappedName] = useState<string | null>(null);

  // Tap → query the real building footprint under the finger, highlight it.
  const onMapPress = async (e: NativeSyntheticEvent<any>) => {
    const point = e?.nativeEvent?.point;
    if (!point || !mapRef.current) return;
    try {
      const feats = await mapRef.current.queryRenderedFeatures(point, { layers: ['bld-real'] });
      if (feats && feats.length > 0) {
        const f = feats[0];
        setSelected({ type: 'FeatureCollection', features: [f] });
        const props: any = f.properties || {};
        setTappedName(props.name || `Gebäude ${props.render_height ? Math.round(props.render_height) + ' m' : ''}`.trim() || 'Reales Gebäude');
      } else {
        setSelected(EMPTY_FC as any);
        setTappedName(null);
      }
    } catch {
      // query can fail mid-gesture; ignore, keep last selection
    }
  };

  return (
    <View style={styles.container}>
      <Map
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        mapStyle={radarStyle as any}
        touchPitch
        compass={false}
        logo={false}
        onPress={onMapPress}
      >
        <Camera center={CENTER} zoom={16.5} pitch={pitched ? 55 : 0} bearing={20} duration={600} />

        {/* REAL OSM buildings, rendered as OUR game buildings: brand blue,
            extruded by their real height. This is the whole point. */}
        <Layer
          id="bld-real"
          type="fill-extrusion"
          source="openmaptiles"
          source-layer="building"
          paint={{
            'fill-extrusion-color': ACCENT,
            'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 6],
            'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
            'fill-extrusion-opacity': 0.85,
          }}
        />

        {/* The tapped building, echoed back as an amber solid = "claimed". */}
        <GeoJSONSource id="sel" data={selected as any}>
          <Layer
            id="sel-ext"
            type="fill-extrusion"
            source="sel"
            paint={{
              'fill-extrusion-color': AMBER,
              'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
              'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
              'fill-extrusion-opacity': 0.95,
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
          <Text style={styles.headerTitle}>Echte Gebäude → Spielgebäude</Text>
          <View style={styles.headerBtn} />
        </View>
      </SafeAreaView>

      {/* What to look for */}
      <View style={[styles.hint, { top: insets.top + 60 }]} pointerEvents="none">
        <Text style={styles.hintText}>
          {tappedName
            ? `Beansprucht: ${tappedName} (echtes OSM-Haus, amber). Tippe ein anderes an.`
            : 'Jedes blaue 3D-Haus ist ein ECHTES Gebäude aus der Karte, in unserer Optik. Tippe eins an, um es zu beanspruchen. Straßen nach Ausbaustufe eingefärbt.'}
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
    fontSize: 14,
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
