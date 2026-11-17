"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Color, DoubleSide, InstancedMesh, MathUtils, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, Object3D, QuadraticBezierCurve3, Vector3,
} from "three";

type Position = [number, number, number];
type FountainProps = { position: Position; night: number };

const OUTER_JETS = 8;
const INNER_JETS = 4;
const DROPLETS_PER_JET = 9;

// Water follows parabolic gravity-like trajectories from fixed nozzles back
// into the basin. Curves and tube geometries are built once, not per frame.
function makeJets() {
  const jets: QuadraticBezierCurve3[] = [];
  for (let i = 0; i < OUTER_JETS; i++) {
    const angle = i * Math.PI * 2 / OUTER_JETS;
    const x = Math.cos(angle), z = Math.sin(angle);
    jets.push(new QuadraticBezierCurve3(
      new Vector3(x * 4.55, 1.74, z * 4.55),
      new Vector3(x * 3.15, 7.7, z * 3.15),
      new Vector3(x * 0.95, 1.42, z * 0.95),
    ));
  }
  for (let i = 0; i < INNER_JETS; i++) {
    const angle = (i + 0.5) * Math.PI * 2 / INNER_JETS;
    const x = Math.cos(angle), z = Math.sin(angle);
    jets.push(new QuadraticBezierCurve3(
      new Vector3(x * 0.45, 2.06, z * 0.45),
      new Vector3(x * 2.0, 8.55, z * 2.0),
      new Vector3(x * 4.15, 1.42, z * 4.15),
    ));
  }
  return jets;
}

