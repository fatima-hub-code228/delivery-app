import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeGoldenClocheProps {
  className?: string;
  cameraDistance?: number;
}

export default function ThreeGoldenCloche({ className = 'w-full h-full', cameraDistance = 9 }: ThreeGoldenClocheProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || 300;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, cameraDistance);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Luxury lighting
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfacc15, 2.4);
    dirLight.position.set(5, 8, 6);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0xb8860b, 1.8);
    rimLight.position.set(-6, -4, -3);
    scene.add(rimLight);

    const group = new THREE.Group();
    scene.add(group);

    // Golden cloche dish
    const clocheGeo = new THREE.SphereGeometry(2.2, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const goldMat = new THREE.MeshPhongMaterial({
      color: 0xeab308,
      emissive: 0x3e2305,
      specular: 0xfffbeb,
      shininess: 90,
    });
    const cloche = new THREE.Mesh(clocheGeo, goldMat);
    cloche.position.y = 0.3;
    group.add(cloche);

    // Cloche Handle / Knob
    const knobGeo = new THREE.SphereGeometry(0.35, 24, 24);
    const knob = new THREE.Mesh(knobGeo, goldMat);
    knob.position.y = 2.5;
    group.add(knob);

    // Serving Platter base
    const platterGeo = new THREE.CylinderGeometry(2.9, 3.1, 0.28, 36);
    const darkPlatterMat = new THREE.MeshPhongMaterial({
      color: 0x292524,
      specular: 0xfacc15,
      shininess: 60,
    });
    const platter = new THREE.Mesh(platterGeo, darkPlatterMat);
    platter.position.y = 0.14;
    group.add(platter);

    // Outer Orbit Ring (Order sync orbit)
    const ringGeo = new THREE.TorusGeometry(3.9, 0.04, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.7 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.3;
    group.add(ring);

    // Floating order nodes
    const nodeMat = new THREE.MeshPhongMaterial({ color: 0xfacc15 });
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const node = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), nodeMat);
      node.position.set(Math.cos(angle) * 3.9, Math.sin(angle) * 1.2, Math.sin(angle) * 3.9);
      group.add(node);
    }

    group.rotation.x = 0.2;

    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.4;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.4;
    };
    window.addEventListener('mousemove', onMouseMove);

    const onResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || 300;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    let animationId: number;
    function animate() {
      animationId = requestAnimationFrame(animate);
      group.rotation.y += 0.008;
      group.rotation.x += (mouseY - group.rotation.x + 0.2) * 0.05;
      group.rotation.z += (mouseX - group.rotation.z) * 0.05;
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      clocheGeo.dispose();
      knobGeo.dispose();
      platterGeo.dispose();
      ringGeo.dispose();
      goldMat.dispose();
      darkPlatterMat.dispose();
      ringMat.dispose();
      nodeMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [cameraDistance]);

  return <div ref={mountRef} className={className} />;
}
