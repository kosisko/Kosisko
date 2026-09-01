'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface Spatial3DCanvasProps {
  activeModule?: string;
}

export default function Spatial3DCanvas({ activeModule = 'iot_telemetry' }: Spatial3DCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5.2;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const particleCount = 3000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);

    let themeColor = 0x00f3ff; // Default Cyan

    // 2. Module Specific Particle Shape Generation
    if (activeModule === 'crm_leads') {
      // --- CRM LEADS: PARTICLE FUNNEL / TORNADO ---
      themeColor = 0x00ffcc; // Emerald/Teal
      const height = 3.5;

      for (let i = 0; i < particleCount; i++) {
        const y = (Math.random() - 0.5) * height; // Top to bottom [-1.75 to 1.75]
        const normY = (y + height / 2) / height; // [0 to 1]
        const radius = 0.3 + normY * 1.8 + (Math.random() - 0.5) * 0.2; // Funnel widening
        const angle = Math.random() * Math.PI * 2;

        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        originalPositions[i * 3] = x;
        originalPositions[i * 3 + 1] = y;
        originalPositions[i * 3 + 2] = z;
      }
    } else if (activeModule === 'billing_desk') {
      // --- BILLING DESK: DUAL TORUS RINGS (REVENUE DESK) ---
      themeColor = 0xffd700; // Gold
      const R1 = 2.0, r1 = 0.4;

      for (let i = 0; i < particleCount; i++) {
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI * 2;

        const x = (R1 + r1 * Math.cos(v)) * Math.cos(u);
        const y = (R1 + r1 * Math.cos(v)) * Math.sin(u);
        const z = r1 * Math.sin(v) + (Math.random() - 0.5) * 0.1;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        originalPositions[i * 3] = x;
        originalPositions[i * 3 + 1] = y;
        originalPositions[i * 3 + 2] = z;
      }
    } else if (activeModule === 'agentic_ai') {
      // --- AGENTIC AI: HYPER ICOSAHEDRON NEURAL MATRIX ---
      themeColor = 0xff007f; // Neon Pink
      const icoGeo = new THREE.IcosahedronGeometry(2.2, 2);
      const posAttr = icoGeo.attributes.position;
      const count = posAttr.count;

      for (let i = 0; i < particleCount; i++) {
        const vertIndex = i % count;
        const x = posAttr.getX(vertIndex) + (Math.random() - 0.5) * 0.15;
        const y = posAttr.getY(vertIndex) + (Math.random() - 0.5) * 0.15;
        const z = posAttr.getZ(vertIndex) + (Math.random() - 0.5) * 0.15;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        originalPositions[i * 3] = x;
        originalPositions[i * 3 + 1] = y;
        originalPositions[i * 3 + 2] = z;
      }
      icoGeo.dispose();
    } else {
      // --- IOT TELEMETRY: WAVE PARTICLE SPHERE ---
      themeColor = 0x00f3ff; // Cyan
      const radius = 2.2;

      for (let i = 0; i < particleCount; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);

        const r = radius + (Math.random() - 0.5) * 0.25;
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        originalPositions[i * 3] = x;
        originalPositions[i * 3 + 1] = y;
        originalPositions[i * 3 + 2] = z;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Particle Material
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.038,
      color: themeColor,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(geometry, particleMaterial);
    group.add(particleSystem);

    // Inner Wireframe Core matching Module Shape
    let coreGeo: THREE.BufferGeometry;
    if (activeModule === 'crm_leads') coreGeo = new THREE.CylinderGeometry(1.2, 0.2, 2.5, 12, 1, true);
    else if (activeModule === 'billing_desk') coreGeo = new THREE.TorusGeometry(1.4, 0.2, 12, 40);
    else if (activeModule === 'agentic_ai') coreGeo = new THREE.IcosahedronGeometry(1.5, 1);
    else coreGeo = new THREE.SphereGeometry(1.4, 16, 16);

    const coreMat = new THREE.MeshBasicMaterial({
      color: themeColor,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    // 3. Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (event: MouseEvent) => {
      const rect = currentMount.getBoundingClientRect();
      mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 4. Resize Handler
    const handleResize = () => {
      if (!currentMount) return;
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // 5. Unique Animation Loop for Each Module
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Continuous Module-based Animation
      if (activeModule === 'crm_leads') {
        // Tornado Swirl Motion
        group.rotation.y = elapsedTime * 0.4 + mouseX * 0.5;
        group.rotation.x = Math.sin(elapsedTime * 0.2) * 0.15 + mouseY * 0.2;
      } else if (activeModule === 'billing_desk') {
        // Gyroscope Ring Motion
        group.rotation.x = elapsedTime * 0.3 + mouseY * 0.4;
        group.rotation.y = elapsedTime * 0.5 + mouseX * 0.4;
      } else if (activeModule === 'agentic_ai') {
        // Pulsating AI Motion
        group.rotation.y = elapsedTime * 0.2 + mouseX * 0.5;
        group.rotation.z = Math.cos(elapsedTime * 0.2) * 0.2;
        const scale = 1 + Math.sin(elapsedTime * 3) * 0.05;
        group.scale.set(scale, scale, scale);
      } else {
        // IoT Sphere Wave
        group.rotation.y = elapsedTime * 0.15 + mouseX * 0.5;
        group.rotation.x = Math.sin(elapsedTime * 0.1) * 0.2 + mouseY * 0.3;
      }

      // Particle Wave Displacement Animation
      const posAttr = geometry.attributes.position;
      for (let i = 0; i < particleCount; i++) {
        const x = originalPositions[i * 3];
        const y = originalPositions[i * 3 + 1];
        const z = originalPositions[i * 3 + 2];

        let wave = Math.sin(elapsedTime * 2 + x * 2 + y * 2) * 0.06;
        if (activeModule === 'crm_leads') {
          wave = Math.sin(elapsedTime * 4 + y * 3) * 0.05; // Upward spiral wave
        }

        posAttr.setXYZ(
          i,
          x + (x / 2) * wave,
          y + (y / 2) * wave,
          z + (z / 2) * wave
        );
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    // 6. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      particleMaterial.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      renderer.dispose();
    };
  }, [activeModule]);

  // Title label matching module
  let titleLabel = '3D Spatial Wave Matrix';
  if (activeModule === 'crm_leads') titleLabel = 'CRM Funnel Leads Particle Stream';
  else if (activeModule === 'billing_desk') titleLabel = 'Revenue Torus Rings Stream';
  else if (activeModule === 'agentic_ai') titleLabel = 'Agentic AI Hyper-Matrix Particles';

  return (
    <div className="w-full h-full min-h-[260px] relative rounded-2xl overflow-hidden bg-slate-950/80 border border-cyan-500/20">
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-full border border-cyan-500/30 text-[11px] font-bold text-cyan-300 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
        {titleLabel}
      </div>
      <div ref={mountRef} className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing" />
    </div>
  );
}