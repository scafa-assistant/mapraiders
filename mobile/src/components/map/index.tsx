// ============================================================
// MapLibre Adapter , react-native-maps-kompatible Fassade
// (2026-07-06, one-layer 3D milestone)
//
// Bildet die von der App genutzte react-native-maps-API (MapView/Marker/
// Polygon/Polyline/Circle + imperative Ref-Methoden) NACH, rendert darunter
// aber MapLibre + OpenFreeMap im MapRaiders-Radar-Style. Damit tauscht jede
// der 18 Karten-Dateien nur ihre Import-Zeile (`react-native-maps` →
// `@components/map`); der Engine-Swap lebt komplett hier.
//
// Koordinaten nach außen wie rnmaps: { latitude, longitude }.
// Intern MapLibre/GeoJSON: [lng, lat].
// ============================================================

import React, {
  forwardRef, useEffect, useId, useImperativeHandle, useMemo, useRef,
} from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import {
  Map, Camera, GeoJSONSource, Layer, Marker as MLMarker, UserLocation,
} from '@maplibre/maplibre-react-native';
import type { MapRef, CameraRef, Anchor } from '@maplibre/maplibre-react-native';
import radarStyle from '../../../assets/map/radar-style.json';

// ─── Coordinate types (mirror react-native-maps) ─────────────────────────────
export interface LatLng { latitude: number; longitude: number; }
export interface Region extends LatLng { latitudeDelta: number; longitudeDelta: number; }
export interface MapPressEvent { nativeEvent: { coordinate: LatLng } }
export type LongPressEvent = MapPressEvent;

// Dummy provider constant so `provider={PROVIDER_GOOGLE}` keeps compiling (ignored).
export const PROVIDER_GOOGLE = 'google' as const;

const SCREEN_W = Dimensions.get('window').width;

// ─── zoom ↔ region-delta (web-mercator approximation) ────────────────────────
function zoomFromDelta(lonDelta: number): number {
  const z = Math.log2((360 * (SCREEN_W / 256)) / Math.max(lonDelta, 1e-6));
  return Math.min(20, Math.max(1, z));
}
function deltaFromBounds(bounds: [number, number, number, number]) {
  // bounds = [west, south, east, north]
  return { latitudeDelta: bounds[3] - bounds[1], longitudeDelta: bounds[2] - bounds[0] };
}

// ─── color normalization: MapLibre-native parses rgba()/hex6, but 8-digit hex
//     (#RRGGBBAA / #RGBA, which rnmaps callers use) is unreliable → to rgba(). ─
function normalizeColor(c?: string): string {
  if (!c) return 'rgba(0,0,0,0)';
  if (c[0] === '#') {
    if (c.length === 9) {
      const r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16);
      const b = parseInt(c.slice(5, 7), 16), a = parseInt(c.slice(7, 9), 16) / 255;
      return `rgba(${r},${g},${b},${a.toFixed(3)})`;
    }
    if (c.length === 5) {
      const r = parseInt(c[1] + c[1], 16), g = parseInt(c[2] + c[2], 16);
      const b = parseInt(c[3] + c[3], 16), a = parseInt(c[4] + c[4], 16) / 255;
      return `rgba(${r},${g},${b},${a.toFixed(3)})`;
    }
  }
  return c;
}

const toLngLat = (c: LatLng): [number, number] => [c.longitude, c.latitude];

function closedRing(coords: LatLng[]): [number, number][] {
  const ring = coords.map(toLngLat);
  if (ring.length > 0) {
    const f = ring[0], l = ring[ring.length - 1];
    if (f[0] !== l[0] || f[1] !== l[1]) ring.push(f);
  }
  return ring;
}

// rnmaps anchor {x,y} (0..1) → MapLibre Anchor string.
function toAnchor(a?: { x: number; y: number }): Anchor {
  if (!a) return 'center';
  const ny = a.y < 0.34 ? 'top' : a.y > 0.66 ? 'bottom' : 'center';
  const nx = a.x < 0.34 ? 'left' : a.x > 0.66 ? 'right' : 'center';
  if (nx === 'center' && ny === 'center') return 'center';
  if (nx === 'center') return ny as Anchor;
  if (ny === 'center') return nx as Anchor;
  return `${ny}-${nx}` as Anchor;
}

// A stable, MapLibre-safe unique id per overlay instance.
function useLayerId(prefix: string): string {
  const raw = useId();
  return `${prefix}_${raw.replace(/[^a-zA-Z0-9]/g, '')}`;
}

