import React, { useState, useEffect } from 'react';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Image,
  Plus,
  Trash2,
  X,
  ExternalLink,
  Sparkles,
  Camera,
  FolderPlus
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import DeleteConfirmCaptchaModal from '../../../components/DeleteConfirmCaptchaModal';
import { compressImageFile } from '../../../utils/imageCompressor';

export const DEFAULT_GALLERY_SETTINGS = {
  header: {
    title: 'Moments & Academic Activities Gallery',
    subtitle: 'Witness the vibrant campus life, lab practicals, annual convocation, and student achievements across our affiliated center network.'
  },
  categories: ['All', 'Convocations', 'Lab Practicals', 'Workshops', 'Award Ceremonies', 'Center Inaugurations']
};

interface GalleryItem {
  id: number;
  image_url: string;
  caption?: string;
  category?: string;
  created_at?: string;
}

const formatImageUrl = (src: string) => {
  if (!src) return '';
  if (src.startsWith('http://localhost:3000')) {
    return src.replace('http://localhost:3000', '');
  }
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:image/')) {
    return src;
  }
  return src.startsWith('/') ? src : `/${src}`;
};

const GalleryCustomizer = () => {
  const [headerData, setHeaderData] = useState(DEFAULT_GALLERY_SETTINGS);
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add Photo Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newCategory, setNewCategory] = useState('Convocations');
  const [submittingPhoto, setSubmittingPhoto] = useState(false);

  const fetchGalleryData = async () => {
    try {
      setLoading(true);
      const [settingsRes, galleryRes] = await Promise.all([
        axios.get('http://localhost:3000/api/v1/settings/gallery').catch(() => ({ data: { success: false } })),
        axios.get('http://localhost:3000/api/admin/gallery').catch(() => ({ data: { success: false } }))
      ]);

      if (settingsRes.data?.success && settingsRes.data?.data) {
        setHeaderData({
          ...DEFAULT_GALLERY_SETTINGS,
          ...settingsRes.data.data,
          header: { ...DEFAULT_GALLERY_SETTINGS.header, ...(settingsRes.data.data.header || {}) }
        });
      }

      if (galleryRes.data?.success && Array.isArray(galleryRes.data.data)) {
        setPhotos(galleryRes.data.data);
      } else {
        setPhotos([]);
      }
    } catch (err) {
      console.error(err);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleryData();
  }, []);

  const handleSaveHeader = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await axios.put('http://localhost:3000/api/v1/settings/gallery', { data: headerData });
      if (res.data?.success) {
        toast.success('Gallery page titles & categories saved successfully!');
      } else {
        toast.error('Failed to update gallery settings.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Server error while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl) {
      toast.error('Please enter a valid image URL or upload photo');
      return;
    }

    try {
      setSubmittingPhoto(true);
      const res = await axios.post('http://localhost:3000/api/admin/gallery', {
        imageUrl: newImageUrl,
        caption: newCaption || 'Examirror Event Photo'
      });

      if (res.data?.success) {
        toast.success('Photo added to public gallery successfully!');
        setIsAddModalOpen(false);
        setNewImageUrl('');
        setNewCaption('');
        fetchGalleryData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add photo.');
    } finally {
      setSubmittingPhoto(false);
    }
  };

  const [deletePhotoTarget, setDeletePhotoTarget] = useState<{ id: number; caption: string } | null>(null);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);

  const handleConfirmDeletePhoto = async () => {
    if (!deletePhotoTarget) return;
    try {
      setIsDeletingPhoto(true);
      const res = await axios.delete(`http://localhost:3000/api/admin/gallery/${deletePhotoTarget.id}`);
      if (res.data?.success) {
        toast.success('Photo removed from gallery');
        setPhotos(prev => prev.filter(p => p.id !== deletePhotoTarget.id));
        setDeletePhotoTarget(null);
      }
    } catch (err: any) {
      toast.error('Failed to delete photo');
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  return (
    <div className="space-y-6 text-xs text-slate-800 font-sans">


      {/* 1. Header & Text Customization */}
      <form onSubmit={handleSaveHeader} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Image size={18} className="text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">Gallery Page Header & Introduction</h3>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-1.5 bg-[#1e1b4b] hover:bg-[#2e2b5e] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Save size={13} />
            <span>{saving ? 'Saving...' : 'Save Titles'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Gallery Main Title</label>
            <input
              type="text"
              value={headerData.header.title}
              onChange={(e) => setHeaderData({ ...headerData, header: { ...headerData.header, title: e.target.value } })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Subtitle / Punchline</label>
            <input
              type="text"
              value={headerData.header.subtitle}
              onChange={(e) => setHeaderData({ ...headerData, header: { ...headerData.header, subtitle: e.target.value } })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600"
            />
          </div>
        </div>
      </form>

      {/* 2. Photo Grid & Image Management */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Camera size={18} className="text-indigo-600" />
              <span>Uploaded Gallery Images ({photos.length})</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Add photos of convocations, lab practicals, ceremonies, and workshops displayed on the public gallery.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Plus size={15} />
            <span>Add New Photo</span>
          </button>
        </div>

        {/* Photos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
          {photos.map((item) => (
            <div key={item.id} className="group bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
              <div className="relative aspect-video bg-slate-200 overflow-hidden">
                <img
                  src={formatImageUrl(item.image_url)}
                  alt={item.caption || 'Gallery photo'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  type="button"
                  onClick={() => setDeletePhotoTarget({ id: item.id, caption: item.caption || 'Gallery Photo' })}
                  className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg shadow-sm hover:bg-rose-700 transition-colors cursor-pointer"
                  title="Remove Photo"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="p-3">
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full inline-block mb-1">
                  {item.category || 'General'}
                </span>
                <div className="text-xs font-semibold text-slate-800 line-clamp-2">
                  {item.caption || 'Event Photograph'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: Add New Photo */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-300">
            <div className="p-4 bg-[#1e1b4b] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-amber-400" />
                <h3 className="font-bold text-sm">Add Gallery Photograph</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPhotoSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Image URL or Direct Link *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/photo.jpg"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-indigo-600 font-mono"
                />
              </div>

              {/* Or quick file upload to Base64 / Local */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Or Upload Local Image File
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const compressed = await compressImageFile(file, { maxWidth: 1920, maxHeight: 1080, quality: 0.85 });
                        setNewImageUrl(compressed.dataUrl);
                        toast.success(`Image converted to WebP (${compressed.sizeKB} KB)`);
                      } catch {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewImageUrl(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }
                  }}
                  className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>

              {newImageUrl && (
                <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative">
                  <img src={newImageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Event Category Tag
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 bg-white"
                >
                  <option value="Convocations">Convocations</option>
                  <option value="Lab Practicals">Lab Practicals</option>
                  <option value="Workshops">Workshops</option>
                  <option value="Award Ceremonies">Award Ceremonies</option>
                  <option value="Center Inaugurations">Center Inaugurations</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Photo Caption / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Student batch receiving graduation diplomas"
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPhoto}
                  className="px-5 py-2 bg-[#1e1b4b] hover:bg-[#2e2b5e] text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {submittingPhoto ? 'Uploading...' : 'Publish to Gallery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Captcha Modal */}
      <DeleteConfirmCaptchaModal
        isOpen={Boolean(deletePhotoTarget)}
        title="Remove Photo from Gallery"
        itemName={deletePhotoTarget?.caption || 'Photo'}
        itemType="Gallery Photo"
        description="Are you sure you want to permanently remove this photograph from the student gallery showcase?"
        onClose={() => setDeletePhotoTarget(null)}
        onConfirm={handleConfirmDeletePhoto}
        isDeleting={isDeletingPhoto}
      />

    </div>
  );
};

export default GalleryCustomizer;
