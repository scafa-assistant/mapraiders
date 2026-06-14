// ============================================================
// Google Maps styles for dark/light mode.
//
// app.json pins userInterfaceStyle to "dark", so the Maps renderer
// would draw its own native dark theme whenever customMapStyle is
// empty. Always passing an explicit style (even in light mode)
// overrides that, keeping tiles in sync with the in-app toggle.
// ============================================================

// Clean light basemap matching the web cockpit. Both exports resolve to the
// SAME light style so the renderer never draws dark tiles regardless of the
// historic dark-mode toggle.
export const LIGHT_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#F6F4F1' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFFFF' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7A7470' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#E5E1DB' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#CFE0F5' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#DCE8D6' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
];

// Kept for API compatibility — mirrors the light brand basemap.
export const DARK_MAP_STYLE = LIGHT_MAP_STYLE;

export function getMapStyle(darkMode: boolean) {
  return darkMode ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;
}
