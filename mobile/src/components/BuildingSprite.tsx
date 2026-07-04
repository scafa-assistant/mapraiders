// ============================================================
// BuildingSprite , isometric vector buildings (2026-07-04)
// Replaces the flat Kenney PNG markers with recognisable isometric 3D
// buildings drawn in react-native-svg. A shared iso engine (box / cyl /
// gableRoof / slab / dot) composes each of the 13 building types so an
// airport looks like an airport, not a cube. Brand palette: white/blue/amber.
// Authored in abstract iso units; the viewBox auto-fits the drawn bounds,
// so the caller only passes a pixel `size`.
// ============================================================

import React from 'react';
import Svg, { Polygon, Path, Circle } from 'react-native-svg';
import type { BuildingType } from '../services/api';

const COS = Math.cos(Math.PI / 6);
const SIN = Math.sin(Math.PI / 6);
const SQ2 = Math.SQRT2;

// Material = [top, right(+x wall), left(+y wall)] shades for iso volume.
type Shades = readonly [string, string, string];
const MAT: Record<string, Shades> = {
  white: ['#FFFFFF', '#D9E1EF', '#C2CDE2'],
  glass: ['#7FA8FF', '#2E63E6', '#1543C4'],
  amber: ['#FFC85C', '#F0982A', '#C77E12'],
  dark:  ['#4A566E', '#333D52', '#232B3C'],
  asph:  ['#ECEFF5', '#DBE0EA', '#CBD1DE'],
  steel: ['#EAE2D8', '#CFC7BB', '#B9B1A4'],
  red:   ['#FF7A6B', '#E24A3B', '#B8382C'],
  green: ['#7FD6A6', '#3FB374', '#2C8256'],
  wood:  ['#C79A5E', '#A87C43', '#8A6534'],
  stone: ['#D8D3CB', '#BEB8AE', '#A49E93'],
  crop:  ['#E8C34A', '#CDA22F', '#A98420'],
  water: ['#DDEBFB', '#BFD6F2', '#A9C6EE'],
  field: ['#DDE6CE', '#C9D3B8', '#BAC5A6'],
};

/** Builder context: projects iso coords, emits SVG elements, tracks bounds. */
class Ctx {
  els: React.ReactElement[] = [];
  private k = 0;
  minX = Infinity; minY = Infinity; maxX = -Infinity; maxY = -Infinity;

  private track(px: number, py: number) {
    if (px < this.minX) this.minX = px;
    if (px > this.maxX) this.maxX = px;
    if (py < this.minY) this.minY = py;
    if (py > this.maxY) this.maxY = py;
  }
  private key() { return `e${this.k++}`; }

