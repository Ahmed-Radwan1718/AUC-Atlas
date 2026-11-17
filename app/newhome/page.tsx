"use client";

import { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Instance, Instances, OrbitControls, Sky, Stars } from "@react-three/drei";
import {
  Material,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  Shape,
  Path,
  ExtrudeGeometry,
  TextureLoader,
  Texture,
  DoubleSide,
  ACESFilmicToneMapping,
  PCFSoftShadowMap,
  SRGBColorSpace,
} from "three";
import styles from "./newhome.module.css";

/**
 * AUC Atlas /newhome — isolated experimental scene.
 *
 * Library reference geometry:
 * El-Khouly et al. (2026), Table 2, DOI: 10.1108/ARCH-01-2026-0068
 * Five levels; 90 x 43 m footprint; area 3,870 m²;
 * coordinates 30°01'12"N, 31°30'01"E; orientation 45° NE.
 *
 * Facade interpretation cross-checked against Perkins Eastman's photographs.
 * This is a source-informed exterior reconstruction, NOT an imported BIM model
 * or a claim that every opening and setback is survey-accurate.
 */
const LAT = 30 + 1 / 60 + 12 / 3600;
const LON = 31 + 30 / 60 + 1 / 3600;
const DEG = Math.PI / 180;

type Position = [number, number, number];
type Size = [number, number, number];
type SceneLight = {
  sun: Position;
  moon: Position;
  altitude: number;
  moonAltitude: number;
  illuminated: number;
  phase: number;
};

function positiveAngle(degrees: number) {
  return ((degrees % 360) + 360) % 360;
}

function skyCoordinates(rightAscension: number, declination: number, jd: number) {
  const t = (jd - 2451545) / 36525;
  const sidereal = positiveAngle(
    280.46061837 + 360.98564736629 * (jd - 2451545) +
    0.000387933 * t * t - (t * t * t) / 38710000 + LON
  ) * DEG;
  const hourAngle = sidereal - rightAscension;
  const latitude = LAT * DEG;
  const altitude = Math.asin(
    Math.sin(latitude) * Math.sin(declination) +
    Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle)
  );
  // Azimuth clockwise from geographic north.
  const azimuth = Math.atan2(
    Math.sin(hourAngle),
    Math.cos(hourAngle) * Math.sin(latitude) -
    Math.tan(declination) * Math.cos(latitude)
  ) + Math.PI;
  const distance = 145;
  return {
    altitude,
    position: [
      distance * Math.cos(altitude) * Math.sin(azimuth),
      distance * Math.sin(altitude),
      distance * Math.cos(altitude) * Math.cos(azimuth),
    ] as Position,
  };
}

