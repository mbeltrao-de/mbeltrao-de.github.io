
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Viewer360Props {
  imageUrl: string;
  className?: string;
  fov?: number;
}

const Viewer360: React.FC<Viewer360Props> = ({ imageUrl, className, fov = 75 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  
  // Persistence for orientation - these live as long as the component is mounted
  const lon = useRef(0);
  const lat = useRef(0);
  const phi = useRef(0);
  const theta = useRef(0);
  
  const isUserInteracting = useRef(false);
  const onPointerDownPointerX = useRef(0);
  const onPointerDownPointerY = useRef(0);
  const onPointerDownLon = useRef(0);
  const onPointerDownLat = useRef(0);

  // EFFECT 1: Initialize Three.js Engine (Runs once on mount)
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(fov, width / height, 1, 1100);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Geometry & Persistent Material
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);
    
    // Create material with a placeholder color until texture loads
    const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    materialRef.current = material;
    
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // 3. Interaction Handlers
    const onWindowResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.isPrimary === false) return;
      isUserInteracting.current = true;
      onPointerDownPointerX.current = event.clientX;
      onPointerDownPointerY.current = event.clientY;
      onPointerDownLon.current = lon.current;
      onPointerDownLat.current = lat.current;
      container.style.cursor = 'grabbing';
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.isPrimary === false || !isUserInteracting.current) return;
      lon.current = (onPointerDownPointerX.current - event.clientX) * 0.1 + onPointerDownLon.current;
      lat.current = (event.clientY - onPointerDownPointerY.current) * 0.1 + onPointerDownLat.current;
    };

    const onPointerUp = () => {
      isUserInteracting.current = false;
      container.style.cursor = 'grab';
    };

    const onWheel = (event: WheelEvent) => {
      if (!cameraRef.current) return;
      const newFov = cameraRef.current.fov + event.deltaY * 0.05;
      cameraRef.current.fov = THREE.MathUtils.clamp(newFov, 10, 130);
      cameraRef.current.updateProjectionMatrix();
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('resize', onWindowResize);

    // 4. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
      animationFrameId = requestAnimationFrame(animate);

      lat.current = Math.max(-85, Math.min(85, lat.current));
      phi.current = THREE.MathUtils.degToRad(90 - lat.current);
      theta.current = THREE.MathUtils.degToRad(lon.current);

      const target = new THREE.Vector3();
      target.x = 500 * Math.sin(phi.current) * Math.cos(theta.current);
      target.y = 500 * Math.cos(phi.current);
      target.z = 500 * Math.sin(phi.current) * Math.sin(theta.current);

      cameraRef.current.lookAt(target);
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animate();

    // 5. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('wheel', onWheel);
      
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  // EFFECT 2: Texture Loading / Swapping
  useEffect(() => {
    if (!imageUrl || !materialRef.current) return;

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imageUrl, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      
      const oldTexture = materialRef.current?.map;
      if (materialRef.current) {
        materialRef.current.map = texture;
        materialRef.current.color.set(0xffffff);
        materialRef.current.needsUpdate = true;
      }

      if (oldTexture) oldTexture.dispose();
    });
  }, [imageUrl]);

  // EFFECT 3: FOV Updates
  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.fov = fov;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [fov]);

  return (
    <div 
      ref={containerRef} 
      className={`${className} cursor-grab bg-black overflow-hidden relative`}
    />
  );
};

export default Viewer360;
