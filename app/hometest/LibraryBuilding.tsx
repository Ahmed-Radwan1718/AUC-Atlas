"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  DataTexture,
  LinearFilter,
  MeshStandardMaterial,
  Object3D,
  RGBAFormat,
  RepeatWrapping,
  SRGBColorSpace,
  type InstancedMesh,
  type Material
} from "three";

type Vec3 = [number, number, number];
type Piece = { at: Vec3; size: Vec3 };

const unitBox = new BoxGeometry(1, 1, 1);

// The 2026 Archnet-IJAR study (Table 2) documents a 90m x 43m rectangular
// footprint, a garden/plaza + three upper levels, and elevations on all sides.
// Scene units are intentionally reduced to match the neighbouring buildings.
// This is a reference-based architectural likeness, not a measured BIM model.
const WIDTH = 7.9;
const LENGTH = 16.6;
const HEIGHT = 7.55;

function createLimestoneTexture() {
  const side = 256;
  const pixels = new Uint8Array(side * side * 4);
  for (let y = 0; y < side; y++) {
    const course = Math.floor(y / 24);
    for (let x = 0; x < side; x++) {
      const offset = (course % 2) * 29;
      const column = Math.floor((x + offset) / 58);
      const seed = (course * 37 + column * 53) % 23;
      const noise = (x * 13 + y * 17 + course * 11) % 13;
      const grout = y % 24 < 2 || (x + offset) % 58 < 2;
      const value = seed - 11 + noise - 6 - (grout ? 23 : 0);
      const index = (y * side + x) * 4;
      pixels[index] = Math.max(0, Math.min(255, 204 + value));
      pixels[index + 1] = Math.max(0, Math.min(255, 184 + value));
      pixels[index + 2] = Math.max(0, Math.min(255, 154 + value));
      pixels[index + 3] = 255;
    }
  }
  const texture = new DataTexture(pixels, side, side, RGBAFormat);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(2.2, 1.7);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

const stoneTexture = createLimestoneTexture();
const surface = {
  limestone: new MeshStandardMaterial({ map: stoneTexture, roughness: 0.96 }),
  stoneLight: new MeshStandardMaterial({ color: "#e4d3b4", roughness: 0.94 }),
  stoneMid: new MeshStandardMaterial({ color: "#bea584", roughness: 0.96 }),
  stoneDeep: new MeshStandardMaterial({ color: "#8d755b", roughness: 0.96 }),
  roof: new MeshStandardMaterial({ color: "#c8bca9", roughness: 0.97 }),
  dark: new MeshStandardMaterial({ color: "#202b2e", roughness: 0.83 }),
  glass: new MeshStandardMaterial({
    color: "#5b808e", metalness: 0.27, roughness: 0.21,
    transparent: true, opacity: 0.83
  }),
  glassDark: new MeshStandardMaterial({
    color: "#385967", metalness: 0.33, roughness: 0.2
  }),
  steel: new MeshStandardMaterial({ color: "#344448", metalness: 0.6, roughness: 0.42 }),
  bronze: new MeshStandardMaterial({ color: "#796449", metalness: 0.34, roughness: 0.61 }),
  lit: new MeshStandardMaterial({ color: "#e4c793", roughness: 0.85 }),
  highlight: new MeshStandardMaterial({ color: "#c09a5c", roughness: 0.8 })
};

function Solid({ at, size, material }: { at: Vec3; size: Vec3; material: Material }) {
  return (
    <mesh
      geometry={unitBox}
      material={material}
      position={at}
      scale={size}
      castShadow
      receiveShadow
    />
  );
}

// One draw call per repeated material, instead of hundreds of separate meshes.
function Repeated({ pieces, material }: { pieces: Piece[]; material: Material }) {
  const mesh = useRef<InstancedMesh>(null);
  useEffect(() => {
    if (!mesh.current) return;
    const transform = new Object3D();
    pieces.forEach(({ at, size }, i) => {
      transform.position.set(at[0], at[1], at[2]);
      transform.scale.set(size[0], size[1], size[2]);
      transform.updateMatrix();
      mesh.current?.setMatrixAt(i, transform.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [pieces]);

  if (pieces.length === 0) return null;
  return (
    <instancedMesh
      ref={mesh}
      args={[unitBox, material, pieces.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  );
}

function buildFacadeDetails() {
  const light: Piece[] = [];
  const mid: Piece[] = [];
  const dark: Piece[] = [];
  const glass: Piece[] = [];
  const steel: Piece[] = [];
  const bronze: Piece[] = [];
  const put = (pieces: Piece[], at: Vec3, size: Vec3) => pieces.push({ at, size });

  // East elevation: long five-level curtain wall with a pronounced deep
  // concrete perimeter and a separate perforated screening wing.
  // In the campus scene it faces the camera after the library's -90° rotation.
  const eastX = WIDTH / 2 + 0.14;
  for (let i = 0; i <= 16; i++) {
    const z = -7.85 + i * 0.64;
    put(steel, [eastX, 3.84, z], [0.12, 6.8, 0.055]);
  }
  for (let floor = 0; floor <= 5; floor++) {
    const y = 0.52 + floor * 1.34;
    put(steel, [eastX + 0.025, y, -2.72], [0.13, 0.085, 10.55]);
  }
  for (let i = 0; i < 4; i++) {
    const z = -7.5 + i * 3.35;
    put(light, [eastX + 0.28, 3.76, z], [0.29, 7.05, 0.26]);
    put(mid, [eastX + 0.39, 0.7, z], [0.28, 0.38, 0.4]);
  }

  // Deep, open square perforations: physical geometry and shadows rather
  // than a grid painted onto an opaque slab.
  const screenStart = 3.35;
  const screenEnd = 7.83;
  const screenX = WIDTH / 2 + 0.52;
  const screenCols = 7;
  const screenRows = 9;
  for (let i = 0; i <= screenCols; i++) {
    const z = screenStart + (screenEnd - screenStart) * (i / screenCols);
    put(light, [screenX, 3.8, z], [0.32, 6.95, 0.15]);
  }
  for (let j = 0; j <= screenRows; j++) {
    const y = 0.39 + j * 0.76;
    put(light, [screenX, y, (screenStart + screenEnd) / 2], [0.33, 0.16, screenEnd - screenStart + 0.19]);
  }
  for (let i = 0; i < 2; i++) {
    const z = screenStart - 0.12 + i * (screenEnd - screenStart + 0.24);
    put(mid, [screenX + 0.02, 3.85, z], [0.42, 7.2, 0.26]);
  }

  // West elevation: many small recessed openings and a heavy mineral facade.
  // Dark slots remain visible even from low-detail/distant campus views.
  for (let i = 0; i < 15; i++) {
    const z = -7.55 + i * 1.06;
    for (let floor = 0; floor < 5; floor++) {
      const y = 1.0 + floor * 1.26;
      if ((i === 7 || i === 8) && floor < 3) continue;
      put(dark, [-4.01, y, z], [0.10, 0.69, 0.35]);
      put(glass, [-4.07, y, z], [0.052, 0.56, 0.24]);
      put(mid, [-4.12, y - 0.4, z], [0.17, 0.08, 0.53]);
    }
  }
  for (let floor = 1; floor < 5; floor++) {
    put(mid, [-4.09, floor * 1.38 + 0.13, 0], [0.18, 0.055, 16.0]);
  }

  // Southern end elevation: recessed tall glazed entrance and shaded steps.
  for (let i = 0; i <= 6; i++) {
    const x = -3.38 + i * 1.13;
    put(steel, [x, 4.02, LENGTH / 2 + 0.18], [0.07, 6.55, 0.13]);
    if (i === 1 || i === 5) put(light, [x, 4.0, LENGTH / 2 + 0.37], [0.22, 7.03, 0.25]);
  }
  for (let floor = 0; floor <= 5; floor++) {
    put(steel, [0, 0.74 + floor * 1.3, LENGTH / 2 + 0.2], [6.8, 0.08, 0.14]);
  }

  // Northern elevation: a glazed vertical bay, projecting shading fins and
  // bands across its stone-framed edges.
  for (let i = 0; i <= 9; i++) {
    const x = -3.45 + i * 0.77;
    put(steel, [x, 3.7, -LENGTH / 2 - 0.13], [0.07, 6.15, 0.12]);
    if (i % 3 === 0) put(light, [x, 3.75, -LENGTH / 2 - 0.29], [0.17, 6.9, 0.28]);
  }
  for (let floor = 0; floor <= 5; floor++) {
    put(steel, [0, 0.66 + floor * 1.26, -LENGTH / 2 - 0.14], [7.0, 0.085, 0.15]);
  }

  // Limestone joint bands on the four corners, and roof parapet returns.
  for (const z of [-7.99, 7.99]) {
    for (const x of [-3.83, 3.83]) {
      put(light, [x, 3.75, z], [0.23, 7.42, 0.25]);
    }
  }
  for (let j = 0; j < 4; j++) {
    put(bronze, [2.9, 0.95 + j * 1.25, 7.92], [0.055, 0.045, 0.62]);
  }
  return { light, mid, dark, glass, steel, bronze };
}

export default function LibraryBuilding({ active }: { active: boolean }) {
  const details = useMemo(buildFacadeDetails, []);

  return (
    <group>
      {/* Real footprint aspect is about 90:43, from 2026 Table 2.
          Long axis runs along local Z so the previously requested -90°
          rotation presents the glazed long elevation to the camera. */}
      <Solid at={[0, 0.06, 0]} size={[8.4, 0.12, 17.0]} material={active ? surface.highlight : surface.roof} />
      <Solid at={[-1.8, 3.83, 0]} size={[4.05, 7.0, 16.0]} material={surface.limestone} />
      <Solid at={[1.65, 0.78, 0]} size={[3.2, 1.35, 16.0]} material={surface.stoneMid} />
      <Solid at={[1.95, 3.77, 5.68]} size={[3.53, 6.98, 4.75]} material={surface.dark} />

      {/* Five visible levels, inset glazing, deep lintels and spandrels. */}
      <Solid at={[3.63, 3.8, -2.72]} size={[0.15, 6.78, 10.55]} material={surface.dark} />
      <Solid at={[3.81, 3.8, -2.72]} size={[0.055, 6.62, 10.45]} material={surface.glass} />
      <Solid at={[3.58, 3.78, 5.67]} size={[0.06, 6.9, 4.3]} material={surface.glassDark} />
      {[1.63, 2.98, 4.32, 5.67].map((y) => (
        <Solid
          key={y}
          at={[2.52, y, -2.65]}
          size={[2.25, 0.16, 10.54]}
          material={surface.stoneMid}
        />
      ))}
      <Solid at={[4.03, 7.34, -2.65]} size={[0.52, 0.32, 10.85]} material={surface.stoneLight} />
      <Solid at={[4.02, 0.53, -2.65]} size={[0.36, 0.34, 10.9]} material={surface.stoneDeep} />
      <Repeated pieces={details.light} material={surface.stoneLight} />
      <Repeated pieces={details.mid} material={surface.stoneMid} />
      <Repeated pieces={details.dark} material={surface.dark} />
      <Repeated pieces={details.glass} material={surface.glassDark} />
      <Repeated pieces={details.steel} material={surface.steel} />
      <Repeated pieces={details.bronze} material={surface.bronze} />

      {/* West continuous stone screen: staggered masonry columns and a
          recessed vertical stair-window strip breaking the long wall. */}
      <Solid at={[-3.78, 3.82, 0]} size={[0.45, 7.15, 16.12]} material={surface.limestone} />
      <Solid at={[-4.015, 3.42, 0.0]} size={[0.065, 4.9, 1.4]} material={surface.dark} />
      <Solid at={[-4.075, 3.42, 0.0]} size={[0.045, 4.75, 1.27]} material={surface.glassDark} />
      {[-0.51, 0, 0.51].map((z) => (
        <Solid key={z} at={[-4.16, 3.42, z]} size={[0.12, 4.87, 0.07]} material={surface.steel} />
      ))}

      {/* South: recessed glazed entry, a deep coffered canopy and approach
          steps. This is based on the 2026 author's transitional-zone views,
          but the exact dimensions remain an approximation. */}
      <Solid at={[0, 3.85, 8.06]} size={[7.45, 7.1, 0.35]} material={surface.limestone} />
      <Solid at={[0, 3.82, 8.3]} size={[6.5, 6.55, 0.08]} material={surface.glassDark} />
      <Solid at={[0, 2.0, 8.43]} size={[2.6, 3.2, 0.1]} material={surface.dark} />
      <Solid at={[0, 2.0, 8.49]} size={[2.44, 3.06, 0.055]} material={surface.glass} />
      <Solid at={[0, 2.0, 8.57]} size={[0.055, 3.14, 0.1]} material={surface.steel} />
      <Solid at={[0, 7.3, 8.88]} size={[7.85, 0.36, 2.1]} material={surface.stoneLight} />
      <Solid at={[0, 7.06, 8.87]} size={[6.5, 0.11, 1.75]} material={surface.stoneDeep} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Solid
          key={i}
          at={[0, 0.35 - i * 0.037, 8.65 + i * 0.3]}
          size={[5.25 + i * 0.16, 0.12, 0.43]}
          material={i % 2 ? surface.stoneLight : surface.stoneMid}
        />
      ))}
      {[-3.35, 3.35].map((x) => (
        <Solid key={x} at={[x, 3.81, 8.76]} size={[0.33, 6.8, 0.44]} material={surface.stoneLight} />
      ))}

      {/* North: dark atrium glazing beyond a stone frame. */}
      <Solid at={[0, 3.8, -8.13]} size={[7.42, 7.0, 0.26]} material={surface.stoneMid} />
      <Solid at={[0, 3.7, -8.32]} size={[6.97, 6.1, 0.075]} material={surface.glassDark} />
      <Solid at={[0, 7.29, -8.21]} size={[8.01, 0.26, 0.43]} material={surface.stoneLight} />

      {/* Flat, stepped roof, two plant enclosures, parapet, and a skylight. */}
      <Solid at={[0, 7.48, 0]} size={[8.06, 0.23, 16.75]} material={surface.roof} />
      <Solid at={[-0.65, 7.79, -4.5]} size={[5.9, 0.19, 6.5]} material={surface.stoneLight} />
      <Solid at={[-1.62, 8.13, 5.35]} size={[2.08, 1.18, 2.8]} material={surface.limestone} />
      <Solid at={[-1.62, 8.76, 5.35]} size={[2.28, 0.15, 3.04]} material={surface.stoneLight} />
      <Solid at={[1.75, 7.93, -5.3]} size={[1.4, 0.75, 2.1]} material={surface.limestone} />
      <Solid at={[1.75, 8.34, -5.3]} size={[1.54, 0.13, 2.27]} material={surface.stoneLight} />
      <Solid at={[0.7, 7.65, 1.25]} size={[1.25, 0.035, 3.0]} material={surface.glassDark} />
      <Solid at={[0.7, 7.69, 1.25]} size={[0.07, 0.08, 2.95]} material={surface.steel} />
      <Solid at={[0.7, 7.69, 1.25]} size={[1.3, 0.08, 0.06]} material={surface.steel} />
    </group>
  );
}