function celestialState(date: Date): SceneLight {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const t = (jd - 2451545) / 36525;
  const meanLongitude = positiveAngle(280.46646 + t * (36000.76983 + 0.0003032 * t));
  const anomaly = positiveAngle(357.52911 + t * (35999.05029 - 0.0001537 * t));
  const m = anomaly * DEG;
  const correction =
    (1.914602 - t * (0.004817 + 0.000014 * t)) * Math.sin(m) +
    (0.019993 - 0.000101 * t) * Math.sin(2 * m) +
    0.000289 * Math.sin(3 * m);
  const omega = (125.04 - 1934.136 * t) * DEG;
  const solarLongitude = (meanLongitude + correction - 0.00569 - 0.00478 * Math.sin(omega)) * DEG;
  const obliquity =
    (23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - 0.001813 * t))) / 60) / 60 +
    0.00256 * Math.cos(omega)) * DEG;
  const solarRA = Math.atan2(Math.cos(obliquity) * Math.sin(solarLongitude), Math.cos(solarLongitude));
  const solarDec = Math.asin(Math.sin(obliquity) * Math.sin(solarLongitude));
  const sun = skyCoordinates(solarRA, solarDec, jd);

  // Low-precision lunar orbit: actual sky position, not a decorative fixed moon.
  const d = jd - 2451543.5;
  const node = positiveAngle(125.1228 - 0.0529538083 * d) * DEG;
  const inclination = 5.1454 * DEG;
  const periapsis = positiveAngle(318.0634 + 0.1643573223 * d) * DEG;
  const lunarM = positiveAngle(115.3654 + 13.0649929509 * d) * DEG;
  const eccentricity = 0.0549;
  const eccentricAnomaly = lunarM +
    eccentricity * Math.sin(lunarM) * (1 + eccentricity * Math.cos(lunarM));
  const xv = 60.2666 * (Math.cos(eccentricAnomaly) - eccentricity);
  const yv = 60.2666 * Math.sqrt(1 - eccentricity * eccentricity) * Math.sin(eccentricAnomaly);
  const trueAnomaly = Math.atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  const argument = trueAnomaly + periapsis;
  const x = r * (Math.cos(node) * Math.cos(argument) -
    Math.sin(node) * Math.sin(argument) * Math.cos(inclination));
  const y = r * (Math.sin(node) * Math.cos(argument) +
    Math.cos(node) * Math.sin(argument) * Math.cos(inclination));
  const z = r * Math.sin(argument) * Math.sin(inclination);
  const lunarRA = Math.atan2(y * Math.cos(obliquity) - z * Math.sin(obliquity), x);
  const lunarDec = Math.atan2(
    y * Math.sin(obliquity) + z * Math.cos(obliquity),
    Math.sqrt(x * x + (y * Math.cos(obliquity) - z * Math.sin(obliquity)) ** 2)
  );
  const moon = skyCoordinates(lunarRA, lunarDec, jd);

  // Synodic phase referenced to the 6 January 2000 new moon (approximation).
  const synodic = 29.530588853;
  const daysSinceNew = (date.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000;
  const phase = ((daysSinceNew / synodic) % 1 + 1) % 1;
  return {
    sun: sun.position,
    moon: moon.position,
    altitude: sun.altitude / DEG,
    moonAltitude: moon.altitude / DEG,
    illuminated: (1 - Math.cos(2 * Math.PI * phase)) / 2,
    phase,
  };
}

function cairoParts(date: Date) {
  const fields = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).formatToParts(date);
  const value = (part: string) => fields.find((item) => item.type === part)?.value || "";
  const hour = Number(value("hour"));
  const minute = Number(value("minute"));
  return {
    time: value("hour") + ":" + value("minute"),
    day: value("weekday") + ", " + value("day") + " " + value("month"),
    decimalHour: hour + minute / 60,
  };
}

function phaseName(phase: number) {
  if (phase < 0.035 || phase > 0.965) return "New moon";
  if (phase < 0.215) return "Waxing crescent";
  if (phase < 0.285) return "First quarter";
  if (phase < 0.465) return "Waxing gibbous";
  if (phase < 0.535) return "Full moon";
  if (phase < 0.715) return "Waning gibbous";
  if (phase < 0.785) return "Last quarter";
  return "Waning crescent";
}


/** CC0 photographic material maps: polyhaven.com/a/old_sandstone_02
 * and polyhaven.com/a/stone_tile_wall. Image delivery is CDN-backed;
 * if the network is unavailable, the scene falls back to stone PBR colors. */
const PBR_ROOT = "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/";

function Solid({ position, size, material, cast = true }: {
  position: Position; size: Size; material: Material; cast?: boolean;
}) {
  return <mesh position={position} material={material} castShadow={cast} receiveShadow>
    <boxGeometry args={size} />
  </mesh>;
}

function elevationGeometry(width: number, columns: number) {
  const s = new Shape();
  const height = 23.5;
  s.moveTo(-width / 2, 0);
  s.lineTo(width / 2, 0);
  s.lineTo(width / 2, height);
  s.lineTo(-width / 2, height);
  s.closePath();
  const bay = width / columns;
  for (let col = 0; col < columns; col++) {
    const x = -width / 2 + bay * (col + 0.5);
    for (let row = 0; row < 7; row++) {
      const topRow = row === 6;
      const bottom = topRow ? 22.25 : 0.8 + row * 3.35;
      const top = bottom + (topRow ? 0.55 : 2.22);
      const half = bay * (topRow ? 0.23 : 0.355);
      const hole = new Path();
      hole.moveTo(x - half, bottom);
      hole.lineTo(x - half, top);
      hole.lineTo(x + half, top);
      hole.lineTo(x + half, bottom);
      hole.closePath();
      s.holes.push(hole);
    }
  }
  const geometry = new ExtrudeGeometry(s, {
    depth: 1.6, steps: 1, bevelEnabled: true,
    bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2,
  });
  geometry.computeVertexNormals();
  return geometry;
}

