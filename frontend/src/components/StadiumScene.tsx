"use client";
import Hero3D from "./Hero3D";

export default function StadiumScene() {
  return <Hero3D />;
/*
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    // Scene & Camera
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(0, 18, 32);
    camera.lookAt(0, 0, 0);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x223366, 0.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffeedd, 2.5);
    sunLight.position.set(10, 30, 20);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const orangeLight = new THREE.PointLight(0xff6b00, 2, 60);
    orangeLight.position.set(-15, 10, 0);
    scene.add(orangeLight);

    const blueLight = new THREE.PointLight(0x1a78c2, 1.5, 60);
    blueLight.position.set(15, 10, 0);
    scene.add(blueLight);

    // ── PITCH ─────────────────────────────────────────────────
    const pitchGeo = new THREE.BoxGeometry(3.5, 0.15, 22);
    const pitchMat = new THREE.MeshStandardMaterial({ color: 0xc8a26d, roughness: 0.9 });
    const pitch = new THREE.Mesh(pitchGeo, pitchMat);
    pitch.receiveShadow = true;
    scene.add(pitch);

    // Crease lines
    const creaseGeo = new THREE.BoxGeometry(4, 0.16, 0.08);
    const creaseMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    [-8, 8].forEach((z) => {
      const crease = new THREE.Mesh(creaseGeo, creaseMat);
      crease.position.set(0, 0.01, z);
      scene.add(crease);
    });

    // ── OUTFIELD ───────────────────────────────────────────────
    const fieldGeo = new THREE.CircleGeometry(28, 64);
    const fieldMat = new THREE.MeshStandardMaterial({ color: 0x1a5c1a, roughness: 0.9, side: THREE.DoubleSide });
    const field = new THREE.Mesh(fieldGeo, fieldMat);
    field.rotation.x = -Math.PI / 2;
    field.receiveShadow = true;
    scene.add(field);

    // Inner circle ring
    const ringGeo = new THREE.RingGeometry(13.5, 14, 64);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xffffff, opacity: 0.5, transparent: true, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    scene.add(ring);

    // ── STUMPS ─────────────────────────────────────────────────
    const stumpGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8);
    const stumpMat = new THREE.MeshStandardMaterial({ color: 0xffe0b2 });
    [-0.15, 0, 0.15].forEach((x) => {
      [-8, 8].forEach((z) => {
        const s = new THREE.Mesh(stumpGeo, stumpMat);
        s.position.set(x, 0.4, z);
        s.castShadow = true;
        scene.add(s);
      });
    });

    // ── STADIUM STANDS (arc of boxes) ─────────────────────────
    const standColors = [0x1a1a2e, 0x16213e, 0x0f3460, 0x1a1a2e];
    for (let tier = 0; tier < 4; tier++) {
      const radius = 28 + tier * 4;
      const height = 3 + tier * 2;
      const segments = 48;
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const bGeo = new THREE.BoxGeometry(3.2, height, 2.5);
        const bMat = new THREE.MeshStandardMaterial({
          color: standColors[tier],
          roughness: 0.6,
        });
        const b = new THREE.Mesh(bGeo, bMat);
        b.position.set(
          Math.cos(angle) * radius,
          height / 2,
          Math.sin(angle) * radius
        );
        b.rotation.y = -angle;
        b.castShadow = true;
        scene.add(b);
      }
    }

    // ── FLOODLIGHTS ────────────────────────────────────────────
    const poleGeo = new THREE.CylinderGeometry(0.2, 0.3, 30, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const lightAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    lightAngles.forEach((angle) => {
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(Math.cos(angle) * 40, 15, Math.sin(angle) * 40);
      scene.add(pole);
      // Light cluster
      const headGeo = new THREE.BoxGeometry(3, 0.5, 1.5);
      const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff8e7, emissiveIntensity: 0.5 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(Math.cos(angle) * 40, 30.5, Math.sin(angle) * 40);
      scene.add(head);
      const fl = new THREE.SpotLight(0xffeedd, 3, 80, Math.PI / 5, 0.4);
      fl.position.set(Math.cos(angle) * 40, 30, Math.sin(angle) * 40);
      fl.target.position.set(0, 0, 0);
      scene.add(fl);
      scene.add(fl.target);
    });

    // ── FLOATING IPL TROPHY ────────────────────────────────────
    const trophyGroup = new THREE.Group();
    const cupGeo = new THREE.CylinderGeometry(1, 0.5, 2.5, 16);
    const cupMat = new THREE.MeshStandardMaterial({ color: 0xf5a623, metalness: 0.9, roughness: 0.1 });
    const cup = new THREE.Mesh(cupGeo, cupMat);
    trophyGroup.add(cup);
    const baseGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 16);
    const base = new THREE.Mesh(baseGeo, cupMat);
    base.position.y = -1.45;
    trophyGroup.add(base);
    trophyGroup.position.set(0, 8, 0);
    scene.add(trophyGroup);

    // Orbit controls simulation
    let mouseX = 0, mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Resize
    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Animation loop
    let raf: number;
    const startTime = performance.now();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = (performance.now() - startTime) / 1000;

      // Trophy float
      trophyGroup.position.y = 8 + Math.sin(t * 1.2) * 0.6;
      trophyGroup.rotation.y = t * 0.5;

      // Camera gentle orbit following mouse
      camera.position.x += (mouseX * 8 - camera.position.x) * 0.03;
      camera.position.y += (-mouseY * 4 + 18 - camera.position.y) * 0.03;
      camera.lookAt(0, 2, 0);

      // Orange light pulse
      orangeLight.intensity = 2 + Math.sin(t * 2) * 0.5;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }} />;
*/}
