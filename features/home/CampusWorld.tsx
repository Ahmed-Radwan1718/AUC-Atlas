"use client";

import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";

export type CampusDestinationId = "engineering" | "business" | "library" | "sciences" | "humanities";
export type CampusPhase = "campus" | "approaching" | "inside" | "leaving";

export const CAMPUS_DESTINATIONS: {
  id: CampusDestinationId; name: string; short: string; number: string;
}[] = [
  { id: "engineering", name: "Engineering", short: "Engineering", number: "01" },
  { id: "business", name: "Business", short: "Business", number: "02" },
  { id: "library", name: "Library", short: "Library", number: "03" },
  { id: "sciences", name: "Sciences", short: "Sciences", number: "04" },
  { id: "humanities", name: "Humanities & Social Sciences", short: "Humanities", number: "05" }
];

type CampusWorldProps = {
  phase: CampusPhase;
  selectedId: CampusDestinationId | null;
  onSelect: (id: CampusDestinationId) => void;
  onArrival: () => void;
  onDeparture: () => void;
};

// A real textured photogrammetry scan, not a procedurally generated building.
// IMPORTANT: the source model is a building in Minnesota, NOT an AUC building.
// Attribution: Matt1up/drone-building-scans (CC BY 4.0), see /homenew.
function ScannedBuilding({ onSelect, enabled }: {
  onSelect: (id: CampusDestinationId) => void; enabled: boolean;
}) {
  const { scene: source } = useGLTF("/homenew/model");
  const { scene, position, scale, height } = useMemo(() => {
    const cloned = source.clone(true);
    const bounds = new THREE.Box3().setFromObject(cloned);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const normalizedScale = 25 / Math.max(size.x, size.z, 0.001);

    // Photogrammetry can have an arbitrary origin and dimensions. Normalize
    // automatically so the first frame never starts inside an imported mesh.
    cloned.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.receiveShadow = true;
        child.castShadow = false; // baked scan shadows; avoid costly shadow pass
      }
    });
    return {
      scene: cloned,
      position: [
        -center.x * normalizedScale,
        -bounds.min.y * normalizedScale,
        -center.z * normalizedScale
      ] as [number, number, number],
      scale: normalizedScale,
      height: size.y * normalizedScale
    };
  }, [source]);

  return (
    <group position={[0, 0, -7.5]}>
      <group onClick={event => {
        if (!enabled) return;
        event.stopPropagation();
        onSelect("engineering");
      }} onPointerOver={() => {
        if (enabled) document.body.style.cursor = "pointer";
      }} onPointerOut={() => { document.body.style.cursor = ""; }}>
        <primitive object={scene} position={position} scale={scale} dispose={null} />
      </group>
      {enabled && (
        <Html position={[0, Math.min(height + 2.5, 9), 0]} center
          distanceFactor={30} zIndexRange={[15, 0]}>
          <button type="button" className="cinema-scan-hotspot"
            onClick={() => onSelect("engineering")}>
            <span className="cinema-scan-hotspot-dot" aria-hidden="true"/>
            EXPLORE THE 3D MODEL <span aria-hidden="true">↗</span>
          </button>
        </Html>
      )}
    </group>
  );
}

class ModelErrorBoundary extends Component<
  { children: ReactNode }, { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <Html center position={[0, 4, -7]}>
      <div className="cinema-scan-error" role="status">
        The scanned model could not load. You can still select a school below.
      </div>
    </Html>;
    return this.props.children;
  }
}

function ModelPending() {
  return <Html center position={[0, 4, -7]}>
    <div className="cinema-scan-loading" role="status">
      <span className="cinema-scan-loading-mark" aria-hidden="true"/>
      LOADING REAL-WORLD PHOTOGRAMMETRY…
    </div>
  </Html>;
}

function Ground() {
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, -7.5]} receiveShadow>
      <planeGeometry args={[250, 250]}/>
      <meshStandardMaterial color="#7f8579" roughness={1}/>
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.10, -7.5]}>
      <circleGeometry args={[33, 64]}/>
      <meshStandardMaterial color="#928e78" roughness={1}/>
    </mesh>
  </>;
}