function PiercedFacade({ position, width, columns, material }: {
  position: Position; width: number; columns: number; material: Material;
}) {
  const geometry = useMemo(() => elevationGeometry(width, columns), [width, columns]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh position={position} geometry={geometry}
    material={material} castShadow receiveShadow />;
}

function LibraryBuilding({ night }: { night: boolean }) {
  const m = useMemo(() => ({
    screen: new MeshStandardMaterial({ color: "#e0c7a3", roughness: 0.9 }),
    stone: new MeshStandardMaterial({ color: "#dcc5a6", roughness: 0.88 }),
    darkStone: new MeshStandardMaterial({ color: "#917463", roughness: 0.87 }),
    roof: new MeshStandardMaterial({ color: "#bba78b", roughness: 0.95 }),
    shadow: new MeshStandardMaterial({ color: "#71685a", roughness: 0.92 }),
    paving: new MeshStandardMaterial({ color: "#d6c8b0", roughness: 0.94 }),
    frame: new MeshStandardMaterial({ color: "#33454b", metalness: 0.7, roughness: 0.3 }),
    glass: new MeshPhysicalMaterial({
      color: "#7291a0", roughness: 0.13, metalness: 0.3, clearcoat: 0.9,
      transparent: true, opacity: 0.76, side: DoubleSide, depthWrite: false,
    }),
    reflection: new MeshPhysicalMaterial({
      color: "#accbd3", roughness: 0.07, metalness: 0.2, clearcoat: 1,
      transparent: true, opacity: 0.12, side: DoubleSide, depthWrite: false,
    }),
    interior: new MeshStandardMaterial({
      color: "#7b6655", roughness: 0.8, emissive: "#eab76d",
      emissiveIntensity: 0.1,
    }),
  }), []);

  useEffect(() => {
    m.interior.emissiveIntensity = night ? 1.05 : 0.12;
    m.glass.color.set(night ? "#a4937a" : "#7291a0");
  }, [m, night]);

  useEffect(() => {
    const loader = new TextureLoader();
    let alive = true;
    const loaded: Texture[] = [];
    const load = (name: string, tiling: [number, number], target: MeshStandardMaterial,
      kind: "map" | "normalMap") => {
      loader.load(PBR_ROOT + name, (texture) => {
        if (!alive) { texture.dispose(); return; }
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        texture.repeat.set(tiling[0], tiling[1]);
        texture.anisotropy = 8;
        if (kind === "map") texture.colorSpace = SRGBColorSpace;
        texture.needsUpdate = true;
        target[kind] = texture;
        if (kind === "normalMap") target.normalScale.set(0.22, 0.22);
        target.needsUpdate = true;
        loaded.push(texture);
      }, undefined, () => { /* Retain fallback if CDN cannot be reached. */ });
    };
    load("old_sandstone_02/old_sandstone_02_diff_2k.jpg", [0.21, 0.21], m.screen, "map");
    load("old_sandstone_02/old_sandstone_02_nor_gl_2k.jpg", [0.21, 0.21], m.screen, "normalMap");
    load("stone_tile_wall/stone_tile_wall_diff_2k.jpg", [3, 2], m.stone, "map");
    load("stone_tile_wall/stone_tile_wall_nor_gl_2k.jpg", [3, 2], m.stone, "normalMap");
    return () => {
      alive = false;
      loaded.forEach((texture) => texture.dispose());
    };
  }, [m]);
  useEffect(() => () => Object.values(m).forEach((mat) => mat.dispose()), [m]);

  return (
    <group rotation={[0, -Math.PI / 4, 0]}>
      {/* The original placeholder block is replaced by separate structural layers,
          so the 1.6-meter-deep screen opens into a real glass setback. */}
      <Solid position={[0, 0.6, 0]} size={[90, 1.2, 43]} material={m.darkStone} />
      {[5.7, 11, 16.4, 21.6].map((y) =>
        <Solid key={"slab-" + y} position={[0, y, -1]}
          size={[87, 0.42, 39]} material={m.roof} />
      )}
      {/* Stone and glazing behind genuinely perforated long eastern facade. */}
      <Solid position={[0, 12.3, 18.6]} size={[88.3, 22.4, 0.3]}
        material={m.interior} />
      <Solid position={[0, 12.3, 21.4]} size={[87.9, 22.4, 0.12]}
        material={m.glass} cast={false} />
      <PiercedFacade position={[-18.5, 1.1, 21.5]} width={53} columns={24}
        material={m.screen} />
      <PiercedFacade position={[32.5, 1.1, 21.5]} width={25} columns={11}
        material={m.screen} />

      {/* Real-life landmark: recessed, full-height monumental entrance framed
          in darker stone, rather than a tiny rectangular front door. */}
      <Solid position={[14, 13.75, 22.6]} size={[12.7, 27.5, 5.3]}
        material={m.darkStone} />
      <Solid position={[14, 12.5, 25.35]} size={[8.5, 23.2, 0.17]}
        material={m.glass} cast={false} />
      {[-5.0, 5.0].map((x) =>
        <Solid key={"portal-pier" + x} position={[14 + x, 13.7, 25.6]}
          size={[1.2, 27.4, 1.0]} material={m.stone} />
      )}
      <Solid position={[14, 27, 25.6]} size={[11.8, 1.25, 1.0]}
        material={m.stone} />
      {[-3.1, -1.5, 0, 1.5, 3.1].map((x) =>
        <Solid key={"entrance-mullion" + x} position={[14 + x, 12.4, 25.52]}
          size={[0.085, 22.5, 0.15]} material={m.frame} />
      )}
      {[5.2, 10, 14.8, 19.6].map((y) =>
        <Solid key={"entrance-transom" + y} position={[14, y, 25.55]}
          size={[8.4, 0.1, 0.14]} material={m.frame} />
      )}

      {/* The opposite elevation is an expansive three-story reading-room
          curtain wall with a substantial projecting roof and stone columns. */}
      <Solid position={[-7, 12.2, -21.2]} size={[74, 22.8, 0.28]}
        material={m.interior} />
      <Solid position={[-7, 12.2, -21.55]} size={[74, 22.8, 0.13]}
        material={m.glass} cast={false} />
      <Solid position={[-7, 12.2, -21.72]} size={[74, 22.8, 0.08]}
        material={m.reflection} cast={false} />
      <Solid position={[-7, 25, -24.8]} size={[76.5, 2.3, 12.5]}
        material={m.stone} />
      <Solid position={[-7, 23.75, -26.2]} size={[76, 0.28, 8.4]}
        material={m.roof} />
      <Instances limit={28} material={m.stone} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        {Array.from({ length: 18 }, (_, i) =>
          <Instance key={i} position={[-42 + i * 4.06, 12.2, -24.1]}
            scale={[1.1, 24.4, 1.7]} />
        )}
      </Instances>
      <Instances limit={55} material={m.frame} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        {Array.from({ length: 18 }, (_, i) =>
          <Instance key={"m" + i} position={[-40 + i * 4.06, 12.1, -21.79]}
            scale={[0.085, 21.3, 0.13]} />
        )}
        {[5, 10, 15, 20].map((y) =>
          <Instance key={"t" + y} position={[-7, y, -21.8]}
            scale={[73.5, 0.12, 0.13]} />
        )}
      </Instances>
      {/* Interior silhouette visible through reflective glass. */}
      {[-34, -22, -10, 2, 14].map((x) =>
        [7, 12.5, 18].map((y) =>
          <Solid key={"shelf" + x + ":" + y} position={[x, y, -19.4]}
            size={[4.3, 2.5, 0.7]} material={m.interior} />
        )
      )}

      {/* Horizontally banded stone mass on the glass elevation's far end. */}
      <Solid position={[37, 13.2, -22]} size={[16, 26.4, 2.8]}
        material={m.darkStone} />
      {Array.from({ length: 22 }, (_, i) =>
        <Solid key={"stripe" + i} position={[37, 0.7 + i * 1.18, -23.5]}
          size={[16.4, i % 2 ? 0.35 : 0.58, 0.15]}
          material={i % 2 ? m.roof : m.stone} />
      )}
      {[30.7, 34.5, 38.4].map((x) =>
        <Solid key={"slot" + x} position={[x, 14, -23.67]}
          size={[0.85, 10, 0.13]} material={m.frame} />
      )}

      {/* Side elevations, recessed dark glazing and thick vertical fins. */}
      {[-44.4, 44.4].map((x) =>
        <Solid key={"side" + x} position={[x, 12.2, 0]}
          size={[0.4, 23, 42.5]} material={m.stone} />
      )}
      {[-45, 45].map((x) =>
        [-17, -9, -1, 7, 15].map((z) =>
          <Solid key={"sidefin" + x + "," + z}
            position={[x, 12.2, z]} size={[1.1, 23, 1.2]}
            material={m.stone} />
        )
      )}

      {/* Broad stepped entry and the deep, coffered portico. */}
      <Solid position={[14, 2.1, 30]} size={[19, 0.75, 11]}
        material={m.stone} />
      {Array.from({ length: 15 }, (_, i) =>
        <Solid key={"step" + i} position={[14, 0.17 + i * 0.13, 42 - i * 0.65]}
          size={[19, 0.35, 0.7]} material={m.stone} />
      )}
      <Solid position={[14, 5.2, 32.8]} size={[20, 0.8, 12.7]}
        material={m.roof} />
      {[-8, 8].map((x) =>
        <Solid key={"portico" + x} position={[14 + x, 2.5, 37]}
          size={[1.2, 5, 1.2]} material={m.stone} />
      )}
      {Array.from({ length: 11 }, (_, i) =>
        <Solid key={"coffer" + i} position={[5 + i * 1.8, 4.75, 32.6]}
          size={[0.18, 0.17, 10]} material={m.darkStone} />
      )}

      {/* Roof level, parapets, and modest raised service mass. */}
      <Solid position={[0, 24.1, 0]} size={[90, 1.2, 43]}
        material={m.roof} />
      {[-21, 21].map((z) =>
        <Solid key={"parapet" + z} position={[0, 25.2, z]}
          size={[91, 1.5, 1.4]} material={m.stone} />
      )}
      {[-44.6, 44.6].map((x) =>
        <Solid key={"parapet2" + x} position={[x, 25.2, 0]}
          size={[1.1, 1.5, 41]} material={m.stone} />
      )}
      <Solid position={[-20, 26.5, 0]} size={[19, 3.5, 10]}
        material={m.darkStone} />

      {/* Only the library and immediate ground plane. */}
      <Solid position={[0, -0.18, 27]} size={[117, 0.33, 84]}
        material={m.paving} cast={false} />
    </group>
  );
}

function Scene({ light }: { light: SceneLight }) {
  const night = light.altitude < -5;
  const twilight = light.altitude < 7;
  const daylight = Math.max(0, Math.min(1, (light.altitude + 6) / 16));
  const lightPower = Math.max(0, Math.sin(Math.max(0, light.altitude) * DEG)) * 3.1;

  return (
    <>
      <color attach="background" args={[night ? "#0b1627" : twilight ? "#a6a7ab" : "#c4deea"]} />
      <fog attach="fog" args={[night ? "#101b2b" : twilight ? "#c7bbb0" : "#dfd7c7", 160, 340]} />
      {!night && <Sky
        sunPosition={light.sun}
        distance={450000}
        turbidity={3.6}
        rayleigh={twilight ? 2.5 : 1.1}
        mieCoefficient={0.004}
        mieDirectionalG={0.83}
      />}
      {night && <Stars radius={220} depth={80} count={1300} factor={3} saturation={0} fade speed={0} />}
      {night && light.moonAltitude > 1 && (
        <mesh position={light.moon}>
          <sphereGeometry args={[2.2, 24, 24]} />
          <meshBasicMaterial color={light.illuminated < 0.1 ? "#525a67" : "#e9e9dc"} />
        </mesh>
      )}
      <hemisphereLight
        args={[night ? "#6c7d9c" : "#e2edfa", "#927b60", night ? 0.36 : 0.74 + 0.25 * daylight]}
      />
      <ambientLight intensity={night ? 0.16 : 0.24} />
      <directionalLight
        position={light.sun}
        intensity={lightPower}
        color={twilight ? "#ffcc9a" : "#fff6e5"}
        castShadow={light.altitude > 0}
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-90}
        shadow-camera-right={90}
        shadow-camera-top={90}
        shadow-camera-bottom={-90}
        shadow-camera-near={5}
        shadow-camera-far={350}
        shadow-bias={-0.00012}
      />
      {night && <directionalLight position={light.moon} intensity={0.2}
        color="#99b3da" />}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.48, 0]} receiveShadow>
        <planeGeometry args={[450, 450]} />
        <meshStandardMaterial color={night ? "#5c5b56" : "#c7b89d"} roughness={1} />
      </mesh>
      <LibraryBuilding night={night} />
      <OrbitControls
        makeDefault
        target={[0, 12, 0]}
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
        minDistance={57}
        maxDistance={175}
        minPolarAngle={0.24}
        maxPolarAngle={1.44}
        rotateSpeed={0.55}
        zoomSpeed={0.75}
      />
    </>
  );
}

