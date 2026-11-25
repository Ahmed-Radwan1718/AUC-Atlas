"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { buildPlaza, landmarks } from "./plazaScene";
import styles from "./map.module.css";

export default function PlazaMap() {
  const host = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLSpanElement | null)[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch { setError(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.domElement.setAttribute("aria-label", "Interactive preliminary model of Bartlett Plaza");
    el.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    renderer.setClearColor(0x000000, 0);
    scene.add(new THREE.HemisphereLight("#fff9e9", "#8d826e", 2.1));
    const sun = new THREE.DirectionalLight("#fff1d8", 2.8);
    sun.position.set(-100, 180, 40);
    sun.target.position.set(0, 0, -50);
    scene.add(sun.target);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -220, right: 220, top: 220, bottom: -220, near: 1, far: 450 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.normalBias = 0.12;
    scene.add(sun);
    const plaza = buildPlaza();
    scene.add(plaza.root);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animationStart = performance.now();
    const camera = new THREE.OrthographicCamera(-150, 150, 110, -110, 1, 1000);
    camera.position.set(0, 155, -320);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minZoom = 0.65;
    controls.maxZoom = 4;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.target.set(0, 0, -50);
    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      const aspect = w / h;
      const halfHeight = Math.max(175, 170 / aspect);
      camera.left = -halfHeight * aspect; camera.right = halfHeight * aspect;
      camera.top = halfHeight; camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el); resize();
    const projected = new THREE.Vector3();
    let frame = 0;
    const draw = () => {
      frame = requestAnimationFrame(draw);
      controls.update();
      if (!reducedMotion.matches) plaza.animateWater((performance.now() - animationStart) / 1000);
      renderer.render(scene, camera);
      landmarks.forEach((landmark, i) => {
        const node = labels.current[i];
        if (!node) return;
        projected.set(...landmark.position).project(camera);
        node.style.visibility = Math.abs(projected.x) > .96 || Math.abs(projected.y) > .94 || projected.z > 1 ? "hidden" : "visible";
        node.style.left = ((projected.x + 1) * 50) + "%";
        node.style.top = ((1 - projected.y) * 50) + "%";
      });
    };
    draw();
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); controls.dispose();
      const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
      scene.traverse(obj => { if (obj instanceof THREE.Mesh) { if (obj instanceof THREE.InstancedMesh) obj.dispose(); geometries.add(obj.geometry); for (const mat of Array.isArray(obj.material) ? obj.material : [obj.material]) materials.add(mat); } });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
      sun.shadow.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  return <main className={styles.page}>
    <section className={styles.map} aria-label="Bartlett Plaza map">
      <div ref={host} className={styles.viewport}>
        <div className={styles.labels}>{landmarks.map((landmark, i) => <span className={styles.pin} key={landmark.name} ref={el => { labels.current[i] = el; }}>{landmark.name}</span>)}</div>
        {error && <div className={styles.fallback}>3D rendering is unavailable in this browser. <a href="https://www.aucegypt.edu/maps">Open AUC’s campus map</a>.</div>}
      </div>
      <div className={styles.hint}>Drag to rotate · Scroll to zoom · Right-drag to pan<br/>Touch: drag to rotate · Two fingers to pan / zoom</div>
    </section>
  </main>;
}
