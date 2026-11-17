"use client";

import { useEffect, useMemo, useState } from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Sky, Stars } from "@react-three/drei";
import {
  ACESFilmicToneMapping, CatmullRomCurve3, DoubleSide, Mesh,
  PCFSoftShadowMap, Shape, Vector3, BufferGeometry, Float32BufferAttribute,
} from "three";
import { DEGREE_REQUIREMENTS } from "../../data/degree-requirements";
import { courses } from "../../data/courses";
import styles from "./newhome.module.css";

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
const BUILDINGS: {id: BuildingId; name: string; description: string; location: [number, number, number]}[] = [
  {id:"library", name:"Library", description:"Explore all courses, study resources and uploaded materials.", location:[0,0,0]},
  {id:"business", name:"School of Business", description:"Business, economics, accounting, finance and related majors.", location:[-50,0,-32]},
  {id:"sse", name:"School of Sciences & Engineering", description:"Engineering, computer science, sciences and technology.", location:[51,0,-32]},
  {id:"humanities", name:"Humanities & Social Sciences", description:"Arts, languages, politics, psychology and the social sciences.", location:[34,0,40]},
];
const CATEGORY: Record<BuildingId, string[]> = {
  library: ["Browse all courses", "Student materials", "Professors"],
  business: ["Business and Entrepreneurship", "Business in Finance", "Business in Marketing", "Accounting", "Economics", "Actuarial Science"],
  sse: ["Mechanical Engineering", "Computer Science", "Computer Engineering", "Electronics and Communications Engineering", "Architecture", "Data Science", "Construction Engineering", "Physics", "Chemistry", "Biology", "Mathematics", "Petroleum Engineering"],
  humanities: ["Political Science", "Psychology", "English and Comparative Literature", "History", "Sociology", "Anthropology", "Philosophy", "Visual Arts", "Film", "Theatre", "Arabic Studies", "Egyptology", "Music"],
};
const TOOLS: Record<string,string> = {
  "Browse all courses":"/courses", "Student materials":"/courses", "Professors":"/professors"
};
type DegreeGroup = {title?:string;items?:string[]};
const degreePlans = DEGREE_REQUIREMENTS as Record<string,{groups?:DegreeGroup[]}>;
const courseByCode = new Map(courses.map(c=>[c.code.toUpperCase(),c]));
function majorCourses(major:string) {
  const groups=degreePlans[major]?.groups || [];
  const seen=new Set<string>();
  return groups.map(group=>({
    title:group.title || "Degree requirements",
    courses:(group.items||[]).flatMap(item=>{
      if(typeof item!=="string")return [];
      const matches=item.match(/\b[A-Z]{3,5}\s+\d{4}[A-Z]?\b/g) || [];
      return matches.flatMap(match=>{
        const code=match.replace(/\s+/g," ").trim().toUpperCase();
        if(seen.has(code)) return [];
        seen.add(code);
        const entry=courseByCode.get(code);
        return [{code,name:entry?.title || item.slice(0,110)}];
      });
    }),
  })).filter(group=>group.courses.length>0);
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
  const intensity=0.06+night*1.5;
  return <group position={position}>
    <mesh position={[0,0,-0.12]}>
      <shapeGeometry args={[outline]}/>
      <meshStandardMaterial color={night>0.5?"#e5ac61":"#6f96a4"}
        emissive="#f6bd76" emissiveIntensity={intensity} metalness={0.15} roughness={0.19} side={DoubleSide}/>
    </mesh>
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
  const glow=night*brightness;
  return <group position={position}>
    <Block position={[0,0,-0.2]} size={[width+0.48,height+0.48,0.36]} color="#cab291"/>
    <Block position={[0,0,0]} size={[width,height,0.12]} color={glow>0.5?"#f1b76d":"#688a97"}
      emissive="#f8bd73" emissiveIntensity={0.06+glow*1.55} roughness={0.23} metalness={0.19}/>
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
function Building({children,id,position,select,hover}:{
  children:React.ReactNode;id:BuildingId;position:Position;select:(id:BuildingId)=>void;
  hover:(id:BuildingId|null)=>void;
}){
  return <group position={position}
    onPointerOver={(event:ThreeEvent<PointerEvent>)=>{event.stopPropagation();hover(id);document.body.style.cursor="pointer";}}
    onPointerOut={(event:ThreeEvent<PointerEvent>)=>{event.stopPropagation();hover(null);document.body.style.cursor="";}}
    onClick={(event:ThreeEvent<MouseEvent>)=>{event.stopPropagation();select(id);}}>
    {children}
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
  </group>;
}
function SSE({night}:{night:number}){
  return <group>
    <Block position={[0,0.5,0]} size={[39,1,31]} color="#b8b7aa"/>
    <Block position={[0,9.8,0]} size={[36.5,18.6,29]} color="#dbd2c4"/>
    <Block position={[-4.9,9.6,15.3]} size={[24.5,17.5,0.18]} color={night>0.5?"#d9ac77":"#7a9caa"}
      emissive="#ffc786" emissiveIntensity={0.1+night*1.15} roughness={0.21} metalness={0.3}/>
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
  </group>;
}

function Pathway({points,width=7,color="#ddd1c3"}:{
  points:Position[];width?:number;color?:string;
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
      vertices.push(p.x+dx,0.15,p.z+dz,p.x-dx,0.15,p.z-dz);
      if(i<segments){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
    }
    const g=new BufferGeometry();
    g.setAttribute("position",new Float32BufferAttribute(vertices,3));
    g.setIndex(indices);g.computeVertexNormals();
    return g;
  },[points,width]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <mesh geometry={geometry} receiveShadow>
    <meshStandardMaterial color={color} roughness={0.98} side={DoubleSide}/>
  </mesh>;
}
const walk1:Position[]=[[-50,0,0],[-32,0,11],[-16,0,21],[0,0,32]];
const walk2:Position[]=[[51,0,0],[33,0,5],[17,0,20],[0,0,32]];
const walk3:Position[]=[[0,0,33],[15,0,42],[30,0,49]];
const walk4:Position[]=[[0,0,33],[-12,0,49],[-31,0,74]];
function Campus({light,onSelect,onHover}:{
  light:SceneLight;onSelect:(id:BuildingId)=>void;onHover:(id:BuildingId|null)=>void;
}){
  const brightness=Math.max(0,Math.min(1,(9-light.altitude)/15));
  const night=brightness;
  const atNight=light.altitude < -5;
  const ambient=Math.max(0.42,Math.min(1,0.4+light.altitude/35));
  const spot=light.altitude>0?light.sun:[-80,110,-80] as Position;
  return <>
    <color attach="background" args={[atNight?"#6878a6":"#c9d6df"]}/>
    {!atNight&&<Sky sunPosition={light.sun} turbidity={4} rayleigh={1.65}
      mieCoefficient={0.008} mieDirectionalG={0.8}/>}
    {atNight&&<Stars radius={240} depth={50} count={600} factor={2.2} saturation={0} fade/>}
    <hemisphereLight args={[atNight?"#8f9ac8":"#fff7e8","#9f9b94",atNight?1.45:1.1]}/>
    <ambientLight intensity={atNight?0.55:0.62}/>
    <directionalLight position={spot} intensity={atNight?1.8:2.7*ambient}
      color={atNight?"#b8c8f6":"#fff3db"} castShadow
      shadow-mapSize={[2048,2048]} shadow-camera-left={-130}
      shadow-camera-right={130} shadow-camera-top={130} shadow-camera-bottom={-130}
      shadow-camera-near={1} shadow-camera-far={380} shadow-bias={-0.0002}/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.38,0]} receiveShadow>
      <planeGeometry args={[390,330]}/>
      <meshStandardMaterial color={atNight?"#a2a6c0":"#eee9dc"} roughness={1}/>
    </mesh>
    <Block position={[0,-0.11,18]} size={[184,0.24,154]} color={atNight?"#b1b2bf":"#e9e2d3"} cast={false}/>
    <Pathway points={walk1} width={8.5}/>
    <Pathway points={walk2} width={8.5}/>
    <Pathway points={walk3} width={8.5}/>
    <Pathway points={walk4} width={8.5}/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.17,32]} receiveShadow>
      <circleGeometry args={[15.3,64]}/>
      <meshStandardMaterial color="#e9d9c8" roughness={0.96}/>
    </mesh>
    {[9.5,12.8,14.5].map(r=><mesh key={r} rotation={[-Math.PI/2,0,0]} position={[0,0.21,32]}>
      <torusGeometry args={[r,0.16,6,70]}/>
      <meshStandardMaterial color="#bdb6aa" roughness={0.9}/>
    </mesh>)}
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.23,32]}>
      <circleGeometry args={[6.4,48]}/>
      <meshStandardMaterial color="#7b9666"/>
    </mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.26,32]}>
      <ringGeometry args={[5.7,6.4,48]}/>
      <meshStandardMaterial color="#4b7648" side={DoubleSide}/>
    </mesh>
    <RoundTree position={[0,0,32]} night={night} scale={0.95}/>
    {[
      [-74,0,-22],[-31,0,-31],[72,0,-27],[71,0,-48],
      [52,0,20],[66,0,26],[-69,0,13],[-34,0,17],
      [2,0,-39],[-12,0,51],[40,0,71],
    ].map((p,i)=><Cypress key={i} position={p as Position} scale={i%3===0?0.9:0.7}/>)}
    {[[-26,0,30],[-16,0,62],[56,0,67]].map((p,i)=>
      <RoundTree key={i} position={p as Position} night={night} scale={0.68}/>)}
    {[
      [-29,0,16],[-17,0,24],[17,0,24],[30,0,12],
      [-12,0,44],[16,0,43],[34,0,48],
      [-57,0,-8],[-42,0,1],[56,0,6],
    ].map((p,i)=><GlowLight key={i} position={p as Position} night={night}/>)}
    <Building id="business" position={[-50,0,-32]} select={onSelect} hover={onHover}>
      <Business night={night}/>
    </Building>
    <Building id="library" position={[0,0,0]} select={onSelect} hover={onHover}>
      <Library night={night}/>
    </Building>
    <Building id="sse" position={[51,0,-32]} select={onSelect} hover={onHover}>
      <SSE night={night}/>
    </Building>
    <Building id="humanities" position={[34,0,40]} select={onSelect} hover={onHover}>
      <Humanities night={night}/>
    </Building>
    <OrbitControls makeDefault target={[0,9,13]} enableDamping
      dampingFactor={0.08} minDistance={85} maxDistance={240}
      maxPolarAngle={1.42} minPolarAngle={0.6}
      enablePan={true} panSpeed={0.6} rotateSpeed={0.38} zoomSpeed={0.7}/>
  </>;
}

