"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { buildPlaza, landmarks } from "./plazaScene";
import styles from "./map.module.css";

function disposeMeshes(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  root.traverse(obj => {
    if (obj instanceof THREE.Mesh) {
      if (obj instanceof THREE.InstancedMesh) obj.dispose();
      geometries.add(obj.geometry);
      for (const material of Array.isArray(obj.material) ? obj.material : [obj.material]) materials.add(material);
    }
  });
  geometries.forEach(g => g.dispose());
  materials.forEach(m => m.dispose());
}

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
    renderer.domElement.setAttribute("aria-label", "Interactive preliminary model of AUC New Cairo campus");
    el.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    renderer.setClearColor(0x000000, 0);
    scene.add(new THREE.HemisphereLight("#fff9e9", "#8d826e", 2.1));
    const sun = new THREE.DirectionalLight("#fff1d8", 2.8);
    sun.position.set(-128, 220, -38);
    sun.target.position.set(-28, 0, -128);
    scene.add(sun.target);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -310, right: 310, top: 310, bottom: -310, near: 1, far: 650 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.normalBias = 0.12;
    scene.add(sun);
    const plaza = buildPlaza();
    scene.add(plaza.root);
    let disposed = false;
    const labelPositions = landmarks.map(landmark => new THREE.Vector3(...landmark.position));
    const libraryLabelIndex = landmarks.findIndex(landmark => landmark.name === "AUC Library");

    // Model's front faces +Z, while the existing campus library faces +X.
    // Rotate the original geometry, fit its long axis to 72 m and ground it.
    // All model materials, meshes and proportions are preserved.
    new GLTFLoader().load("/models/auc-library.glb?v=5bba6a6c", gltf => {
      if (disposed) { disposeMeshes(gltf.scene); return; }
      const library = new THREE.Group();
      library.name = "AUC Library — detailed GLB";
      library.add(gltf.scene);
      library.rotation.y = Math.PI / 2;
      library.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(library);
      const size = bounds.getSize(new THREE.Vector3());
      if (bounds.isEmpty() || !Number.isFinite(size.z) || size.z <= 0) {
        disposeMeshes(library);
        return;
      }
      const scale = 72 / size.z;
      library.scale.setScalar(scale);
      library.updateMatrixWorld(true);
      bounds.setFromObject(library);
      const center = bounds.getCenter(new THREE.Vector3());
      library.position.set(-54 - center.x, .02 - bounds.min.y, -10 - center.z);
      library.traverse(obj => {
        if (obj instanceof THREE.Mesh) { obj.castShadow = true; obj.receiveShadow = true; }
      });
      plaza.root.add(library);
      library.updateMatrixWorld(true);
      bounds.setFromObject(library);
      bounds.getCenter(center);
      if (libraryLabelIndex >= 0) labelPositions[libraryLabelIndex].set(center.x, bounds.max.y + 2, center.z);
      plaza.libraryFallback.visible = false;
    }, undefined, error => {
      if (!disposed) console.warn("AUC Library model could not load; using fallback.", error);
    });
    // The GLB mosaic and sign face +Z; the existing auditorium facade faces -X.
    // Fit the detailed model uniformly within the old main mass's 40 m width.
    const auditoriumLabelIndex = landmarks.findIndex(landmark => landmark.name === "Bassily Auditorium");
    new GLTFLoader().load("/models/bassily-auditorium.glb?v=f77fec6", gltf => {
      if (disposed) { disposeMeshes(gltf.scene); return; }
      const auditorium = new THREE.Group();
      auditorium.name = "Bassily Auditorium — detailed GLB";
      auditorium.add(gltf.scene);
      auditorium.rotation.y = -Math.PI / 2;
      auditorium.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(auditorium);
      const size = bounds.getSize(new THREE.Vector3());
      if (bounds.isEmpty() || !Number.isFinite(size.x) || !Number.isFinite(size.z) || size.x <= 0 || size.z <= 0) {
        disposeMeshes(auditorium);
        return;
      }
      auditorium.scale.setScalar(Math.min(40 / size.x, 50 / size.z));
      auditorium.updateMatrixWorld(true);
      bounds.setFromObject(auditorium);
      const center = bounds.getCenter(new THREE.Vector3());
      auditorium.position.set(79 - center.x, .02 - bounds.min.y, -179 - center.z);
      auditorium.traverse(obj => {
        if (obj instanceof THREE.Mesh) { obj.castShadow = true; obj.receiveShadow = true; }
      });
      plaza.root.add(auditorium);
      auditorium.updateMatrixWorld(true);
      bounds.setFromObject(auditorium);
      bounds.getCenter(center);
      if (auditoriumLabelIndex >= 0) labelPositions[auditoriumLabelIndex].set(center.x, bounds.max.y + 2, center.z);
      plaza.auditoriumFallback.visible = false;
    }, undefined, error => {
      if (!disposed) console.warn("Bassily Auditorium model could not load; using fallback.", error);
    });
    // The uploaded hall's entrance sign faces +Z; the old hall faces +X.
    // Fit it to the approximate 21.5 x 23.5 m campus footprint without distortion.
    const hallLabelIndex = landmarks.findIndex(landmark => landmark.name === "Moataz Al Alfi Hall");
    new GLTFLoader().load("/models/moataz-al-alfi-hall.glb?v=b945caa", gltf => {
      if (disposed) { disposeMeshes(gltf.scene); return; }
      const hall = new THREE.Group();
      hall.name = "Moataz Al Alfi Hall — detailed GLB";
      hall.add(gltf.scene);
      hall.rotation.y = Math.PI / 2;
      hall.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(hall);
      const size = bounds.getSize(new THREE.Vector3());
      if (bounds.isEmpty() || !Number.isFinite(size.x) || !Number.isFinite(size.z) || size.x <= 0 || size.z <= 0) {
        disposeMeshes(hall);
        return;
      }
      hall.scale.setScalar(Math.min(21.5 / size.x, 23.5 / size.z));
      hall.updateMatrixWorld(true);
      bounds.setFromObject(hall);
      const center = bounds.getCenter(new THREE.Vector3());
      hall.position.set(14 - center.x, .02 - bounds.min.y, -198 - center.z);
      hall.traverse(obj => {
        if (obj instanceof THREE.Mesh) { obj.castShadow = true; obj.receiveShadow = true; }
      });
      plaza.root.add(hall);
      hall.updateMatrixWorld(true);
      bounds.setFromObject(hall);
      bounds.getCenter(center);
      if (hallLabelIndex >= 0) labelPositions[hallLabelIndex].set(center.x, bounds.max.y + 2, center.z);
      plaza.hallFallback.visible = false;
    }, undefined, error => {
      if (!disposed) console.warn("Moataz Al Alfi Hall model could not load; using fallback.", error);
    });
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animationStart = performance.now();
    const camera = new THREE.OrthographicCamera(-150, 150, 110, -110, 1, 1000);
    camera.position.set(-28, 205, -485);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minZoom = 0.65;
    controls.maxZoom = 4;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.target.set(-28, 0, -128);
    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      const aspect = w / h;
      const halfHeight = Math.max(250, 220 / aspect);
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
      landmarks.forEach((_, i) => {
        const node = labels.current[i];
        if (!node) return;
        projected.copy(labelPositions[i]).project(camera);
        node.style.visibility = Math.abs(projected.x) > .96 || Math.abs(projected.y) > .94 || projected.z > 1 ? "hidden" : "visible";
        node.style.left = ((projected.x + 1) * 50) + "%";
        node.style.top = ((1 - projected.y) * 50) + "%";
      });
    };
    draw();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame); observer.disconnect(); controls.dispose();
      disposeMeshes(scene);
      sun.shadow.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  return <main className={styles.page}>
    <section className={styles.map} aria-label="AUC campus map">
      <div ref={host} className={styles.viewport}>
        <div className={styles.labels}>{landmarks.map((landmark, i) => <span className={styles.pin} key={landmark.name} ref={el => { labels.current[i] = el; }}>{landmark.name}</span>)}</div>
        {error && <div className={styles.fallback}>3D rendering is unavailable in this browser. <a href="https://www.aucegypt.edu/maps">Open AUC’s campus map</a>.</div>}
      </div>
      <div className={styles.hint}>Drag to rotate · Scroll to zoom · Right-drag to pan<br/>Touch: drag to rotate · Two fingers to pan / zoom</div>
    </section>
  </main>;
}
