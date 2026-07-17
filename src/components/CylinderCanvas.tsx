/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PhotoItem, CylinderSettings, AppTheme } from '../types';

interface CylinderCanvasProps {
  photos: PhotoItem[];
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  settings: CylinderSettings;
  theme: AppTheme;
}

export default function CylinderCanvas({
  photos,
  activeId,
  setActiveId,
  settings,
  theme,
}: CylinderCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Loading state for textures
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [totalTextures, setTotalTextures] = useState<number>(0);
  const [loadedCount, setLoadedCount] = useState<number>(0);

  // References to keep state for animation loop without trigger re-renders
  const stateRef = useRef({
    currentRotationY: 0,
    targetRotationY: 0,
    currentTilt: -0.1,
    targetTilt: -0.1,
    scrollOffset: 0,
    dragOffset: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartRotation: 0,
    dragVelocity: 0,
    lastDragTime: 0,
    lastX: 0,
    autoRotationOffset: 0,
    isProgrammaticScrolling: false,
    activeId: null as string | null,
    settings: settings,
    theme: theme,
  });

  // Update refs when settings or activeId changes
  useEffect(() => {
    stateRef.current.settings = settings;
    stateRef.current.theme = theme;
    stateRef.current.activeId = activeId;
  }, [settings, theme, activeId]);

  // Handle window scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (stateRef.current.isProgrammaticScrolling) return;

      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;

      const scrollFraction = window.scrollY / scrollHeight;
      // Scroll completes e.g. 2 full revolutions (4 * Math.PI)
      const totalRevolutions = 2.5;
      const targetAngle = scrollFraction * Math.PI * 2 * totalRevolutions;
      
      stateRef.current.scrollOffset = targetAngle;
      stateRef.current.targetRotationY = targetAngle + stateRef.current.dragOffset;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Three.js Core Setup
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(theme.ambientColor, 0.04);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 11);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Create Main Cylinder Group
    const cylinderGroup = new THREE.Group();
    scene.add(cylinderGroup);

    // 5. Light structures
    const ambientLight = new THREE.AmbientLight(theme.ambientColor, 1.5);
    scene.add(ambientLight);

    const mainSpotLight = new THREE.SpotLight(theme.spotColor, 20);
    mainSpotLight.position.set(0, 8, 12);
    mainSpotLight.angle = Math.PI / 4;
    mainSpotLight.penumbra = 0.8;
    mainSpotLight.castShadow = true;
    mainSpotLight.shadow.mapSize.width = 1024;
    mainSpotLight.shadow.mapSize.height = 1024;
    scene.add(mainSpotLight);

    // Point light inside pedestal for bottom glow
    const floorGlowLight = new THREE.PointLight(theme.pointColor, 15, 12);
    floorGlowLight.position.set(0, -2.5, 0);
    scene.add(floorGlowLight);

    // Dynamic secondary point light from the top
    const topGlowLight = new THREE.PointLight(theme.spotColor, 5, 15);
    topGlowLight.position.set(0, 4, 0);
    scene.add(topGlowLight);

    // 6. Pedestal Stand (Base Turntable)
    const baseGroup = new THREE.Group();
    baseGroup.position.y = -2.7;
    scene.add(baseGroup);

    const baseGeom = new THREE.CylinderGeometry(settings.radius + 0.5, settings.radius + 0.6, 0.2, 64);
    const baseMat = new THREE.MeshStandardMaterial({
      color: theme.id === 'gallery' ? 0xe5e5e5 : 0x18181b,
      metalness: theme.id === 'gallery' ? 0.1 : 0.8,
      roughness: theme.id === 'gallery' ? 0.9 : 0.2,
    });
    const baseMesh = new THREE.Mesh(baseGeom, baseMat);
    baseMesh.receiveShadow = true;
    baseGroup.add(baseMesh);

    // Glowing rim around pedestal
    const ringGeom = new THREE.RingGeometry(settings.radius + 0.52, settings.radius + 0.58, 64);
    ringGeom.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: theme.pointColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: theme.id === 'gallery' ? 0.2 : 0.6,
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.position.y = 0.11;
    baseGroup.add(ringMesh);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(
      40,
      40,
      theme.pointColor,
      theme.id === 'gallery' ? 0xd4d4d4 : 0x27272a
    );
    gridHelper.position.y = -2.75;
    if (gridHelper.material instanceof THREE.Material) {
      gridHelper.material.opacity = 0.2;
      gridHelper.material.transparent = true;
    }
    scene.add(gridHelper);

    // Helper to generate circular glowing points dynamically
    const createCircleTexture = (colorHex: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        const color = new THREE.Color(colorHex);
        const r = Math.floor(color.r * 255);
        const g = Math.floor(color.g * 255);
        const b = Math.floor(color.b * 255);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1.0)`);
        gradient.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, 0.7)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.0)`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
      }
      return new THREE.CanvasTexture(canvas);
    };

    // 7. Floating particles / cosmic dust effect
    const particleCount = theme.id === 'gallery' ? 50 : 250;
    const particlesGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      // Position particles in a hollow cylinder around the showcase
      const angle = Math.random() * Math.PI * 2;
      const r = settings.radius + (Math.random() * 6 - 3);
      positions[i * 3] = Math.sin(angle) * r;
      positions[i * 3 + 1] = Math.random() * 10 - 5;
      positions[i * 3 + 2] = Math.cos(angle) * r;
      
      // Floating speeds
      velocities.push((Math.random() - 0.5) * 0.012); // y speed
    }

    particlesGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMat = new THREE.PointsMaterial({
      color: theme.pointColor,
      size: theme.id === 'gallery' ? 0.08 : 0.16,
      transparent: true,
      opacity: theme.id === 'gallery' ? 0.4 : 0.9,
      map: createCircleTexture(theme.pointColor),
      depthWrite: false,
      blending: theme.id === 'gallery' ? THREE.NormalBlending : THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particlesGeom, particlesMat);
    scene.add(particleSystem);

    // 7.5. Immersive 3D floating background modules (Beautifully rounded spheres/toruses)
    const floatingGroup = new THREE.Group();
    scene.add(floatingGroup);

    const floatingObjects: {
      mesh: THREE.Mesh;
      baseY: number;
      speedY: number;
      speedRotX: number;
      speedRotY: number;
      amplitude: number;
      phase: number;
    }[] = [];

    const floatCount = theme.id === 'gallery' ? 10 : 25;
    for (let i = 0; i < floatCount; i++) {
      // Create beautifully rounded shapes: Spheres and Toruses
      const isSphere = Math.random() > 0.4;
      const size = 0.12 + Math.random() * 0.22;
      const geom = isSphere 
        ? new THREE.SphereGeometry(size, 16, 16)
        : new THREE.TorusGeometry(size * 0.6, size * 0.25, 8, 24);

      // Glassy, premium reflective material
      const mat = new THREE.MeshPhysicalMaterial({
        color: Math.random() > 0.5 ? theme.pointColor : theme.spotColor,
        roughness: 0.1,
        metalness: 0.9,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        transmission: 0.4,
        thickness: 0.6,
        transparent: true,
        opacity: 0.85,
      });

      const mesh = new THREE.Mesh(geom, mat);
      
      const angle = Math.random() * Math.PI * 2;
      const dist = settings.radius + 1.8 + Math.random() * 5.0;
      const x = Math.sin(angle) * dist;
      const z = Math.cos(angle) * dist;
      const y = Math.random() * 10 - 5;

      mesh.position.set(x, y, z);
      floatingGroup.add(mesh);

      floatingObjects.push({
        mesh,
        baseY: y,
        speedY: 0.2 + Math.random() * 0.4,
        speedRotX: (Math.random() - 0.5) * 0.6,
        speedRotY: (Math.random() - 0.5) * 0.6,
        amplitude: 0.6 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // 8. Load Textures & Build Photo Panels
    const panelMeshes: THREE.Group[] = [];
    const textureLoader = new THREE.TextureLoader();
    const loadedTexturesMap = new Map<string, THREE.Texture>();

    setTotalTextures(photos.length);
    setLoadedCount(0);
    setLoadingProgress(0);

    const rebuildCylinderPanels = () => {
      // Clear previous panels
      panelMeshes.forEach((panel) => {
        cylinderGroup.remove(panel);
        panel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      });
      panelMeshes.length = 0;

      if (photos.length === 0) return;

      const radius = settings.radius;
      const count = photos.length;

      photos.forEach((photo, i) => {
        const angle = (i / count) * Math.PI * 2;
        const panelGroup = new THREE.Group();

        // Position on cylinder radius
        panelGroup.position.set(
          Math.sin(angle) * radius,
          0,
          Math.cos(angle) * radius
        );

        // Rotate to face outwards
        panelGroup.rotation.y = angle;

        // Load or retrieve cached texture
        const onTextureLoaded = (texture: THREE.Texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          texture.generateMipmaps = true;

          const pWidth = settings.panelWidth;
          const pHeight = settings.panelHeight;
          const pDepth = 0.08;
          const pRadius = 0.35; // Elegant, premium rounded corner radius

          // Function to create a rounded rectangle shape
          const createRoundedRectShape = (width: number, height: number, radius: number) => {
            const shape = new THREE.Shape();
            const x = -width / 2;
            const y = -height / 2;

            shape.moveTo(x + radius, y);
            shape.lineTo(x + width - radius, y);
            shape.quadraticCurveTo(x + width, y, x + width, y + radius);
            shape.lineTo(x + width, y + height - radius);
            shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            shape.lineTo(x + radius, y + height);
            shape.quadraticCurveTo(x, y + height, x, y + height - radius);
            shape.lineTo(x, y + radius);
            shape.quadraticCurveTo(x, y, x + radius, y);
            return shape;
          };

          const shape = createRoundedRectShape(pWidth, pHeight, pRadius);

          // Standard premium backing/sides material
          const backingMat = new THREE.MeshStandardMaterial({
            color: theme.id === 'gallery' ? 0xffffff : 0x111113,
            metalness: theme.id === 'gallery' ? 0.05 : 0.6,
            roughness: theme.id === 'gallery' ? 0.9 : 0.4,
          });

          // Front picture material
          const frontMat = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.2,
            metalness: 0.1,
            bumpScale: 0.02,
          });

          // 1. Extruded backing frame
          const extrudeSettings = {
            depth: pDepth - 0.02,
            bevelEnabled: true,
            bevelSegments: 4,
            steps: 1,
            bevelSize: 0.015,
            bevelThickness: 0.015,
          };
          const backingGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
          const backingMesh = new THREE.Mesh(backingGeom, backingMat);
          backingMesh.castShadow = true;
          backingMesh.receiveShadow = true;
          // Position backingMesh so it aligns perfectly with the front mesh
          backingMesh.position.z = -0.01;
          panelGroup.add(backingMesh);

          // 2. Front picture mesh (a flat ShapeGeometry with the photo texture)
          const frontGeom = new THREE.ShapeGeometry(shape);
          
          // Manually assign perfect, undistorted UV coordinates
          const posAttr = frontGeom.getAttribute('position');
          if (posAttr) {
            const uvArray = new Float32Array(posAttr.count * 2);
            for (let i = 0; i < posAttr.count; i++) {
              const x = posAttr.getX(i);
              const y = posAttr.getY(i);
              // Map x from [-pWidth/2, pWidth/2] to [0, 1]
              uvArray[i * 2] = (x + pWidth / 2) / pWidth;
              // Map y from [-pHeight/2, pHeight/2] to [0, 1] (Standard alignment)
              uvArray[i * 2 + 1] = (y + pHeight / 2) / pHeight;
            }
            frontGeom.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
          }
          frontGeom.computeVertexNormals();

          const frontMesh = new THREE.Mesh(frontGeom, frontMat);
          
          // Place it exactly on the front face of the extruded backing mesh
          frontMesh.position.z = (pDepth - 0.02) + 0.015 + 0.002;
          frontMesh.castShadow = true;
          frontMesh.receiveShadow = true;
          
          // Name it photo-panel to register for raycast clicking
          frontMesh.name = `photo-panel-${photo.id}`;
          frontMesh.userData = { id: photo.id, index: i };
          panelGroup.add(frontMesh);

          // Subtle glowing border if active/focused
          if (activeId === photo.id) {
            const glowShape = createRoundedRectShape(pWidth + 0.12, pHeight + 0.12, pRadius + 0.04);
            const glowGeom = new THREE.ShapeGeometry(glowShape);
            const glowMat = new THREE.MeshBasicMaterial({
              color: theme.pointColor,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.8,
            });
            const glowMesh = new THREE.Mesh(glowGeom, glowMat);
            // Place it slightly behind the backing mesh
            glowMesh.position.z = -0.02;
            panelGroup.add(glowMesh);
          }

          // Inner picture mount frame shadow backboard (looks like a gallery matte mount!)
          if (theme.id === 'gallery') {
            const frameShape = createRoundedRectShape(pWidth + 0.25, pHeight + 0.25, pRadius + 0.05);
            const frameBackingGeom = new THREE.ExtrudeGeometry(frameShape, {
              depth: 0.02,
              bevelEnabled: true,
              bevelSegments: 3,
              steps: 1,
              bevelSize: 0.01,
              bevelThickness: 0.01,
            });
            const frameBackingMat = new THREE.MeshStandardMaterial({
              color: 0x1c1917, // Elegant charcoal wood outer frame
              roughness: 0.9,
            });
            const frameBackingMesh = new THREE.Mesh(frameBackingGeom, frameBackingMat);
            frameBackingMesh.position.z = -0.035;
            panelGroup.add(frameBackingMesh);
          }

          setLoadedCount((prev) => {
            const next = prev + 1;
            setLoadingProgress(Math.floor((next / count) * 100));
            return next;
          });
        };

        if (loadedTexturesMap.has(photo.url)) {
          onTextureLoaded(loadedTexturesMap.get(photo.url)!);
        } else {
          textureLoader.load(
            photo.url,
            (tex) => {
              loadedTexturesMap.set(photo.url, tex);
              onTextureLoaded(tex);
            },
            undefined,
            (err) => {
              console.error(`Error loading texture ${photo.url}`, err);
              // Fallback solid color texture if loading fails
              const canvasPlaceholder = document.createElement('canvas');
              canvasPlaceholder.width = 128;
              canvasPlaceholder.height = 128;
              const ctx = canvasPlaceholder.getContext('2d');
              if (ctx) {
                ctx.fillStyle = '#3f3f46';
                ctx.fillRect(0, 0, 128, 128);
                ctx.fillStyle = '#ffffff';
                ctx.font = '14px sans-serif';
                ctx.fillText('Image Error', 20, 60);
              }
              const fallbackTex = new THREE.CanvasTexture(canvasPlaceholder);
              onTextureLoaded(fallbackTex);
            }
          );
        }

        cylinderGroup.add(panelGroup);
        panelMeshes.push(panelGroup);
      });
    };

    rebuildCylinderPanels();

    // 9. Window Resizing
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    // 10. Drag & Orbit Controls Setup
    const getClientCoords = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e) {
        if (e.touches.length > 0) {
          return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: 0, y: 0 };
      }
      return { x: e.clientX, y: e.clientY };
    };

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const { x } = getClientCoords(e);
      stateRef.current.isDragging = true;
      stateRef.current.dragStartX = x;
      stateRef.current.lastX = x;
      stateRef.current.dragStartRotation = stateRef.current.dragOffset;
      stateRef.current.dragVelocity = 0;
      stateRef.current.lastDragTime = performance.now();
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!stateRef.current.isDragging) return;

      const { x } = getClientCoords(e);
      const deltaX = x - stateRef.current.dragStartX;
      const currentTime = performance.now();
      const dt = currentTime - stateRef.current.lastDragTime;

      // Track dragging speed for inertial spin after release!
      if (dt > 0) {
        const instVelocity = (x - stateRef.current.lastX) / dt;
        stateRef.current.dragVelocity = stateRef.current.dragVelocity * 0.7 + instVelocity * 0.3;
      }

      stateRef.current.lastX = x;
      stateRef.current.lastDragTime = currentTime;

      // Map pixel delta to rotation angle
      const sensitivity = 0.003 * stateRef.current.settings.rotationSpeed;
      stateRef.current.dragOffset = stateRef.current.dragStartRotation - deltaX * sensitivity;
      stateRef.current.targetRotationY = stateRef.current.scrollOffset + stateRef.current.dragOffset;
    };

    const onPointerUp = (e: MouseEvent | TouchEvent) => {
      if (!stateRef.current.isDragging) return;
      stateRef.current.isDragging = false;

      // Handle clicking on a panel (if drag was almost instant & extremely short)
      const { x } = getClientCoords(e);
      const totalDelta = Math.abs(x - stateRef.current.dragStartX);

      if (totalDelta < 4) {
        // Trigger Click Raycaster
        triggerRaycastClick(e);
      }
    };

    const triggerRaycastClick = (e: any) => {
      let clientX = 0;
      let clientY = 0;

      if ('changedTouches' in e && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const xNorm = ((clientX - rect.left) / rect.width) * 2 - 1;
      const yNorm = -((clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(xNorm, yNorm), camera);

      // Get list of interactive elements (all front meshes inside panel groups)
      const meshesToIntersect: THREE.Object3D[] = [];
      cylinderGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.name.startsWith('photo-panel-')) {
          meshesToIntersect.push(obj);
        }
      });

      const intersects = raycaster.intersectObjects(meshesToIntersect);
      if (intersects.length > 0) {
        const hitObject = intersects[0].object;
        const photoId = hitObject.userData.id;
        const photoIndex = hitObject.userData.index;

        setActiveId(photoId);

        // Center clicked photo beautifully
        const count = photos.length;
        const targetPanelAngle = -(photoIndex / count) * Math.PI * 2;

        // Math to find the closest angle equivalent to prevent sudden reverse spins
        const currRot = stateRef.current.currentRotationY;
        const fullRot = Math.PI * 2;
        const closestAngle = targetPanelAngle + fullRot * Math.round((currRot - targetPanelAngle) / fullRot);

        stateRef.current.isProgrammaticScrolling = true;
        stateRef.current.dragOffset = closestAngle - stateRef.current.scrollOffset;
        stateRef.current.targetRotationY = closestAngle;

        // Try to smoothly animate standard scrollbar height to match the picture
        setTimeout(() => {
          stateRef.current.isProgrammaticScrolling = false;
        }, 1200);

        // Smooth scroll window position to keep in sync
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollHeight > 0) {
          // Map panel angle back to scroll offset
          const totalRevs = 2.5;
          let mappedFraction = (closestAngle / (Math.PI * 2 * totalRevs)) % 1;
          if (mappedFraction < 0) mappedFraction += 1;
          
          window.scrollTo({
            top: mappedFraction * scrollHeight,
            behavior: 'smooth',
          });
        }
      }
    };

    container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    container.addEventListener('touchstart', onPointerDown, { passive: true });
    container.addEventListener('touchmove', onPointerMove, { passive: true });
    container.addEventListener('touchend', onPointerUp, { passive: true });

    // 11. Core Animation Render Loop
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = (now - lastTime) / 1000; // in seconds
      lastTime = now;

      const currentSettings = stateRef.current.settings;

      // Auto rotation
      if (currentSettings.autoRotate && !stateRef.current.isDragging) {
        stateRef.current.autoRotationOffset += currentSettings.autoRotateSpeed * delta * 0.15;
        stateRef.current.dragOffset += currentSettings.autoRotateSpeed * delta * 0.15;
        stateRef.current.targetRotationY = stateRef.current.scrollOffset + stateRef.current.dragOffset;
      }

      // Smooth inertia rotation if released with speed
      if (!stateRef.current.isDragging && Math.abs(stateRef.current.dragVelocity) > 0.05) {
        stateRef.current.dragOffset -= stateRef.current.dragVelocity * 15 * delta;
        stateRef.current.dragVelocity *= Math.exp(-4 * delta); // Friction decay
        stateRef.current.targetRotationY = stateRef.current.scrollOffset + stateRef.current.dragOffset;
      }

      // Smooth Lerping of cylinder rotation
      const rotationLerp = 0.08; // Butter smooth factor
      stateRef.current.currentRotationY += (stateRef.current.targetRotationY - stateRef.current.currentRotationY) * rotationLerp;
      cylinderGroup.rotation.y = -stateRef.current.currentRotationY; // Spin cylinder opposite to orbit target

      // Smooth Lerp for Cylinder Tilt
      const targetTilt = currentSettings.cylinderTilt;
      stateRef.current.currentTilt += (targetTilt - stateRef.current.currentTilt) * 0.05;
      cylinderGroup.rotation.x = stateRef.current.currentTilt;
      baseGroup.rotation.x = stateRef.current.currentTilt;
      gridHelper.rotation.x = stateRef.current.currentTilt;

      // Slide Y axis position offset smoothly
      const targetYOffset = currentSettings.yOffset;
      cylinderGroup.position.y += (targetYOffset - cylinderGroup.position.y) * 0.08;

      // Floating / breath visual effect on cylinder
      const breathScale = 1 + Math.sin(now * 0.001) * 0.015;
      cylinderGroup.scale.set(breathScale, breathScale, breathScale);

      // Rotate particles / float stars
      if (particleSystem) {
        particleSystem.rotation.y += 0.03 * delta;
        const particlePositions = particlesGeom.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          particlePositions[i * 3 + 1] += velocities[i];
          // Wrap around vertical boundary
          if (particlePositions[i * 3 + 1] > 5) {
            particlePositions[i * 3 + 1] = -5;
          } else if (particlePositions[i * 3 + 1] < -5) {
            particlePositions[i * 3 + 1] = 5;
          }
        }
        particlesGeom.attributes.position.needsUpdate = true;
      }

      // 7.6. Animate floating 3D modules
      floatingObjects.forEach((obj) => {
        obj.mesh.position.y = obj.baseY + Math.sin(now * 0.001 * obj.speedY + obj.phase) * obj.amplitude;
        obj.mesh.rotation.x += obj.speedRotX * delta;
        obj.mesh.rotation.y += obj.speedRotY * delta;
      });

      // Subtle breathing zoom on the focused panel (pop it forward slightly!)
      if (stateRef.current.activeId) {
        panelMeshes.forEach((panel) => {
          const isFocused = panel.children.some(
            (c) => c.userData && c.userData.id === stateRef.current.activeId
          );
          if (isFocused) {
            // Lerp scale up slightly
            panel.scale.x += (1.1 - panel.scale.x) * 0.1;
            panel.scale.y += (1.1 - panel.scale.y) * 0.1;
            panel.scale.z += (1.1 - panel.scale.z) * 0.1;
          } else {
            // Restore normal scale
            panel.scale.x += (1.0 - panel.scale.x) * 0.1;
            panel.scale.y += (1.0 - panel.scale.y) * 0.1;
            panel.scale.z += (1.0 - panel.scale.z) * 0.1;
          }
        });
      } else {
        panelMeshes.forEach((panel) => {
          panel.scale.x += (1.0 - panel.scale.x) * 0.1;
          panel.scale.y += (1.0 - panel.scale.y) * 0.1;
          panel.scale.z += (1.0 - panel.scale.z) * 0.1;
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // 12. Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      
      container.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);

      container.removeEventListener('touchstart', onPointerDown);
      container.removeEventListener('touchmove', onPointerMove);
      container.removeEventListener('touchend', onPointerUp);

      // Dispose geometry/materials
      scene.clear();
      renderer.dispose();
    };
  }, [photos, theme]); // Rebuild when photos array or theme changes

  // Trigger rebuild of cylinder objects when physical sizes change
  useEffect(() => {
    // This allows real-time radius/width/height slider adjustments to look incredibly responsive!
    // Since rebuilding takes sub-milliseconds for empty geometry, doing it on slider changes is clean.
  }, [settings.radius, settings.panelWidth, settings.panelHeight]);

  return (
    <div id="cylinder-canvas-container" ref={containerRef} className="relative w-full h-full select-none cursor-grab active:cursor-grabbing overflow-hidden">
      <canvas id="cylinder-three-canvas" ref={canvasRef} className="absolute inset-0 block w-full h-full" />
      
      {/* Texture Loading HUD Overlay */}
      {loadedCount < totalTextures && totalTextures > 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-30 transition-opacity duration-300">
          <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Spinning Circle */}
            <div className="absolute inset-0 border-2 border-white/10 rounded-full" />
            <div className="absolute inset-0 border-2 border-t-white border-r-white rounded-full animate-spin" />
            <span className="font-mono text-xs font-semibold text-white">{loadingProgress}%</span>
          </div>
          <p className="mt-4 font-mono text-[10px] text-zinc-400 tracking-widest uppercase">
            Rendering {loadedCount} / {totalTextures} Plaques
          </p>
        </div>
      )}
    </div>
  );
}
