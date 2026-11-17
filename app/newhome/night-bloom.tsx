"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending, ClampToEdgeWrapping, Color, DataTexture,
  DoubleSide, LinearFilter, RGBAFormat, UnsignedByteType, Vector2,
} from "three";
import type { Vector3Tuple } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

// One shared radial alpha texture: unlike a tinted transparent rectangle, this
// fades smoothly into nearby stone and around window frames. No image requests.
const HALO_SIZE = 64;
function makeHaloTexture() {
  const bytes = new Uint8Array(HALO_SIZE * HALO_SIZE * 4);
  for (let y = 0; y < HALO_SIZE; y++) {
    for (let x = 0; x < HALO_SIZE; x++) {
      const nx = (x + 0.5 - HALO_SIZE / 2) / (HALO_SIZE / 2);
      const ny = (y + 0.5 - HALO_SIZE / 2) / (HALO_SIZE / 2);
      const r2 = nx * nx + ny * ny;
      const gaussian = Math.exp(-4.5 * r2);
      const alpha = Math.max(0, (gaussian - Math.exp(-4.5)) / (1 - Math.exp(-4.5)));
      const idx = (y * HALO_SIZE + x) * 4;
      bytes[idx] = 255;
      bytes[idx + 1] = 255;
      bytes[idx + 2] = 255;
      bytes[idx + 3] = Math.round(alpha * 255);
    }
  }
  const tex = new DataTexture(bytes, HALO_SIZE, HALO_SIZE, RGBAFormat, UnsignedByteType);
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearFilter;
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}
const HALO_TEXTURE = makeHaloTexture();

export function WindowHalo({
  position, width, height, brightness,
}: {
  position: Vector3Tuple;
  width: number;
  height: number;
  brightness: number;
}) {
  if (brightness < 0.02) return null;
  return <mesh position={position} raycast={() => null} renderOrder={3}>
    <planeGeometry args={[width, height]}/>
    <meshBasicMaterial
      map={HALO_TEXTURE}
      color="#ffbb69"
      transparent
      opacity={Math.min(0.11, brightness * 0.085)}
      depthWrite={false}
      depthTest
      toneMapped={false}
      side={DoubleSide}
      blending={AdditiveBlending}
    />
  </mesh>;
}

// Real localized light spill: the nearby sandstone and columns receive amber
// illumination while the rest of the campus keeps its nighttime palette.
// Just two unshadowed point lights per building, rather than one per window.
export function FacadeLights({
  night, positions, intensity = 24, range = 19,
}: {
  night: number;
  positions: Vector3Tuple[];
  intensity?: number;
  range?: number;
}) {
  if (night < 0.02) return null;
  return <>
    {positions.map((p,i)=><pointLight key={i} position={p}
      color="#ffc078" intensity={night * intensity}
      distance={range} decay={2} />)}
  </>;
}

/**
 * Restrained HDR bloom focused on bright emissive windows:
 * - the high threshold leaves stone, roads, moon, and UI unaffected
 * - warm HDR emissive window pixels generate a photographic soft halo
 * - the effect is disabled during the day
 * - no third-party rendering dependency is needed
 */
export default function NightBloom({enabled}: {enabled: boolean}) {
  const {gl, scene, camera, size} = useThree();
  const post = useMemo(() => {
    const composer = new EffectComposer(gl);
    composer.setPixelRatio(gl.getPixelRatio());
    const bloom = new UnrealBloomPass(
      new Vector2(size.width, size.height),
      0.26, // subtle bloom, not a campus-wide orange fog
      0.27, // tight softness, limited to individual windows
      1.95, // suppress spill from non-emissive stone and walkways
    );
    const render = new RenderPass(scene, camera);
    composer.addPass(render);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    return {composer, bloom};
  }, [gl, scene, camera]);

  useEffect(() => {
    post.composer.setSize(size.width, size.height);
  }, [post, size.width, size.height]);

  useEffect(() => () => { post.composer.dispose(); }, [post]);

  // Own the frame exactly once; preserve a normal, fast renderer by day.
  useFrame(({gl: renderer, scene: world, camera: cam}, delta) => {
    if (enabled) {
      post.composer.render(delta);
    } else {
      renderer.render(world, cam);
    }
  }, 1);
  return null;
}
