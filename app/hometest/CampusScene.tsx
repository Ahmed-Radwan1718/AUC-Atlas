"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import {
  BoxGeometry, DataTexture, LinearFilter, MeshStandardMaterial,
  RGBAFormat, RepeatWrapping, SRGBColorSpace, Vector3,
  type Material
} from "three";

export type SchoolId = "humanities" | "engineering" | "business" | "library";
type Vec3 = [number, number, number];

type CampusSceneProps = {
  selected: SchoolId | null;
  onSelect: (school: SchoolId | null) => void;
};

// Shared geometry and materials avoid hundreds of redundant GPU allocations.
// Every building is assembled in code: no downloads or external model assets.
const cube = new BoxGeometry(1, 1, 1);

// Procedural limestone masonry inspired by the real SSE facade.
// A single small repeating GPU texture gives the long stone wings visible,
// irregular banding without hundreds of expensive individual stone meshes.
function createSSEStoneTexture() {
  const side = 256;
  const pixels = new Uint8Array(side * side * 4);
  const palette = [
    [164, 153, 136], [185, 172, 150], [151, 141, 125],
    [195, 180, 155], [170, 159, 142], [207, 192, 164],
    [149, 139, 127], [177, 163, 141]
  ];
  for (let y = 0; y < side; y++) {
    const row = Math.floor(y / 16);
    const stagger = (row % 2) * 16;
    for (let x = 0; x < side; x++) {
      const shifted = (x + stagger) % side;
      const column = Math.floor(shifted / 32);
      const stone = palette[(row * 3 + column * 5 + (row * column) % 7) % palette.length];
      const grain = ((x * 17 + y * 23 + row * 7) % 15) - 7;
      const grout = y % 16 === 0 || shifted % 32 === 0;
      const index = (y * side + x) * 4;
      for (let channel = 0; channel < 3; channel++) {
        pixels[index + channel] = Math.max(0, Math.min(255, stone[channel] + grain - (grout ? 30 : 0)));
      }
      pixels[index + 3] = 255;
    }
  }
  const texture = new DataTexture(pixels, side, side, RGBAFormat);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1.5, 1.2);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
const mat = {
  limestone: new MeshStandardMaterial({ color: "#c8b38e", roughness: 0.91 }),
  limestoneLight: new MeshStandardMaterial({ color: "#e2d0b0", roughness: 0.92 }),
  sandstone: new MeshStandardMaterial({ color: "#ae9169", roughness: 0.94 }),
  sandstoneDark: new MeshStandardMaterial({ color: "#927755", roughness: 0.96 }),
  carved: new MeshStandardMaterial({ color: "#e8d9bb", roughness: 0.9 }),
  glass: new MeshStandardMaterial({ color: "#536974", metalness: 0.27, roughness: 0.26 }),
  glassLight: new MeshStandardMaterial({ color: "#879ca1", metalness: 0.22, roughness: 0.24 }),
  recess: new MeshStandardMaterial({ color: "#3e3e3b", roughness: 0.92 }),
  bronze: new MeshStandardMaterial({ color: "#b18b56", metalness: 0.35, roughness: 0.51 }),
  roof: new MeshStandardMaterial({ color: "#9c8a72", roughness: 0.94 }),
  concrete: new MeshStandardMaterial({ color: "#e1d9cd", roughness: 1 }),
  path: new MeshStandardMaterial({ color: "#d4c5ad", roughness: 1 }),
  green: new MeshStandardMaterial({ color: "#72806b", roughness: 1 }),
  greenDark: new MeshStandardMaterial({ color: "#505f4c", roughness: 1 }),
  ground: new MeshStandardMaterial({ color: "#e9e3d7", roughness: 1 }),
  focus: new MeshStandardMaterial({ color: "#c09a5c", roughness: 0.76 }),
  sseStone: new MeshStandardMaterial({ map: createSSEStoneTexture(), roughness: 0.94 }),
  sseBlue: new MeshStandardMaterial({ color: "#213a7b", roughness: 0.6, metalness: 0.08 }),
  sseWindow: new MeshStandardMaterial({ color: "#30495c", roughness: 0.19, metalness: 0.26 })
};

