import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Camera, Sparkles, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import SEO from '../../components/SEO';

interface GalleryItem {
  id: number | string;
  image_url: string;
  caption?: string;
  created_at?: string;
}

export const Gallery = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Helper to format local upload URLs
  const formatImageUrl = (src: string) => {
    if (!src) return '';
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:image/')) {
      return src;
    }
    return `http://localhost:3000${src.startsWith('/') ? '' : '/'}${src}`;
  };

  // Fetch only authentic uploaded photos from backend database
  const { data: galleryData, isLoading } = useQuery<{ items: GalleryItem[]; total: number }>({
    queryKey: ['publicGallery', currentPage],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/public/gallery?page=${currentPage}&limit=24`);
        if (!response.ok) return { items: [], total: 0 };
        const json = await response.json();
        const list = Array.isArray(json.data) ? json.data : json.data?.items || [];
        return {
          items: list,
          total: list.length
        };
      } catch (error) {
        console.error('Error fetching public gallery:', error);
        return { items: [], total: 0 };
      }
    }
  });

  const photos = galleryData?.items || [];

  return (
    <div className="flex flex-col w-full bg-slate-50 min-h-screen">
      <SEO
        title="Photo Gallery | Examirror Campus & Activities"
        description="View official photographs of Examirror student workshops, practical computer lab sessions, convocation ceremonies, and center events."
        keywords={[
          'Examirror Photo Gallery',
          'Computer Institute Photos',
          'Student Workshops Examirror',
          'Convocation Ceremonies',
          'Center Event Photos'
        ]}
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Gallery', item: '/gallery' }
        ]}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ImageGallery',
          name: 'Examirror Campus & Activities Photo Gallery',
          description: 'Official photo gallery of Examirror computer training institutes and activities across India.'
        }}
      />
      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setSelectedImage(null)}
          >
            <button
              className="absolute top-6 right-6 text-white hover:text-blue-400 bg-black/60 rounded-full p-2.5 transition-colors cursor-pointer"
              onClick={() => setSelectedImage(null)}
            >
              <X size={26} />
            </button>
            <motion.img
              initial={{ scale: 0.94 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.94 }}
              src={selectedImage}
              alt="Gallery Preview"
              className="max-w-full max-h-[88vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <section className="bg-slate-900 text-white py-14 sm:py-16 text-center relative overflow-hidden border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-400/20 text-blue-300 px-3 py-1 rounded-full text-xs font-semibold">
            <Camera size={14} />
            <span>Campus Moments & Official Activities</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Photo Gallery
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Official photographs of student workshops, convocation ceremonies, practical lab sessions, and authorized center events.
          </p>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow flex flex-col">
        {isLoading ? (
          <div className="flex justify-center items-center py-24 flex-grow">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : photos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-12">
            {photos.map((image, index) => {
              const fullUrl = formatImageUrl(image.image_url);
              return (
                <motion.div
                  key={image.id || index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.25) }}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all group relative cursor-pointer flex flex-col"
                  onClick={() => setSelectedImage(fullUrl)}
                >
                  <div className="h-64 overflow-hidden relative bg-slate-100">
                    <img
                      src={fullUrl}
                      alt={image.caption || `Gallery photo ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <span className="bg-white/95 text-slate-900 font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 backdrop-blur-xs">
                        <Eye size={14} className="text-blue-600" />
                        <span>View Photo</span>
                      </span>
                    </div>
                  </div>

                  {image.caption && (
                    <div className="p-3.5 bg-white border-t border-slate-100 text-xs font-semibold text-slate-800 line-clamp-1">
                      {image.caption}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Clean Empty State (Zero Fake Demo Pictures) */
          <div className="bg-white rounded-3xl border border-slate-200 p-12 sm:p-16 text-center shadow-xs max-w-lg mx-auto my-auto">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ImageIcon size={30} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1.5">No Gallery Photos Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Official photographs published and approved by the administration will appear here. Check back soon for event updates.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Gallery;
