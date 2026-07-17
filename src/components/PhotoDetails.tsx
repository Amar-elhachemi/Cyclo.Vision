/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Calendar, 
  User, 
  Edit3, 
  Check, 
  Maximize2, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PhotoItem, AppTheme } from '../types';

interface PhotoDetailsProps {
  photo: PhotoItem | null;
  photos: PhotoItem[];
  setPhotos: React.Dispatch<React.SetStateAction<PhotoItem[]>>;
  setActiveId: (id: string | null) => void;
  theme: AppTheme;
}

export default function PhotoDetails({
  photo,
  photos,
  setPhotos,
  setActiveId,
  theme,
}: PhotoDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDesc, setEditedDesc] = useState('');
  const [editedAuthor, setEditedAuthor] = useState('');
  const [editedDate, setEditedDate] = useState('');
  const [editedCategory, setEditedCategory] = useState('');
  const [editedUrl, setEditedUrl] = useState('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Sync edits when active photo changes
  useEffect(() => {
    if (photo) {
      setEditedTitle(photo.title);
      setEditedDesc(photo.description);
      setEditedAuthor(photo.author || 'eLhash-Dev');
      setEditedDate(photo.date || new Date().toLocaleDateString());
      setEditedCategory(photo.category || 'General');
      setEditedUrl(photo.url || '');
      setIsEditing(false);
    }
  }, [photo]);

  if (!photo) {
    return (
      <div 
        className={`fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 p-5 rounded-2xl border shadow-xl z-20 flex items-center gap-4 animate-pulse backdrop-blur-md ${theme.cardClass}`}
        id="no-photo-details"
      >
        <div className="w-10 h-10 rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center text-white flex-shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs sm:text-sm font-semibold tracking-wide truncate">Explore Cylinder</h4>
          <p className="text-[10px] sm:text-xs text-zinc-400 mt-1 line-clamp-2">Scroll or swipe to spin, or tap on any plaque to inspect its features.</p>
        </div>
      </div>
    );
  }

  // Toggle Like Action
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id === photo.id) {
          const currentLikes = p.likes || 0;
          return { ...p, likes: currentLikes + 1 };
        }
        return p;
      })
    );
  };

  // Save metadata edits
  const handleSaveEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedTitle.trim()) return;

    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id === photo.id) {
          return {
            ...p,
            title: editedTitle.trim(),
            description: editedDesc.trim(),
            author: editedAuthor.trim(),
            date: editedDate.trim(),
            category: editedCategory.trim(),
            url: editedUrl.trim() || p.url,
          };
        }
        return p;
      })
    );
    setIsEditing(false);
  };

  // Switch to Next/Prev photo
  const handleAdjacentSwitch = (direction: 'next' | 'prev') => {
    const currentIndex = photos.findIndex((p) => p.id === photo.id);
    if (currentIndex === -1) return;

    let targetIndex = currentIndex;
    if (direction === 'next') {
      targetIndex = (currentIndex + 1) % photos.length;
    } else {
      targetIndex = (currentIndex - 1 + photos.length) % photos.length;
    }

    const nextPhoto = photos[targetIndex];
    setActiveId(nextPhoto.id);
  };

  return (
    <>
      {/* Dynamic Floating Photo Card */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        className={`fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 rounded-2xl border shadow-2xl z-20 overflow-hidden flex flex-col max-h-[calc(100vh-16rem)] ${theme.cardClass}`}
        id="photo-details-card"
      >
        {/* Photo Image Card Header */}
        <div className="relative h-44 overflow-hidden group">
          <img 
            src={photo.url} 
            alt={photo.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          
          {/* Close Panel Button */}
          <button
            onClick={() => setActiveId(null)}
            className="absolute top-3 left-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all border border-white/10 z-10"
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Lightbox Trigger */}
          <button
            onClick={() => setIsLightboxOpen(true)}
            className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all border border-white/10 z-10"
            title="View Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Floating Category Tag */}
          <span className="absolute bottom-3 left-4 px-2.5 py-0.5 rounded-full text-[9px] font-mono tracking-widest font-bold uppercase bg-white text-black border border-white shadow-sm">
            {photo.category}
          </span>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between px-5 py-2 border-b border-white/10 bg-zinc-950/40">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleLike}
              className="group/like flex items-center gap-1.5 text-xs text-white font-semibold font-mono hover:text-rose-300 transition-colors"
              title="Add Love"
            >
              <Heart className="w-4 h-4 fill-white/10 group-hover/like:fill-rose-500 group-hover/like:text-rose-500 transition-all text-white" />
              <span>{photo.likes || 0}</span>
            </button>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={() => handleAdjacentSwitch('prev')}
              className="p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors"
              title="Previous Photo"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAdjacentSwitch('next')}
              className="p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors"
              title="Next Photo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Description & Data Panel */}
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
          {isEditing ? (
            <form onSubmit={handleSaveEdits} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[9px] font-bold font-mono uppercase tracking-widest text-zinc-500">Edit Title</label>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-zinc-950/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 font-medium font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold font-mono uppercase tracking-widest text-zinc-500">Image URL</label>
                <input
                  type="url"
                  value={editedUrl}
                  onChange={(e) => setEditedUrl(e.target.value)}
                  className="w-full text-[11px] px-3 py-1.5 bg-zinc-950/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 font-mono"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold font-mono uppercase tracking-widest text-zinc-500">Author</label>
                  <input
                    type="text"
                    value={editedAuthor}
                    onChange={(e) => setEditedAuthor(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 bg-zinc-950/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold font-mono uppercase tracking-widest text-zinc-500">Date</label>
                  <input
                    type="text"
                    value={editedDate}
                    onChange={(e) => setEditedDate(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 bg-zinc-950/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold font-mono uppercase tracking-widest text-zinc-500">Category</label>
                <input
                  type="text"
                  value={editedCategory}
                  onChange={(e) => setEditedCategory(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-zinc-950/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold font-mono uppercase tracking-widest text-zinc-500">Description</label>
                <textarea
                  rows={2}
                  value={editedDesc}
                  onChange={(e) => setEditedDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-zinc-950/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 leading-relaxed font-sans"
                />
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-[10px] border border-white/10 hover:bg-white/10 text-white font-mono uppercase tracking-wider rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-[10px] bg-white hover:bg-zinc-200 text-black border border-white font-bold uppercase tracking-widest rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Title Section */}
              <div className="flex justify-between items-start gap-4">
                <h3 className="text-base font-bold tracking-tight text-white leading-snug flex-1">
                  {photo.title}
                </h3>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  title="Edit Info"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Text Description */}
              <p className="text-xs text-zinc-400 leading-relaxed">
                {photo.description}
              </p>

              {/* Horizontal Metadata Details */}
              <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-3 text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-white" />
                  <span className="truncate">{photo.date || 'Jul 17, 2026'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-white" />
                  <span className="truncate">{photo.author || 'AI Gallery'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* IMMERSIVE LIGHTBOX PORTAL */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 select-none"
            onClick={() => setIsLightboxOpen(false)}
            id="lightbox-backdrop"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 shadow-lg"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Next / Prev Controls */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAdjacentSwitch('prev');
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/5 hover:bg-white/15 text-white rounded-full transition-all border border-white/10 shadow-lg"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAdjacentSwitch('next');
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/5 hover:bg-white/15 text-white rounded-full transition-all border border-white/10 shadow-lg"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Central Immersive Photo Frame */}
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
              className="max-w-4xl max-h-[80vh] flex flex-col bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative overflow-hidden flex items-center justify-center">
                <img 
                  src={photo.url} 
                  alt={photo.title} 
                  className="max-w-full max-h-[60vh] object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Bottom Caption bar */}
              <div className="p-6 bg-black border-t border-white/10 text-white flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold tracking-tight">{photo.title}</h2>
                  <span className="px-3 py-1 bg-white text-black border border-white text-xs font-mono font-bold rounded-full uppercase tracking-widest">
                    {photo.category}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
                  {photo.description}
                </p>
                <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 pt-2 border-t border-white/5">
                  <span>Author: {photo.author || 'AI Gallery'}</span>
                  <span>Captured: {photo.date || 'Jul 17, 2026'}</span>
                  <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> {photo.likes || 0} Likes</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
