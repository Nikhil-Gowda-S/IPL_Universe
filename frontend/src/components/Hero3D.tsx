"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

function addWickets(scene: THREE.Scene, z: number, color: number) {
  const glow = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.5 });
  [-0.18, 0, 0.18].forEach((x) => {
    const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.72, 10), glow);
    stump.position.set(x, 0.38, z); scene.add(stump);
  });
  [-0.09, 0.09].forEach((x) => { const bail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.035), glow); bail.position.set(x, 0.76, z); scene.add(bail); });
}

export default function Hero3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mount = mountRef.current; if (!mount) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setSize(mount.clientWidth, mount.clientHeight); renderer.setClearColor(0x000000, 0); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.35; mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x07111f, 35, 100);
    const camera = new THREE.PerspectiveCamera(48, mount.clientWidth / mount.clientHeight, 0.1, 150); camera.position.set(17, 13, 27);
    const controls = new OrbitControls(camera, renderer.domElement); controls.target.set(0, 3, 0); controls.enablePan = false; controls.enableZoom = true; controls.minDistance = 18; controls.maxDistance = 48; controls.update();
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const sun = new THREE.DirectionalLight(0xfff1d2, 2.5); sun.position.set(14, 25, 12); scene.add(sun);
    [[0xffcc00, -13, 8, 4], [0x1a78c2, 13, 9, 3], [0xe63946, 0, 12, -13]].forEach(([color, x, y, z]) => { const l = new THREE.PointLight(color as number, 3, 45); l.position.set(x as number, y as number, z as number); scene.add(l); });
    const field = new THREE.Mesh(new THREE.CylinderGeometry(25, 25, 0.3, 80), new THREE.MeshStandardMaterial({ color: 0x0b4f31, roughness: 0.82 })); field.position.y = -0.2; scene.add(field);
    const boundary = new THREE.Mesh(new THREE.TorusGeometry(23, 0.07, 8, 96), new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xa76b00, emissiveIntensity: 1.3 })); boundary.rotation.x = Math.PI / 2; scene.add(boundary);
    const pitch = new THREE.Mesh(new THREE.BoxGeometry(3.25, 0.16, 19), new THREE.MeshStandardMaterial({ color: 0xc89a5a, roughness: 0.7 })); pitch.position.y = 0.02; scene.add(pitch); addWickets(scene, -7.3, 0xff3355); addWickets(scene, 7.3, 0x20dcff);
    for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; const block = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3 + (i % 3), 2.2), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x13294b : 0x1c2440, roughness: 0.55 })); block.position.set(Math.cos(a) * 29, 1.7, Math.sin(a) * 29); block.rotation.y = -a; scene.add(block); }
    const trophy = new THREE.Group(); const gold = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.15, envMapIntensity: 2 });
    trophy.add(new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0.65, -0.8), new THREE.Vector2(1.35, -0.35), new THREE.Vector2(1.5, 0.6), new THREE.Vector2(1.08, 1.3), new THREE.Vector2(0.62, 1.5)], 36), gold));
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.36, 0.85, 24), gold); stem.position.y = -1.2; trophy.add(stem); const base = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.4, 0.38, 32), gold); base.position.y = -1.75; trophy.add(base);
    [-1, 1].forEach((side) => { const handle = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.1, 10, 24, Math.PI), gold); handle.position.set(side * 1.24, 0.45, 0); handle.rotation.y = side * Math.PI / 2; trophy.add(handle); }); trophy.position.set(0, 7, 0); trophy.scale.setScalar(1.45); scene.add(trophy);
    const sparkles = new THREE.Group(); const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xffe680 }); for (let i = 0; i < 70; i++) { const star = new THREE.Mesh(new THREE.SphereGeometry(0.035 + (i % 3) * 0.02, 8, 8), sparkleMat); const a = i * 2.4, r = 3.2 + (i % 9) * 0.28; star.position.set(Math.cos(a) * r, 7 + ((i % 11) - 5) * 0.35, Math.sin(a) * r); sparkles.add(star); } scene.add(sparkles);
    const resize = () => { camera.aspect = mount.clientWidth / mount.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(mount.clientWidth, mount.clientHeight); }; window.addEventListener("resize", resize);
    const timer = new THREE.Timer(); timer.connect(document); let frame = 0; const animate = (time: number) => { frame = requestAnimationFrame(animate); timer.update(time); const t = timer.getElapsed(); trophy.rotation.y = t * 0.28; trophy.position.y = 7 + Math.sin(t * 1.25) * 0.42; sparkles.rotation.y = -t * 0.18; sparkles.position.y = Math.sin(t) * 0.15; controls.update(); renderer.render(scene, camera); }; animate(performance.now());
    return () => { cancelAnimationFrame(frame); timer.disconnect(); timer.dispose(); window.removeEventListener("resize", resize); controls.dispose(); renderer.dispose(); mount.removeChild(renderer.domElement); };
  }, []);
  return <div ref={mountRef} aria-label="Interactive 3D IPL trophy and stadium" style={{ width: "100%", height: "100%", position: "absolute", inset: 0, cursor: "grab" }} />;
}
