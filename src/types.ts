/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PhotoItem {
  id: string;
  url: string;
  title: string;
  description: string;
  category: string;
  author?: string;
  date?: string;
  likes?: number;
}

export interface CylinderSettings {
  radius: number;
  rotationSpeed: number; // scroll sensitivity
  autoRotate: boolean;
  autoRotateSpeed: number;
  panelWidth: number;
  panelHeight: number;
  cylinderTilt: number; // in radians
  yOffset: number; // vertical positioning
  lightingPreset: 'studio' | 'moody' | 'neon' | 'sunset';
  ambientIntensity: number;
  directionalIntensity: number;
  pointIntensity: number;
}

export type ThemePreset = 'geometric' | 'midnight' | 'sunset' | 'cyber' | 'gallery';

export interface AppTheme {
  id: ThemePreset;
  name: string;
  bgClass: string;
  cardClass: string;
  textPrimary: string;
  textSecondary: string;
  accentClass: string;
  ambientColor: number;
  spotColor: number;
  pointColor: number;
}

export const THEMES: Record<ThemePreset, AppTheme> = {
  geometric: {
    id: 'geometric',
    name: 'Geometric Balance',
    bgClass: 'bg-[#0A0A0A]',
    cardClass: 'bg-zinc-900/90 border-white/10 text-white backdrop-blur-md shadow-[0_0_50px_rgba(255,255,255,0.03)]',
    textPrimary: 'text-white',
    textSecondary: 'text-zinc-400',
    accentClass: 'bg-white hover:bg-zinc-200 text-black border-white font-semibold',
    ambientColor: 0x050505,
    spotColor: 0xffffff,
    pointColor: 0x6366f1, // soft indigo for core lighting
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Slate',
    bgClass: 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950',
    cardClass: 'bg-slate-900/80 border-slate-800 text-slate-100 backdrop-blur-md',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-400',
    accentClass: 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500',
    ambientColor: 0x1e1e2f,
    spotColor: 0xffffff,
    pointColor: 0x3b82f6, // blue
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Aura',
    bgClass: 'bg-gradient-to-br from-zinc-950 via-rose-950 to-orange-950',
    cardClass: 'bg-zinc-900/80 border-rose-900/30 text-rose-50/90 backdrop-blur-md',
    textPrimary: 'text-rose-50',
    textSecondary: 'text-orange-200/60',
    accentClass: 'bg-rose-700 hover:bg-rose-600 text-white border-rose-500',
    ambientColor: 0x2e1115,
    spotColor: 0xffe4e6,
    pointColor: 0xf59e0b, // amber
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber Grid',
    bgClass: 'bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-black to-black',
    cardClass: 'bg-black/90 border-fuchsia-500/30 text-cyan-100 backdrop-blur-md shadow-[0_0_15px_rgba(217,70,239,0.15)]',
    textPrimary: 'text-cyan-400',
    textSecondary: 'text-fuchsia-400',
    accentClass: 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white border-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.5)]',
    ambientColor: 0x050510,
    spotColor: 0x00ffff, // cyan
    pointColor: 0xd946ef, // fuchsia
  },
  gallery: {
    id: 'gallery',
    name: 'Art Gallery',
    bgClass: 'bg-gradient-to-br from-neutral-50 via-stone-100 to-neutral-200',
    cardClass: 'bg-white/80 border-neutral-200 text-neutral-800 backdrop-blur-md shadow-lg',
    textPrimary: 'text-neutral-800',
    textSecondary: 'text-neutral-500',
    accentClass: 'bg-neutral-900 hover:bg-neutral-800 text-white border-neutral-900',
    ambientColor: 0xffffff,
    spotColor: 0xfffcf0,
    pointColor: 0xd4d4d4, // soft grey
  },
};
