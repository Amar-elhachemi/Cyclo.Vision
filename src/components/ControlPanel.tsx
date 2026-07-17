/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Sliders, 
  RotateCw, 
  Upload, 
  Image, 
  Palette, 
  Trash2, 
  RotateCcw, 
  Sparkles,
  Link,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PhotoItem, CylinderSettings, ThemePreset, AppTheme, THEMES } from '../types';

interface ControlPanelProps {
  photos: PhotoItem[];
  setPhotos: React.Dispatch<React.SetStateAction<PhotoItem[]>>;
  settings: CylinderSettings;
  setSettings: React.Dispatch<React.SetStateAction<CylinderSettings>>;
  currentTheme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
}

export default function ControlPanel({
  photos,
  setPhotos,
  settings,
  setSettings,
  currentTheme,
  setTheme,
  activeId,
  setActiveId,
}: ControlPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'settings' | 'photos' | 'themes'>('settings');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageTitle, setImageTitle] = useState('');
  const [imageCategory, setImageCategory] = useState('Urban');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick preset resets
  const handleResetSettings = () => {
    setSettings({
      radius: 5,
      rotationSpeed: 1.0,
      autoRotate: true,
      autoRotateSpeed: 0.3,
      panelWidth: 3.2,
      panelHeight: 2.1,
      cylinderTilt: -0.12,
      yOffset: 0.1,
      lightingPreset: 'studio',
      ambientIntensity: 0.8,
      directionalIntensity: 1.2,
      pointIntensity: 1.5,
    });
  };

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((fileObj) => {
      const file = fileObj as File;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newPhoto: PhotoItem = {
            id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url: event.target.result as string,
            title: file.name.split('.')[0] || 'Uploaded Photograph',
            description: 'Custom uploaded personal picture showcasing on the 3D scroll cylinder.',
            category: 'Personal',
            date: new Date().toLocaleDateString(),
            likes: 0,
          };
          setPhotos((prev) => [newPhoto, ...prev]);
          setActiveId(newPhoto.id);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Add custom photo via URL
  const handleAddUrlPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;

    const newPhoto: PhotoItem = {
      id: `url-${Date.now()}`,
      url: imageUrlInput.trim(),
      title: imageTitle.trim() || 'Untitled Frame',
      description: 'Custom external reference photo uploaded to the 3D Cylinder.',
      category: imageCategory,
      date: new Date().toLocaleDateString(),
      likes: 0,
    };

    setPhotos((prev) => [newPhoto, ...prev]);
    setActiveId(newPhoto.id);
    setImageUrlInput('');
    setImageTitle('');
  };

  const handleDeletePhoto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    if (activeId === id) {
      setActiveId(null);
    }
  };

  const handleSliderChange = (key: keyof CylinderSettings, value: number | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <>
      {/* Floating Toggle Tab Button */}
      <div 
        className={`fixed top-24 z-40 transition-all duration-300 ${
          isOpen 
            ? 'left-[21rem] max-sm:left-auto max-sm:right-6' 
            : 'left-4'
        }`}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-center p-3 rounded-full shadow-lg border transition-all duration-300 backdrop-blur-md ${currentTheme.cardClass}`}
          title={isOpen ? "Collapse Controls" : "Expand Controls"}
          id="control-panel-toggle"
        >
          {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -350, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -350, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className={`fixed top-24 left-4 right-4 sm:right-auto sm:w-80 max-h-[calc(100vh-12rem)] flex flex-col rounded-2xl border shadow-2xl z-30 overflow-hidden ${currentTheme.cardClass}`}
            id="control-panel-container"
          >
            {/* Header Tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === 'settings' 
                    ? 'border-white text-white font-extrabold' 
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
                id="tab-settings"
              >
                <Sliders className="w-3.5 h-3.5" />
                Structure
              </button>
              <button
                onClick={() => setActiveTab('photos')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === 'photos' 
                    ? 'border-white text-white font-extrabold' 
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
                id="tab-photos"
              >
                <Image className="w-3.5 h-3.5" />
                Media ({photos.length})
              </button>
              <button
                onClick={() => setActiveTab('themes')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === 'themes' 
                    ? 'border-white text-white font-extrabold' 
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
                id="tab-themes"
              >
                <Palette className="w-3.5 h-3.5" />
                Atmosphere
              </button>
            </div>

            {/* Scrollable Panel Area */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              
              {/* TAB 1: 3D CYLINDER SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-5" id="settings-content">
                  {/* Auto Rotate Control */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/40 border border-white/5">
                    <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                      <RotateCw className="w-3.5 h-3.5 text-white animate-spin-slow" />
                      Auto-Rotate Cylinder
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.autoRotate}
                        onChange={(e) => handleSliderChange('autoRotate', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-800 rounded-full peer peer-focus:ring-2 peer-focus:ring-white/10 peer-checked:after:translate-x-full peer-checked:after:border-zinc-950 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
                    </label>
                  </div>

                  {/* Auto Rotate Speed */}
                  {settings.autoRotate && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                        <span>Spin Speed</span>
                        <span className="text-white font-bold">{settings.autoRotateSpeed.toFixed(2)} rad/s</span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="1.5"
                        step="0.05"
                        value={settings.autoRotateSpeed}
                        onChange={(e) => handleSliderChange('autoRotateSpeed', parseFloat(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                      />
                    </div>
                  )}

                  {/* Radius Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                      <span>Cylinder Radius</span>
                      <span className="text-white font-bold">{settings.radius.toFixed(1)}m</span>
                    </div>
                    <input
                      type="range"
                      min="3.0"
                      max="10.0"
                      step="0.1"
                      value={settings.radius}
                      onChange={(e) => handleSliderChange('radius', parseFloat(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>

                  {/* Scroll Sensitivity */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                      <span>Scroll Sensitivity</span>
                      <span className="text-white font-bold">{settings.rotationSpeed.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="3.0"
                      step="0.1"
                      value={settings.rotationSpeed}
                      onChange={(e) => handleSliderChange('rotationSpeed', parseFloat(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>

                  {/* Cylinder Tilt */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                      <span>Showcase Tilt</span>
                      <span className="text-white font-bold">{(settings.cylinderTilt * (180/Math.PI)).toFixed(0)}°</span>
                    </div>
                    <input
                      type="range"
                      min="-0.4"
                      max="0.4"
                      step="0.02"
                      value={settings.cylinderTilt}
                      onChange={(e) => handleSliderChange('cylinderTilt', parseFloat(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>

                  {/* Vertical position / Height */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                      <span>Vertical Offset</span>
                      <span className="text-white font-bold">{settings.yOffset.toFixed(2)}m</span>
                    </div>
                    <input
                      type="range"
                      min="-2.0"
                      max="2.0"
                      step="0.1"
                      value={settings.yOffset}
                      onChange={(e) => handleSliderChange('yOffset', parseFloat(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>

                  {/* Panel Sizes */}
                  <div className="border-t border-white/10 pt-4 space-y-4">
                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-white animate-pulse" />
                      Plaque Dimensions
                    </h4>

                    {/* Width */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                        <span>Plaque Width</span>
                        <span className="text-white font-bold">{settings.panelWidth.toFixed(1)}m</span>
                      </div>
                      <input
                        type="range"
                        min="1.5"
                        max="5.0"
                        step="0.1"
                        value={settings.panelWidth}
                        onChange={(e) => handleSliderChange('panelWidth', parseFloat(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                      />
                    </div>

                    {/* Height */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                        <span>Plaque Height</span>
                        <span className="text-white font-bold">{settings.panelHeight.toFixed(1)}m</span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="4.0"
                        step="0.1"
                        value={settings.panelHeight}
                        onChange={(e) => handleSliderChange('panelHeight', parseFloat(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                      />
                    </div>
                  </div>

                  {/* Reset Settings Button */}
                  <button
                    onClick={handleResetSettings}
                    className="w-full py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest rounded-xl border border-white/20 hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Cylinder
                  </button>
                </div>
              )}

              {/* TAB 2: PHOTO MANAGEMENT */}
              {activeTab === 'photos' && (
                <div className="space-y-5" id="photos-content">
                  {/* Native File Upload */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Local Uploads</span>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/10 hover:border-white/30 hover:bg-white/5 cursor-pointer p-5 rounded-xl flex flex-col items-center justify-center text-center gap-2 transition-all group"
                    >
                      <Upload className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
                      <span className="text-xs font-semibold text-zinc-300">Drag & Drop or Click</span>
                      <span className="text-[10px] text-zinc-500 font-mono">JPG, PNG, WEBP, AVIF</span>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      multiple
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  {/* URL Image Addition */}
                  <form onSubmit={handleAddUrlPhoto} className="space-y-3 pt-2 border-t border-white/10">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                      <Link className="w-3 h-3" /> Add Image from Web
                    </span>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      required
                      className="w-full text-xs px-3 py-2 bg-zinc-950/40 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 font-mono"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Plaque Title"
                        value={imageTitle}
                        onChange={(e) => setImageTitle(e.target.value)}
                        className="flex-1 text-xs px-3 py-2 bg-zinc-950/40 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-white/30"
                      />
                      <select
                        value={imageCategory}
                        onChange={(e) => setImageCategory(e.target.value)}
                        className="text-xs px-2 py-2 bg-zinc-950/40 border border-white/10 rounded-lg text-zinc-300 focus:outline-none focus:border-white/30 uppercase tracking-wider font-semibold text-[10px]"
                      >
                        <option value="Urban" className="bg-zinc-900">Urban</option>
                        <option value="Nature" className="bg-zinc-900">Nature</option>
                        <option value="Cosmic" className="bg-zinc-900">Cosmic</option>
                        <option value="Abstract" className="bg-zinc-900">Abstract</option>
                        <option value="Portrait" className="bg-zinc-900">Portrait</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-white hover:bg-zinc-200 text-black font-bold uppercase tracking-widest text-[10px] rounded-lg flex items-center justify-center gap-1.5 transition-all border border-white"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Insert into Cylinder
                    </button>
                  </form>

                  {/* Current Photos List */}
                  <div className="pt-4 border-t border-white/10 space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Current Showcase</span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {photos.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setActiveId(p.id);
                            // Smooth scroll to center this panel
                            const index = photos.findIndex((photo) => photo.id === p.id);
                            const element = document.getElementById('cylinder-three-canvas');
                            if (element) {
                              element.dispatchEvent(new CustomEvent('focus-panel', { detail: { index } }));
                            }
                          }}
                          className={`group/item flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition-all ${
                            activeId === p.id 
                              ? 'bg-white/10 border-white' 
                              : 'bg-zinc-950/30 border-white/5 hover:bg-white/5'
                          }`}
                        >
                          <img 
                            src={p.url} 
                            alt={p.title} 
                            className="w-10 h-8 object-cover rounded-md border border-white/10"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-semibold truncate text-zinc-100">{p.title}</h5>
                            <span className="text-[9px] text-zinc-400 font-mono tracking-widest uppercase">{p.category}</span>
                          </div>
                          <button
                            onClick={(e) => handleDeletePhoto(p.id, e)}
                            className="p-1.5 rounded-lg opacity-0 group-hover/item:opacity-100 hover:bg-zinc-800 hover:text-white text-zinc-500 transition-all"
                            title="Delete Photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: THEME SELECTOR */}
              {activeTab === 'themes' && (
                <div className="space-y-4 font-sans" id="themes-content">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Atmosphere Configuration</span>
                  <div className="grid grid-cols-1 gap-2.5">
                    {(Object.keys(THEMES) as ThemePreset[]).map((key) => {
                      const t = THEMES[key];
                      const isSelected = currentTheme.id === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t)}
                          className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex items-center justify-between ${
                            isSelected 
                              ? 'border-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] font-bold' 
                              : 'border-white/5 bg-zinc-950/30 hover:bg-white/5'
                          }`}
                        >
                          {/* Inner color balls illustrating lighting preset colors */}
                          <div className="flex items-center gap-3">
                            <div className="flex -space-x-1.5">
                              <div className="w-3.5 h-3.5 rounded-full border border-zinc-950 shadow-sm" style={{ backgroundColor: `#${t.ambientColor.toString(16).padStart(6, '0')}` }} />
                              <div className="w-3.5 h-3.5 rounded-full border border-zinc-950 shadow-sm" style={{ backgroundColor: `#${t.spotColor.toString(16).padStart(6, '0')}` }} />
                              <div className="w-3.5 h-3.5 rounded-full border border-zinc-950 shadow-sm" style={{ backgroundColor: `#${t.pointColor.toString(16).padStart(6, '0')}` }} />
                            </div>
                            <span className="text-xs uppercase tracking-wider font-semibold">{t.name}</span>
                          </div>
                          
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Backdrop information */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-white/5 text-[11px] leading-relaxed text-zinc-400 mt-2 space-y-1 font-mono">
                    <p className="font-semibold text-zinc-200">ENVIRONMENT LIGHTING</p>
                    <p>Changing atmospheres dynamically shifts ambient light projections, spotlight rays, and the base neon glow underneath the cylinder model inside the render engine.</p>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
