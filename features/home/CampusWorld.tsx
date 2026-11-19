"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export type CampusDestinationId = "engineering" | "business" | "library" | "sciences" | "humanities";
export type CampusPhase = "campus" | "approaching" | "inside" | "leaving";

export const CAMPUS_DESTINATIONS: {
  id: CampusDestinationId;
  name: string;
  short: string;
  number: string;
  x: number;
  z: number;
  width: number;
  height: number;
  depth: number;
}[] = [
  { id: "engineering", name: "Engineering", short: "Engineering", number: "01", x: -16.6, z: -14.5, width: 7.7, height: 7.6, depth: 5.7 },
  { id: "business", name: "Business", short: "Business", number: "02", x: -8.2, z: -17.2, width: 7.4, height: 6.5, depth: 5.5 },
  { id: "library", name: "Library", short: "Library", number: "03", x: 0, z: -20.2, width: 9.3, height: 8.3, depth: 6.7 },
  { id: "sciences", name: "Sciences", short: "Sciences", number: "04", x: 8.4, z: -17.2, width: 7.5, height: 7.0, depth: 5.8 },
  { id: "humanities", name: "Humanities & Social Sciences", short: "Humanities", number: "05", x: 16.8, z: -14.5, width: 8.0, height: 6.7, depth: 5.5 }
];

type CampusWorldProps = {
  phase: CampusPhase;
  selectedId: CampusDestinationId | null;
  onSelect: (id: CampusDestinationId) => void;
  onArrival: () => void;
  onDeparture: () => void;
};

const sandstone = "#c5aa82";
const paleStone = "#e1ccab";
const deepStone = "#977955";
const brass = "#bd9964";
const glass = "#21333d";

// The preview's architectural textures are generated locally in the browser.
// No stock model or third-party render is being presented as the real AUC campus.
function useStoneTexture() {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    if (!context) return null;
    const image = context.createImageData(256, 256);
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        const grain = Math.sin(x * 49.21 + y * 17.37) * 15392.6;
        const noise = (grain - Math.floor(grain)) * 23 - 11;
        const joint = (y % 49 < 2 || ((x + ((Math.floor(y / 49) % 2) * 60)) % 124 < 2)) ? -24 : 0;
        const v = noise + joint;
        const i = (y * 256 + x) * 4;
        image.data[i] = Math.max(0, 216 + v);
        image.data[i + 1] = Math.max(0, 195 + v);
        image.data[i + 2] = Math.max(0, 158 + v);
        image.data[i + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = 4;
    return map;
  }, []);
  useEffect(() => () => { texture?.dispose(); }, [texture]);
  return texture;
}

function Masonry({
  position, size, color = sandstone, texture, metalness = 0
}: {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  texture?: THREE.Texture | null;
  metalness?: number;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} map={texture || undefined} metalness={metalness} roughness={0.83} />
    </mesh>
  );
}

function Window({
  x, y, front, width = 0.83, height = 1.19
}: {
  x: number; y: number; front: number; width?: number; height?: number;
}) {
  return (
    <group position={[x, y, front]}>
      <Masonry position={[0, 0, 0]} size={[width + 0.25, height + 0.27, 0.12]} color={paleStone} />
      <mesh position={[0, 0, 0.085]}>
        <boxGeometry args={[width, height, 0.045]} />
        <meshPhysicalMaterial color={glass} metalness={0.43} roughness={0.13} clearcoat={0.8} />
      </mesh>
      <Masonry position={[0, 0, 0.15]} size={[0.045, height, 0.038]} color="#8b755b" />
      <Masonry position={[0, 0, 0.15]} size={[width, 0.038, 0.038]} color="#8b755b" />
      <Masonry position={[0, -height / 2 - 0.19, 0.16]} size={[width + 0.31, 0.12, 0.32]} color={paleStone} />
    </group>
  );
}

