// ============================================================
// Google Maps styles for dark/light mode.
//
// app.json pins userInterfaceStyle to "dark", so the Maps renderer
// would draw its own native dark theme whenever customMapStyle is
// empty. Always passing an explicit style (even in light mode)
// overrides that, keeping tiles in sync with the in-app toggle.
// ============================================================

export const DARK_MAP_STYLE = [
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

// Light look with EXPLICIT colors: the renderer derives its base from the
// Activity uiMode (pinned dark), so every element we care about must be set.
export const LIGHT_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#F5F5F5' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFFFF' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#E0E0E0' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#BFE0F0' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#CDE8CF' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
];

export function getMapStyle(darkMode: boolean) {
  return darkMode ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;
}
