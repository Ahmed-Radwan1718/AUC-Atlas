"use client";

import { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Instance, Instances, OrbitControls, Sky, Stars } from "@react-three/drei";
import {
  DataTexture,
  Material,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
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

function stoneTexture() {
  // Tiny deterministic mottled material. All texture data is local to /newhome.
  const width = 128;
  const data = new Uint8Array(width * width * 4);
  let seed = 746311;
  for (let index = 0; index < width * width; index++) {
    seed = (1664525 * seed + 1013904223) >>> 0;
    const grain = (seed / 4294967295 - 0.5) * 30;
    const band = Math.sin(Math.floor(index / width) * 0.31) * 5;
    data[index * 4] = Math.max(0, Math.min(255, 220 + grain + band));
    data[index * 4 + 1] = Math.max(0, Math.min(255, 202 + grain + band));
    data[index * 4 + 2] = Math.max(0, Math.min(255, 172 + grain + band));
    data[index * 4 + 3] = 255;
  }
  const texture = new DataTexture(data, width, width);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(3, 2);
  texture.needsUpdate = true;
  return texture;
}

function Solid({
  position, size, material, cast = true,
}: {
  position: Position;
  size: Size;
  material: Material;
  cast?: boolean;
}) {
  return (
    <mesh position={position} material={material} castShadow={cast} receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  );
}

function LibraryBuilding({ night }: { night: boolean }) {
  const texture = useMemo(stoneTexture, []);
  const materials = useMemo(() => ({
    stone: new MeshStandardMaterial({ color: "#fff1d6", map: texture, roughness: 0.92 }),
    darkStone: new MeshStandardMaterial({ color: "#89745c", roughness: 0.9 }),
    trim: new MeshStandardMaterial({ color: "#dac6a6", roughness: 0.9 }),
    roof: new MeshStandardMaterial({ color: "#cabba5", roughness: 0.96 }),
    glass: new MeshPhysicalMaterial({
      color: "#3f6571", roughness: 0.14, metalness: 0.43, clearcoat: 0.7, clearcoatRoughness: 0.14,
    }),
    litGlass: new MeshPhysicalMaterial({
      color: night ? "#c3a270" : "#557681",
      roughness: 0.18, metalness: 0.2, clearcoat: 0.45,
      emissive: night ? "#94744b" : "#000000", emissiveIntensity: night ? 0.32 : 0,
    }),
    frame: new MeshStandardMaterial({ color: "#393e40", roughness: 0.36, metalness: 0.6 }),
    paving: new MeshStandardMaterial({ color: "#dbcbb1", roughness: 0.94 }),
  }), [texture, night]);

  useEffect(() => () => {
    Object.values(materials).forEach((material) => material.dispose());
  }, [materials]);
  useEffect(() => () => { texture.dispose(); }, [texture]);

  const longBays = 28;
  const shortBays = 12;
  const longStep = 90 / longBays;
  const shortStep = 43 / shortBays;

  return (
    // Table 2 specifies a 45° NE orientation. X = east, Z = north for the sun.
    <group rotation={[0, -Math.PI / 4, 0]}>
      {/* 90 m × 43 m structural envelope, garden/plaza and three upper levels. */}
      <Solid position={[0, 0.5, 0]} size={[90, 1, 43]} material={materials.darkStone} />
      <Solid position={[0, 11.5, 0]} size={[88, 21, 41]} material={materials.trim} />
      <Solid position={[0, 23.05, 0]} size={[91, 1.45, 44]} material={materials.roof} />
      <Solid position={[0, 23.95, 0]} size={[93, 0.55, 46]} material={materials.stone} />

      {/* Long plaza-facing facade: deeply recessed mashrabiya-inspired grid. */}
      <Solid position={[0, 11.9, 21.54]} size={[89.4, 21.6, 0.2]} material={materials.glass} />
      <Instances limit={160} material={materials.stone} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        {Array.from({ length: longBays + 1 }, (_, i) => {
          const x = -45 + i * longStep;
          // The entrance tower interrupts the regular facade.
          if (x > 7 && x < 20) return null;
          return <Instance key={"plaza-pier-" + i} position={[x, 12.1, 22.35]}
            scale={[0.75, 22.1, 1.6]} />;
        })}
        {Array.from({ length: 6 }, (_, i) =>
          <Instance key={"plaza-beam-" + i} position={[-0.1, 1.7 + i * 4.15, 22.35]}
            scale={[89.7, 0.77, 1.6]} />
        )}
      </Instances>
      {/* Recessed central entrance slot, vertical glass and stone portal. */}
      <Solid position={[13.5, 12.5, 23.08]} size={[12, 25, 3.4]} material={materials.darkStone} />
      <Solid position={[13.5, 12.2, 24.86]} size={[7.8, 21.9, 0.18]} material={materials.litGlass} />
      <Solid position={[13.5, 12.2, 25.02]} size={[0.17, 22, 0.18]} material={materials.frame} />
      <Solid position={[13.5, 6.7, 25.05]} size={[8.1, 0.22, 0.22]} material={materials.frame} />
      <Solid position={[13.5, 15.2, 25.05]} size={[8.1, 0.22, 0.22]} material={materials.frame} />
      <Solid position={[8.1, 12.7, 25.05]} size={[1.1, 25, 0.6]} material={materials.darkStone} />
      <Solid position={[18.9, 12.7, 25.05]} size={[1.1, 25, 0.6]} material={materials.darkStone} />
      <Solid position={[13.5, 25.0, 24.8]} size={[12.8, 1.1, 4.8]} material={materials.darkStone} />

      {/* Covered colonnade and tall glazing on the opposite long elevation. */}
      <Solid position={[0, 11.4, -21.45]} size={[78, 21.2, 0.2]} material={materials.litGlass} />
      <Solid position={[-39.5, 11.5, -21.6]} size={[11, 22.5, 1.6]} material={materials.stone} />
      <Solid position={[39.5, 11.5, -21.6]} size={[11, 22.5, 1.6]} material={materials.stone} />
      <Solid position={[0, 23.8, -24.8]} size={[84, 1.15, 9]} material={materials.roof} />
      <Instances limit={100} material={materials.trim} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        {Array.from({ length: 23 }, (_, i) =>
          <Instance key={"glass-pier-" + i} position={[-37 + i * 3.36, 11.3, -24.2]}
            scale={[0.66, 22.2, 0.94]} />
        )}
        {Array.from({ length: 5 }, (_, i) =>
          <Instance key={"glass-spandrel-" + i} position={[0, 3.5 + i * 4.4, -23.1]}
            scale={[78, 0.43, 0.75]} />
        )}
      </Instances>
      <Instances limit={30} material={materials.frame} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        {Array.from({ length: 22 }, (_, i) =>
          <Instance key={"mullion-" + i} position={[-36.6 + i * 3.36, 11, -21.81]}
            scale={[0.08, 20, 0.18]} />
        )}
      </Instances>

      {/* The short-end facades and shadowed recessed openings. */}
      <Solid position={[-45, 11.5, 0]} size={[0.2, 22, 42.8]} material={materials.glass} />
      <Solid position={[45, 11.5, 0]} size={[0.2, 22, 42.8]} material={materials.glass} />
      <Instances limit={190} material={materials.stone} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        {[-45.6, 45.6].flatMap((x, side) => [
          ...Array.from({ length: shortBays + 1 }, (_, i) =>
            <Instance key={"end-pier-" + side + "-" + i}
              position={[x, 11.7, -21.5 + i * shortStep]}
              scale={[1.25, 22.2, 0.72]} />
          ),
          ...Array.from({ length: 6 }, (_, i) =>
            <Instance key={"end-beam-" + side + "-" + i}
              position={[x, 1.7 + i * 4.15, 0]}
              scale={[1.25, 0.77, 43]} />
          ),
        ])}
      </Instances>

      {/* Entrance plinth and the unusually deep shaded approach. */}
      <Solid position={[13, 1.35, 28]} size={[23, 2.1, 14]} material={materials.trim} />
      {Array.from({ length: 10 }, (_, i) =>
        <Solid key={"entry-step-" + i}
          position={[13, 0.16 + i * 0.125, 39 - i * 0.82]}
          size={[24, 0.26 + i * 0.25, 0.86]} material={materials.stone} />
      )}
      <Solid position={[13.5, 3.6, 28]} size={[16, 0.6, 13]} material={materials.roof} />
      {[-7, 7].map((offset) =>
        <Solid key={offset} position={[13.5 + offset, 2.7, 32.8]}
          size={[0.9, 5.4, 0.9]} material={materials.stone} />
      )}

      {/* Roofline, parapets, skylight and discrete service masses. */}
      <Solid position={[0, 24.6, 21]} size={[92, 1.7, 1.6]} material={materials.stone} />
      <Solid position={[0, 24.6, -21]} size={[92, 1.7, 1.6]} material={materials.stone} />
      <Solid position={[-45, 24.6, 0]} size={[1.4, 1.7, 42]} material={materials.stone} />
      <Solid position={[45, 24.6, 0]} size={[1.4, 1.7, 42]} material={materials.stone} />
      <Solid position={[-15, 25.1, -1]} size={[31, 1.5, 11]} material={materials.glass} />
      <Solid position={[-15, 26.1, -1]} size={[31.9, 0.38, 11.9]} material={materials.frame} />
      <Solid position={[30, 25.4, 4]} size={[12, 1.9, 10]} material={materials.roof} />

      {/* No other buildings: a limited stone forecourt only. */}
      <Solid position={[0, -0.18, 38]} size={[112, 0.35, 38]}
        material={materials.paving} cast={false} />
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
        shadow-mapSize={[2048, 2048]}
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
          dpr={[1, 1.65]}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          fallback={<p className={styles.fallback}>WebGL is required for the 3D library preview.</p>}
        >
          <Scene light={light} />
        </Canvas>
      </div>

      <section className={styles.intro} aria-label="Building information">
        <span className={styles.kicker}>AUC ATLAS · CAMPUS EXPERIMENT 01</span>
        <h1>AUC Library</h1>
        <p>A source-informed, interactive 3D reconstruction of the New Cairo Library.</p>
        <div className={styles.meta}>
          <span>90 × 43 m footprint</span><span>Five levels</span><span>45° NE</span>
        </div>
        <p className={styles.experimental}>First-pass geometry. Facade details and roof forms are still being calibrated against photographs and architectural drawings.</p>
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