function Portal({ front, width = 1.65, height = 3.0 }: { front: number; width?: number; height?: number }) {
  return (
    <group position={[0, 0, front]}>
      <Masonry position={[0, height / 2 + 0.18, 0]} size={[width + 0.81, height + 0.56, 0.34]} color={deepStone}/>
      <mesh position={[0, height / 2 + 0.14, 0.2]}>
        <boxGeometry args={[width, height, 0.04]} />
        <meshStandardMaterial color="#101b21" roughness={0.32} metalness={0.25} />
      </mesh>
      <mesh position={[0, height / 2 + 0.18, 0.23]}>
        <boxGeometry args={[0.035, height - 0.13, 0.06]} />
        <meshStandardMaterial color={brass} metalness={0.85} roughness={0.23}/>
      </mesh>
      <Masonry position={[0, height + 0.48, 0.26]} size={[width + 1.2, 0.16, 0.52]} color={paleStone}/>
      <Masonry position={[0, 0.11, 0.49]} size={[width + 2.1, 0.23, 1.34]} color="#b3a083"/>
      <Masonry position={[0, 0.075, 1.18]} size={[width + 3.2, 0.15, 0.75]} color="#d3bc9a"/>
      <mesh position={[width * 0.33, height / 2, 0.275]}>
        <boxGeometry args={[0.055, 0.52, 0.06]}/>
        <meshStandardMaterial color="#ceb082" metalness={0.75} roughness={0.2}/>
      </mesh>
    </group>
  );
}

function CampusBuilding({
  destination, onSelect, enabled
}: {
  destination: (typeof CAMPUS_DESTINATIONS)[number];
  onSelect: (id: CampusDestinationId) => void;
  enabled: boolean;
}) {
  const texture = useStoneTexture();
  const { id, width, height, depth } = destination;
  const front = depth / 2 + 0.2;
  const isLibrary = id === "library";
  const cols = isLibrary ? 6 : 5;
  const windowPositions = Array.from({ length: cols }, (_, i) => (i - (cols - 1) / 2) * (width / (cols + 0.3)));
  return (
    <group position={[destination.x, 0, destination.z]}>
      <Masonry position={[0, height / 2, -0.2]} size={[width, height, depth]} color={sandstone} texture={texture}/>
      <Masonry position={[0, 0.28, 0]} size={[width + 0.4, 0.56, depth + 0.4]} color="#a78b66"/>
      <Masonry position={[0, height - 0.17, 0]} size={[width + 0.45, 0.35, depth + 0.45]} color="#e2c9a5"/>
      <Masonry position={[0, height + 0.1, 0]} size={[width + 0.76, 0.24, depth + 0.76]} color="#9d7f5a"/>
      <Masonry position={[0, height + 0.32, 0]} size={[width + 0.95, 0.23, depth + 0.95]} color="#d3b992"/>
      <Masonry position={[0, height / 2, depth / 2 + 0.06]} size={[width - 0.45, height - 1.0, 0.19]} color={id === "sciences" ? "#c0a17a" : "#c7a67e"}/>
      {windowPositions.map((x, i) => (
        <group key={i}>
          {(i !== Math.floor((cols - 1) / 2) && i !== Math.ceil((cols - 1) / 2)) && (
            <Window x={x} y={1.75} front={front} width={isLibrary ? 0.91 : 0.77} height={1.24}/>
          )}
          <Window x={x} y={height - 2.0} front={front} width={isLibrary ? 0.91 : 0.77} height={1.25}/>
        </group>
      ))}
      {Array.from({ length: 5 }, (_, i) => {
        const x = -width / 2 + 0.16 + (i * (width - 0.32) / 4);
        return <Masonry key={i} position={[x, height / 2, front + 0.13]}
          size={[0.22, height - 0.82, 0.42]} color={i === 0 || i === 4 ? "#d3b995" : "#e0c6a0"}/>;
      })}
      <Portal front={front + 0.29} width={isLibrary ? 2.35 : 1.62} height={isLibrary ? 3.55 : 3.0}/>
      {isLibrary && <>
        <Masonry position={[0, height + 0.65, 0]} size={[width + 1.45, 0.32, depth + 1.0]} color={paleStone}/>
        <Masonry position={[0, height + 0.98, 0]} size={[width - 1, 0.38, depth - 0.4]} color="#b49a76"/>
        {[-width / 2 + 0.85, width / 2 - 0.85].map(x =>
          <Masonry key={x} position={[x, 3, front + 0.66]} size={[0.48, 5.8, 0.52]} color="#e7ccaa"/>
        )}
      </>}
      {id === "engineering" && (
        <group position={[0, 0, front + 0.1]}>
          <Masonry position={[-width / 2 + 1, height / 2, 0.54]} size={[0.25, height - 0.4, 0.74]} color="#a38865"/>
          <Masonry position={[width / 2 - 1, height / 2, 0.54]} size={[0.25, height - 0.4, 0.74]} color="#a38865"/>
          <Masonry position={[0, height - 1.11, 0.62]} size={[width - 1.1, 0.12, 0.67]} color="#d7c2a3"/>
        </group>
      )}
      <Html position={[0, height + (isLibrary ? 2.7 : 1.65), front + 1]} center
        distanceFactor={26} zIndexRange={[30, 0]}>
        <button type="button" className="cinema-world-label" disabled={!enabled} onClick={() => onSelect(id)}
          aria-label={"Enter " + destination.name}>
          <span className="cinema-world-label-index">{destination.number} / SCHOOL</span>
          <strong>{destination.name}</strong>
          <span className="cinema-world-label-enter">ENTER <span aria-hidden="true">↗</span></span>
        </button>
      </Html>
    </group>
  );
}

