"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { buildPlaza, landmarks } from "./plazaScene";
import styles from "./map.module.css";

type Actions = { reset: () => void; top: () => void; zoom: (factor: number) => void };
export default function PlazaMap() {
  const host = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLSpanElement | null)[]>([]);
  const actions = useRef<Actions | null>(null);
  const [error, setError] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); }
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
    scene.background = new THREE.Color("#e9e9df");
    scene.add(new THREE.HemisphereLight("#fff9e9", "#8d826e", 2.1));
    const sun = new THREE.DirectionalLight("#fff1d8", 2.8);
    sun.position.set(-100, 180, 90);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -155, right: 155, top: 155, bottom: -155, near: 1, far: 450 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.normalBias = 0.12;
    scene.add(sun);
    scene.add(buildPlaza());
    const camera = new THREE.OrthographicCamera(-150, 150, 110, -110, 1, 1000);
    camera.position.set(130, 155, 215);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minZoom = 0.65;
    controls.maxZoom = 4;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.target.set(0, 0, 0);
    controls.saveState();
    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      const aspect = w / h;
      const halfHeight = Math.max(115, 115 / aspect);
      camera.left = -halfHeight * aspect; camera.right = halfHeight * aspect;
      camera.top = halfHeight; camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el); resize();
    actions.current = {
      reset: () => controls.reset(),
      top: () => { controls.target.set(0, 0, 0); camera.position.set(0, 300, 0.1); camera.zoom = 1; camera.updateProjectionMatrix(); controls.update(); },
      zoom: factor => { camera.zoom = THREE.MathUtils.clamp(camera.zoom * factor, controls.minZoom, controls.maxZoom); camera.updateProjectionMatrix(); },
    };
    const projected = new THREE.Vector3();
    let frame = 0;
    const draw = () => {
      frame = requestAnimationFrame(draw);
      controls.update();
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
      actions.current = null;
      const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
      scene.traverse(obj => { if (obj instanceof THREE.Mesh) { geometries.add(obj.geometry); for (const mat of Array.isArray(obj.material) ? obj.material : [obj.material]) materials.add(mat); } });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
      sun.shadow.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  return <main className={styles.page}>
    <div className={styles.heading}><div><span className={styles.kicker}>AUC ATLAS / CAMPUS MAP</span><h1>Explore campus</h1><p>New Cairo · Bartlett Plaza</p></div><span className={styles.status}>Early preview</span></div>
    <section className={styles.map} aria-label="Bartlett Plaza map">
      <div ref={host} className={styles.viewport}>
        <div className={styles.labels} hidden={!showLabels}>{landmarks.map((landmark, i) => <span className={styles.pin} key={landmark.name} ref={el => { labels.current[i] = el; }}>{landmark.name}</span>)}</div>
        {error && <div className={styles.fallback}>3D rendering is unavailable in this browser. <a href="https://www.aucegypt.edu/maps">Open AUC’s campus map</a>.</div>}
      </div>
      <div className={styles.location}><span/> Bartlett Plaza <small>Exterior model</small></div>
      <div className={styles.tools}>
        <button onClick={() => actions.current?.zoom(1.25)} aria-label="Zoom in" title="Zoom in">+</button>
        <button onClick={() => actions.current?.zoom(.8)} aria-label="Zoom out" title="Zoom out">−</button>
        <button onClick={() => actions.current?.top()} title="Top-down view">2D</button>
        <button onClick={() => actions.current?.reset()} title="Reset camera">3D</button>
        <button onClick={() => setShowLabels(v => !v)} aria-pressed={showLabels} title="Toggle labels">Aa</button>
      </div>
      <div className={styles.hint}>Drag to rotate · Scroll to zoom · Right-drag to pan<br/>Touch: drag to rotate · Two fingers to pan / zoom</div>
    </section>
    <div className={styles.notes}><div><strong>About this preview</strong><p>Plaza length: 150 m (AUC). Building footprints, heights, paths and elevations are illustrative estimates. Not suitable for navigation yet.</p></div><div><strong>References</strong><p><a href="https://www.aucegypt.edu/giving/named-spaces/plazas-courtyards-and-spaces">AUC plaza dimensions</a> · <a href="https://dir.aucegypt.edu/files/NCmap.pdf">Original campus plan</a> · <a href="https://www.aucegypt.edu/maps">Official campus map</a></p></div></div>
  </main>;
}
