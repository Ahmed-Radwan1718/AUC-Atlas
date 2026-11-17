"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferGeometry, Color, DoubleSide, Float32BufferAttribute,
  InstancedMesh, MathUtils, MeshStandardMaterial, Object3D,
} from "three";

type Position = [number, number, number];
type Path = { points: Position[]; width: number };
type Plot = { position: Position; size: Position };
type GrassProps = {
  night: number;
  paths: Path[];
  plots: Plot[];
  plazaZ: number;
};

type Tuft = { x: number; z: number; turn: number; spread: number; height: number; shade: number };
type LawnZone = { center: [number, number]; size: [number, number]; radius: number };

// Localized lawn areas around the five buildings and the interior courtyard.
// The rounded, overlapping zones produce a connected campus landscape rather
// than a huge rectangular green plane disappearing into the horizon.
const LAWN_ZONES: LawnZone[] = [
  { center: [-94, -77], size: [88, 78], radius: 13 },  // Business
  { center: [92, -77], size: [88, 78], radius: 13 },   // Engineering
  { center: [0, -129], size: [86, 65], radius: 13 },   // Sciences
  { center: [-94, 85], size: [106, 82], radius: 15 }, // Library
  { center: [92, 85], size: [108, 77], radius: 15 },  // Humanities
  { center: [0, -53], size: [188, 66], radius: 12 },  // North promenade gardens
  { center: [0, -97], size: [35, 62], radius: 10 },   // Sciences link
  { center: [0, 43], size: [197, 125], radius: 16 },  // Central and south greens
];

function insideAnyLawnZone(x: number, z: number) {
  return LAWN_ZONES.some(({ center, size, radius }) => {
    // Signed distance to a rounded rectangle in the horizontal X/Z plane.
    const dx = Math.abs(x - center[0]) - size[0] / 2 + radius;
    const dz = Math.abs(z - center[1]) - size[1] / 2 + radius;
    return Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) <= radius;
  });
}