// ─── MapView ─────────────────────────────────────────────────────────────────
export interface MapViewRef {
  animateToRegion: (region: Region, duration?: number) => void;
  getMapBoundaries: () => Promise<{ northEast: LatLng; southWest: LatLng }>;
  getCamera: () => Promise<{ center: LatLng; zoom: number; pitch: number; heading: number }>;
  fitToCoordinates: (
    coords: LatLng[],
    opts?: { edgePadding?: { top: number; right: number; bottom: number; left: number }; animated?: boolean },
  ) => void;
}
// Also exported as a type named `MapView` so `useRef<MapView>` keeps compiling.
export type MapView = MapViewRef;

interface MapViewProps {
  style?: StyleProp<ViewStyle>;
  initialRegion?: Region;
  region?: Region;
  showsUserLocation?: boolean;
  showsCompass?: boolean;
  rotateEnabled?: boolean;
  onMapReady?: () => void;
  onRegionChangeComplete?: (region: Region) => void;
  onPress?: (e: MapPressEvent) => void;
  onLongPress?: (e: LongPressEvent) => void;
  children?: React.ReactNode;
  // Swallow rnmaps-only props (provider, customMapStyle, showsMyLocationButton,
  // followsUserLocation, etc.) without type noise during migration.
  [key: string]: any;
}

const DEFAULT_CENTER: [number, number] = [7.9812, 51.3642];

