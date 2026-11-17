"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import {
  ACESFilmicToneMapping, DoubleSide, ExtrudeGeometry, MathUtils,
  MeshStandardMaterial, Path, PCFSoftShadowMap, Shape, Vector3,
} from "three";
import type { Group, Material } from "three";

export type SchoolId = "business" | "huss" | "sse" | "library";
export const SCHOOLS: { id: SchoolId; name: string; short: string; position: [number, number, number] }[] = [
  { id: "business", name: "School of Business", short: "Business", position: [-51, 0, -42] },
  { id: "huss", name: "Humanities & Social Sciences", short: "Humanities", position: [-51, 0, 39] },
  { id: "sse", name: "Sciences & Engineering", short: "SSE", position: [49, 0, -42] },
  { id: "library", name: "AUC Library", short: "Library", position: [49, 0, 39] },
];

const mat = {
  limestone: new MeshStandardMaterial({ color: "#f0ddbb", roughness: 0.94 }),
  sandstone: new MeshStandardMaterial({ color: "#d4b38a", roughness: 0.92 }),
  cream: new MeshStandardMaterial({ color: "#fff0d4", roughness: 0.91 }),
  roof: new MeshStandardMaterial({ color: "#b99a76", roughness: 0.93 }),
  greyStone: new MeshStandardMaterial({ color: "#a99278", roughness: 0.94 }),
  base: new MeshStandardMaterial({ color: "#b29f8a", roughness: 1 }),
  paving: new MeshStandardMaterial({ color: "#e6dccb", roughness: 1 }),
  trim: new MeshStandardMaterial({ color: "#f8e9ce", roughness: 0.89 }),
  shadow: new MeshStandardMaterial({ color: "#42515a", roughness: 0.47 }),
  glass: new MeshStandardMaterial({ color: "#4b7892", metalness: 0.24, roughness: 0.25 }),
  blue: new MeshStandardMaterial({ color: "#547e9a", metalness: 0.32, roughness: 0.28 }),
  slate: new MeshStandardMaterial({ color: "#657981", roughness: 0.77 }),
  metallic: new MeshStandardMaterial({ color: "#51616e", metalness: 0.67, roughness: 0.36 }),
  bronze: new MeshStandardMaterial({ color: "#927152", metalness: 0.4, roughness: 0.62 }),
  green: new MeshStandardMaterial({ color: "#4d755c", roughness: 1, flatShading: true }),
  greenLight: new MeshStandardMaterial({ color: "#6b8e68", roughness: 1, flatShading: true }),
  greenDark: new MeshStandardMaterial({ color: "#365d4b", roughness: 1, flatShading: true }),
  bark: new MeshStandardMaterial({ color: "#957355", roughness: 1 }),
  water: new MeshStandardMaterial({ color: "#90bfc0", metalness: 0.16, roughness: 0.24 }),
  gold: new MeshStandardMaterial({ color: "#a07b4b", metalness: 0.36, roughness: 0.47 }),
} satisfies Record<string, Material>;

type P = [number, number, number];
function Block({ p, s, m, shadows = true }: { p: P; s: P; m: Material; shadows?: boolean }) {
  return <mesh position={p} material={m} castShadow={shadows} receiveShadow>
    <boxGeometry args={s}/>
  </mesh>;
}

