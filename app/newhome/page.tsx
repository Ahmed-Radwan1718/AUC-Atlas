"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, Sky, Stars } from "@react-three/drei";
import {
  ACESFilmicToneMapping, CatmullRomCurve3, Color, DoubleSide, MathUtils, Mesh,
  MeshStandardMaterial, PointLight, Group,
  PCFSoftShadowMap, Shape, Vector3, BufferGeometry, Float32BufferAttribute, OrthographicCamera,
} from "three";
import styles from "./newhome.module.css";
import MajorWheel from "./major-wheel";
import type { SchoolId } from "./wheel-data";
import NightBloom, { FacadeLights, WindowHalo } from "./night-bloom";

/**
 * AUC Atlas — original four-building architectural diorama.
 * Custom-designed buildings (not representations of actual AUC footprints).
 * Isolated within /newhome. Cairo solar position is computed below.
 */
const LAT = 30 + 1 / 60 + 12 / 3600;
const LON = 31 + 30 / 60 + 1 / 3600;
const DEG = Math.PI / 180;
type Position = [number, number, number];
type SceneLight = {
  sun: Position; moon: Position; altitude: number; moonAltitude: number;
  illuminated: number; phase: number;
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




type BuildingId = "library" | "business" | "sse" | "humanities";
// The site uses four independent precincts arranged around a connected walkway network.
// Entrance elevations face +Z; the walkway stubs terminate immediately in front of them.
const SITE_POSITIONS: Record<BuildingId, Position> = {
  business: [-94,0,-77],
  sse: [92,0,-77],
  library: [-94,0,85],
  humanities: [92,0,85],
};
const PLAZA_Z = 20;
const BUILDINGS: {id: BuildingId; name: string; description: string; location: Position}[] = [
  {id:"library", name:"Library", description:"Explore all courses, study resources and uploaded materials.", location:SITE_POSITIONS.library},
  {id:"business", name:"School of Business", description:"Business, economics, accounting, finance and related majors.", location:SITE_POSITIONS.business},
  {id:"sse", name:"School of Sciences & Engineering", description:"Engineering, computer science, sciences and technology.", location:SITE_POSITIONS.sse},
  {id:"humanities", name:"Humanities & Social Sciences", description:"Arts, languages, politics, psychology and the social sciences.", location:SITE_POSITIONS.humanities},
];

// Hover animation state lives in the 3D scene rather than React state: no
// React rerendering per frame and no interference with OrbitControls.
// Progress drives a small rise, ground-level selection ring and window wave.
type BuildingHoverMotion = {
  target: number;
  progress: number;
  elapsed: number;
};
const BuildingHoverContext = createContext<{current: BuildingHoverMotion} | null>(null);
const DAY_GLASS = new Color("#688a97");
const DAY_GLASS_HOVER = new Color("#9ac3cc");
const NIGHT_GLASS = new Color("#9c6539");
const NIGHT_GLASS_HOVER = new Color("#ce9b5c");
const ARCH_DAY = new Color("#6f96a4");
const ARCH_DAY_HOVER = new Color("#abd0d7");
const ARCH_NIGHT = new Color("#a97144");
const ARCH_NIGHT_HOVER = new Color("#cf9b61");

function hoverWave(state: BuildingHoverMotion | null, height: number, x: number) {
  if (!state || state.progress < 0.001) return 0;
  // Floors brighten from the bottom up, with a slight lateral stagger.
  const delay = 0.06 + MathUtils.clamp(height / 31, 0, 1) * 0.30 +
    Math.abs(x) * 0.004;
  return state.progress * MathUtils.smoothstep(state.elapsed, delay, delay + 0.26);
}

function Block({position,size,color="#e1d1b7",emissive,emissiveIntensity=0,roughness=0.85,metalness=0,cast=true}:{
  position:Position;size:Position;color?:string;emissive?:string;emissiveIntensity?:number;roughness?:number;metalness?:number;cast?:boolean;
}){
  return <mesh position={position} castShadow={cast} receiveShadow>
    <boxGeometry args={size}/>
    <meshStandardMaterial color={color} roughness={roughness} metalness={metalness}
      emissive={emissive || "#000000"} emissiveIntensity={emissiveIntensity}/>
  </mesh>;
}

function ArchedPane({position,width=4,height=11,night=0}:{
  position:Position;width?:number;height?:number;night:number;
}){
  const outline=useMemo(()=>{
    const r=width/2;
    const s=new Shape();
    s.moveTo(-r,0);s.lineTo(r,0);s.lineTo(r,height-r);
    s.absarc(0,height-r,r,0,Math.PI,false);
    s.lineTo(-r,0);
    return s;
  },[width,height]);
  const hover=useContext(BuildingHoverContext);
  const glass=useRef<MeshStandardMaterial>(null);
  const intensity=0.02+night*2.15;
  useFrame((_,delta)=>{
    if (!glass.current) return;
    const wave=hoverWave(hover?.current ?? null, position[1]+height*0.5, position[0]);
    glass.current.color.lerpColors(
      night>0.5 ? ARCH_NIGHT : ARCH_DAY,
      night>0.5 ? ARCH_NIGHT_HOVER : ARCH_DAY_HOVER,
      wave
    );
    glass.current.emissiveIntensity=MathUtils.damp(
      glass.current.emissiveIntensity,
      intensity+wave*(night>0.5?0.42:0.18),12,delta
    );
  });
  return <group position={position}>
    <mesh position={[0,0,-0.12]}>
      <shapeGeometry args={[outline]}/>
      <meshStandardMaterial ref={glass} color={night>0.5?"#a97144":"#6f96a4"}
        emissive={night>0.5?"#ffad45":"#a4cbda"} emissiveIntensity={intensity}
        metalness={0.07} roughness={0.23} side={DoubleSide}/>
    </mesh>
    <WindowHalo position={[0,height*0.48,0.22]}
      width={width*1.4} height={height*1.22} brightness={night}/>
    <Block position={[0,height-width/2,0.02]} size={[width+0.36,0.16,0.19]} color="#c3a889"/>
    <mesh position={[0,height-width/2,0.08]} castShadow>
      <torusGeometry args={[width/2+0.1,0.24,8,28,Math.PI]}/>
      <meshStandardMaterial color="#f4e7d2" roughness={0.81}/>
    </mesh>
    <Block position={[-width/2-0.12,(height-width/2)/2,0.03]} size={[0.34,height-width/2,0.38]} color="#f4e7d2"/>
    <Block position={[width/2+0.12,(height-width/2)/2,0.03]} size={[0.34,height-width/2,0.38]} color="#f4e7d2"/>
    <Block position={[0,height*0.43,0.14]} size={[0.09,height*0.85,0.13]} color="#aa8970"/>
    <Block position={[0,height*0.18,0.15]} size={[width,0.11,0.12]} color="#aa8970"/>
  </group>;
}
function Window({position,width=2.1,height=3.8,night=0,brightness=1}:{
  position:Position;width?:number;height?:number;night:number;brightness?:number;
}){
  const hover=useContext(BuildingHoverContext);
  const glass=useRef<MeshStandardMaterial>(null);
  const glow=night*brightness;
  const isNight=glow>0.5;
  const baseIntensity=0.025+glow*2.35;
  useFrame((_,delta)=>{
    if (!glass.current) return;
    const wave=hoverWave(hover?.current ?? null,position[1],position[0]);
    glass.current.color.lerpColors(
      isNight ? NIGHT_GLASS : DAY_GLASS,
      isNight ? NIGHT_GLASS_HOVER : DAY_GLASS_HOVER,
      wave
    );
    glass.current.emissiveIntensity=MathUtils.damp(
      glass.current.emissiveIntensity,
      baseIntensity+wave*(isNight?0.45:0.19),12,delta
    );
  });
  return <group position={position}>
    <Block position={[0,0,-0.2]} size={[width+0.48,height+0.48,0.36]} color="#cab291"/>
    <mesh position={[0,0,0]} castShadow receiveShadow>
      <boxGeometry args={[width,height,0.12]}/>
      <meshStandardMaterial ref={glass} color={isNight?"#9c6539":"#688a97"}
        emissive={isNight?"#ffad45":"#a4cbda"}
        emissiveIntensity={baseIntensity} roughness={0.24} metalness={0.08}/>
    </mesh>
    <WindowHalo position={[0,0,0.31]}
      width={width*1.65} height={height*1.48} brightness={glow}/>
    <Block position={[0,0,0.11]} size={[0.1,height,0.1]} color="#6b6762"/>
    <Block position={[0,0,0.12]} size={[width,0.10,0.1]} color="#6b6762"/>
    <Block position={[0,-height/2-0.22,0.15]} size={[width+0.6,0.25,0.48]} color="#f8ecda"/>
  </group>;
}
function Ledge({w,d,y,overhang=0.6}:{
  w:number;d:number;y:number;overhang?:number;
}){
  return <Block position={[0,y,0]} size={[w+overhang*2,0.64,d+overhang*2]} color="#fcf1db"/>;
}
function Steps({front,wide=18,levels=6}:{
  front:number;wide?:number;levels?:number;
}){
  return <group>
    {Array.from({length:levels},(_,i)=>
      <Block key={i} position={[0,0.15+i*0.25,front+levels*0.7-i*0.7]}
        size={[wide+0.55,0.3+i*0.5,0.78]} color="#e7d5bd"/>
    )}
  </group>;
}
function GlowLight({position,night=0}:{
  position:Position;night:number;
}){
  return <group position={position}>
    <Block position={[0,0.42,0]} size={[0.5,0.84,0.5]} color="#968979"/>
    <Block position={[0,1.02,0]} size={[0.6,0.40,0.6]} color="#fbd6a0"
      emissive="#ffc678" emissiveIntensity={night*2.2+0.1}/>
    {night>0.45&&<pointLight position={[0,1.15,0]} intensity={night*6} color="#ffbf7d" distance={9} decay={2}/>}
  </group>;
}
function RoundTree({position,scale=1,night=0}:{
  position:Position;scale?:number;night:number;
}){
  return <group position={position} scale={scale}>
    <mesh position={[0,1.8,0]} castShadow>
      <cylinderGeometry args={[0.26,0.37,3.7,7]}/>
      <meshStandardMaterial color="#7b6150" roughness={1}/>
    </mesh>
    {[[0,4.5,0,2.3],[-1.4,3.8,0.2,1.8],[1.4,3.9,0.1,1.9],[-0.3,4,1.1,1.8],[0.5,4,-1,1.6]].map((v,i)=>
      <mesh key={i} position={[v[0],v[1],v[2]]} castShadow>
        <icosahedronGeometry args={[v[3],1]}/>
        <meshStandardMaterial color={i%2===0?"#506d48":"#628451"} roughness={1}
          emissive="#9e9c51" emissiveIntensity={night*0.045}/>
      </mesh>
    )}
  </group>;
}
function Cypress({position,scale=1}:{
  position:Position;scale?:number;
}){
  return <group position={position} scale={scale}>
    <mesh position={[0,0.8,0]} castShadow>
      <cylinderGeometry args={[0.17,0.24,1.6,7]}/>
      <meshStandardMaterial color="#715c47"/>
    </mesh>
    <mesh position={[0,3.2,0]} castShadow>
      <coneGeometry args={[1.25,5.8,7]}/>
      <meshStandardMaterial color="#3b6253" roughness={0.98}/>
    </mesh>
    <mesh position={[0,4.3,0]} castShadow>
      <coneGeometry args={[0.82,3.6,7]}/>
      <meshStandardMaterial color="#49765d" roughness={0.98}/>
    </mesh>
  </group>;
}
function Hedge({position,size}:{
  position:Position;size:Position;
}){
  return <Block position={position} size={size} color="#527443"/>;
}
function Building({children,id,position,onSelect}:{
  children:React.ReactNode;
  id:SchoolId;
  position:Position;
  onSelect:(id:SchoolId)=>void;
}){
  const moving=useRef<Group>(null);
  const highlight=useRef<PointLight>(null);
  const motion=useRef<BuildingHoverMotion>({target:0,progress:0,elapsed:0});
  const reduceMotion=useRef(false);

  useEffect(()=>{
    const media=window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync=()=>{reduceMotion.current=media.matches;};
    sync();
    media.addEventListener("change",sync);
    return ()=>media.removeEventListener("change",sync);
  },[]);

  useFrame((_,delta)=>{
    const state=motion.current;
    const dt=Math.min(delta,0.05);
    if(state.target>0) state.elapsed+=dt;
    state.progress=MathUtils.damp(state.progress,state.target,
      reduceMotion.current?60:8,dt);
    if(state.progress<0.0001 && !state.target)state.progress=0;
    const strength=reduceMotion.current ? 0 : state.progress;
    if(moving.current) moving.current.position.y=strength*0.75;
    if(highlight.current)
      highlight.current.intensity=strength*23;
  });

  // Screen-facing labels remain visible from any orbit angle and rise with
  // the model on hover. They are non-interactive, preserving building clicks.
  const labelHeight:Record<SchoolId,number>={
    library:36, business:34, sse:32, humanities:27,
  };
  const name=BUILDINGS.find(item=>item.id===id)?.name ?? id;
  return <group position={position}>
    <pointLight ref={highlight} position={[0,14,21]}
      color="#ffd8a0" intensity={0} distance={48} decay={2}/>
    <BuildingHoverContext.Provider value={motion}>
      <group ref={moving}
        onPointerOver={(event)=>{
          event.stopPropagation();
          if(motion.current.target!==1){
            motion.current.target=1;
            motion.current.elapsed=0;
          }
        }}
        onPointerOut={(event)=>{
          event.stopPropagation();
          // Changing from a wall to one of its windows is still inside
          // this building. Do not restart the hover animation on every mesh.
          const stillInside=event.intersections.some(hit=>{
            let object=hit.object;
            while(object){
              if(object===moving.current)return true;
              if(!object.parent)break;
              object=object.parent;
            }
            return false;
          });
          if(!stillInside)motion.current.target=0;
        }}
        onClick={(event)=>{
          event.stopPropagation();
          motion.current.target=0;
          onSelect(id);
        }}>
        {children}
        <Html center position={[0,labelHeight[id],0]}
          style={{pointerEvents:"none",userSelect:"none"}} zIndexRange={[3,1]}>
          <div className={styles.buildingName}>{name}</div>
        </Html>
      </group>
    </BuildingHoverContext.Provider>
  </group>;
}
function Library({night}: {night:number}){
  return <group>
    <Block position={[0,0.45,0]} size={[49,0.9,32]} color="#c7b99f"/>
    <Block position={[0,11.0,0]} size={[46,21,29]} color="#dfc7a9"/>
    {/* Balanced central iconic facade, stone pilasters and three 2-storey arches */}
    <Block position={[0,12,15.65]} size={[30,23,1.6]} color="#f1dfc6"/>
    {[-9.6,0,9.6].map(x=><ArchedPane key={x} position={[x,1.35,16.65]} width={7.7} height={20.2} night={night}/>)}
    {[-15.2,15.2].map(x=><Block key={x} position={[x,12.7,16.95]} size={[2,24.1,2.3]} color="#ead9c0"/>)}
    {[-21,-17.1,17.1,21].map(x=>[6.6,12.4,18.1].map(y=>
      <Window key={x+":"+y} position={[x,y,14.78]} width={2.1} height={4.6} night={night}/>))}
    <Block position={[0,24.3,0]} size={[48,1.9,31]} color="#f0e4d1"/>
    <Ledge w={48} d={31} y={25.35} overhang={0.6}/>
    <Block position={[0,27,0]} size={[21.5,3,16.5]} color="#d9c9b4"/>
    <Block position={[0,29.2,0]} size={[22.6,0.6,17.5]} color="#f7ead8"/>
    <Block position={[0,29.2,0]} size={[18,0.3,13.5]} color="#7c9da8"
      emissive="#e5b67d" emissiveIntensity={night*0.45} roughness={0.2}/>
    {Array.from({length:7},(_,i)=><Block key={i}
      position={[-8.4+i*2.8,29.48,0]} size={[0.15,0.16,13.8]} color="#5b6970"/>)}
    {[-14,14].map(x=><group key={x}>
      <Block position={[x,26.8,0]} size={[5,3.7,20]} color="#ebdfcd"/>
      <Block position={[x,29,0]} size={[6,0.6,21]} color="#f6e8d4"/>
    </group>)}
    {[-20.5,20.5].map(x=> <group key={x}>
      <Block position={[x,27,10]} size={[6.6,4.5,7.8]} color="#dec9ad"/>
      <Block position={[x,29.65,10]} size={[7.6,0.7,8.6]} color="#f5e8d5"/>
    </group>)}
    <Steps front={16.0} wide={30} levels={7}/>
    {[-17.3,17.3].map(x=><group key={x}>
      <Block position={[x,1.6,23]} size={[7.8,2.5,5]} color="#e7d4b8"/>
      <Hedge position={[x,3.03,23]} size={[6.9,0.42,4.1]}/>
    </group>)}
    {/* Side elevation and glowing windows */}
    {[-10,-2,6,13].map(z=>[6,12,18].map(y=>
      <group key={z+":"+y} position={[23.27,0,z]} rotation={[0,Math.PI/2,0]}>
        <Window position={[0,y,0]} width={2.5} height={3.9} night={night}/>
      </group>))}
    <GlowLight position={[-12,0,24]} night={night}/>
    <GlowLight position={[12,0,24]} night={night}/>
    <FacadeLights night={night} positions={[[-12,11,19],[12,11,19]]}
      intensity={24} range={20}/>
  </group>;
}
function Business({night}: {night:number}){
  return <group>
    <Block position={[0,0.45,0]} size={[36,0.9,27]} color="#c3b49a"/>
    <Block position={[0,10.7,0]} size={[34,20.4,24.5]} color="#dfc3a3"/>
    <Block position={[0,8,12.45]} size={[31,14.8,1.2]} color="#efdbc0"/>
    {[-10,0,10].map(x=><ArchedPane key={x} position={[x,1,13.16]} width={8.1} height={13.8} night={night}/>)}
    <Ledge w={35} d={26} y={16.5}/>
    {[-13,-9,-5,-1,3,7,11,15].map(x=>
      <Window key={x} position={[x,18.65,12.45]} width={2.5} height={2.2} night={night}/>)}
    <Ledge w={35} d={26} y={21.5} overhang={0.9}/>
    <Block position={[0,22.8,0]} size={[35.7,2,25.2]} color="#d8c4a7"/>
    <Ledge w={36} d={26} y={24.0}/>
    {[-11,11].map(x=><group key={x}>
      <Block position={[x,25.6,-5.0]} size={[7,4.1,7]} color="#d9c09f"/>
      <Block position={[x,27.9,-5]} size={[8,0.65,8]} color="#f4e6ce"/>
      <Window position={[x,25.6,-1.4]} width={2.4} height={2.3} night={night}/>
    </group>)}
    {[-7,0,7].map(z=>[6.7,13.2,19.3].map(y=>
      <group key={z+":"+y} position={[17.2,0,z]} rotation={[0,Math.PI/2,0]}>
        <Window position={[0,y,0]} width={2.8} height={3.5} night={night}/>
      </group>))}
    <Steps front={13.3} wide={22} levels={4}/>
    {[-15,15].map(x=><Hedge key={x} position={[x,1.15,16]}
      size={[3.2,1.4,10]}/>)}
    <FacadeLights night={night} positions={[[-10,9,16.5],[10,9,16.5]]}
      intensity={23} range={19}/>
  </group>;
}
function Humanities({night}:{night:number}){
  return <group>
    <Block position={[0,0.5,0]} size={[57,1,19.5]} color="#cabbab"/>
    <Block position={[0,8.2,0]} size={[55,15.4,18]} color="#e0c6a4"/>
    <Block position={[0,5.2,9.5]} size={[53,9.8,0.9]} color="#f4e5d0"/>
    {Array.from({length:8},(_,i)=>
      <ArchedPane key={i} position={[-22.4+i*6.4,1.1,10.10]}
        width={5.5} height={9.3} night={night}/>)}
    <Ledge w={56} d={20} y={11.4}/>
    {Array.from({length:13},(_,i)=>
      <Window key={i} position={[-24+i*4,13.1,9.15]} width={2.2} height={2.3} night={night}/>)}
    <Ledge w={56} d={20} y={16.15} overhang={0.85}/>
    <Block position={[0,17.0,0]} size={[56,1.5,19]} color="#ae947b"/>
    <Ledge w={56} d={19} y={18.1}/>
    {[-24,24].map(x=><group key={x}>
      <Block position={[x,19.6,1.3]} size={[7.7,4.3,13]} color="#d6ba95"/>
      <Ledge w={8.1} d={13.5} y={22}/>
      <Window position={[x,19.7,8.2]} width={2.4} height={2.7} night={night}/>
    </group>)}
    <Steps front={10.2} wide={29} levels={4}/>
    {[-27,27].map(x=><Hedge key={x} position={[x,1.35,11.2]} size={[3,1.2,8]}/>)}
    {[-5,1,7].map(z=>[6.7,12.7].map(y=>
      <group key={z+":"+y} position={[27.7,0,z]} rotation={[0,Math.PI/2,0]}>
        <Window position={[0,y,0]} width={2.5} height={3.2} night={night}/>
      </group>))}
    <FacadeLights night={night} positions={[[-16,8,13],[16,8,13]]}
      intensity={24} range={19}/>
  </group>;
}
function SSE({night}:{night:number}){
  return <group>
    <Block position={[0,0.5,0]} size={[39,1,31]} color="#b8b7aa"/>
    <Block position={[0,9.8,0]} size={[36.5,18.6,29]} color="#dbd2c4"/>
    <Block position={[-4.9,9.6,15.3]} size={[24.5,17.5,0.18]}
      color={night>0.5?"#91603b":"#7a9caa"}
      emissive={night>0.5?"#ffb24e":"#a0c3d4"}
      emissiveIntensity={0.02+night*2.15} roughness={0.21} metalness={0.12}/>
    <WindowHalo position={[-4.9,9.6,15.65]}
      width={27} height={20} brightness={night*0.62}/>
    {Array.from({length:7},(_,i)=>
      <Block key={"m"+i} position={[-16.4+i*3.8,9.6,15.48]}
        size={[0.21,18.1,0.26]} color="#54656b" metalness={0.65}/>)}
    {[6.3,12.7,18.4].map(y=><Block key={y} position={[-4.9,y,15.5]}
      size={[24.4,0.22,0.3]} color="#54656b"/>)}
    {/* Folded projecting architectural fins give the science building its identity. */}
    <mesh position={[10.8,13,16.2]} rotation={[0,0,0.14]} castShadow>
      <boxGeometry args={[2.0,22,3.2]}/>
      <meshStandardMaterial color="#f6e9d8" roughness={0.87}/>
    </mesh>
    <Block position={[0,20,0]} size={[39,1.8,32.6]} color="#eae2d5"/>
    <Block position={[0,21.25,0]} size={[41,0.55,33.4]} color="#f4ecdf"/>
    <Block position={[0,22.5,-4]} size={[32,2.2,23]} color="#d7d8d1"/>
    <Block position={[0,23.8,-4]} size={[34,0.6,24]} color="#eee8da"/>
    <Block position={[-7,25,-3]} size={[18,2.3,14]} color="#c7ced0"/>
    <Block position={[-7,26.2,-3]} size={[19,0.4,14.5]} color="#e5e8e5"/>
    {[16.8,11.3,5.8].map(z=>[5.3,11.5,17.6].map(y=>
      <group key={z+":"+y} position={[18.5,0,z]} rotation={[0,Math.PI/2,0]}>
        <Window position={[0,y,0]} width={3.1} height={4.2} night={night}/>
      </group>))}
    <Steps front={15.5} wide={20} levels={4}/>
    {[-17,17].map(x=><Hedge key={x} position={[x,1.1,16.2]} size={[3.1,1.1,7]}/>)}
    <FacadeLights night={night} positions={[[-10,9,18],[10,9,18]]}
      intensity={26} range={21}/>
  </group>;
}

function Pathway({points,width=7,color="#ddd1c3",height=0.15}:{
  points:Position[];width?:number;color?:string;height?:number;
}){
  const geometry=useMemo(()=>{
    const curve=new CatmullRomCurve3(points.map(p=>new Vector3(...p)),false,"catmullrom",0.25);
    const segments=36;
    const vertices:number[]=[];
    const indices:number[]=[];
    for(let i=0;i<=segments;i++){
      const t=i/segments, p=curve.getPoint(t), tangent=curve.getTangent(t);
      const length=Math.hypot(tangent.x,tangent.z)||1;
      const dx=-tangent.z/length*width/2, dz=tangent.x/length*width/2;
      vertices.push(p.x+dx,height,p.z+dz,p.x-dx,height,p.z-dz);
      if(i<segments){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
    }
    const g=new BufferGeometry();
    g.setAttribute("position",new Float32BufferAttribute(vertices,3));
    g.setIndex(indices);g.computeVertexNormals();
    return g;
  },[points,width,height]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <mesh geometry={geometry} receiveShadow>
    <meshStandardMaterial color={color} roughness={0.98} side={DoubleSide}/>
  </mesh>;
}

const ROAD_SEGMENTS: {name:string;points:Position[];width:number}[] = [
  {name:"north-arcade-promenade",points:[[-94,0,-50],[92,0,-50]],width:10},
  {name:"south-garden-promenade",points:[[-94,0,116],[92,0,116]],width:10},
  {name:"central-avenue-north",points:[[0,0,-50],[0,0,0]],width:10},
  {name:"central-avenue-south",points:[[0,0,40],[0,0,116]],width:10},
  {name:"business-entrance",points:[[-94,0,-62],[-94,0,-50]],width:8},
  {name:"sse-entrance",points:[[92,0,-60],[92,0,-50]],width:8},
  {name:"library-entrance",points:[[-94,0,108],[-94,0,116]],width:9},
  {name:"humanities-entrance",points:[[92,0,97],[92,0,116]],width:9},
];

function Promenade({points,width}: {points:Position[];width:number}) {
  const horizontal=Math.abs(points[1][0]-points[0][0]) >
    Math.abs(points[1][2]-points[0][2]);
  return <>
    {/* Stone curbs, lighter inset pavers, and parallel inlaid borders.
        These are walkways, not car lanes: no center traffic markings. */}
    <Pathway points={points} width={width+2} height={0.13} color="#b8a48a"/>
    <Pathway points={points} width={width} height={0.155} color="#e4d8c4"/>
    {[-1,1].map(side=>{
      const inset=(width/2-0.9)*side;
      const shifted=points.map(p=>[p[0]+(horizontal?0:inset),0,
        p[2]+(horizontal?inset:0)] as Position);
      return <Pathway key={side} points={shifted} width={0.17}
        height={0.179} color="#c7b394"/>;
    })}
  </>;
}

function CampusWalkways(){
  return <>
    {/* An H-shaped system of formal campus promenades; every branch joins
        an actual school entrance and none crosses a building footprint. */}
    {ROAD_SEGMENTS.map(segment=>
      <Promenade key={segment.name} points={segment.points} width={segment.width}/>
    )}
    {/* Hand-laid stone joints at regular intervals soften the long avenues. */}
    {[-50,116].flatMap(z=>
      Array.from({length:14},(_,i)=>
        <Block key={"joint-x-"+z+"-"+i}
          position={[-85+i*13.0,0.186,z]}
          size={[0.18,0.015,9.4]} color="#c3ae90" cast={false}/>
      )
    )}
    {[-38,-25,-12,53,66,79,92,105].map(z=>
      <Block key={"joint-z-"+z} position={[0,0.186,z]}
        size={[9.4,0.015,0.18]} color="#c3ae90" cast={false}/>
    )}
    {/* Rounded intersection pavers indicate pedestrian junctions. */}
    {[-94,0,92].flatMap(x=>[-50,116].map(z=>
      <group key={"junction-"+x+"-"+z}>
        <mesh rotation={[-Math.PI/2,0,0]} position={[x,0.188,z]}>
          <circleGeometry args={[5.0,36]}/>
          <meshStandardMaterial color="#eadac0" roughness={0.95}/>
        </mesh>
        <mesh rotation={[-Math.PI/2,0,0]} position={[x,0.194,z]}>
          <ringGeometry args={[4.15,4.28,36]}/>
          <meshStandardMaterial color="#c0a88a" roughness={0.95} side={DoubleSide}/>
        </mesh>
      </group>
    ))}
  </>;
}

// Low, continuous, pale sandstone precincts anchor each building in the
// environment. They connect directly to the paths rather than floating in space.
const BUILDING_PLOTS: {id:BuildingId;size:Position}[] = [
  {id:"business",size:[57,0.2,46]},
  {id:"sse",size:[57,0.2,49]},
  {id:"library",size:[68,0.2,50]},
  {id:"humanities",size:[74,0.2,39]},
];

const WALKWAY_LIGHTS: Position[] = [
  [-69,0,-57],[-44,0,-57],[-19,0,-57],[19,0,-57],[44,0,-57],[68,0,-57],
  [-69,0,123],[-44,0,123],[-19,0,123],[19,0,123],[44,0,123],[68,0,123],
  [-8,0,-35],[8,0,-18],[-8,0,55],[8,0,73],[-8,0,91],[8,0,106],
  [-106,0,-50],[104,0,-50],[-106,0,116],[104,0,116],
];

function AdaptiveCamera(){
  const {camera,size}=useThree();
  useEffect(()=>{
    if(camera instanceof OrthographicCamera) {
      // Accommodate all four separated buildings and their wider circulation system.
       camera.zoom=Math.max(1.15,Math.min(size.width/335,size.height/245));
      camera.updateProjectionMatrix();
    }
  },[camera,size.width,size.height]);
  return null;
}
function Campus({light,onSelect}:{light:SceneLight;onSelect:(id:SchoolId)=>void}){
  const brightness=Math.max(0,Math.min(1,(9-light.altitude)/15));
  const night=brightness;
  const atNight=light.altitude < -5;
  const ambient=Math.max(0.42,Math.min(1,0.4+light.altitude/35));
  const spot=light.altitude>0?light.sun:[-80,110,-80] as Position;
  return <>
    <color attach="background" args={[atNight?"#0b1730":"#c9d6df"]}/>
    {!atNight&&<Sky sunPosition={light.sun} turbidity={4} rayleigh={1.65}
      mieCoefficient={0.008} mieDirectionalG={0.8}/>}
    {atNight&&<Stars radius={240} depth={50} count={600} factor={2.2} saturation={0} fade/>}
    <hemisphereLight args={[atNight?"#8f9ac8":"#fff7e8","#9f9b94",atNight?0.85:1.1]}/>
    <ambientLight intensity={atNight?0.27:0.62}/>
    <directionalLight position={spot} intensity={atNight?1.05:2.7*ambient}
      color={atNight?"#b8c8f6":"#fff3db"} castShadow
      shadow-mapSize={[2048,2048]} shadow-camera-left={-185}
      shadow-camera-right={185} shadow-camera-top={185} shadow-camera-bottom={-185}
      shadow-camera-near={1} shadow-camera-far={490} shadow-bias={-0.0002}/>
    {/* Shadow-catching ground is transparent: no visible rectangle or platform edge. */}
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.38,0]} receiveShadow>
      <planeGeometry args={[2000,2000]}/>
      <shadowMaterial color="#1d2538" transparent opacity={0.28} depthWrite={false}/>
    </mesh>
    {BUILDING_PLOTS.map(plot=>
      <group key={"plot-"+plot.id}>
        <Block position={[SITE_POSITIONS[plot.id][0],-0.06,SITE_POSITIONS[plot.id][2]]}
          size={plot.size} color="#c6b296" cast={false}/>
        <Block position={[SITE_POSITIONS[plot.id][0],0.06,SITE_POSITIONS[plot.id][2]]}
          size={[plot.size[0]-1.2,0.16,plot.size[2]-1.2]} color="#e9ddc8" cast={false}/>
      </group>
    )}
    <CampusWalkways/>
    {/* A planted circular plaza at the main avenue's central junction. */}
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.176,PLAZA_Z]} receiveShadow>
      <circleGeometry args={[20,72]}/>
      <meshStandardMaterial color="#d0b99a" roughness={0.96}/>
    </mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.194,PLAZA_Z]} receiveShadow>
      <circleGeometry args={[18.7,72]}/>
      <meshStandardMaterial color="#e9dccc" roughness={0.96}/>
    </mesh>
    {[8.2,15.7,18.2].map(r=>
      <mesh key={r} rotation={[-Math.PI/2,0,0]} position={[0,0.211,PLAZA_Z]}>
        <ringGeometry args={[r,r+0.16,72]}/>
        <meshStandardMaterial color="#bcaa93" roughness={0.9} side={DoubleSide}/>
      </mesh>
    )}
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.235,PLAZA_Z]}>
      <circleGeometry args={[7.1,48]}/>
      <meshStandardMaterial color="#789463"/>
    </mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.247,PLAZA_Z]}>
      <ringGeometry args={[6.55,7.15,48]}/>
      <meshStandardMaterial color="#477047" side={DoubleSide}/>
    </mesh>
    <RoundTree position={[0,0,PLAZA_Z]} night={night} scale={0.95}/>
    {/* Trees outside building footprints, circulation, and entrances. */}
    {[
      [-128,0,-88],[-128,0,-60],[-63,0,-101],[-55,0,-67],
      [127,0,-92],[129,0,-57],[59,0,-99],[56,0,-66],
      [-129,0,79],[-129,0,106],[-61,0,70],[-61,0,129],
      [131,0,79],[132,0,108],[53,0,72],[53,0,130],
      [-33,0,-7],[33,0,-7],[-34,0,49],[34,0,49],
    ].map((p,i)=>
      <Cypress key={i} position={p as Position} scale={i%3===0?0.97:0.8}/>
    )}
    {[[-43,0,18],[46,0,19],[-49,0,65],[47,0,66]].map((p,i)=>
      <RoundTree key={i} position={p as Position} night={night} scale={0.68}/>
    )}
    {WALKWAY_LIGHTS.map((p,i)=>
      <GlowLight key={i} position={p} night={night}/>
    )}
    {BUILDINGS.map(building=>
      <Building key={building.id} id={building.id} position={building.location}
        onSelect={onSelect}>
        {building.id==="business"&&<Business night={night}/>}
        {building.id==="library"&&<Library night={night}/>}
        {building.id==="sse"&&<SSE night={night}/>}
        {building.id==="humanities"&&<Humanities night={night}/>}
      </Building>
    )}
    <OrbitControls makeDefault target={[0,9,PLAZA_Z]} enableDamping
      dampingFactor={0.08} minDistance={90} maxDistance={380}
      maxPolarAngle={1.42} minPolarAngle={0.6}
      enablePan={true} panSpeed={0.6} rotateSpeed={0.38} zoomSpeed={0.7}/>
  </>;
}

