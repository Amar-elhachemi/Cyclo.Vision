/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  Compass, 
  Layers, 
  Info, 
  X,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PhotoItem, CylinderSettings, AppTheme, THEMES } from './types';
import { INITIAL_PHOTOS } from './data';
import CylinderCanvas from './components/CylinderCanvas';
import ControlPanel from './components/ControlPanel';
import PhotoDetails from './components/PhotoDetails';

export default function App() {
  const [photos, setPhotos] = useState<PhotoItem[]>(INITIAL_PHOTOS);
  const [activeId, setActiveId] = useState<string | null>(INITIAL_PHOTOS[0]?.id || null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showHelp, setShowHelp] = useState(true);

  // Default Cylinder parameters
  const [settings, setSettings] = useState<CylinderSettings>({
    radius: 4.8,
    rotationSpeed: 1.0,
    autoRotate: true,
    autoRotateSpeed: 0.25,
    panelWidth: 3.2,
    panelHeight: 2.1,
    cylinderTilt: -0.1, // tilt slightly forward for three-dimensional elevation
    yOffset: 0.1,
    lightingPreset: 'studio',
    ambientIntensity: 0.8,
    directionalIntensity: 1.2,
    pointIntensity: 1.5,
  });

  const [currentTheme, setCurrentTheme] = useState<AppTheme>(THEMES.geometric);

  // 1.5. Dynamic Custom Cursor and Aura States
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [trailPos, setTrailPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0
      );
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  useEffect(() => {
    if (isTouchDevice) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseDown = () => {
      setIsMouseDown(true);
      setIsClicked(true);
      setTimeout(() => setIsClicked(false), 300);
    };

    const handleMouseUp = () => {
      setIsMouseDown(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isTouchDevice]);

  // Inertial follow/lerp effect for the aura ring
  useEffect(() => {
    if (isTouchDevice) return;
    let animationId: number;
    const updateTrail = () => {
      setTrailPos((prev) => {
        const dx = mousePos.x - prev.x;
        const dy = mousePos.y - prev.y;
        const speed = 0.16; // smooth coefficient
        return {
          x: prev.x + dx * speed,
          y: prev.y + dy * speed,
        };
      });
      animationId = requestAnimationFrame(updateTrail);
    };
    animationId = requestAnimationFrame(updateTrail);
    return () => cancelAnimationFrame(animationId);
  }, [mousePos, isTouchDevice]);

  // Hook hover events on interactive elements
  useEffect(() => {
    if (isTouchDevice) return;
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.classList.contains('cursor-pointer') ||
        target.closest('.cursor-pointer') ||
        target.closest('#cylinder-canvas-container')
      ) {
        setIsHovered(true);
      }
    };

    const handleMouseOut = () => {
      setIsHovered(false);
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [isTouchDevice]);

  const pointColorCSS = useMemo(() => {
    return `#${currentTheme.pointColor.toString(16).padStart(6, '0')}`;
  }, [currentTheme]);

  // Monitor document scrolling for top HUD progress bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const progress = (window.scrollY / scrollHeight) * 100;
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Retrieve selected photo details safely
  const activePhoto = useMemo(() => {
    return photos.find((p) => p.id === activeId) || null;
  }, [photos, activeId]);

  // Compute active gallery indexes
  const activeIndex = useMemo(() => {
    if (!activeId) return -1;
    return photos.findIndex((p) => p.id === activeId);
  }, [photos, activeId]);

  const progressText = useMemo(() => {
    if (activeIndex === -1) return '00 / 00 PLAQUES';
    return `${String(activeIndex + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')} PLAQUES`;
  }, [activeIndex, photos]);

  return (
    <div 
      className={`relative min-h-[350vh] w-full ${currentTheme.bgClass} ${currentTheme.textPrimary} lg:cursor-none transition-colors duration-1000 font-sans selection:bg-indigo-500 selection:text-white`}
      id="app-container"
    >
      {/* 1. TOP DYNAMIC SCROLL GLOW BAR */}
      <div className="fixed top-0 left-0 right-0 h-[3.5px] bg-slate-900/50 z-50">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-400 shadow-[0_0_8px_rgba(99,102,241,0.8)] transition-all duration-75"
          style={{ width: `${scrollProgress}%` }}
          id="scroll-progress-indicator"
        />
      </div>

      {/* 2. DYNAMIC THREE.JS CANVAS BACKGROUND */}
      <div className="fixed inset-0 w-full h-full z-10 overflow-hidden">
        <CylinderCanvas
          photos={photos}
          activeId={activeId}
          setActiveId={setActiveId}
          settings={settings}
          theme={currentTheme}
        />
      </div>

      {/* 3. FLOATING HUD LAYER (UI OVERLAYS) */}
      <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 sm:p-6">
        
        {/* HEADER BAR */}
        <header className="flex justify-between items-center pointer-events-auto px-2 sm:px-10 py-2 sm:py-4">
          {/* Logo Brand Title with Geometric Icon */}
          <div className="flex items-center gap-2 sm:gap-3 select-none">
            <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-white rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-sm"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-xl font-bold tracking-tighter uppercase font-display leading-none">
                Cyclo.Vision
              </span>
              <span className="text-[8px] sm:text-[9px] font-mono tracking-widest text-zinc-400 uppercase mt-0.5 sm:mt-1">
                BY ELHASH-DEV
              </span>
            </div>
          </div>

          {/* Curated Archive Links */}
          <nav className="hidden lg:flex items-center gap-10 text-xs font-semibold uppercase tracking-widest text-zinc-400">
            <a href="#cylinder-three-canvas" className="hover:text-white transition-colors">Archive</a>
            <a href="#control-panel-container" className="hover:text-white transition-colors">Collections</a>
            <span className="text-white/20">/</span>
            <span className="text-zinc-500 font-mono text-[10px]">ROT_SPEED: {settings.rotationSpeed.toFixed(1)}X</span>
          </nav>

          {/* Guides and Connect Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHelp(true)}
              className="px-3 sm:px-5 py-1.5 sm:py-2 border border-white/20 rounded-full text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest hover:bg-white hover:text-black transition-all"
              id="help-button-toggle"
            >
              Guides
            </button>
          </div>
        </header>

        {/* MIDDLE WATERMARK (BACKGROUND) */}
        <div className="absolute inset-0 flex flex-col justify-between items-center py-28 pointer-events-none select-none z-0">
          <span className="text-[10vw] font-black leading-none uppercase tracking-tighter text-white opacity-[0.025] select-none">Immersion</span>
          <span className="text-[10vw] font-black leading-none uppercase tracking-tighter text-white opacity-[0.025] select-none">Perspective</span>
        </div>

        {/* BOTTOM INTERACTIVE INDICATORS */}
        <div className="flex justify-between items-center pointer-events-auto w-full px-2 sm:px-10 pb-4">
          
          {/* Technical specs on left */}
          <div className="space-y-0.5 select-none text-left">
            <p className="text-[8px] sm:text-[9px] text-white/40 uppercase tracking-widest">Specifications</p>
            <p className="text-[10px] sm:text-[11px] font-mono text-zinc-300">
              ROT_Y: {((scrollProgress * 3.6) % 360).toFixed(0)}°<span className="hidden sm:inline"> | RAD: {settings.radius.toFixed(1)}M | TILT: {(settings.cylinderTilt * (180/Math.PI)).toFixed(0)}°</span>
            </p>
          </div>

          {/* Centered Scroll indicator bar */}
          <div className="hidden md:flex items-center gap-10 select-none">
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-40 text-white">Scroll to Spin</div>
            <div className="h-[1px] w-32 bg-white/10 relative overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-white transition-all duration-75"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-40 text-white font-mono">
              {String(activeIndex + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}
            </div>
          </div>

          {/* Dynamic controls to skip left/right */}
          <div className="flex gap-2 sm:gap-4">
            <div 
              onClick={() => {
                const currIndex = photos.findIndex((p) => p.id === activeId);
                const targetIndex = (currIndex - 1 + photos.length) % photos.length;
                setActiveId(photos[targetIndex].id);
              }}
              className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center border border-white/10 rounded-full hover:bg-white hover:text-black cursor-pointer text-white transition-all hover:scale-105"
              title="Previous Plaque"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/>
              </svg>
            </div>

            {/* Display active photo index on mobile */}
            <div className="sm:hidden flex items-center px-2 text-[11px] font-mono font-semibold tracking-wider text-white">
              {String(activeIndex + 1).padStart(2, '0')}/{String(photos.length).padStart(2, '0')}
            </div>

            <div 
              onClick={() => {
                const currIndex = photos.findIndex((p) => p.id === activeId);
                const targetIndex = (currIndex + 1) % photos.length;
                setActiveId(photos[targetIndex].id);
              }}
              className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center border border-white/10 rounded-full hover:bg-white hover:text-black cursor-pointer text-white transition-all hover:scale-105"
              title="Next Plaque"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </div>

        </div>

      </div>

      {/* 4. DASHBOARD FLOATING INTERACTION FORMS (Z-30) */}
      <div className="relative z-30 pointer-events-auto">
        <ControlPanel
          photos={photos}
          setPhotos={setPhotos}
          settings={settings}
          setSettings={setSettings}
          currentTheme={currentTheme}
          setTheme={setCurrentTheme}
          activeId={activeId}
          setActiveId={setActiveId}
        />

        <PhotoDetails
          photo={activePhoto}
          photos={photos}
          setPhotos={setPhotos}
          setActiveId={setActiveId}
          theme={currentTheme}
        />
      </div>

      {/* 5. IMMERSIVE ONBOARDING INSTRUCTIONS MODAL (Z-50) */}
      <AnimatePresence>
        {showHelp && (
          <div 
            className="fixed inset-0 flex items-center justify-center bg-black/85 backdrop-blur-xl z-50 p-4"
            id="onboarding-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 150 }}
              className={`max-w-md w-full rounded-2xl border p-6 shadow-2xl ${currentTheme.cardClass}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-white animate-pulse" />
                  <h3 className="text-sm font-bold tracking-tight uppercase">Interactive Controls</h3>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed mb-5">
                Explore an immersive 3D cylinder photo showcase designed and developed by eLhash-Dev. Learn how to control and interact with the cylinder below:
              </p>

              {/* Control Guidelines List */}
              <div className="space-y-3.5 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white font-mono text-sm font-semibold flex-shrink-0">
                    🖱️
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200">Scroll Wheel / Touch Swipe</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Scroll up/down anywhere on the page to spin the cylinder smoothly and reveal surrounding images.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white font-mono text-sm font-semibold flex-shrink-0">
                    🤝
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200">Drag to Orbit / Spin</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Click and drag directly on the canvas space to spin the cylinder manually with momentum-releasing inertia.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white font-mono text-sm font-semibold flex-shrink-0">
                    🎯
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200">Click Plaque to Center</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Click directly on any photo panel inside the 3D space. The engine will rotate the cylinder to face you and display metadata.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white font-mono text-sm font-semibold flex-shrink-0">
                    🛠️
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200">Customization Dashboard</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Use the left sidebar to tweak sizes, tilt angles, lighting parameters, select atmospheric themes, or upload your own pictures!</p>
                  </div>
                </div>
              </div>

              {/* Close / Confirm */}
              <button
                onClick={() => setShowHelp(false)}
                className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all border border-white"
              >
                Begin Exhibition
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. DYNAMIC CUSTOM CURSOR & AURA (Z-50) */}
      {!isTouchDevice && (
        <>
          {/* Main Interactive Dot */}
          <motion.div
            className="fixed top-0 left-0 w-2.5 h-2.5 rounded-full pointer-events-none z-50 mix-blend-difference hidden lg:block"
            style={{
              left: mousePos.x,
              top: mousePos.y,
              x: '-50%',
              y: '-50%',
              backgroundColor: '#ffffff',
            }}
            animate={{
              scale: isMouseDown ? 0.7 : isHovered ? 1.6 : 1,
            }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          />
          {/* Dynamic Glowing Halo Trail */}
          <motion.div
            className="fixed top-0 left-0 rounded-full pointer-events-none z-50 border border-white/20 hidden lg:block"
            style={{
              left: trailPos.x,
              top: trailPos.y,
              x: '-50%',
              y: '-50%',
              width: 38,
              height: 38,
              borderColor: pointColorCSS,
              boxShadow: `0 0 20px ${pointColorCSS}33`,
            }}
            animate={{
              scale: isClicked ? 1.7 : isMouseDown ? 0.85 : isHovered ? 1.9 : 1,
              opacity: isHovered ? 0.95 : 0.55,
              backgroundColor: isHovered ? `${pointColorCSS}18` : 'rgba(255, 255, 255, 0.0)',
              borderWidth: isHovered ? '2px' : '1px',
            }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          />
        </>
      )}
    </div>
  );
}
