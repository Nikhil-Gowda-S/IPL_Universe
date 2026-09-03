"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface WagonWheelProps {
  data: Array<{ runs: number; angle?: number }>;
  width?: number;
  height?: number;
}

export default function WagonWheel({ data, width = 400, height = 400 }: WagonWheelProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || data.length === 0) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 18);

    // Field
    const fieldGeo = new THREE.CircleGeometry(7, 64);
    const fieldMat = new THREE.MeshBasicMaterial({ color: 0x1a5c1a });
    scene.add(new THREE.Mesh(fieldGeo, fieldMat));

    // Inner circle
    const innerGeo = new THREE.RingGeometry(4.4, 4.6, 48);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
    scene.add(new THREE.Mesh(innerGeo, innerMat));

    // Pitch rectangle
    const pitchGeo = new THREE.PlaneGeometry(0.8, 3);
    const pitchMat = new THREE.MeshBasicMaterial({ color: 0xc8a26d });
    scene.add(new THREE.Mesh(pitchGeo, pitchMat));

    // Shots
    const maxRuns = Math.max(...data.map((d) => d.runs), 1);
    data.forEach((shot, i) => {
      const angle = shot.angle ?? (i / data.length) * Math.PI * 2;
      const length = 1.5 + (shot.runs / maxRuns) * 5;
      const color = shot.runs === 6 ? 0xff6b00 : shot.runs === 4 ? 0xf5a623 : shot.runs >= 2 ? 0x63b3ed : 0xffffff;

      const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.sin(angle) * length, Math.cos(angle) * length, 0)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({ color, opacity: 0.8, transparent: true, linewidth: 2 });
      scene.add(new THREE.Line(lineGeo, lineMat));

      // Dot at end
      const dotGeo = new THREE.CircleGeometry(0.12, 8);
      const dotMat = new THREE.MeshBasicMaterial({ color });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(Math.sin(angle) * length, Math.cos(angle) * length, 0.01);
      scene.add(dot);
    });

    let raf: number;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      scene.rotation.z += 0.002;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [data, width, height]);

  return <div ref={mountRef} style={{ width, height, borderRadius: "50%", overflow: "hidden" }} />;
}
