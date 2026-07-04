# VISION + MEILENSTEIN: Ein Layer, echte 3D-Weltkarte (René, 2026-07-04)

> **Entscheidung (René, 2026-07-04):** Kein separater Basis-Screen mehr. Alles auf
> EINEM Layer, der echten Weltkarte. Man erobert Territorium, tippt es an, und baut
> die Gebäude direkt auf der weißen Karte. Andere Spieler sehen die Gebäude und
> Mauern DIREKT auf der Karte. Mauern werden echte, umkreisbare 3D-Bauten mit
> Materialstufen (Maschendraht → Ziegel → gepanzert gegen Artillerie).
> Gewählter Weg: **echte 3D-Engine** (MapLibre) + **voller Merge** (nicht erst Prototyp).

## Die Vision in einem Satz
Die echte Weltkarte IST das Spielfeld: Territorien, Gebäude und Mauern stehen sichtbar
für alle im selben 3D-Layer, gebaut direkt auf dem eroberten Land, ohne zweiten Screen.

## Warum ein Layer besser ist (nicht nur einfacher)
Sichtbarkeit ist der soziale Motor eines Territorial-MMO. Eine private Basis, die keiner
sieht, erzeugt keinen Sog. Öffentliche Festungen und Mauern sind Angeberei, Abschreckung
und Ziel-Markierung in einem, das bindet Spieler. Der Merge löst zugleich Renés reale
Verwirrung ("brauche ich zwei Layer?") auf: es gab nie zwei Daten-Layer, nur einen
zweiten Screen. Der fällt weg.

## Ist-Zustand (gemessen 2026-07-04, "measure before change")
- **Karten-Stack heute:** `react-native-maps` auf Google (PROVIDER_GOOGLE), weißes Land
  via `RADAR_MAP_STYLE` (customMapStyle). Flache Marker, keine echte 3D-Extrusion, Kamera
  nicht kippbar. Google-Marker schauen immer zur Kamera (Billboard).
- **Blast-Radius:** 19 Dateien importieren `react-native-maps` (MapScreen, CommanderMapScreen,
  BaseBuilderScreen, TerritoryPolygon, EchoMarker, PvESpawnMarker, alle Quest/Echo/Travel/
  Meetup/Challenge/Artifact-Screens). Ein Engine-Wechsel berührt fast jeden interaktiven Screen.
- **Basis-Bau heute:** eigener `BaseBuilderScreen` (separater Screen, gleiche Geo-Karte),
  Grid + Ghost + Sprite-Marker + Ausbau/Ausbildung. Server-Bau-Logik (buildingEngine, Grid,
  Footprints, Tiers, Training) bleibt unverändert, nur die Darstellung/Interaktion wandert.

## Tech-Stack (recherchiert + verifiziert 2026-07-04)
| Baustein | Wahl | Warum |
|---|---|---|
| Karten-Engine | **MapLibre React Native 11.3.2** (`@maplibre/maplibre-react-native`) | Open Source, gratis, aktiv gepflegt, newArch-fähig (SDK 55 hat newArch immer an), kippbare Kamera (pitch/bearing) |
| 3D-Bauten/Mauern | **FillExtrusionLayer** | Extrudiert GeoJSON-Polygone per `fill-extrusion-height`/`-base` aus Source-Properties. Genau der Mechanismus für Gebäude-Footprints + Mauer-Grenzen mit Höhe je Material/Tier |
| Vektor-Tiles | **OpenFreeMap** (public instance) | Gratis, kein API-Key, keine Request-Limits, OSM-basiert, self-hostbar auf zoro (bei Skalierung). Kostet Scafa LLC nichts |
| Karten-Style | **Eigener Radar-Style-JSON** (Positron-Basis, getunt) | Land weiß, Wasser blau, Wald grün, Labels/POI aus. Style selbst hosten (zoro), URL in MapLibre. In Maputnik final getunt |
| Gebäude-Optik | **Codex-Vektoren** ([[struktur-codex]]) als Extrusions-Baukörper + Icon-Layer | Die futuristischen Formen aus der Vorschau werden zu 3D-Silhouetten/Symbolen auf den Extrusionen |

Warum nicht Mapbox: Mapbox GL Native ist seit v2 kostenpflichtig (Pro-MAU-Gebühr, Token, Terms).
MapLibre ist der freie Fork. Für ein Kaltstart-MMO ohne Kartenbudget die einzige Wahl.

## Phasen (Ziel = voller Merge, gebaut so dass die Tester-App nie bricht)
Reihenfolge so gewählt, dass jede Phase einzeln am Gerät verifizierbar ist und die App
zwischendurch spielbar bleibt. "Voller Merge" ist das Ziel, nicht ein einzelner Riesen-Commit.

**Phase A , MapLibre-Fundament (das Risiko-Herz).**
MapLibre-Dependency + Config/Native-Build (Expo bare workflow, Gradle, newArch), OpenFreeMap-
Tile-Quelle, Radar-Style-JSON auf zoro. Die HAUPTKARTE läuft auf MapLibre statt Google, mit
denselben Territorien-Polygonen und derselben weißen Optik. KEIN Feature-Verlust.
Verify: APK bauen, aufs Pixel, weißes Land + Territorien + Kamera kippbar bestätigt.