function Arch({ width, height, depth, p, m }: {
  width: number; height: number; depth: number; p: P; m: Material;
}) {
  const geometry = useMemo(() => {
    const a = new Shape();
    const r = width / 2;
    a.moveTo(-r, 0); a.lineTo(r, 0); a.lineTo(r, height - r);
    a.absarc(0, height - r, r, 0, Math.PI, false);
    a.lineTo(-r, 0); a.closePath();
    return new ExtrudeGeometry(a, { depth, bevelEnabled: false, curveSegments: 20 });
  }, [width, height, depth]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh position={p} geometry={geometry} material={m} castShadow receiveShadow />;
}
function Arcade({ x, y, z, w, h, night, cool = false }: {
  x: number; y: number; z: number; w: number; h: number; night: boolean; cool?: boolean;
}) {
  return <group>
    <Arch width={w} height={h} depth={0.3} p={[x, y, z]} m={mat.cream}/>
    <Arch width={w - 0.8} height={h - 0.7} depth={0.12} p={[x, y + 0.34, z + 0.33]}
      m={mat.shadow}/>
    {night && <mesh position={[x, y + h * 0.45, z + 0.47]}>
      <planeGeometry args={[w * 0.65, h * 0.45]}/>
      <meshBasicMaterial color={cool ? "#a4e5f7" : "#ffc980"} toneMapped={false}
        transparent opacity={0.75} side={DoubleSide}/>
    </mesh>}
    <Block p={[x - w * 0.5, y + h * 0.44, z + 0.15]} s={[0.32, h * 0.89, 0.55]} m={mat.trim}/>
    <Block p={[x + w * 0.5, y + h * 0.44, z + 0.15]} s={[0.32, h * 0.89, 0.55]} m={mat.trim}/>
  </group>;
}
const hash = (r: number, c: number, seed: number) =>
  (((r * 13 + c * 7 + seed * 19) % 17) + 17) % 17;

function Window({ p, w = 1.85, h = 2.3, night, hour, row, col, seed, cool = false }: {
  p: P; w?: number; h?: number; night: boolean; hour: number; row: number;
  col: number; seed: number; cool?: boolean;
}) {
  const lit = night && hash(row, col, seed) < (hour > 22 || hour < 5 ? 9 : 14);
  return <group position={p}>
    <Block p={[0, 0, 0]} s={[w + 0.3, h + 0.24, 0.21]} m={mat.trim}/>
    <Block p={[0, 0, 0.13]} s={[w, h, 0.08]} m={mat.shadow} shadows={false}/>
    <mesh position={[0, 0, 0.19]}>
      <planeGeometry args={[w - 0.14, h - 0.15]}/>
      {lit
        ? <meshBasicMaterial color={cool ? "#b1edff" : "#ffd18d"} toneMapped={false} side={DoubleSide}/>
        : <meshStandardMaterial color={cool ? "#517d96" : "#395f78"}
          roughness={0.24} metalness={0.24} side={DoubleSide}/>}
    </mesh>
    <Block p={[0, 0, 0.24]} s={[0.095, h + 0.15, 0.13]} m={mat.trim}/>
    <Block p={[0, -h * 0.5, 0.22]} s={[w + 0.48, 0.15, 0.32]} m={mat.cream}/>
  </group>;
}
function Windows({ x, y, z, night, hour, seed, cool = false, w, h }: {
  x: number[]; y: number[]; z: number; night: boolean; hour: number;
  seed: number; cool?: boolean; w?: number; h?: number;
}) {
  return <>{y.flatMap((yy, row) => x.map((xx, col) =>
    <Window key={row + "-" + col} p={[xx, yy, z]} row={row} col={col}
      night={night} hour={hour} seed={seed} cool={cool} w={w} h={h}/>
  ))}</>;
}

function Business({ night, hour }: { night: boolean; hour: number }) {
  const xs = [-13, -6.5, 0, 6.5, 13];
  return <group>
    <Block p={[0, 0.8, 0]} s={[39, 1.6, 25]} m={mat.base}/>
    <Block p={[0, 9.2, -0.5]} s={[36, 16.4, 22]} m={mat.sandstone}/>
    <Block p={[0, 17.5, -0.5]} s={[39, 0.9, 25]} m={mat.cream}/>
    <Block p={[0, 18.5, -0.5]} s={[37.6, 1.0, 23.7]} m={mat.roof}/>
    <Block p={[0, 19.1, -0.5]} s={[40, 0.35, 25.8]} m={mat.trim}/>
    <Block p={[0, 7.9, 10.65]} s={[37, 12.6, 0.6]} m={mat.greyStone}/>
    {xs.map((x, i) => <Arcade key={i} x={x} y={1.6} z={11.05}
      w={5.1} h={10.1} night={night && hash(2, i, 3) < 14}/>)}
    <Block p={[0, 12.1, 11.75]} s={[38, 0.5, 1.2]} m={mat.cream}/>
    <Windows x={xs} y={[14.8]} z={11.83} night={night} hour={hour} seed={4}/>
    {[-17.5, 17.5].map(x=><Block key={x} p={[x, 9.5, 12.0]}
      s={[1.2, 17.6, 1.25]} m={mat.cream}/>)}
    {/* Central clock tower above a classical cornice. */}
    <Block p={[0, 22, -2.3]} s={[10.5, 7.7, 12.4]} m={mat.sandstone}/>
    <Block p={[0, 26.25, -2.3]} s={[12.2, 0.9, 14]} m={mat.cream}/>
    <Block p={[0, 27.2, -2.3]} s={[11, 0.9, 12.8]} m={mat.roof}/>
    <mesh position={[0, 22.1, 4.1]} rotation={[Math.PI / 2, 0, 0]} material={mat.gold}>
      <cylinderGeometry args={[2.05, 2.05, 0.36, 32]}/>
    </mesh>
    <mesh position={[0, 22.1, 4.35]} rotation={[Math.PI / 2, 0, 0]} material={mat.cream}>
      <cylinderGeometry args={[1.77, 1.77, 0.1, 32]}/>
    </mesh>
    <Block p={[0, 22.68, 4.45]} s={[0.12, 1.25, 0.12]} m={mat.gold}/>
    <Block p={[0.49, 22.1, 4.45]} s={[0.95, 0.12, 0.12]} m={mat.gold}/>
    <Block p={[0, 1.65, 14.0]} s={[19, 0.55, 6.2]} m={mat.cream}/>
    {Array.from({length:19},(_,i)=><Block key={i}
      p={[-17.5+i*1.95,18.7,11.55]} s={[0.4,1.2,0.8]} m={mat.cream}/>)}
  </group>;
}

function Humanities({ night, hour }: { night: boolean; hour: number }) {
  return <group>
    <Block p={[0,0.7,-0.5]} s={[41,1.4,38]} m={mat.base}/>
    <Block p={[0,8.5,-12.2]} s={[39,15.5,12.4]} m={mat.sandstone}/>
    {[-14,14].map(x=><group key={x}>
      <Block p={[x,7.15,1]} s={[11.8,12.8,28]} m={mat.limestone}/>
      <Block p={[x,14.0,1]} s={[13,0.85,29.1]} m={mat.roof}/>
      <Block p={[x,14.55,1]} s={[13.7,0.35,29.4]} m={mat.trim}/>
      <Windows x={[x-3,x+3]} y={[6.6,11.0]} z={15.25}
        night={night} hour={hour} seed={15}/>
    </group>)}
    <Block p={[0,16.15,-12.2]} s={[41.5,0.85,13.8]} m={mat.roof}/>
    <Block p={[0,16.82,-12.2]} s={[41.7,0.4,14.0]} m={mat.cream}/>
    {/* Arched inner cloister over an open courtyard. */}
    {[-15.3,-10.2,-5.1,0,5.1,10.2,15.3].map((x,i)=>
      <Arcade key={x} x={x} y={1.5} z={-5.65} w={3.9} h={8.8}
        night={night && hash(i,2,8)<11}/>)}
    <Block p={[0,10.8,-5.55]} s={[40,0.45,1.25]} m={mat.cream}/>
    <Windows x={[-15,-10,-5,0,5,10,15]} y={[13.1]} z={-5.54}
      night={night} hour={hour} seed={7}/>
    {[-15,15].map(x=><group key={x}>
      <Block p={[x,18.25,-12.2]} s={[5.8,3.5,6.4]} m={mat.sandstone}/>
      <Block p={[x,20.2,-12.2]} s={[6.9,0.75,7.2]} m={mat.cream}/>
    </group>)}
    <Block p={[0,1.45,6]} s={[14.5,0.2,20]} m={mat.paving}/>
    <mesh position={[0,1.62,7.3]} rotation={[-Math.PI/2,0,0]} material={mat.cream}>
      <ringGeometry args={[2.7,3.25,32]}/>
    </mesh>
    <mesh position={[0,1.59,7.3]} rotation={[-Math.PI/2,0,0]} material={mat.water}>
      <circleGeometry args={[2.7,32]}/>
    </mesh>
    <Block p={[0,2.05,7.3]} s={[0.9,0.9,0.9]} m={mat.cream}/>
  </group>;
}

function SSE({ night, hour }: { night: boolean; hour: number }) {
  return <group>
    <Block p={[0,0.8,0]} s={[40,1.6,27]} m={mat.base}/>
    <Block p={[0,9,-1]} s={[36,16.8,23]} m={mat.slate}/>
    <Block p={[-12.4,10,0]} s={[12.0,19,24]} m={mat.limestone}/>
    <Block p={[12.4,11.3,0]} s={[12.5,21.3,24]} m={mat.sandstone}/>
    {/* Raised center glass atrium, vertical fins, and solar canopy. */}
    <Block p={[0,12.6,11.35]} s={[17,23.5,3]} m={mat.metallic}/>
    <Windows x={[-6,-2,2,6]} y={[4.0,8.2,12.4,16.6,20.8]}
      z={13.05} w={3.15} h={3.43} night={night} hour={hour} seed={5} cool/>
    {[-17.3,-14.8,-12.3,-9.8,10.6,13.2,15.8,18].map(x=>
      <Block key={x} p={[x,11.8,12.55]} s={[0.56,21.5,1.25]} m={mat.trim}/>)}
    <Windows x={[-13.5,13.5]} y={[7,14]} z={13}
      night={night} hour={hour} seed={3} cool/>
    <Block p={[0,24.8,11.3]} s={[20,1,5.1]} m={mat.cream}/>
    <Block p={[0,22.85,-1]} s={[38,0.95,25]} m={mat.trim}/>
    <Block p={[12.1,24.9,-3]} s={[10,4.3,10]} m={mat.slate}/>
    <Block p={[12.1,27.35,-3]} s={[11.3,0.6,11.3]} m={mat.cream}/>
    {[-6.5,-2.2,2.2,6.5].map(x=><group key={x}>
      <Block p={[x,23.5,-6]} s={[3.65,0.15,5.7]} m={mat.metallic}/>
      <Block p={[x,23.65,-6]} s={[3.3,0.08,5.2]} m={mat.glass}/>
    </group>)}
    <Block p={[0,1.75,15.4]} s={[18,0.5,8.8]} m={mat.paving}/>
  </group>;
}

function Library({ night, hour }: { night: boolean; hour: number }) {
  return <group>
    <Block p={[0,0.7,0]} s={[44,1.4,29]} m={mat.base}/>
    {[-13.8,13.8].map(x=><group key={x}>
      <Block p={[x,7.7,-0.7]} s={[15.4,13.7,26]} m={mat.sandstone}/>
      <Block p={[x,14.9,-0.7]} s={[16.5,0.95,27.1]} m={mat.cream}/>
      <Block p={[x,15.6,-0.7]} s={[15.4,0.85,26]} m={mat.roof}/>
    </group>)}
    <Windows x={[-18.5,-14,-9.5,9.5,14,18.5]} y={[5,10.8]}
      z={12.6} w={2.25} h={3.8} night={night} hour={hour} seed={10}/>
    <Block p={[0,11.5,0.6]} s={[15.8,21.9,26]} m={mat.slate}/>
    <Block p={[0,11.2,14]} s={[14.4,20.5,2.3]} m={mat.metallic}/>
    <Windows x={[-4.8,0,4.8]} y={[3.45,8.2,12.95,17.7]} z={15.32}
      w={3.73} h={3.75} night={night} hour={hour} seed={18}/>
    <Block p={[0,23.1,0.6]} s={[17.2,1.35,27.2]} m={mat.cream}/>
    <Block p={[0,24,0.6]} s={[16.4,0.6,26.8]} m={mat.roof}/>
    {[-7.5,7.5].map(x=>
      <Block key={x} p={[x,11.35,15.6]} s={[1.2,22.7,1.7]} m={mat.cream}/>)}
    <Block p={[0,23.85,15.3]} s={[18.8,0.7,2.1]} m={mat.trim}/>
    <Block p={[0,24.65,-6]} s={[12.0,1.0,12.8]} m={mat.metallic}/>
    <Block p={[0,25.26,-6]} s={[11.1,0.2,11.6]} m={mat.blue}/>
    {[-3.4,0,3.4].map(x=><Block key={x} p={[x,25.39,-6]}
      s={[0.18,0.16,11.7]} m={mat.trim}/>)}
    <Block p={[0,2.1,18.3]} s={[18.7,0.65,7.2]} m={mat.paving}/>
    {night && <pointLight position={[0,11,19]} color="#ffcb83" intensity={26} distance={31} decay={2}/>}
  </group>;
}

function Tree({ p, scale = 1, alt = false }: { p: P; scale?: number; alt?: boolean }) {
  return <group position={p} scale={scale}>
    <Block p={[0,0.28,0]} s={[2.9,0.55,2.9]} m={mat.cream}/>
    <mesh position={[0,1.45,0]} material={mat.bark} castShadow>
      <cylinderGeometry args={[0.2,0.34,2.7,8]}/>
    </mesh>
    <mesh position={[0,4.2,0]} material={alt ? mat.greenLight : mat.greenDark} castShadow>
      <coneGeometry args={[1.75,7.1,7]}/>
    </mesh>
    <mesh position={[0,5.8,0]} material={mat.green} castShadow>
      <coneGeometry args={[1.12,4.7,7]}/>
    </mesh>
  </group>;
}
function Palm({ p }: { p: P }) {
  return <group position={p}>
    <mesh position={[0,4,0]} material={mat.bark} castShadow>
      <cylinderGeometry args={[0.22,0.42,8,8]}/>
    </mesh>
    {Array.from({length:7},(_,i)=>{
      const a = i * (Math.PI*2/7);
      return <mesh key={i} position={[Math.sin(a)*1.65,8.2,Math.cos(a)*1.65]}
        rotation={[0,a,Math.PI/2+0.45]} material={i%2?mat.green:mat.greenLight} castShadow>
        <coneGeometry args={[0.58,4.5,5]}/>
      </mesh>;
    })}
    <mesh position={[0,8.6,0]} material={mat.greenDark}>
      <sphereGeometry args={[0.75,8,6]}/>
    </mesh>
  </group>;
}
const trees: Array<[number,number,number]> = [
  [-81,-67,1],[-70,-65,1.1],[-25,-67,0.98],[23,-68,1.02],[68,-67,1.16],[82,-64,0.95],
  [-82,66,1.03],[-70,65,1.12],[-25,64,0.94],[24,66,1],[70,66,1.08],[83,65,0.92],
  [-27,-20,0.8],[-26,24,0.77],[27,-20,0.8],[26,22,0.79],
];

function Grounds({ night }: { night: boolean }) {
  return <group>
    <Block p={[0,-2.1,0]} s={[194,4.2,163]} m={mat.base}/>
    <Block p={[0,0.06,0]} s={[191.5,0.22,160.5]} m={mat.paving}/>
    <Block p={[0,0.3,0]} s={[169,0.15,13.5]} m={mat.trim} shadows={false}/>
    <Block p={[0,0.31,0]} s={[12.6,0.15,143]} m={mat.trim} shadows={false}/>
    <Block p={[0,0.41,0]} s={[26,0.18,26]} m={mat.limestone} shadows={false}/>
    {SCHOOLS.map(s=><Block key={s.id}
      p={[s.position[0],0.38,s.position[2]>0?22:-22]}
      s={[7,0.16,22]} m={mat.trim} shadows={false}/>)}
    {/* Water bowl and stone rim in the center of the pedestrian plaza. */}
    <mesh position={[0,0.56,0]} rotation={[-Math.PI/2,0,0]} material={mat.roof}>
      <ringGeometry args={[5.5,6.9,48]}/>
    </mesh>
    <mesh position={[0,0.55,0]} rotation={[-Math.PI/2,0,0]} material={mat.water}>
      <circleGeometry args={[5.5,48]}/>
    </mesh>
    <mesh position={[0,0.62,0]} rotation={[-Math.PI/2,0,0]} material={mat.cream}>
      <ringGeometry args={[1.95,2.3,32]}/>
    </mesh>
    <mesh position={[0,0.61,0]} rotation={[-Math.PI/2,0,0]} material={mat.water}>
      <circleGeometry args={[1.95,32]}/>
    </mesh>
    <mesh position={[0,1.55,0]} material={mat.cream} castShadow>
      <cylinderGeometry args={[0.7,1.2,1.8,12]}/>
    </mesh>
    <mesh position={[0,2.7,0]} material={mat.cream} castShadow>
      <sphereGeometry args={[0.8,14,10]}/>
    </mesh>
    {trees.map(([x,z,s],i)=><Tree key={i} p={[x,0.32,z]} scale={s} alt={i%3===0}/>)}
    {[-20,20].map(x=>[-25,27].map(z=>
      <Palm key={x+":"+z} p={[x,0.33,z]}/>))}
    {[-26,26].map(x=><group key={x} position={[x,0.35,0]}>
      <Block p={[0,0.8,0]} s={[1.3,0.25,4.0]} m={mat.bronze}/>
      <Block p={[0,1.5,-0.5]} s={[0.25,1.1,4.0]} m={mat.bronze}/>
    </group>)}
    {night && <pointLight position={[0,9,0]} intensity={38} color="#ffdbad" distance={35} decay={2}/>}
  </group>;
}

function Building({ id, night, hour, selected, hovered, onSelect, onHover }: {
  id: SchoolId; night: boolean; hour: number; selected: boolean; hovered: boolean;
  onSelect: (id: SchoolId) => void; onHover: (id: SchoolId | null) => void;
}) {
  const school = SCHOOLS.find(s=>s.id===id)!;
  const group = useRef<Group>(null);
  useFrame((_,delta)=>{
    if(group.current) group.current.position.y = MathUtils.damp(
      group.current.position.y, hovered?0.9:0, 7, delta);
  });
  useEffect(()=>()=>{ document.body.style.cursor=""; },[]);
  const over = (e: ThreeEvent<PointerEvent>)=>{
    e.stopPropagation(); onHover(id); document.body.style.cursor="pointer";
  };
  const out = (e: ThreeEvent<PointerEvent>)=>{
    e.stopPropagation(); onHover(null); document.body.style.cursor="";
  };
  return <group position={school.position}>
    {(hovered || selected) && <mesh position={[0,0.49,0]} rotation={[-Math.PI/2,0,0]}>
      <ringGeometry args={[28,29,64]}/>
      <meshBasicMaterial color={night?"#ffd29b":"#bb9058"} transparent opacity={0.58}
        depthWrite={false}/>
    </mesh>}
    <group ref={group} onPointerOver={over} onPointerOut={out}
      onClick={(e)=>{ e.stopPropagation(); onSelect(id); }}>
      {id==="business" && <Business night={night} hour={hour}/>}
      {id==="huss" && <Humanities night={night} hour={hour}/>}
      {id==="sse" && <SSE night={night} hour={hour}/>}
      {id==="library" && <Library night={night} hour={hour}/>}
    </group>
  </group>;
}

function CameraRig({ selected }: { selected: SchoolId | null }) {
  const { camera, size } = useThree();
  const controls=useRef<React.ElementRef<typeof OrbitControls>>(null);
  const moving=useRef(false);
  const target=useMemo(()=>{
    const p=SCHOOLS.find(s=>s.id===selected)?.position;
    return p ? new Vector3(p[0],9,p[2]) : new Vector3(0,5,0);
  },[selected]);
  const destination=useMemo(()=>target.clone().add(
    selected ? new Vector3(49,46,54) : new Vector3(146,123,160)
  ),[selected,target]);
  const zoom=useMemo(()=>
    Math.min(size.width/(selected?115:240),size.height/(selected?100:172)),[size,selected]);
  useEffect(()=>{moving.current=true;},[destination,zoom]);
  useFrame((_,delta)=>{
    if(!controls.current||!moving.current)return;
    const alpha=1-Math.exp(-3.6*delta);
    camera.position.lerp(destination,alpha);
    controls.current.target.lerp(target,alpha);
    if("zoom" in camera && typeof camera.zoom==="number"){
      camera.zoom=MathUtils.lerp(camera.zoom,zoom,alpha);
      camera.updateProjectionMatrix();
    }
    controls.current.update();
    if(camera.position.distanceTo(destination)<0.05 &&
      controls.current.target.distanceTo(target)<0.04 &&
      Math.abs(camera.zoom-zoom)<0.01) moving.current=false;
  });
  return <OrbitControls ref={controls} makeDefault target={[0,5,0]}
    enablePan={false} enableDamping dampingFactor={0.08}
    minDistance={28} maxDistance={360}
    minPolarAngle={0.28} maxPolarAngle={1.43}
    zoomSpeed={0.78} rotateSpeed={0.53}/>;
}

export type Celestial = {sun:P; moon:P; altitude:number; moonAltitude:number};
function Scene({celestial,night,hour,selected,hovered,onSelect,onHover}:{
  celestial:Celestial; night:boolean; hour:number;
  selected:SchoolId|null; hovered:SchoolId|null;
  onSelect:(id:SchoolId)=>void; onHover:(id:SchoolId|null)=>void;
}){
  const dusk=celestial.altitude>-7 && celestial.altitude<9;
  const dayStrength=Math.max(0,Math.sin(Math.max(0,celestial.altitude)*Math.PI/180));
  return <>
    <color attach="background" args={[night?"#101a2d":dusk?"#edcbb9":"#f5f2eb"]}/>
    <fog attach="fog" args={[night?"#101a2d":dusk?"#edcbb9":"#f5f2eb",290,560]}/>
    {night && <Stars radius={350} depth={90} count={1000} factor={2.3}
      saturation={0} fade speed={0}/>}
    {night && celestial.moonAltitude>2 && <mesh position={celestial.moon}>
      <sphereGeometry args={[4,24,24]}/>
      <meshStandardMaterial color="#e5e4de" roughness={1}/>
    </mesh>}
    <hemisphereLight args={[night?"#91add1":"#ffffff","#b49b7b",night?0.9:1.55]}/>
    <ambientLight intensity={night?0.22:0.42}/>
    <directionalLight position={celestial.sun} color={dusk?"#ffd0a4":"#fff7e4"}
      intensity={3.4*dayStrength} castShadow={celestial.altitude>0}
      shadow-mapSize={[3072,3072]} shadow-camera-left={-155}
      shadow-camera-right={155} shadow-camera-top={155} shadow-camera-bottom={-155}
      shadow-camera-near={1} shadow-camera-far={410} shadow-bias={-0.00018}/>
    {night && <directionalLight position={[-90,140,-30]} color="#9cbbef" intensity={1.15}/>}
    <mesh position={[0,-4.27,0]} rotation={[-Math.PI/2,0,0]} receiveShadow>
      <planeGeometry args={[750,750]}/>
      <meshStandardMaterial color={night?"#111e35":"#ece9e2"} roughness={1}/>
    </mesh>
    <Grounds night={night}/>
    {SCHOOLS.map(s=><Building key={s.id} id={s.id} night={night} hour={hour}
      selected={selected===s.id} hovered={hovered===s.id}
      onSelect={onSelect} onHover={onHover}/>)}
    {night && SCHOOLS.map(s=><pointLight key={s.id} position={[s.position[0],14,s.position[2]+11]}
      color={s.id==="sse"?"#a1dfff":"#ffd3a1"}
      intensity={52} distance={35} decay={2}/>)}
    <CameraRig selected={selected}/>
  </>;
}

export default function CampusScene({celestial,night,hour,selected,hovered,onSelect,onHover}:{
  celestial:Celestial; night:boolean; hour:number;
  selected:SchoolId|null; hovered:SchoolId|null;
  onSelect:(id:SchoolId)=>void; onHover:(id:SchoolId|null)=>void;
}){
  return <Canvas orthographic shadows dpr={[1,1.8]}
    camera={{position:[146,123,160],near:0.1,far:900,zoom:4.2}}
    gl={{antialias:true,alpha:false,powerPreference:"high-performance"}}
    onCreated={({gl})=>{
      gl.toneMapping=ACESFilmicToneMapping;
      gl.toneMappingExposure=1.18;
      gl.shadowMap.type=PCFSoftShadowMap;
    }}
    fallback={<p role="status">WebGL is required to explore the 3D campus.</p>}>
    <Scene celestial={celestial} night={night} hour={hour}
      selected={selected} hovered={hovered} onSelect={onSelect} onHover={onHover}/>
  </Canvas>;
}