function Block({
  at, size, material, rotation
}: {
  at: Vec3;
  size: Vec3;
  material: Material;
  rotation?: Vec3;
}) {
  return (
    <mesh
      geometry={cube}
      position={at}
      scale={size}
      rotation={rotation}
      material={material}
      castShadow
      receiveShadow
    />
  );
}

function Pier({ x, z, height = 2.8 }: { x: number; z: number; height?: number }) {
  return (
    <group position={[x, 0, z]}>
      <Block at={[0, height / 2 + 0.23, 0]} size={[0.28, height, 0.34]} material={mat.limestoneLight} />
      <Block at={[0, 0.3, 0]} size={[0.43, 0.2, 0.47]} material={mat.sandstone} />
      <Block at={[0, height + 0.17, 0]} size={[0.48, 0.2, 0.49]} material={mat.carved} />
    </group>
  );
}

function Arch({ x, z, width = 1.25, height = 2.8 }: {
  x: number; z: number; width?: number; height?: number;
}) {
  const radius = width * 0.5;
  const centerY = height - radius;
  return (
    <group position={[x, 0, z]}>
      <Block at={[0, centerY / 2 + 0.24, 0.02]} size={[width - 0.06, centerY - 0.1, 0.09]} material={mat.recess} />
      <mesh position={[0, centerY + 0.16, 0.075]} material={mat.recess}>
        <circleGeometry args={[radius - 0.03, 24, 0, Math.PI]} />
      </mesh>
      <mesh position={[0, centerY + 0.16, 0.13]} material={mat.carved} castShadow>
        <torusGeometry args={[radius, 0.115, 8, 28, Math.PI]} />
      </mesh>
      <Block at={[0, 0.27, 0.17]} size={[width - 0.09, 0.12, 0.22]} material={mat.bronze} />
      <Block at={[0, 0.19, 0.2]} size={[width - 0.08, 0.26, 0.15]} material={mat.sandstoneDark} />
    </group>
  );
}

function Window({ at, wide = 0.6, tall = 0.85 }: { at: Vec3; wide?: number; tall?: number }) {
  const [x, y, z] = at;
  return (
    <group>
      <Block at={[x, y, z]} size={[wide, tall, 0.07]} material={mat.recess} />
      <Block at={[x, y, z + 0.045]} size={[wide - 0.11, tall - 0.11, 0.04]} material={mat.glass} />
      <Block at={[x, y, z + 0.08]} size={[0.045, tall - 0.06, 0.06]} material={mat.sandstoneDark} />
      <Block at={[x, y - 0.06, z + 0.08]} size={[wide - 0.06, 0.035, 0.06]} material={mat.sandstoneDark} />
      <Block at={[x, y - tall / 2 - 0.08, z + 0.1]} size={[wide + 0.18, 0.12, 0.29]} material={mat.carved} />
    </group>
  );
}

function Cypress({ at, height = 1.7 }: { at: Vec3; height?: number }) {
  return (
    <group position={at}>
      <mesh position={[0, height * 0.52, 0]} material={mat.sandstoneDark} castShadow>
        <cylinderGeometry args={[0.075, 0.11, height * 0.95, 7]} />
      </mesh>
      <mesh position={[0, height * 0.75, 0]} material={mat.greenDark} castShadow>
        <coneGeometry args={[0.35, height * 1.3, 9]} />
      </mesh>
      <mesh position={[0, height * 0.38, 0]} material={mat.green} castShadow>
        <coneGeometry args={[0.43, height * 0.88, 9]} />
      </mesh>
    </group>
  );
}

function SchoolBase({ active }: { active: boolean }) {
  return (
    <group>
      <Block at={[0, 0.07, 0]} size={[7.7, 0.14, 6.4]} material={active ? mat.focus : mat.concrete} />
      <Block at={[0, 0.12, 2.94]} size={[7.7, 0.055, 0.48]} material={mat.path} />
    </group>
  );
}