function Cypress({ x, z, height = 5 }: { x: number; z: number; height?: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, height * 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.14, height * 0.48, 7]}/>
        <meshStandardMaterial color="#5a4c32" roughness={1}/>
      </mesh>
      {[0, 1, 2, 3].map(i => (
        <mesh key={i} position={[0, height * (0.36 + i * 0.17), 0]} castShadow>
          <coneGeometry args={[0.94 - i * 0.15, height * 0.5, 12]}/>
          <meshStandardMaterial color={i % 2 === 0 ? "#3b5042" : "#405443"} roughness={0.94}/>
        </mesh>
      ))}
    </group>
  );
}

function Landscape() {
  const texture = useStoneTexture();
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.32, -7]} receiveShadow>
      <planeGeometry args={[210, 210]}/>
      <meshStandardMaterial color="#a99170" roughness={0.96} map={texture || undefined}/>
    </mesh>
    <Masonry position={[0, -0.12, 7]} size={[48, 0.20, 20]} color="#c2ae8d" texture={texture}/>
    <Masonry position={[0, -0.20, -7.0]} size={[53, 0.24, 11.0]} color="#bd9d78" texture={texture}/>
    {Array.from({ length: 24 }, (_, i) =>
      <Masonry key={"paver-"+i} position={[-23.2+i*2.03, 0.005, 7.5]}
        size={[0.036, 0.012, 17]} color="#d6c2a1"/>
    )}
    {Array.from({ length: 12 }, (_, i) =>
      <Masonry key={"paverrow-"+i} position={[0, 0.009, -1.5+i*1.72]}
        size={[48, 0.012, 0.038]} color="#d6c2a1"/>
    )}
    {[-25.3, -11.9, 12.1, 25.3].map((x, i) =>
      <Cypress key={x} x={x} z={i % 2 ? -8.5 : -9.5} height={i % 2 ? 5.5 : 6.6}/>
    )}
    {[-25.3, 25.3].map(x =>
      <Cypress key={"back"+x} x={x} z={-19.0} height={8.5}/>
    )}
    <group position={[0, 0.07, 10.3]}>
      <mesh receiveShadow>
        <cylinderGeometry args={[3.9, 4.1, 0.38, 60]}/>
        <meshStandardMaterial color="#ad9574" metalness={0.08} roughness={0.68}/>
      </mesh>
      <mesh position={[0, 0.23, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.52, 60]}/>
        <meshPhysicalMaterial color="#678b8b" metalness={0.55} roughness={0.16} transparent opacity={0.78}/>
      </mesh>
      <mesh position={[0, 0.39, 0]}>
        <cylinderGeometry args={[0.48, 1.16, 0.63, 24]}/>
        <meshStandardMaterial color="#e0c8a6" roughness={0.72}/>
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.08, 0.2, 0.73, 18]}/>
        <meshStandardMaterial color="#e4d1b5" roughness={0.54}/>
      </mesh>
    </group>
  </>;
}