export default function NewHomePage() {
  const [clock, setClock] = useState(() => new Date());
  const [manualHour, setManualHour] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const liveCairo = cairoParts(clock);
  const renderedDate = manualHour === null
    ? clock
    : new Date(clock.getTime() + (manualHour - liveCairo.decimalHour) * 3600000);
  const viewingCairo = cairoParts(renderedDate);
  const light = useMemo(() => celestialState(renderedDate), [renderedDate.getTime()]);
  const isNight = light.altitude < -5;

  return (
    <main className={styles.page} aria-label="AUC Atlas experimental 3D campus homepage">
      <div className={styles.scene} aria-label="Interactive model of the AUC New Cairo Library">
        <Canvas
          shadows
          camera={{ position: [78, 58, 82], fov: 47, near: 0.5, far: 750 }}
          dpr={[1, 1.85]}
          onCreated={({ gl }) => {
            gl.toneMapping = ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.15;
            gl.shadowMap.type = PCFSoftShadowMap;
          }}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          fallback={<p className={styles.fallback}>WebGL is required for the 3D library preview.</p>}
        >
          <Scene light={light} />
        </Canvas>
      </div>

      <section className={styles.intro} aria-label="Building information">
        <span className={styles.kicker}>AUC ATLAS · CAMPUS EXPERIMENT 01</span>
        <h1>AUC Library</h1>
        <p>Interactive architectural reconstruction based on the Library's actual exterior.</p>
        <div className={styles.meta}>
          <span>90 × 43 m footprint</span><span>Five levels</span><span>45° NE</span>
        </div>
        <p className={styles.experimental}>In progress: deep facade openings, photographic stone materials, and glass detail. Not an official BIM model or photogrammetry scan.</p>
      </section>

      <div className={styles.dragTip} aria-hidden="true">Drag to orbit <span>·</span> Scroll to zoom</div>

      <section className={styles.environment} aria-label="Cairo environmental lighting">
        <div className={styles.environmentHeader}>
          <div>
            <span className={styles.kicker}>CAIRO SKY · {manualHour === null ? "LIVE" : "PREVIEW"}</span>
            <strong>{viewingCairo.time}</strong>
            <small>{viewingCairo.day} · {isNight ? "Night" : light.altitude < 4 ? "Twilight" : "Daylight"}</small>
          </div>
          {manualHour !== null && (
            <button type="button" className={styles.liveButton} onClick={() => setManualHour(null)}>
              Return to live
            </button>
          )}
        </div>
        <label htmlFor="library-time" className={styles.sliderLabel}>
          <span>Explore time of day</span>
          <span>{manualHour === null ? "Following Cairo" : "Manual preview"}</span>
        </label>
        <input
          id="library-time"
          className={styles.slider}
          type="range"
          min="0"
          max="23.75"
          step="0.25"
          value={manualHour ?? liveCairo.decimalHour}
          onChange={(event) => setManualHour(Number(event.target.value))}
          aria-label="Preview Cairo time of day"
        />
        <div className={styles.timeTicks}><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div>
        <p className={styles.moon}>
          <span>{phaseName(light.phase)} · ~{Math.round(light.illuminated * 100)}% illuminated</span>
          <span>Sun {Math.round(light.altitude)}°</span>
        </p>
      </section>

      <aside className={styles.sources}>
        Geometry: <a href="https://doi.org/10.1108/ARCH-01-2026-0068" target="_blank" rel="noopener noreferrer">El-Khouly et al. (2026), Table 2</a>
        <span> · </span>
        Facade reference: <a href="https://www.perkinseastman.com/projects/the-american-university-in-cairo-library/" target="_blank" rel="noopener noreferrer">Perkins Eastman</a>
      </aside>
    </main>
  );
}