// Humanities: a sandstone courtyard composition with a colonnaded arcade.
function Humanities({ active }: { active: boolean }) {
  return (
    <group position={[-14.5, 0, -4.2]}>
      <SchoolBase active={active} />
      <Block at={[0, 1.84, 0.15]} size={[6.7, 3.45, 3.8]} material={mat.limestone} />
      <Block at={[-2.63, 2.55, -1.48]} size={[1.5, 4.95, 1.55]} material={mat.sandstone} />
      <Block at={[2.59, 2.3, -1.44]} size={[1.53, 4.48, 1.7]} material={mat.sandstone} />
      <Block at={[0, 3.64, 0.16]} size={[6.99, 0.27, 4.15]} material={mat.carved} />
      <Block at={[0, 3.87, 0.16]} size={[6.99, 0.18, 4.15]} material={mat.sandstone} />
      <Block at={[-2.63, 5.1, -1.47]} size={[1.66, 0.22, 1.72]} material={mat.carved} />
      <Block at={[2.59, 4.6, -1.44]} size={[1.69, 0.22, 1.88]} material={mat.carved} />
      <Block at={[0, 3.23, 2.08]} size={[6.6, 0.18, 0.28]} material={mat.carved} />
      {[-2.36, -0.79, 0.79, 2.36].map((x) => <Pier key={x} x={x} z={2.14} height={2.65} />)}
      {[-1.58, 0, 1.58].map((x) => <Arch key={x} x={x} z={2.12} width={1.25} height={2.77} />)}
      {[-2.65, -1.59, -0.53, 0.53, 1.59, 2.65].map((x) => (
        <Block key={x} at={[x, 3.54, 2.23]} size={[0.65, 0.09, 0.12]} material={mat.sandstoneDark} />
      ))}
      <Window at={[-2.63, 3.9, -0.58]} wide={0.6} tall={0.83} />
      <Window at={[2.59, 3.6, -0.52]} wide={0.6} tall={0.83} />
      {[-2.65, 2.62].map((x) => <Window key={x} at={[x, 2.65, -0.54]} wide={0.6} tall={0.79} />)}
      <Cypress at={[-3.55, 0.18, 2.6]} height={1.35} />
      <Cypress at={[3.52, 0.18, 2.55]} height={1.4} />
    </group>
  );
}

// SSE: modeled from the supplied photograph of the actual Sciences & Engineering
// building, with its patterned stone wings, recessed blue vertical bays,
// upper school-name lintel, shaded entrance and broad monumental steps.
// It is an architectural likeness rather than a survey-accurate digital twin.
function SSEBay({ x }: { x: number }) {
  return (
    <group position={[x, 0, 2.01]}>
      {/* Tall window and deep cobalt spandrel blocks, repeated four times. */}
      <Block at={[0, 4.17, 0.025]} size={[0.67, 0.83, 0.13]} material={mat.recess} />
      <Block at={[0, 4.18, 0.099]} size={[0.57, 0.72, 0.055]} material={mat.sseWindow} />
      <Block at={[0, 3.68, 0.14]} size={[0.76, 0.49, 0.10]} material={mat.sseBlue} />
      <Block at={[0, 2.84, 0.025]} size={[0.67, 0.88, 0.13]} material={mat.recess} />
      <Block at={[0, 2.86, 0.099]} size={[0.57, 0.77, 0.055]} material={mat.sseWindow} />
      <Block at={[0, 2.27, 0.14]} size={[0.76, 0.57, 0.10]} material={mat.sseBlue} />
      <Block at={[0, 1.67, 0.023]} size={[0.67, 0.48, 0.12]} material={mat.recess} />
      <Block at={[0, 1.67, 0.095]} size={[0.57, 0.38, 0.055]} material={mat.sseWindow} />
      <Block at={[0, 4.19, 0.16]} size={[0.036, 0.73, 0.04]} material={mat.sandstoneDark} />
      <Block at={[0, 2.86, 0.16]} size={[0.036, 0.79, 0.04]} material={mat.sandstoneDark} />
    </group>
  );
}