export default function Fountain({ position, night }: FountainProps) {
  const jets = useMemo(makeJets, []);
  const spray = useRef<InstancedMesh>(null);
  const ripples = useRef<(Mesh | null)[]>([]);
  const reducedMotion = useRef(false);
  const simulationTime = useRef(0);
  const dummy = useMemo(() => new Object3D(), []);
  const timeUniform = useMemo(() => ({ value: 0 }), []);

  const poolMaterial = useMemo(() => {
    const material = new MeshStandardMaterial({
      color: new Color("#4a91ad"),
      metalness: 0.12,
      roughness: 0.26,
      side: DoubleSide,
      transparent: true,
      opacity: 0.95,
    });
    // Subtle intersecting traveling ripples on the reflective pool surface.
    // This moves only the vertices, keeping standard lights and tone mapping.
    material.onBeforeCompile = shader => {
      shader.uniforms.uFountainTime = timeUniform;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        "#include <common>\nuniform float uFountainTime;",
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        float r = length(position.xy);
        float swell = sin(r * 5.4 - uFountainTime * 4.6) * 0.034;
        float crossWave = sin(position.x * 2.4 + position.y * 1.6 + uFountainTime * 2.0) * 0.018;
        transformed.z += swell + crossWave;`,
      );
    };
    material.customProgramCacheKey = () => "atlas-fountain-water-v1";
    return material;
  }, [timeUniform]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { reducedMotion.current = mq.matches; };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => () => { poolMaterial.dispose(); }, [poolMaterial]);

  useFrame((_, delta) => {
    if (!reducedMotion.current) {
      simulationTime.current += Math.min(delta, 0.05);
    }
    const t = simulationTime.current;
    timeUniform.value = t;

    // Continuous packets of water travel along each visible water stream.
    // One instanced draw call handles all 108 droplets.
    if (spray.current) {
      for (let i = 0; i < jets.length; i++) {
        const jet = jets[i];
        for (let j = 0; j < DROPLETS_PER_JET; j++) {
          const phase = ((j / DROPLETS_PER_JET + t * (0.37 + i % 3 * 0.023)) % 1);
          const point = jet.getPoint(phase);
          dummy.position.copy(point);
          const size = 0.66 + 0.3 * Math.sin(j * 2.2 + i);
          dummy.scale.setScalar(size);
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          spray.current.setMatrixAt(i * DROPLETS_PER_JET + j, dummy.matrix);
        }
      }
      spray.current.instanceMatrix.needsUpdate = true;
    }

    // Concentric ripples expand and fade where water returns to the pool.
    ripples.current.forEach((ring, i) => {
      if (!ring) return;
      const phase = (t * 0.37 + i / 3) % 1;
      const radiusScale = 0.7 + phase * 7.2;
      ring.scale.setScalar(radiusScale);
      const material = ring.material as MeshBasicMaterial;
      material.opacity = 0.28 * (1 - phase) ** 1.3;
    });
  });

  return <group position={position}>
    {/* Plinth fits inside the existing seven-unit center circle of the plaza. */}
    <mesh position={[0,0.38,0]} receiveShadow castShadow>
      <cylinderGeometry args={[7.08,7.28,0.28,72]}/>
      <meshStandardMaterial color="#c6beb3" roughness={0.88}/>
    </mesh>
    <mesh position={[0,1.02,0]} castShadow receiveShadow>
      <cylinderGeometry args={[6.52,6.72,0.92,72,1,true]}/>
      <meshStandardMaterial color="#ded9d0" roughness={0.77} side={DoubleSide}/>
    </mesh>
    <mesh position={[0,1.24,0]} receiveShadow>
      <cylinderGeometry args={[6.45,6.45,0.12,72]}/>
      <meshStandardMaterial color="#315766" roughness={0.35} metalness={0.12}/>
    </mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,1.5,0]}
      castShadow receiveShadow>
      <torusGeometry args={[6.48,0.34,12,80]}/>
      <meshStandardMaterial color="#f0e7d8" roughness={0.6}/>
    </mesh>
    {/* The flat radial mesh has interior vertices for gently moving wavelets. */}
    <mesh position={[0,1.385,0]} rotation={[-Math.PI/2,0,0]}
      material={poolMaterial}>
      <ringGeometry args={[0.53,6.2,96,18]}/>
    </mesh>
    <mesh position={[0,1.62,0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.66,0.93,0.74,24]}/>
      <meshStandardMaterial color="#d4c8b8" roughness={0.74}/>
    </mesh>
    <mesh position={[0,2.02,0]}>
      <cylinderGeometry args={[0.48,0.66,0.18,24]}/>
      <meshStandardMaterial color="#b9a189" roughness={0.42} metalness={0.18}/>
    </mesh>

    {/* Bronze nozzles around the basin and bright, thin parabolic water arcs. */}
    {jets.map((jet, i) => {
      const start = jet.getPoint(0);
      return <group key={i}>
        {i < OUTER_JETS && <mesh position={[start.x,1.54,start.z]}>
          <cylinderGeometry args={[0.19,0.23,0.30,10]}/>
          <meshStandardMaterial color="#aa9882" metalness={0.32} roughness={0.43}/>
        </mesh>}
        <mesh>
          <tubeGeometry args={[jet,40,i < OUTER_JETS ? 0.082 : 0.11,7,false]}/>
          <meshStandardMaterial color={night>0.5?"#7caaba":"#83c9df"}
            metalness={0.10} roughness={0.24} transparent opacity={0.84}
            depthWrite={false}/>
        </mesh>
      </group>;
    })}

    <instancedMesh ref={spray}
      args={[undefined,undefined,(OUTER_JETS+INNER_JETS)*DROPLETS_PER_JET]}
      frustumCulled={false} raycast={() => null}>
      <sphereGeometry args={[0.11,7,6]}/>
      <meshStandardMaterial color={night>0.5?"#a1d0de":"#b4ecf7"}
        roughness={0.2} transparent opacity={0.86} depthWrite={false}/>
    </instancedMesh>

    {[0,1,2].map(i=>
      <mesh key={i} ref={node=>{ ripples.current[i] = node; }}
        position={[0,1.414,0]} rotation={[-Math.PI/2,0,0]}
        raycast={() => null}>
        <torusGeometry args={[0.76,0.025,5,64]}/>
        <meshBasicMaterial color="#b8e3ed" transparent opacity={0.15}
          depthWrite={false} toneMapped/>
      </mesh>
    )}
    {/* Low-intensity local illumination only; no bloom cards or bright sprites. */}
    {night > 0.02 && <pointLight position={[0,2.8,0]}
      color="#87c9e4" intensity={night*3.2} distance={13} decay={2}/>}
  </group>;
}