// A deterministic seed avoids SSR hydration differences and layout jitter.
function seededRandom() {
  let seed = 0x27d4eb2d;
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function distanceToSegmentSquared(x: number, z: number, a: Position, b: Position) {
  const dx = b[0] - a[0], dz = b[2] - a[2];
  const len2 = dx * dx + dz * dz;
  const t = len2 > 0 ? MathUtils.clamp(((x - a[0]) * dx + (z - a[2]) * dz) / len2, 0, 1) : 0;
  const ox = x - (a[0] + dx * t), oz = z - (a[2] + dz * t);
  return ox * ox + oz * oz;
}

// Keep grass off buildings, stone plot platforms, the main plaza, and walkways.
function isLawn(x: number, z: number, paths: Path[], plots: Plot[], plazaZ: number) {
  if (!insideAnyLawnZone(x, z)) return false;
  if (x * x + (z - plazaZ) ** 2 < 22.5 ** 2) return false;
  for (const plot of plots) {
    if (Math.abs(x - plot.position[0]) < plot.size[0] / 2 + 1.7 &&
        Math.abs(z - plot.position[2]) < plot.size[2] / 2 + 1.7) return false;
  }
  for (const path of paths) {
    for (let i = 1; i < path.points.length; i++) {
      const clearance = path.width / 2 + 1.7;
      if (distanceToSegmentSquared(x, z, path.points[i - 1], path.points[i]) < clearance ** 2) {
        return false;
      }
    }
  }
  return true;
}

function createTufts(paths: Path[], plots: Plot[], plazaZ: number): Tuft[] {
  const rand = seededRandom();
  const tufts: Tuft[] = [];
  // Tufts only occupy the same compact footprint as the lawn ground mesh.
  // Their GPU wind animation is retained; nothing grows beyond the campus.
  for (let z = -164; z <= 130; z += 3.1) {
    for (let x = -150; x <= 150; x += 3.1) {
      const px = x + (rand() - 0.5) * 2.35;
      const pz = z + (rand() - 0.5) * 2.35;
      const turn = rand() * Math.PI * 2;
      const spread = 0.74 + rand() * 0.62;
      const height = 0.75 + rand() * 0.64;
      const shade = 0.83 + rand() * 0.27;
      if (isLawn(px, pz, paths, plots, plazaZ)) {
        tufts.push({ x: px, z: pz, turn, spread, height, shade });
      }
    }
  }
  return tufts;
}

// Each instance is a tuft of three crossed tapered blades, bent at the tip.
function makeTuftGeometry() {
  const geometry = new BufferGeometry();
  const positions: number[] = [], colors: number[] = [], indices: number[] = [];
  const levels = [0, 0.36, 0.77, 1.25];
  const widths = [0.22, 0.17, 0.096, 0.008];
  for (let blade = 0; blade < 3; blade++) {
    const angle = blade * Math.PI * 2 / 3;
    const sideX = Math.cos(angle), sideZ = Math.sin(angle);
    const leanX = -sideZ, leanZ = sideX;
    const start = positions.length / 3;
    for (let level = 0; level < levels.length; level++) {
      for (const side of [-1, 1]) {
        const lean = level * level * 0.018;
        positions.push(
          sideX * widths[level] * side + leanX * lean,
          levels[level],
          sideZ * widths[level] * side + leanZ * lean
        );
        const brightness = 0.69 + level * 0.085;
        colors.push(brightness, Math.min(1, brightness + 0.065), brightness * 0.87);
      }
    }
    for (let level = 0; level < levels.length - 1; level++) {
      const i = start + level * 2;
      indices.push(i, i + 1, i + 2, i + 1, i + 3, i + 2);
    }
  }
  geometry.setIndex(indices);
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function makeTerrainGeometry(paths: Path[], plots: Plot[], plazaZ: number) {
  // Build only visible lawn cells, using the exact same exclusion mask as
  // grass blades. This avoids painting grass under walkways, buildings or plaza.
  const geometry = new BufferGeometry();
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const step = 2.5;
  const y = -0.36; // Above the shadow catcher, below raised stone walkways.
  const vertexColor = (x: number, z: number) => {
    const variation = Math.sin(x * 0.034) * Math.cos(z * 0.045) * 0.065 +
      Math.sin(x * 0.087 + z * 0.021) * 0.035;
    colors.push(0.91 + variation, 0.96 + variation, 0.89 + variation);
  };
  for (let z = -165; z < 132.5; z += step) {
    for (let x = -150; x < 152.5; x += step) {
      // All corners must be valid: lawn does not bridge across pavement.
      if (!isLawn(x, z, paths, plots, plazaZ) ||
          !isLawn(x + step, z, paths, plots, plazaZ) ||
          !isLawn(x, z + step, paths, plots, plazaZ) ||
          !isLawn(x + step, z + step, paths, plots, plazaZ)) continue;
      const base = positions.length / 3;
      positions.push(x, y, z, x, y, z + step,
        x + step, y, z, x + step, y, z + step);
      vertexColor(x, z);
      vertexColor(x, z + step);
      vertexColor(x + step, z);
      vertexColor(x + step, z + step);
      indices.push(base, base + 1, base + 2,
        base + 1, base + 3, base + 2);
    }
  }
  geometry.setIndex(indices);
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export default function CampusGrass({ night, paths, plots, plazaZ }: GrassProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const tufts = useMemo(() => createTufts(paths, plots, plazaZ), [paths, plots, plazaZ]);
  const tuftGeometry = useMemo(makeTuftGeometry, []);
  const terrainGeometry = useMemo(
    () => makeTerrainGeometry(paths, plots, plazaZ),
    [paths, plots, plazaZ]
  );
  const wind = useMemo(() => ({
    time: { value: 0 },
    motion: { value: 1 },
  }), []);
  const material = useMemo(() => {
    const result = new MeshStandardMaterial({
      color: "#71945b",
      vertexColors: true,
      side: DoubleSide,
      roughness: 0.98,
      metalness: 0,
    });
    // Only deform vertices. MeshStandardMaterial retains Three.js sunlight,
    // hemisphere/ambient illumination, local point lights, and tone mapping.
    result.onBeforeCompile = shader => {
      shader.uniforms.uGrassTime = wind.time;
      shader.uniforms.uGrassMotion = wind.motion;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        "#include <common>\nuniform float uGrassTime;\nuniform float uGrassMotion;"
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec2 field = instanceMatrix[3].xz;
          float phase = dot(field, vec2(0.035, 0.047));
          float gust = sin(uGrassTime * 0.62 + field.x * 0.018 - field.y * 0.015);
          float breeze = sin(uGrassTime * 1.28 + phase);
          float curl = sin(uGrassTime * 1.91 + phase * 1.77);
          float tip = pow(clamp(position.y / 1.25, 0.0, 1.0), 1.65);
          transformed.x += uGrassMotion * tip * (0.15 * breeze + 0.075 * gust);
          transformed.z += uGrassMotion * tip * (0.105 * curl + 0.048 * gust);
        #endif`
      );
    };
    result.customProgramCacheKey = () => "atlas-natural-wind-grass-v1";
    return result;
  }, [wind]);

  // The previous night albedo was nearly black (#23362d), so physically lit
  // grass vanished into the scene even with moonlight. Keep its night albedo
  // muted and desaturated, but reflective enough to catch existing ambient,
  // moon-directional and nearby fixture lights. No emissive glow is added.
  const transition = MathUtils.smoothstep(night, 0, 1);
  const terrainColor = useMemo(() =>
    new Color("#6f9459").lerp(new Color("#688069"), transition),
  [transition]);
  const bladeColor = useMemo(() =>
    new Color("#7ea467").lerp(new Color("#849a7a"), transition),
  [transition]);

  useLayoutEffect(() => {
    material.color.copy(bladeColor);
  }, [bladeColor, material]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const transform = new Object3D();
    const tint = new Color();
    tufts.forEach((tuft, i) => {
      transform.position.set(tuft.x, -0.30, tuft.z);
      transform.rotation.set(0, tuft.turn, 0);
      transform.scale.set(tuft.spread, tuft.height, tuft.spread);
      transform.updateMatrix();
      mesh.setMatrixAt(i, transform.matrix);
      tint.setRGB(tuft.shade, Math.min(1, tuft.shade + 0.035), tuft.shade * 0.92);
      mesh.setColorAt(i, tint);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [tufts]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { wind.motion.value = query.matches ? 0 : 1; };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [wind]);

  useEffect(() => () => {
    material.dispose();
    tuftGeometry.dispose();
    terrainGeometry.dispose();
  }, [material, tuftGeometry, terrainGeometry]);

  useFrame(state => {
    wind.time.value = state.clock.elapsedTime;
  });

  return <>
    {/* Clipped lawn: only landscaped campus patches, no infinite green world. */}
    <mesh geometry={terrainGeometry} receiveShadow raycast={() => null}>
      <meshStandardMaterial color={terrainColor} vertexColors roughness={1} metalness={0}/>
    </mesh>
    {/* Per-blade GPU wind gives the fields slow waves and a little swirling motion. */}
    <instancedMesh ref={meshRef} args={[tuftGeometry, material, tufts.length]}
      castShadow={false} receiveShadow={false} frustumCulled={false}
      raycast={() => null}/>
  </>;
}