function SSESideWindow({ x, y, z = 2.16 }: { x: number; y: number; z?: number }) {
  return (
    <group>
      <Block at={[x, y, z]} size={[0.56, 0.78, 0.09]} material={mat.recess} />
      <Block at={[x, y, z + 0.06]} size={[0.49, 0.7, 0.045]} material={mat.sseWindow} />
      <Block at={[x, y, z + 0.10]} size={[0.035, 0.72, 0.055]} material={mat.sandstoneDark} />
      <Block at={[x, y - 0.04, z + 0.10]} size={[0.52, 0.035, 0.05]} material={mat.sandstoneDark} />
      <Block at={[x, y - 0.45, z + 0.10]} size={[0.71, 0.11, 0.26]} material={mat.limestoneLight} />
    </group>
  );
}

function Engineering({ active }: { active: boolean }) {
  return (
    <group position={[0, 0, 3.4]}>
      <SchoolBase active={active} />

      {/* Deep main block.  The flank wings step forward as in the photograph. */}
      <Block at={[0, 2.52, -0.28]} size={[6.75, 4.92, 3.82]} material={mat.sseStone} />
      <Block at={[-2.8, 2.73, -0.26]} size={[1.6, 5.4, 4.58]} material={mat.sseStone} />
      <Block at={[2.82, 2.9, -0.38]} size={[1.56, 5.76, 4.79]} material={mat.sseStone} />

      {/* Rear inner wall and pale stone piers behind the four blue panel stacks. */}
      <Block at={[0.1, 2.82, 1.89]} size={[4.36, 4.62, 0.22]} material={mat.limestoneLight} />
      {[-2.1, -1.09, -0.08, 0.93, 1.94].map((x) => (
        <Block key={"pier-" + x} at={[x, 2.83, 2.08]} size={[0.29, 4.53, 0.3]} material={mat.carved} />
      ))}
      {[-1.59, -0.58, 0.43, 1.44].map((x) => <SSEBay key={x} x={x} />)}

      {/* The striking recessed school entrance and its continuous lintel. */}
      <Block at={[0, 0.89, 2.08]} size={[2.07, 1.42, 0.1]} material={mat.recess} />
      <Block at={[0, 0.84, 2.16]} size={[1.88, 1.29, 0.055]} material={mat.sseWindow} />
      <Block at={[0, 0.85, 2.22]} size={[0.06, 1.27, 0.055]} material={mat.sandstoneDark} />
      <Block at={[0, 1.64, 2.22]} size={[3.65, 0.15, 0.56]} material={mat.limestone} />
      <Block at={[0, 4.97, 2.26]} size={[4.72, 0.64, 0.66]} material={mat.carved} />
      <Block at={[0, 5.34, 1.89]} size={[4.95, 0.22, 1.45]} material={mat.sseStone} />
      <Block at={[0, 5.47, 1.88]} size={[5.1, 0.13, 1.5]} material={mat.limestone} />

      {/* Inscription on the real lintel; this is world-anchored, not a floating UI label. */}
      <Html
        transform
        center
        position={[0, 4.98, 2.607]}
        distanceFactor={2.3}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div style={{
          width: "630px",
          color: "#645d52",
          fontFamily: "Arial, sans-serif",
          fontSize: "19px",
          fontWeight: 600,
          letterSpacing: "2.1px",
          textAlign: "center",
          whiteSpace: "nowrap",
          lineHeight: 1
        }}>
          SCHOOL OF SCIENCES AND ENGINEERING
        </div>
      </Html>

      {/* Left wing: balconies and a shadowed ground-floor colonnade. */}
      <Block at={[-2.81, 3.36, 2.05]} size={[1.46, 0.21, 0.38]} material={mat.carved} />
      <Block at={[-2.81, 2.03, 2.08]} size={[1.46, 0.2, 0.43]} material={mat.carved} />
      {[2.65, 3.96].map((y) => (
        <group key={"balcony-"+y}>
          <Block at={[-2.81, y, 2.126]} size={[1.13, 0.77, 0.05]} material={mat.recess} />
          <Block at={[-2.81, y - 0.34, 2.19]} size={[1.43, 0.14, 0.33]} material={mat.sandstoneDark} />
          <Block at={[-2.81, y - 0.12, 2.31]} size={[1.44, 0.06, 0.1]} material={mat.recess} />
        </group>
      ))}
      <Block at={[-2.8, 0.94, 2.12]} size={[1.17, 1.36, 0.08]} material={mat.recess} />
      <Block at={[-2.8, 1.73, 2.23]} size={[1.53, 0.16, 0.41]} material={mat.carved} />

      {/* Right facade: offset stonework and narrow, dark recessed windows. */}
      {[1.33, 2.73, 4.13].map((y) => (
        <SSESideWindow key={"right-" + y} x={2.96} y={y} z={2.095} />
      ))}
      <Block at={[2.81, 5.84, -0.4]} size={[1.74, 0.19, 4.95]} material={mat.carved} />
      <Block at={[-2.8, 5.49, -0.26]} size={[1.78, 0.19, 4.76]} material={mat.carved} />
      {/* Stone bands and the outer architectural frame add depth at low zoom. */}
      {[1.91, 3.31, 4.67].map((y) => (
        <Block key={"band-" + y} at={[2.82, y, 2.14]} size={[1.49, 0.055, 0.16]} material={mat.sandstoneDark} />
      ))}
      <Block at={[2.08, 2.86, 2.02]} size={[0.24, 4.77, 0.28]} material={mat.sandstone} />
      <Block at={[-2.18, 2.86, 2.02]} size={[0.24, 4.77, 0.28]} material={mat.sandstone} />

      {/* Wide shallow steps and the entry landing photographed at AUC. */}
      <Block at={[0.24, 0.51, 2.44]} size={[5.7, 0.22, 0.75]} material={mat.carved} />
      <Block at={[0.24, 0.405, 2.70]} size={[5.8, 0.15, 0.7]} material={mat.limestoneLight} />
      <Block at={[0.24, 0.31, 2.91]} size={[5.94, 0.16, 0.60]} material={mat.carved} />
      <Block at={[0.24, 0.225, 3.11]} size={[6.05, 0.14, 0.48]} material={mat.limestoneLight} />
    </group>
  );
}