**Phase B , Gebäude als echte 3D auf der Hauptkarte.**
Gebäude-Footprints (server grid_x/grid_y + FOOTPRINT) als GeoJSON-Polygone mit Höhe je Tier
in einem FillExtrusionLayer, plus Icon/Silhouette. Sichtbar für ALLE (Bounding-Box-Query, wie
loadFeatures heute). Verify: DopeRunners Militärbasis steht als 3D-Klotz auf Sundern, kippbar.

**Phase C , Bau-Modus direkt auf der Hauptkarte + Basis-Screen auflösen.**
"Bauen"-Knopf auf der Hauptkarte → Grid + grün/roter Ghost erscheinen auf dem angetippten
Territorium (ein Modus, kein zweiter Screen). Platzieren/Ausbauen/Ausbilden/Abriss wandern
her. `BaseBuilderScreen` wird entfernt. Verify: kompletter Bau-Loop ohne Screen-Wechsel.

**Phase D , Mauer-System (der 3D-Kern der Vision).**
Territoriumsgrenze → Mauer-Polygon (Grenz-Puffer) als Extrusion, Höhe + Textur je Material
(Maschendraht → Ziegel → gepanzert). Sichtbar für alle. Bau/Ausbau wie Gebäude. Server:
neue `wall`-Struktur oder Territorium-Attribut (Material/Tier), Kosten, Verteidigungs-Effekt.
Verify: gepanzerte Mauer steht sichtbar um ein Territorium, andere sehen sie.

**Phase E , Zoom-Schärfe (LOD).**
Weit rausgezoomt: Territorium als Fläche + Gebäude-Zähler. Reingezoomt: einzelne Gebäude +
Grid. Hält die Karte lesbar bei vielen Bauten. Viewport-Culling + Cluster für Performance.
Verify: 20+ Gebäude auf der Karte, flüssig, lesbar auf beiden Zoom-Enden.

## Risiken (bewusst benannt)
1. **Nativer Engine-Wechsel im bare workflow.** Neues Native-Modul (Gradle-Dep + evtl.
   Package-Registrierung/Config-Plugin), newArch-Kompatibilität von 11.3.2 am Gerät prüfen.
   NICHT OTA-fähig, braucht vollen APK-Build. Phase A ist die Klippe, alles andere ist danach Fleiß.
2. **Marker-Migration (19 Dateien).** Echo/PvE/Quest/Travel/Meetup-Marker müssen von
   react-native-maps auf MapLibre `PointAnnotation`/`SymbolLayer` umziehen. Viel Fläche,
   wenig Tiefe, aber es ist Arbeit. Phase A migriert nur die Territorien; die restlichen
   Marker ziehen schrittweise nach (Zwischenzustand: beide Libs parallel wäre teuer, daher
   sauber pro Screen migrieren).
3. **Tile-Abhängigkeit OpenFreeMap public.** Gratis, aber Fremd-Instanz. Bei Ausfall/Skalierung
   auf zoro self-hosten (braucht ~300GB SSD, hat zoro aktuell evtl. nicht). Offline-Karte =
   eigenes Thema (Tile-Cache) später.
4. **Sichtbarkeits-Balance (Design-Spannung).** Öffentlich sichtbare Gebäude = gratis Aufklärung
   für Angreifer, das kollidiert mit Spionage/Radar (F.3), wo Sicht Geld/Aufwand kostet. Lösung
   später: nicht alles zeigen (Grobsilhouette aus der Ferne, Details erst mit Radar/Nähe), oder
   Tarnbauten. Nicht in Phase A-C lösen, aber nicht vergessen.
5. **Performance/LOD (Phase E).** Ohne Culling wird die Karte bei vielen Bauten träge. Erst
   Feature liefern, dann optimieren, aber LOD ist Pflicht vor Skalierung.

## Was bleibt, was fällt
- **Bleibt:** komplette Server-Bau-Logik (buildingEngine, Grid, Footprints, Tiers, Training,
  Ausbau-Effekte), Territorien-Daten, Ressourcen. Der Merge ist rein Client/Darstellung + neues Mauer-System.
- **Fällt:** `BaseBuilderScreen` (Phase C), `react-native-maps` (schrittweise, Phase A-C),
  Google-Provider + RADAR_MAP_STYLE (ersetzt durch MapLibre-Radar-Style).
- **Wandert:** die Codex-Gebäude-Vektoren werden zu Extrusions-Baukörpern + Icons (nicht mehr
  flache PNG/SVG-Billboards).

## Nicht-Ziele (dieser Meilenstein)
- Keine begehbare Ego-Perspektive, kein echtes Terrain-3D. FillExtrusion auf der 2.5D-Karte,
  Kamera kippbar, das reicht für "sichtbare 3D-Mauern und -Gebäude".
- Kein Offline-Modus, keine eigene Tile-Infra in Phase A (public OpenFreeMap reicht für Tester).

Siehe [[vision-bau-flaeche-infrastruktur]] (Basis-Layer Stufe 1, der jetzt in die Weltkarte wandert),
[[struktur-codex]] (Gebäude-Optik), [[brand-colors]] (weiß/blau, kein Lila).