const MapViewImpl = forwardRef<MapViewRef, MapViewProps>((props, ref) => {
  const {
    style, initialRegion, region, showsUserLocation, showsCompass,
    onMapReady, onRegionChangeComplete, onPress, onLongPress, children,
  } = props;
  const mapR = useRef<MapRef>(null);
  const camR = useRef<CameraRef>(null);

  const initCenter = useMemo<[number, number]>(() => {
    const r = initialRegion ?? region;
    return r ? [r.longitude, r.latitude] : DEFAULT_CENTER;
  }, []); // once
  const initZoom = useMemo(() => {
    const r = initialRegion ?? region;
    return r ? zoomFromDelta(r.longitudeDelta ?? r.latitudeDelta) : 14;
  }, []); // once

  // Controlled `region` prop → animate when it changes.
  useEffect(() => {
    if (region && camR.current) {
      camR.current.easeTo({
        center: [region.longitude, region.latitude],
        zoom: zoomFromDelta(region.longitudeDelta ?? region.latitudeDelta),
        duration: 300,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region?.latitude, region?.longitude]);

  useImperativeHandle(ref, () => ({
    animateToRegion(r, duration = 500) {
      camR.current?.easeTo({
        center: [r.longitude, r.latitude],
        zoom: zoomFromDelta(r.longitudeDelta ?? r.latitudeDelta),
        duration,
      });
    },
    async getMapBoundaries() {
      const b = await mapR.current!.getBounds(); // [w,s,e,n]
      return {
        northEast: { latitude: b[3], longitude: b[2] },
        southWest: { latitude: b[1], longitude: b[0] },
      };
    },
    async getCamera() {
      const c = await mapR.current!.getCenter(); // [lng,lat]
      const z = await mapR.current!.getZoom();
      return { center: { latitude: c[1], longitude: c[0] }, zoom: z, pitch: 0, heading: 0 };
    },
    fitToCoordinates(coords, opts) {
      if (!coords || coords.length === 0) return;
      let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
      for (const c of coords) {
        w = Math.min(w, c.longitude); e = Math.max(e, c.longitude);
        s = Math.min(s, c.latitude); n = Math.max(n, c.latitude);
      }
      const dw = (e - w) * 0.15 || 0.001, dh = (n - s) * 0.15 || 0.001;
      camR.current?.fitBounds([w - dw, s - dh, e + dw, n + dh], {
        duration: opts?.animated === false ? 0 : 500,
      });
    },
  }));

  return (
    <Map
      ref={mapR}
      style={style ?? StyleSheet.absoluteFill}
      mapStyle={radarStyle as any}
      compass={!!showsCompass}
      logo={false}
      attribution={false}
      onPress={onPress ? (e: any) => onPress({ nativeEvent: { coordinate: { latitude: e.nativeEvent.lngLat[1], longitude: e.nativeEvent.lngLat[0] } } }) : undefined}
      onLongPress={onLongPress ? (e: any) => onLongPress({ nativeEvent: { coordinate: { latitude: e.nativeEvent.lngLat[1], longitude: e.nativeEvent.lngLat[0] } } }) : undefined}
      onDidFinishLoadingMap={() => onMapReady?.()}
      onRegionDidChange={onRegionChangeComplete ? (e: any) => {
        const vs = e.nativeEvent;
        const d = deltaFromBounds(vs.bounds);
        onRegionChangeComplete({ latitude: vs.center[1], longitude: vs.center[0], ...d });
      } : undefined}
    >
      <Camera ref={camR} initialViewState={{ center: initCenter, zoom: initZoom }} />
      {showsUserLocation && <UserLocation />}
      {children}
    </Map>
  );
});
MapViewImpl.displayName = 'MapLibreMapView';

export default MapViewImpl;

// ─── Marker ──────────────────────────────────────────────────────────────────
interface MarkerProps {
  coordinate: LatLng;
  anchor?: { x: number; y: number };
  onPress?: () => void;
  pinColor?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export function Marker({ coordinate, anchor, onPress, pinColor, children }: MarkerProps) {
  return (
    <MLMarker lngLat={toLngLat(coordinate)} anchor={toAnchor(anchor)} onPress={onPress ? () => onPress() : undefined}>
      <View>{children ?? <DefaultPin color={pinColor} />}</View>
    </MLMarker>
  );
}

function DefaultPin({ color = '#1558F0' }: { color?: string }) {
  return <View style={[pinStyles.pin, { backgroundColor: color }]} />;
}
const pinStyles = StyleSheet.create({
  pin: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#FFFFFF' },
});

// ─── Polygon ─────────────────────────────────────────────────────────────────
interface PolygonProps {
  coordinates: LatLng[];
  holes?: LatLng[][];
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  tappable?: boolean;
  onPress?: () => void;
  [key: string]: any;
}

export function Polygon({ coordinates, holes, fillColor, strokeColor, strokeWidth = 1, tappable, onPress }: PolygonProps) {
  const src = useLayerId('polysrc');
  const data = useMemo(() => {
    const rings: [number, number][][] = [closedRing(coordinates)];
    if (holes) for (const h of holes) rings.push(closedRing(h));
    return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: rings } };
  }, [coordinates, holes]);
  return (
    <GeoJSONSource id={src} data={data as any} onPress={tappable && onPress ? () => onPress() : undefined}>
      <Layer id={`${src}_f`} type="fill" source={src} paint={{ 'fill-color': normalizeColor(fillColor) } as any} />
      <Layer id={`${src}_l`} type="line" source={src} paint={{ 'line-color': normalizeColor(strokeColor), 'line-width': strokeWidth } as any} />
    </GeoJSONSource>
  );
}

// ─── Polyline ────────────────────────────────────────────────────────────────
interface PolylineProps {
  coordinates: LatLng[];
  strokeColor?: string;
  strokeWidth?: number;
  [key: string]: any;
}

export function Polyline({ coordinates, strokeColor, strokeWidth = 2 }: PolylineProps) {
  const src = useLayerId('linesrc');
  const data = useMemo(() => ({
    type: 'Feature', properties: {},
    geometry: { type: 'LineString', coordinates: coordinates.map(toLngLat) },
  }), [coordinates]);
  return (
    <GeoJSONSource id={src} data={data as any}>
      <Layer
        id={`${src}_l`}
        type="line"
        source={src}
        layout={{ 'line-cap': 'round', 'line-join': 'round' } as any}
        paint={{ 'line-color': normalizeColor(strokeColor), 'line-width': strokeWidth } as any}
      />
    </GeoJSONSource>
  );
}

// ─── Circle (radius in meters → geodesic polygon) ────────────────────────────
interface CircleProps {
  center: LatLng;
  radius: number; // meters
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  [key: string]: any;
}

export function Circle({ center, radius, fillColor, strokeColor, strokeWidth = 1 }: CircleProps) {
  const src = useLayerId('circsrc');
  const data = useMemo(() => {
    const n = 48;
    const dLat = radius / 111320;
    const dLng = radius / (111320 * Math.cos((center.latitude * Math.PI) / 180));
    const ring: [number, number][] = [];
    for (let i = 0; i <= n; i++) {
      const t = (2 * Math.PI * i) / n;
      ring.push([center.longitude + dLng * Math.cos(t), center.latitude + dLat * Math.sin(t)]);
    }
    return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } };
  }, [center.latitude, center.longitude, radius]);
  return (
    <GeoJSONSource id={src} data={data as any}>
      <Layer id={`${src}_f`} type="fill" source={src} paint={{ 'fill-color': normalizeColor(fillColor) } as any} />
      <Layer id={`${src}_l`} type="line" source={src} paint={{ 'line-color': normalizeColor(strokeColor), 'line-width': strokeWidth } as any} />
    </GeoJSONSource>
  );
}