// Business: restrained stone architecture with a repeating monumental arch rhythm.
function Business({ active }: { active: boolean }) {
  return (
    <group position={[14.5, 0, -4.2]}>
      <SchoolBase active={active} />
      <Block at={[0, 2.06, -0.32]} size={[6.7, 3.83, 3.66]} material={mat.limestone} />
      <Block at={[-2.6, 2.41, -1.61]} size={[1.54, 4.61, 1.56]} material={mat.sandstone} />
      <Block at={[2.61, 2.41, -1.61]} size={[1.54, 4.61, 1.56]} material={mat.sandstone} />
      <Block at={[0, 4.12, -0.32]} size={[7.03, 0.23, 3.98]} material={mat.carved} />
      <Block at={[0, 4.35, -0.32]} size={[6.94, 0.18, 3.93]} material={mat.sandstoneDark} />
      <Block at={[-2.6, 4.78, -1.61]} size={[1.72, 0.16, 1.7]} material={mat.carved} />
      <Block at={[2.61, 4.78, -1.61]} size={[1.72, 0.16, 1.7]} material={mat.carved} />
      <Block at={[0, 3.54, 1.58]} size={[6.65, 0.17, 0.3]} material={mat.sandstone} />
      {[-2.55, -1.28, 0, 1.28, 2.55].map((x) => (
        <Arch key={x} x={x} z={1.6} width={0.99} height={2.82} />
      ))}
      {[-3.13, -1.91, -0.64, 0.64, 1.91, 3.13].map((x) => (
        <Pier key={x} x={x} z={1.67} height={2.81} />
      ))}
      {[-2.45, -1.23, 0, 1.23, 2.45].map((x) => (
        <Window key={x} at={[x, 3.63, 1.58]} wide={0.57} tall={0.49} />
      ))}
      <Block at={[0, 0.25, 2.44]} size={[6.36, 0.16, 1.15]} material={mat.path} />
      <Cypress at={[-3.53, 0.18, 2.63]} height={1.45} />
      <Cypress at={[3.54, 0.18, 2.64]} height={1.41} />
    </group>
  );
}