  P(x: number, y: number, z: number): [number, number] {
    const px = (x - y) * COS;
    const py = (x + y) * SIN - z;
    this.track(px, py);
    return [px, py];
  }
  poly(pts: [number, number][], fill: string) {
    this.els.push(
      <Polygon
        key={this.key()}
        points={pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')}
        fill={fill}
        strokeLinejoin="round"
      />
    );
  }
  dot(x: number, y: number, z: number, r: number, fill: string) {
    const p = this.P(x, y, z);
    this.els.push(<Circle key={this.key()} cx={p[0]} cy={p[1]} r={r} fill={fill} />);
  }

  /** Cuboid: left(+y), right(+x), top faces (painter order back to front). */
  box(x: number, y: number, z: number, w: number, d: number, h: number, mat: string) {
    const m = MAT[mat];
    this.poly([this.P(x, y + d, z), this.P(x + w, y + d, z), this.P(x + w, y + d, z + h), this.P(x, y + d, z + h)], m[2]);
    this.poly([this.P(x + w, y, z), this.P(x + w, y + d, z), this.P(x + w, y + d, z + h), this.P(x + w, y, z + h)], m[1]);
    this.poly([this.P(x, y, z + h), this.P(x + w, y, z + h), this.P(x + w, y + d, z + h), this.P(x, y + d, z + h)], m[0]);
  }
  /** Flat top face (ground plate, runway markings, water). */
  slab(x: number, y: number, z: number, w: number, d: number, color: string) {
    this.poly([this.P(x, y, z), this.P(x + w, y, z), this.P(x + w, y + d, z), this.P(x, y + d, z)], color);
  }
  /** Gable roof (ridge along x) over a footprint. */
  gable(x: number, y: number, z: number, w: number, d: number, rh: number, mat: string) {
    const m = MAT[mat];
    this.poly([this.P(x + w, y, z), this.P(x + w, y + d, z), this.P(x + w, y + d / 2, z + rh)], m[1]);
    this.poly([this.P(x, y + d / 2, z + rh), this.P(x + w, y + d / 2, z + rh), this.P(x + w, y + d, z), this.P(x, y + d, z)], m[0]);
    this.poly([this.P(x, y + d / 2, z + rh), this.P(x + w, y + d / 2, z + rh), this.P(x + w, y, z), this.P(x, y, z)], m[2]);
  }
  /** Vertical cylinder (tank / tower / silo). */
  cyl(cx: number, cy: number, z: number, r: number, h: number, mat: string) {
    const m = MAT[mat];
    const top = this.P(cx, cy, z + h);
    const bot = this.P(cx, cy, z);
    const rx = r * COS * SQ2;
    const ry = r * SIN * SQ2;
    this.track(top[0] - rx, top[1] - ry);
    this.track(top[0] + rx, bot[1] + ry);
    this.els.push(
      <Path
        key={this.key()}
        d={`M ${(top[0] - rx).toFixed(2)} ${top[1].toFixed(2)} A ${rx.toFixed(2)} ${ry.toFixed(2)} 0 0 0 ${(top[0] + rx).toFixed(2)} ${top[1].toFixed(2)} L ${(bot[0] + rx).toFixed(2)} ${bot[1].toFixed(2)} A ${rx.toFixed(2)} ${ry.toFixed(2)} 0 0 1 ${(bot[0] - rx).toFixed(2)} ${bot[1].toFixed(2)} Z`}
        fill={m[1]}
      />
    );
    this.els.push(
      <Path
        key={this.key()}
        d={`M ${(top[0] - rx).toFixed(2)} ${top[1].toFixed(2)} A ${rx.toFixed(2)} ${ry.toFixed(2)} 0 0 0 ${(top[0] + rx).toFixed(2)} ${top[1].toFixed(2)} A ${rx.toFixed(2)} ${ry.toFixed(2)} 0 0 0 ${(top[0] - rx).toFixed(2)} ${top[1].toFixed(2)} Z`}
        fill={m[0]}
      />
    );
  }
  /** Cone tip (roof spire / rocket nose): square base to apex. */
  cone(cx: number, cy: number, z: number, r: number, h: number, mat: string) {
    const m = MAT[mat];
    const apex = this.P(cx, cy, z + h);
    this.poly([this.P(cx - r, cy + r, z), this.P(cx + r, cy + r, z), apex], m[2]);
    this.poly([this.P(cx + r, cy - r, z), this.P(cx + r, cy + r, z), apex], m[1]);
    this.poly([this.P(cx - r, cy - r, z), this.P(cx + r, cy - r, z), apex], m[0]);
  }
}

const A = '#1558F0';
const AMBER = '#F5A623';

// ── 13 building recipes ───────────────────────────────────────────────────────
// Each draws into an abstract ~0..N iso grid, roughly matching its footprint.
type Recipe = (c: Ctx) => void;

const RECIPES: Record<BuildingType, Recipe> = {
  // ---- AIRPORT (8x6): terminal, tower, hangar, runway, jet ----
  airport(c) {
    c.box(0, 0, 0, 42, 30, 0.8, 'asph');
    c.slab(3, 20, 0.81, 36, 7, '#D6DCE8');
    for (let i = 0; i < 9; i++) c.slab(6 + i * 3.6, 23.2, 0.82, 1.8, 0.5, '#F4F6FA');
    for (let i = 0; i < 10; i++) { c.dot(4 + i * 3.6, 20, 0.9, 0.5, AMBER); c.dot(4 + i * 3.6, 27, 0.9, 0.5, AMBER); }
    c.box(4, 4, 0.8, 18, 7, 5.5, 'white');
    for (let i = 0; i < 8; i++) c.box(4.6 + i * 2.1, 10.9, 1.6, 1.5, 0.2, 3, 'glass');
    c.box(9, 11, 0.8, 1.2, 1.6, 1.2, 'amber');
    c.box(15, 11, 0.8, 1.2, 1.6, 1.2, 'amber');
    c.box(26.5, 5, 0.8, 3, 3, 14, 'white');
    c.box(25.3, 3.8, 14.8, 5.4, 5.4, 3.2, 'glass');
    c.box(27.6, 6.1, 18, 0.8, 0.8, 3, 'dark');
    c.dot(28, 6.5, 21.2, 0.7, AMBER);
    c.box(6, 16, 0.8, 12, 9, 4.2, 'white');
    c.gable(6, 16, 5.0, 12, 9, 3.4, 'steel');
    c.box(11.4, 24.9, 0.8, 5.2, 0.2, 3.2, 'glass');
    // parked jet
    const cx = 31.5, cy = 23.6, jz = 1.5;
    c.poly([c.P(cx + 1.4, cy - 0.1, jz), c.P(cx + 3.6, cy - 4.2, jz), c.P(cx + 4.4, cy - 4.0, jz), c.P(cx + 2.8, cy + 0.1, jz)], MAT.white[1]);
    c.poly([c.P(cx + 1.4, cy + 0.5, jz), c.P(cx + 3.6, cy + 4.6, jz), c.P(cx + 4.4, cy + 4.4, jz), c.P(cx + 2.8, cy + 0.3, jz)], MAT.white[2]);
    c.box(cx - 3, cy - 0.7, jz, 8, 1.4, 1.5, 'white');
    for (let i = 0; i < 6; i++) c.box(cx - 2 + i * 1.05, cy + 0.7, jz + 0.55, 0.7, 0.12, 0.55, 'glass');
    c.poly([c.P(cx + 5, cy - 0.7, jz + 0.2), c.P(cx + 5, cy + 0.7, jz + 0.2), c.P(cx + 6.6, cy, jz + 0.55)], MAT.white[1]);
    c.poly([c.P(cx - 2.9, cy, jz + 1.5), c.P(cx - 1.8, cy, jz + 1.5), c.P(cx - 2.5, cy, jz + 3.4)], MAT.glass[1]);
  },

  // ---- MILITARY BASE (5x5): walls, corner towers, command building, flag ----
  military_base(c) {
    c.box(0, 0, 0, 20, 20, 0.8, 'asph');
    c.box(0, 0, 0.8, 20, 1.4, 2.6, 'steel');
    c.box(0, 18.6, 0.8, 20, 1.4, 2.6, 'steel');
    c.box(0, 0, 0.8, 1.4, 20, 2.6, 'steel');
    c.box(18.6, 0, 0.8, 1.4, 20, 2.6, 'steel');
    ([[0, 0], [18, 0], [0, 18], [18, 18]] as const).forEach(([tx, ty]) => {
      c.box(tx, ty, 0.8, 2, 2, 4, 'white');
      c.dot(tx + 1, ty + 1, 4.9, 0.5, AMBER);
    });
    c.box(6, 6, 0.8, 8, 8, 4.5, 'white');
    for (let i = 0; i < 3; i++) c.box(6.8 + i * 2.4, 13.9, 1.6, 1.6, 0.2, 2.4, 'glass');
    c.box(9.4, 9.4, 5.3, 1.2, 1.2, 2.5, 'dark');
    c.dot(10, 10, 8, 0.6, AMBER);
    c.poly([c.P(10, 10, 7.4), c.P(13, 10, 6.6), c.P(10, 10, 5.6)], MAT.red[1]);
  },

  // ---- DATACENTER (3x3): server monoliths + cooling towers + data strips ----
  datacenter(c) {
    c.box(0, 0, 0, 20, 20, 0.8, 'asph');
    for (let r = 0; r < 3; r++) for (let col = 0; col < 3; col++) {
      const h = 5 + ((r + col) % 2) * 2.2;
      c.box(3 + col * 5, 3 + r * 5, 0.8, 3.4, 3.4, h, 'white');
      for (let s = 0; s < 3; s++) c.box(3.4 + col * 5, 3 + r * 5 + 3.4, 1.4 + s * 1.4, 2.6, 0.15, 0.7, 'glass');
    }
    c.cyl(5, 5, 0.8, 1.1, 8.5, 'steel');
    c.cyl(15, 6, 0.8, 1.0, 7.5, 'steel');
    c.dot(3.6, 3.6, 12, 0.6, '#4C82FF');
  },

  // ---- REFINERY (2x3): tanks, pipe rack, flare stack ----
  refinery(c) {
    c.box(0, 0, 0, 20, 20, 0.8, 'asph');
    c.cyl(6, 6, 0.8, 3.0, 5.5, 'steel');
    c.cyl(13.5, 5, 0.8, 2.2, 7.5, 'steel');
    c.cyl(7, 13.5, 0.8, 2.4, 4.5, 'white');
    c.box(8.5, 5.6, 3.2, 5, 0.7, 0.7, 'dark');
    c.box(9, 6, 0.8, 0.6, 0.6, 2.6, 'dark');
    c.box(12.5, 6, 0.8, 0.6, 0.6, 2.6, 'dark');
    c.box(15.5, 14, 0.8, 1.1, 1.1, 8, 'steel');
    c.dot(16, 14.5, 9.2, 0.9, AMBER);
    c.dot(16, 14.5, 10.2, 0.6, '#FF7A6B');
    for (let i = 0; i < 3; i++) c.box(3, 8.9, 1.6 + i * 1.4, 6, 0.15, 0.5, 'amber');
  },

  // ---- GARRISON (3x3): keep with crenellated walls + gatehouse ----
  garrison(c) {
    c.box(0, 0, 0, 20, 20, 0.8, 'asph');
    c.box(1, 1, 0.8, 18, 2, 3.4, 'stone');
    c.box(1, 17, 0.8, 18, 2, 3.4, 'stone');
    c.box(1, 1, 0.8, 2, 18, 3.4, 'stone');
    c.box(17, 1, 0.8, 2, 18, 3.4, 'stone');
    // crenellations (front + right wall tops)
    for (let i = 0; i < 5; i++) { c.box(2 + i * 3.4, 17, 4.2, 1.4, 2, 1, 'stone'); c.box(17, 2 + i * 3.4, 4.2, 2, 1.4, 1, 'stone'); }
    // central keep
    c.box(6.5, 6.5, 0.8, 7, 7, 6, 'stone');
    c.gable(6.5, 6.5, 6.8, 7, 7, 3, 'red');
    // gatehouse
    c.box(8.5, 16.5, 0.8, 3, 2.5, 4.4, 'stone');
    c.box(9.3, 18.9, 0.8, 1.6, 0.2, 2.4, 'dark');
    c.dot(10, 8, 12, 0.6, AMBER);
  },

  // ---- SILO (3x3): missile silo, rocket nose out of the hatch ----
  silo(c) {
    c.box(0, 0, 0, 20, 20, 0.8, 'asph');
    // reinforced ring base
    c.cyl(10, 10, 0.8, 5, 2.5, 'steel');
    // open blast hatch (dark rim)
    c.cyl(10, 10, 3.3, 3.6, 0.4, 'dark');
    // rocket body rising out
    c.cyl(10, 10, 3.5, 2.2, 7, 'white');
    for (let i = 0; i < 2; i++) c.box(7.8, 10, 5 + i * 2, 4.4, 0.15, 0.6, 'glass');
    c.cone(10, 10, 10.5, 2.2, 3, 'red');
    // corner vents
    ([[2, 2], [16, 2], [2, 16], [16, 16]] as const).forEach(([vx, vy]) => c.box(vx, vy, 0.8, 2, 2, 1.4, 'dark'));
  },

  // ---- SHIELD GENERATOR (2x2): emitter pylon + energy crystal ----
  shield_generator(c) {
    c.box(0, 0, 0, 14, 14, 0.8, 'asph');
    // tapered pylon base
    c.box(4, 4, 0.8, 6, 6, 2.5, 'white');
    c.box(5, 5, 3.3, 4, 4, 4, 'dark');
    // three emitter prongs
    ([[5.5, 5.5], [8.5, 5.5], [7, 8.5]] as const).forEach(([px, py]) => c.box(px, py, 7.3, 0.8, 0.8, 2.4, 'steel'));
    // floating energy crystal
    c.cone(7, 7, 10, 1.8, 2.2, 'glass');
    c.cone(7, 7, 12.2, 1.8, -2.2, 'glass');
    c.dot(7, 7, 11, 1.1, '#8FB2FF');
  },

  // ---- RADAR (2x2): mast + dish ----
  radar(c) {
    c.box(0, 0, 0, 14, 14, 0.8, 'asph');
    c.box(6, 6, 0.8, 3, 3, 1.6, 'white');
    c.box(7, 7, 2.4, 1.4, 1.4, 6, 'steel');
    // dish (tilted disc): two offset ellipse-ish polygons
    const dz = 8.4;
    c.poly([c.P(7.7, 7.7, dz), c.P(11.5, 5, dz + 1.8), c.P(12.3, 5.4, dz + 2.2), c.P(8.3, 8.3, dz + 0.3)], MAT.white[0]);
    c.poly([c.P(7.7, 7.7, dz), c.P(8.3, 8.3, dz + 0.3), c.P(11.9, 5.6, dz + 2), c.P(11.5, 5, dz + 1.8)], MAT.glass[1]);
    c.box(7.4, 7.4, dz, 0.7, 0.7, 1.2, 'dark');
    c.dot(11.7, 5.3, dz + 2, 0.5, AMBER);
  },

  // ---- TELEPORTER (2x2): portal ring between two pylons ----
  teleporter(c) {
    c.box(0, 0, 0, 14, 14, 0.8, 'asph');
    c.box(3.5, 4, 0.8, 1.6, 1.6, 8, 'white');
    c.box(9, 4, 0.8, 1.6, 1.6, 8, 'white');
    c.box(3.5, 4, 8.8, 7.1, 1.6, 1.4, 'steel');
    // glowing portal arch
    const g = MAT.glass;
    c.poly([c.P(4.3, 5, 1), c.P(5, 5, 1), c.P(5, 5, 7.5), c.P(4.3, 5, 7.5)], g[1]);
    c.poly([c.P(9.5, 5, 1), c.P(10.2, 5, 1), c.P(10.2, 5, 7.5), c.P(9.5, 5, 7.5)], g[1]);
    c.poly([c.P(5, 5, 5.5), c.P(9.5, 5, 5.5), c.P(9.5, 5, 7.5), c.P(5, 5, 7.5)], g[0]);
    c.dot(7.2, 4.9, 4, 1.6, '#8FB2FF');
    c.dot(7.2, 4.9, 4, 0.9, '#DDEBFB');
  },

  // ---- SAWMILL (2x2): timber mill + log stacks + saw blade ----
  sawmill(c) {
    c.box(0, 0, 0, 14, 14, 0.8, 'asph');
    c.box(3, 3, 0.8, 7, 6, 3.4, 'wood');
    c.gable(3, 3, 4.2, 7, 6, 2.6, 'red');
    c.box(5, 9, 0.8, 3, 0.2, 2, 'dark');
    // log stack
    for (let i = 0; i < 3; i++) c.cyl(11.5, 4 + i * 0.1, 0.8 + i * 1.0, 0.9, 4, 'wood');
    // saw blade
    c.dot(10.5, 10, 2.4, 1.6, '#CFD6E2');
    c.dot(10.5, 10, 2.4, 0.6, 'dark');
  },

  // ---- QUARRY (3x3): stone pit + boulders + conveyor ----
  quarry(c) {
    c.box(0, 0, 0, 20, 20, 0.8, 'stone');
    // stepped pit (darker recessed rings)
    c.slab(4, 4, 0.79, 12, 12, '#C2BCB2');
    c.slab(6, 6, 0.78, 8, 8, '#ACA69C');
    c.slab(8, 8, 0.77, 4, 4, '#948E85');
    // boulders
    c.box(5, 14, 0.8, 2, 2, 1.6, 'stone');
    c.box(14, 5, 0.8, 2.4, 2, 1.8, 'stone');
    c.box(15, 14, 0.8, 1.8, 1.8, 1.4, 'stone');
    // conveyor ramp
    c.poly([c.P(9, 9, 1), c.P(10, 9, 1), c.P(18, 2, 4.5), c.P(17, 2, 4.5)], MAT.dark[1]);
    c.box(17, 1.5, 0.8, 1.4, 1.4, 4, 'steel');
  },

  // ---- FARM (4x4): field rows + barn + silo ----
  farm(c) {
    c.box(0, 0, 0, 24, 24, 0.8, 'field');
    // crop rows
    for (let i = 0; i < 6; i++) c.slab(2, 3 + i * 3, 0.81, 20, 1.6, i % 2 ? '#CDA22F' : '#E8C34A');
    // barn
    c.box(3, 3, 0.8, 6, 5, 3, 'red');
    c.gable(3, 3, 3.8, 6, 5, 2.4, 'wood');
    c.box(5, 7.8, 0.8, 2, 0.2, 2, 'dark');
    // grain silo
    c.cyl(11, 4.5, 0.8, 1.6, 5, 'steel');
    c.cone(11, 4.5, 5.8, 1.6, 1.4, 'steel');
  },

  // ---- FISHERY (2x3): water, pier, hut, nets ----
  fishery(c) {
    c.box(0, 0, 0, 16, 20, 0.8, 'asph');
    c.slab(1, 9, 0.82, 14, 10, MAT.water[1]);
    c.slab(1, 9, 0.83, 14, 10, 'rgba(143,178,255,0.25)');
    // pier out over the water
    c.box(6, 8, 0.8, 3, 9, 0.6, 'wood');
    for (let i = 0; i < 3; i++) c.box(6.2, 9 + i * 3, 0.2, 0.5, 0.5, 0.6, 'wood');
    // hut on shore
    c.box(2.5, 2.5, 0.8, 5, 4, 2.8, 'white');
    c.gable(2.5, 2.5, 3.6, 5, 4, 2, 'red');
    // net frame
    c.box(10, 12, 0.9, 0.4, 0.4, 3, 'wood');
    c.box(13, 15, 0.9, 0.4, 0.4, 3, 'wood');
    c.poly([c.P(10.2, 12.2, 3.9), c.P(13.2, 15.2, 3.9), c.P(13.2, 15.2, 2), c.P(10.2, 12.2, 2)], 'rgba(120,140,170,0.5)');
  },
};

// Cache one Ctx render per building type (buildings are static shapes).
const CACHE: Partial<Record<BuildingType, { els: React.ReactElement[]; vb: string }>> = {};

function buildFor(type: BuildingType) {
  const cached = CACHE[type];
  if (cached) return cached;
  const c = new Ctx();
  (RECIPES[type] ?? RECIPES.datacenter)(c);
  const pad = 1.5;
  const w = c.maxX - c.minX + pad * 2;
  const h = c.maxY - c.minY + pad * 2;
  const vb = `${(c.minX - pad).toFixed(2)} ${(c.minY - pad).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`;
  const out = { els: c.els, vb };
  CACHE[type] = out;
  return out;
}

interface BuildingSpriteProps {
  type: BuildingType;
  /** Rendered pixel size (square box; the iso art sits centered inside). */
  size: number;
  opacity?: number;
}

/** An isometric vector building, sized to `size` px, ready to drop in a Marker. */
function BuildingSprite({ type, size, opacity = 1 }: BuildingSpriteProps) {
  const { els, vb } = buildFor(type);
  return (
    <Svg width={size} height={size} viewBox={vb} opacity={opacity}>
      {els}
    </Svg>
  );
}

export default React.memo(BuildingSprite);