function CameraDirector({ phase, selectedId, onArrival, onDeparture }:
  Omit<CampusWorldProps, "onSelect">) {
  const { camera } = useThree();
  const looking = useRef(new THREE.Vector3(0, 2.4, -7.5));
  const start = useRef<{
    position: THREE.Vector3; look: THREE.Vector3; elapsed: number; completed: boolean;
  } | null>(null);
  const onArrivalRef = useRef(onArrival);
  const onDepartureRef = useRef(onDeparture);
  const reducedMotion = useRef(false);

  useEffect(() => {
    onArrivalRef.current = onArrival;
    onDepartureRef.current = onDeparture;
  }, [onArrival, onDeparture]);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (phase === "approaching" || phase === "leaving") {
      start.current = {
        position: camera.position.clone(),
        look: looking.current.clone(),
        elapsed: 0,
        completed: false
      };
    } else {
      start.current = null;
    }
  }, [phase, selectedId, camera]);

  useFrame((state, delta) => {
    if (phase === "campus") {
      const desired = new THREE.Vector3(
        state.pointer.x * 1.7, 10.5 + state.pointer.y * 0.55, 31.5
      );
      camera.position.lerp(desired, Math.min(1, delta * 0.8));
      looking.current.lerp(
        new THREE.Vector3(state.pointer.x * 0.3, 2.5, -7.5),
        Math.min(1, delta * 0.9)
      );
      camera.lookAt(looking.current);
      return;
    }
    if (phase === "inside" || !start.current || start.current.completed) return;

    const transition = start.current;
    const entering = phase === "approaching";
    const index = CAMPUS_DESTINATIONS.findIndex(item => item.id === selectedId);
    const destinations: [number, number, number][] = [
      [-5, 4.6, 9.7], [3.6, 5.5, 10.5], [0, 6.1, 11.5],
      [5.1, 5.1, 11], [-4.5, 5.6, 12]
    ];
    const end = entering
      ? new THREE.Vector3(...destinations[Math.max(0, index)])
      : new THREE.Vector3(0, 10.5, 31.5);
    const target = entering
      ? new THREE.Vector3(0, 2.1, -7.5)
      : new THREE.Vector3(0, 2.5, -7.5);
    transition.elapsed += Math.min(delta, 0.1);
    const duration = reducedMotion.current ? 0.01 : (entering ? 2.5 : 1.4);
    const t = Math.min(1, transition.elapsed / duration);
    const eased = t * t * (3 - 2 * t);
    camera.position.lerpVectors(transition.position, end, eased);
    looking.current.lerpVectors(transition.look, target, eased);
    camera.lookAt(looking.current);
    if (t >= 1) {
      transition.completed = true;
      if (entering) onArrivalRef.current();
      else onDepartureRef.current();
    }
  });
  return null;
}

export default function CampusWorld(props: CampusWorldProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [0, 10.5, 31.5], fov: 42, near: 0.05, far: 220 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.22;
      }}
    >
      <color attach="background" args={["#bac6c6"]}/>
      <fog attach="fog" args={["#bac6c6", 65, 125]}/>
      <hemisphereLight args={["#e8f0ff", "#a58e78", 1.65]}/>
      <ambientLight intensity={0.72} color="#fff2e3"/>
      <directionalLight position={[-25, 32, 19]} intensity={2.6} color="#ffe8ca"/>
      <Ground/>
      <ModelErrorBoundary>
        <Suspense fallback={<ModelPending/>}>
          <ScannedBuilding enabled={props.phase === "campus"} onSelect={props.onSelect}/>
        </Suspense>
      </ModelErrorBoundary>
      <CameraDirector phase={props.phase} selectedId={props.selectedId}
        onArrival={props.onArrival} onDeparture={props.onDeparture}/>
    </Canvas>
  );
}