// AUC Main Library: a three-story glass reading room behind tall limestone
// columns, with deep canopy and square mashrabiya-inspired stone screens.
// These forms follow the architect's exterior reference photos, using only
// procedural geometry and the existing campus materials.
function Library({ active }: { active: boolean }) {
  return (
    <group position={[-11.5, 0, 13.7]}>
      <Block at={[0, 0.07, 0]} size={[10.8, 0.14, 6.8]} material={active ? mat.focus : mat.concrete} />

      {/* Deep limestone structure and raised parapet. */}
      <Block at={[0, 2.64, -0.38]} size={[10.1, 4.98, 4.04]} material={mat.limestone} />
      <Block at={[0, 5.15, -0.38]} size={[10.35, 0.29, 4.4]} material={mat.carved} />
      <Block at={[0, 5.4, -0.38]} size={[10.3, 0.18, 4.36]} material={mat.sandstone} />
      <Block at={[-3.6, 2.67, 1.77]} size={[2.75, 4.78, 0.17]} material={mat.recess} />
      <Block at={[3.62, 2.67, 1.77]} size={[2.75, 4.78, 0.17]} material={mat.recess} />

      {/* A tall, continuously glazed atrium with dark metal mullions. */}
      <Block at={[0, 2.72, 1.79]} size={[4.7, 4.64, 0.13]} material={mat.recess} />
      <Block at={[0, 2.72, 1.89]} size={[4.53, 4.46, 0.045]} material={mat.glassLight} />
      {[-1.86, -0.93, 0, 0.93, 1.86].map(x => (
        <Block key={"glass-pier-" + x} at={[x, 2.72, 1.98]} size={[0.085, 4.6, 0.17]} material={mat.sandstoneDark} />
      ))}
      {[1.43, 2.47, 3.51, 4.57].map(y => (
        <Block key={"glass-floor-" + y} at={[0, y, 1.99]} size={[4.67, 0.075, 0.16]} material={mat.sandstoneDark} />
      ))}

      {/* Deep entrance threshold, door and broad AUC-style limestone steps. */}
      <Block at={[0, 0.96, 2.08]} size={[1.76, 1.43, 0.09]} material={mat.glass} />
      <Block at={[0, 0.97, 2.19]} size={[0.055, 1.41, 0.06]} material={mat.sandstoneDark} />
      <Block at={[0, 0.41, 2.62]} size={[5.9, 0.19, 0.9]} material={mat.carved} />
      <Block at={[0, 0.3, 2.91]} size={[6.02, 0.17, 0.81]} material={mat.limestoneLight} />
      <Block at={[0, 0.205, 3.21]} size={[6.17, 0.14, 0.76]} material={mat.path} />

      {/* The monumental shaded colonnade and projecting library roof. */}
      <Block at={[0, 5.28, 2.29]} size={[5.45, 0.28, 1.4]} material={mat.carved} />
      <Block at={[0, 5.46, 2.24]} size={[5.52, 0.14, 1.46]} material={mat.sandstone} />
      {[-2.29, -0.77, 0.77, 2.29].map(x => (
        <Block key={"library-column-" + x} at={[x, 2.87, 2.14]} size={[0.25, 4.67, 0.38]} material={mat.carved} />
      ))}

      {/* Repeating square-screen apertures in the exterior limestone wings. */}
      {[-3.61, 3.62].map(side => (
        <group key={"screen-" + side}>
          {Array.from({ length: 7 }, (_, i) => (
            <Block
              key={"vertical-" + i}
              at={[side - 1.28 + i * 0.425, 2.64, 1.91]}
              size={[0.12, 4.63, 0.24]}
              material={mat.limestoneLight}
            />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <Block
              key={"horizontal-" + i}
              at={[side, 0.35 + i * 0.5, 1.92]}
              size={[2.7, 0.125, 0.24]}
              material={mat.limestoneLight}
            />
          ))}
        </group>
      ))}

      {/* Roof returns and a darker stone side volume. */}
      <Block at={[-4.78, 3.05, -0.7]} size={[0.41, 4.78, 3.9]} material={mat.sandstone} />
      <Block at={[4.78, 3.05, -0.7]} size={[0.41, 4.78, 3.9]} material={mat.sandstone} />
      <Block at={[0, 0.13, 3.19]} size={[10.3, 0.055, 0.4]} material={mat.path} />
    </group>
  );
}