function CameraDirector({ phase, selectedId, onArrival, onDeparture }: Omit<CampusWorldProps, "onSelect">) {
  const { camera } = useThree();
  const startRef = useRef<{
    position: THREE.Vector3; look: THREE.Vector3; elapsed: number; done: boolean;
  } | null>(null);
  const looking = useRef(new THREE.Vector3(0, 2, -16));
  const arrival = useRef(onArrival);
  const departure = useRef(onDeparture);
  useEffect(() => { arrival.current = onArrival; departure.current = onDeparture; }, [onArrival, onDeparture]);

  useEffect(() => {
    if (phase !== "approaching" && phase !== "leaving") {
      startRef.current = null;
      return;
    }
    startRef.current = { position: camera.position.clone(), look: looking.current.clone(), elapsed: 0, done: false };
  }, [phase, selectedId, camera]);

  useFrame((state, delta) => {
    if (phase === "campus") {
      const point = new THREE.Vector3(state.pointer.x * 0.45, 9.1 + state.pointer.y * 0.3, 39.5);
      camera.position.lerp(point, Math.min(1, delta * 0.65));
      looking.current.lerp(new THREE.Vector3(state.pointer.x * 0.45, 2.4, -17), Math.min(1, delta * 0.85));
      camera.lookAt(looking.current);
      return;
    }
    if (phase === "inside") return;
    const transition = startRef.current;
    if (!transition || transition.done) return;
    const building = CAMPUS_DESTINATIONS.find(item => item.id === selectedId);
    const entering = phase === "approaching" && building;
    const end = entering
      ? new THREE.Vector3(building.x, 2.05, building.z + building.depth / 2 + 1.55)
      : new THREE.Vector3(0, 9.1, 39.5);
    const target = entering
      ? new THREE.Vector3(building.x, 1.65, building.z + building.depth / 2 - 0.7)
      : new THREE.Vector3(0, 2.4, -17);
    transition.elapsed += Math.min(delta, 0.08);
    const duration = entering ? 2.35 : 1.38;
    const t = Math.min(1, transition.elapsed / duration);
    const eased = t * t * (3 - 2 * t);
    camera.position.lerpVectors(transition.position, end, eased);
    looking.current.lerpVectors(transition.look, target, eased);
    camera.lookAt(looking.current);
    if (t >= 1) {
      transition.done = true;
      if (entering) arrival.current();
      else departure.current();
    }
  });
  return null;
}

export default function CampusWorld(props: CampusWorldProps) {
  return (
    <Canvas shadows dpr={[1, 1.6]} gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [0, 9.1, 39.5], fov: 43, near: 0.1, far: 220 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.62;
      }}>
      <color attach="background" args={["#c5b49d"]}/>
      <fog attach="fog" args={["#c5b49d", 48, 125]}/>
      <hemisphereLight args={["#d7e6ff", "#7b5838", 2.1]}/>
      <ambientLight intensity={0.95} color="#ffe3b9"/>
      <directionalLight position={[-18, 29, 17]} intensity={4.2} color="#ffe2b2"
        castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-42}
        shadow-camera-right={42} shadow-camera-top={38} shadow-camera-bottom={-38}
        shadow-bias={-0.0002}/>
      <Landscape/>
      {CAMPUS_DESTINATIONS.map(destination =>
        <CampusBuilding key={destination.id} destination={destination}
          onSelect={props.onSelect} enabled={props.phase === "campus"}/>
      )}
      <CameraDirector phase={props.phase} selectedId={props.selectedId}
        onArrival={props.onArrival} onDeparture={props.onDeparture}/>
    </Canvas>
  );
}