export default function NewHomePage(){
  const [clock,setClock]=useState(()=>new Date());
  const [selectedSchool,setSelectedSchool]=useState<SchoolId|null>(null);
  useEffect(()=>{
    const timer=window.setInterval(()=>setClock(new Date()),60_000);
    return ()=>window.clearInterval(timer);
  },[]);
  const celestial=useMemo(()=>celestialState(clock),[clock.getTime()]);
  return <main className={styles.campusPage}>
    <div className={styles.scene} aria-label="Interactive three-dimensional university campus with four original buildings">
      <Canvas shadows orthographic camera={{position:[152,138,190],zoom:3.5,near:0.1,far:800}}
        dpr={[1,1.75]} gl={{antialias:true,alpha:false,powerPreference:"high-performance"}}
        onCreated={({gl})=>{gl.toneMapping=ACESFilmicToneMapping;gl.toneMappingExposure=1.18;gl.shadowMap.type=PCFSoftShadowMap;}}
        fallback={<div className={styles.fallback}>This preview needs WebGL.</div>}>
        <AdaptiveCamera/>
        <Campus light={celestial} onSelect={setSelectedSchool}/>
        <NightBloom enabled={celestial.altitude < -3}/>
      </Canvas>
    </div>
    {selectedSchool && <MajorWheel key={selectedSchool} school={selectedSchool}
      onClose={()=>setSelectedSchool(null)}/>}
  </main>;
}