// Walkways are real flat scene geometry, meeting at a shared plaza rather
// than joining the buildings into one continuous frontage.
function CampusWalkway({
  from, to, width = 2.1
}: {
  from: [number, number];
  to: [number, number];
  width?: number;
}) {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  return (
    <Block
      at={[(from[0] + to[0]) / 2, 0.035, (from[1] + to[1]) / 2]}
      size={[width, 0.065, Math.hypot(dx, dz)]}
      rotation={[0, Math.atan2(dx, dz), 0]}
      material={mat.path}
    />
  );
}

function CampusGround() {
  return (
    <group>
      <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat.ground} receiveShadow>
        <planeGeometry args={[200, 200]} />
      </mesh>

      {/* Campus entrance promenade and the connection to SSE's entrance steps. */}
      <CampusWalkway from={[0, 19]} to={[0, 6.4]} width={2.65} />
      {/* Library sits off the promenade, approached along a separate stone path. */}
      <CampusWalkway from={[-1.3, 16.4]} to={[-11.5, 16.4]} width={2.15} />
      <mesh position={[0, 0.073, 9.65]} rotation={[-Math.PI / 2, 0, 0]} material={mat.path} receiveShadow>
        <circleGeometry args={[2.8, 48]} />
      </mesh>

      {/* Paths split naturally towards the two buildings further back. */}
      <CampusWalkway from={[-1.85, 9.65]} to={[-8.1, 5.0]} width={2.05} />
      <CampusWalkway from={[-8.1, 5.0]} to={[-14.5, -0.95]} width={2.05} />
      <CampusWalkway from={[1.85, 9.65]} to={[8.1, 5.0]} width={2.05} />
      <CampusWalkway from={[8.1, 5.0]} to={[14.5, -0.95]} width={2.05} />

      {/* Relocate the existing landscape elements around, not onto, the paths. */}
      {[
        [-3.2, 13.6], [3.2, 13.6],
        [-10.5, 7.1], [10.5, 7.1],
        [-17.8, -0.2], [17.8, -0.2]
      ].map(([x, z]) => (
        <group key={x + ":" + z}>
          <Block at={[x, 0.07, z]} size={[0.45, 0.14, 0.45]} material={mat.limestone} />
          <Cypress at={[x, 0.17, z]} height={1.13} />
        </group>
      ))}
    </group>
  );
}

const positions: Record<SchoolId, [number, number]> = {
  humanities: [-14.5, -4.2],
  engineering: [0, 3.4],
  business: [14.5, -4.2],
  library: [-11.5, 13.7]
};