export default function NewHomePage(){
  const [clock,setClock]=useState(()=>new Date());
  const [previewHour,setPreviewHour]=useState<number|null>(null);
  const [selected,setSelected]=useState<BuildingId|null>(null);
  const [major,setMajor]=useState<string|null>(null);
  const [hovered,setHovered]=useState<BuildingId|null>(null);
  useEffect(()=>{
    const timer=window.setInterval(()=>setClock(new Date()),60_000);
    return ()=>window.clearInterval(timer);
  },[]);
  const cairo=cairoParts(clock);
  const moment=previewHour===null?clock:new Date(clock.getTime()+(previewHour-cairo.decimalHour)*3_600_000);
  const local=cairoParts(moment);
  const celestial=useMemo(()=>celestialState(moment),[moment.getTime()]);
  const chosen=BUILDINGS.find(b=>b.id===selected);
  const groupList=major ? majorCourses(major) : [];
  const hover=BUILDINGS.find(b=>b.id===hovered);
  const timeLabel=celestial.altitude< -6?"Night":celestial.altitude<5?"Twilight":"Daylight";
  return <main className={styles.campusPage}>
    <div className={styles.scene} aria-label="Interactive three-dimensional university campus with four original buildings">
      <Canvas shadows orthographic camera={{position:[104,99,132],zoom:5.0,near:0.1,far:600}}
        dpr={[1,1.75]} gl={{antialias:true,alpha:false,powerPreference:"high-performance"}}
        onCreated={({gl})=>{gl.toneMapping=ACESFilmicToneMapping;gl.toneMappingExposure=1.18;gl.shadowMap.type=PCFSoftShadowMap;}}
        onPointerMissed={()=>{setSelected(null);setMajor(null);}}
        fallback={<div className={styles.fallback}>This preview needs WebGL.</div>}>
        <Campus light={celestial} onSelect={(id)=>{setSelected(id);setMajor(null);}} onHover={setHovered}/>
      </Canvas>
    </div>
    <header className={styles.overlayHead}>
      <span className={styles.eyebrow}>AUC ATLAS · INTERACTIVE CAMPUS</span>
      <h1>Explore your campus.</h1>
      <p>Four schools. One place for your courses and materials.</p>
    </header>
    {hover&&!selected&&<div className={styles.hoverTag} aria-live="polite">
      <span className={styles.hoverDot}/>{hover.name} <span>· click to explore</span>
    </div>}
    {chosen&&<section className={styles.detail} aria-label={chosen.name+" menu"}>
      <button className={styles.close} onClick={()=>{setSelected(null);setMajor(null);}} aria-label="Close building menu">×</button>
      <span className={styles.eyebrow}>EXPLORE BUILDING</span>
      {major ? <>
        <button className={styles.back} onClick={()=>setMajor(null)}>← Back to majors</button>
        <h2>{major}</h2>
        <p>Required and elective course options listed in the AUC Atlas degree plans. Confirm your catalog year and elective choices.</p>
        <div className={styles.courseGroups}>
          {groupList.length?groupList.map((group,i)=>
            <div key={group.title+i}>
              <h3>{group.title}</h3>
              {group.courses.map(course=>
                <a key={course.code} href={"/courses/"+encodeURIComponent(course.code.toLowerCase().replace(/[^a-z0-9]+/g,"-"))+"#course-materials-access"}>
                  <strong>{course.code}</strong><span>{course.name}</span><span aria-hidden="true">↗</span>
                </a>
              )}
            </div>
          ):<p>We don't yet have an indexed degree plan for this major. <a href="/courses">Browse all courses</a>.</p>}
        </div>
      </>:<>
        <h2>{chosen.name}</h2>
        <p>{chosen.description}</p>
        <div className={styles.majorList}>
          {CATEGORY[chosen.id].map(option=>TOOLS[option]?
            <a key={option} href={TOOLS[option]}><span>{option}</span><span aria-hidden="true">↗</span></a>:
            <button key={option} onClick={()=>setMajor(option)}>
              <span>{option}</span><span aria-hidden="true">→</span>
            </button>
          )}
        </div>
        {chosen.id!=="library"&&<small>Select a major to see course requirements and available materials.</small>}
      </>}
    </section>}
    <section className={styles.clockPanel} aria-label="Cairo daylight control">
      <div className={styles.clockTop}>
        <div><span className={styles.eyebrow}>CAIRO · {previewHour===null?"LIVE":"PREVIEW"}</span>
          <strong>{local.time}</strong><small>{timeLabel} · {phaseName(celestial.phase)}</small>
        </div>
        {previewHour!==null&&<button onClick={()=>setPreviewHour(null)}>Live time</button>}
      </div>
      <label className={styles.sliderLabel} htmlFor="campus-time">Explore time of day</label>
      <input id="campus-time" aria-label="Preview Cairo time of day" type="range"
        min={0} max={23.75} step={0.25}
        value={previewHour??cairo.decimalHour}
        onChange={e=>setPreviewHour(Number(e.target.value))}/>
      <div className={styles.ticks}><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div>
    </section>
    <div className={styles.instruction}>Drag to orbit · Scroll to zoom · Click a building</div>
    <div className={styles.signature}>Experimental concept · Original architecture</div>
  </main>;
}
