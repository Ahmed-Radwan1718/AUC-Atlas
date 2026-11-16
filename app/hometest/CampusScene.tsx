"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  BoxGeometry, MeshStandardMaterial, Vector3,
  type Material
} from "three";

export type SchoolId = "humanities" | "engineering" | "business";
type Vec3 = [number, number, number];

type CampusSceneProps = {
  selected: SchoolId | null;
  onSelect: (school: SchoolId | null) => void;
};

// Shared geometry and materials avoid hundreds of redundant GPU allocations.
// Every building is assembled in code: no downloads or external model assets.
const cube = new BoxGeometry(1, 1, 1);
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
  focus: new MeshStandardMaterial({ color: "#c09a5c", roughness: 0.76 })
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
    <group position={[-8.1, 0, -0.65]}>
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

// Sciences & Engineering: precise glass grid, limestone fins and a raised atrium.
function Engineering({ active }: { active: boolean }) {
  return (
    <group position={[0, 0, -0.92]}>
      <SchoolBase active={active} />
      <Block at={[0, 2.06, -0.23]} size={[6.63, 3.86, 3.45]} material={mat.limestone} />
      <Block at={[-2.75, 2.85, -1.45]} size={[1.35, 5.45, 2.19]} material={mat.sandstone} />
      <Block at={[0.46, 2.06, 1.54]} size={[4.78, 3.23, 0.12]} material={mat.recess} />
      <Block at={[0.46, 2.08, 1.64]} size={[4.51, 3.07, 0.08]} material={mat.glass} />
      {[-1.86, -1.09, -0.32, 0.45, 1.22, 1.99, 2.76].map((x) => (
        <Block key={x} at={[x, 2.07, 1.75]} size={[0.095, 3.17, 0.24]} material={mat.limestoneLight} />
      ))}
      {[1.13, 2.13, 3.13].map((y) => (
        <Block key={y} at={[0.46, y, 1.75]} size={[4.78, 0.09, 0.2]} material={mat.bronze} />
      ))}
      <Block at={[0, 4.16, -0.2]} size={[6.95, 0.19, 3.74]} material={mat.sandstone} />
      <Block at={[0, 4.32, -0.2]} size={[6.9, 0.09, 3.7]} material={mat.carved} />
      <Block at={[-2.75, 5.65, -1.45]} size={[1.54, 0.24, 2.32]} material={mat.carved} />
      <Window at={[-2.74, 4.13, -0.3]} wide={0.59} tall={1.08} />
      <Window at={[-2.74, 2.7, -0.3]} wide={0.59} tall={1.05} />
      <Block at={[0.45, 0.49, 2.2]} size={[5.9, 0.16, 1.08]} material={mat.carved} />
      <Block at={[0.46, 0.29, 2.29]} size={[4.7, 0.19, 0.6]} material={mat.path} />
      <Block at={[2.86, 2.1, 0.9]} size={[0.38, 3.2, 1.1]} material={mat.sandstone} />
      <Cypress at={[-3.5, 0.18, 2.64]} height={1.36} />
      <Cypress at={[3.52, 0.18, 2.69]} height={1.35} />
    </group>
  );
}

// Business: restrained stone architecture with a repeating monumental arch rhythm.
function Business({ active }: { active: boolean }) {
  return (
    <group position={[8.1, 0, -0.65]}>
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

function CampusGround() {
  return (
    <group>
      <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat.ground} receiveShadow>
        <planeGeometry args={[200, 200]} />
      </mesh>
      <Block at={[0, 0.025, 3.67]} size={[25.3, 0.05, 1.3]} material={mat.path} />
      <Block at={[0, 0.03, -4.22]} size={[25.3, 0.04, 0.32]} material={mat.concrete} />
      {[-11.83, -4.33, 4.33, 11.83].map((x) => (
        <group key={x}>
          <Block at={[x, 0.07, 3.64]} size={[0.45, 0.14, 1.3]} material={mat.limestone} />
          <Cypress at={[x, 0.17, 4.25]} height={1.13} />
        </group>
      ))}
    </group>
  );
}

const positions: Record<SchoolId, number> = {
  humanities: -8.1,
  engineering: 0,
  business: 8.1
};

function CameraDirector({ selected, controls }: { selected: SchoolId | null; controls: React.RefObject<any> }) {
  const moving = useRef(true);
  const goal = useMemo(
    () => selected
      ? new Vector3(positions[selected] + 5.9, 9.9, 16.9)
      : new Vector3(12.5, 15.4, 30.5),
    [selected]
  );
  const target = useMemo(
    () => new Vector3(selected ? positions[selected] : 0, 2.15, 0),
    [selected]
  );
  useEffect(() => { moving.current = true; }, [selected]);
  useFrame(({ camera }, delta) => {
    if (!moving.current) return;
    const t = 1 - Math.exp(-4 * Math.min(delta, 0.05));
    camera.position.lerp(goal, t);
    if (controls.current) {
      controls.current.target.lerp(target, t);
      controls.current.update();
      if (camera.position.distanceTo(goal) < 0.025 && controls.current.target.distanceTo(target) < 0.025) {
        moving.current = false;
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
        <mesh position={[positions[id], 0.16, -0.65]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[7.48, 6.08]} />
          <meshBasicMaterial color="#c09a5c" transparent opacity={0.12} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

function World({ selected, onSelect }: CampusSceneProps) {
  const controls = useRef<any>(null);
  return (
    <>
      <color attach="background" args={["#f7f4ee"]} />
      <fog attach="fog" args={["#f7f4ee", 35, 70]} />
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
      <OrbitControls
        ref={controls}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={15}
        maxDistance={42}
        minPolarAngle={0.60}
        maxPolarAngle={1.34}
        minAzimuthAngle={-0.8}
        maxAzimuthAngle={0.8}
        rotateSpeed={0.42}
        zoomSpeed={0.75}
      />
      <CameraDirector selected={selected} controls={controls} />
    </>
  );
}

export default function CampusScene(props: CampusSceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.65]}
      camera={{ position: [12.5, 15.4, 30.5], fov: 42, near: 0.1, far: 110 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onPointerMissed={() => props.onSelect(null)}
      fallback={<div className="campus-webgl-fallback">3D preview is unavailable in this browser. Select a school below to inspect the campus model.</div>}
    >
      <World {...props} />
    </Canvas>
  );
}