function CameraDirector({ selected, controls, cameraMotion }: { selected: SchoolId | null; controls: React.RefObject<any>; cameraMotion: React.RefObject<boolean> }) {
  const compact = useThree(state => state.size.width < 760);
  // Keep the existing focus animation and manual zoom behavior. Only the
  // destination coordinates change to match the new triangular campus.
  const goal = useMemo(
    () => selected
      ? compact
        ? new Vector3(positions[selected][0] + 5.2, 9.6, positions[selected][1] + 18.5)
        : new Vector3(positions[selected][0] + 3.7, 7.7, positions[selected][1] + 13.5)
      : compact
        ? new Vector3(12, 23, 93)
        : new Vector3(12, 19, 47),
    [selected, compact]
  );
  const target = useMemo(
    () => new Vector3(
      selected ? positions[selected][0] : 0,
      2.1,
      selected ? positions[selected][1] : 1.3
    ),
    [selected]
  );
  // Only selection changes should move the camera automatically. Mouse/trackpad
  // navigation must cancel the animation so manual zoom stays where the user left it.
  useEffect(() => { cameraMotion.current = true; }, [selected, compact, cameraMotion]);
  useFrame(({ camera }, delta) => {
    if (!cameraMotion.current) return;
    const t = 1 - Math.exp(-4 * Math.min(delta, 0.05));
    camera.position.lerp(goal, t);
    if (controls.current) {
      controls.current.target.lerp(target, t);
      controls.current.update();
      if (camera.position.distanceTo(goal) < 0.025 && controls.current.target.distanceTo(target) < 0.025) {
        cameraMotion.current = false;
      }
    }
  });
  return null;
}

function School({
  id, selected, onSelect, children
}: {
  id: SchoolId;
  selected: SchoolId | null;
  onSelect: (school: SchoolId | null) => void;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <group
      onClick={(event) => {
        event.stopPropagation();
        onSelect(selected === id ? null : id);
      }}
      onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      {children}
      {(hovered || selected === id) && (
        <mesh position={[positions[id][0], 0.16, positions[id][1]]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={id === "library" ? [10.5, 6.6] : [7.48, 6.08]} />
          <meshBasicMaterial color="#c09a5c" transparent opacity={0.12} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

function World({ selected, onSelect }: CampusSceneProps) {
  const controls = useRef<any>(null);
  const cameraMotion = useRef(true);
  return (
    <>
      <color attach="background" args={["#f7f4ee"]} />
      <fog attach="fog" args={["#f7f4ee", 55, 125]} />
      <ambientLight intensity={1.15} />
      <hemisphereLight color="#ffffff" groundColor="#c1b29c" intensity={1.8} />
      <directionalLight
        position={[-10, 18, 12]}
        intensity={2.7}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-camera-near={0.1}
        shadow-camera-far={55}
        shadow-bias={-0.0002}
      />
      <CampusGround />
      <School id="humanities" selected={selected} onSelect={onSelect}>
        <Humanities active={selected === "humanities"} />
      </School>
      <School id="engineering" selected={selected} onSelect={onSelect}>
        <Engineering active={selected === "engineering"} />
      </School>
      <School id="business" selected={selected} onSelect={onSelect}>
        <Business active={selected === "business"} />
      </School>
      <School id="library" selected={selected} onSelect={onSelect}>
        <Library active={selected === "library"} />
      </School>
      <OrbitControls
        ref={controls}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={15}
        maxDistance={110}
        minPolarAngle={0.60}
        maxPolarAngle={1.34}
        minAzimuthAngle={-0.8}
        maxAzimuthAngle={0.8}
        rotateSpeed={0.42}
        zoomSpeed={0.75}
        onStart={() => { cameraMotion.current = false; }}
      />
      <CameraDirector selected={selected} controls={controls} cameraMotion={cameraMotion} />
    </>
  );
}

export default function CampusScene(props: CampusSceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.65]}
      camera={{ position: [12, 19, 47], fov: 42, near: 0.1, far: 155 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onPointerMissed={() => props.onSelect(null)}
      fallback={<div className="campus-webgl-fallback">3D preview is unavailable in this browser. Select a school below to inspect the campus model.</div>}
    >
      <World {...props} />
    </Canvas>
  );
}
