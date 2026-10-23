import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Tag, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteCatId, setDeleteCatId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' });

  const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken') || localStorage.getItem('admin_token') || '';

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/study-materials/categories?managedOnly=true', {
        headers: { Authorization: `Bearer ${adminToken}` }
      }).catch(() => axios.get('http://localhost:3000/api/study-materials/categories?managedOnly=true', {
        headers: { Authorization: `Bearer ${adminToken}` }
      }));
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!editingId) {
      setFormData({ ...formData, name, slug: generateSlug(name) });
    } else {
      setFormData({ ...formData, name });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://localhost:3000/api/study-materials/categories/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
      } else {
        await axios.post('http://localhost:3000/api/study-materials/categories', formData, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
      }
      setIsFormOpen(false);
      setEditingId(null);
      setFormData({ name: '', slug: '', description: '' });
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving category');
    }
  };

  const confirmDelete = async () => {
    if (!deleteCatId) return;
    try {
      setIsDeleting(true);
      await axios.delete(`http://localhost:3000/api/study-materials/categories/${deleteCatId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      fetchCategories();
      setDeleteCatId(null);
    } catch (err: any) {
      alert('Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  const startEdit = (cat: any) => {
    setEditingId(cat.id);
    setFormData({ name: cat.name, slug: cat.slug, description: cat.description || '' });
    setIsFormOpen(true);
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-semibold animate-pulse">Loading Categories...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Tag className="text-indigo-600" size={32} />
            Categories & Tags
          </h1>
          <p className="text-slate-500 mt-2">Manage the subjects and categories for E-Notes and Study Materials</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Plus size={20} /> Create Category
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Category' : 'New Category'}</h3>
            <button onClick={() => { setIsFormOpen(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Category Name</label>
                <input 
                  type="text" required
                  value={formData.name} onChange={handleNameChange}
                  className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                  placeholder="e.g. Computer Science"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Slug URL</label>
                <input 
                  type="text" required
                  value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  className="w-full border-slate-300 rounded-lg shadow-sm bg-slate-50 focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                  placeholder="e.g. computer-science"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Description (Optional)</label>
              <textarea 
                value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                rows={2} placeholder="Brief description of this subject area"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow flex items-center gap-2">
                <Save size={18} /> {editingId ? 'Update Category' : 'Save Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Slug</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{cat.name}</div>
                  {cat.description && <div className="text-sm text-slate-500 mt-1">{cat.description}</div>}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-mono rounded border border-slate-200">
                    {cat.slug}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => startEdit(cat)} className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded-lg mr-2 transition-colors">
                    <Edit2 size={18} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setDeleteCatId(cat.id)} 
                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-500 font-medium">
                  No categories found. Create one above!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={deleteCatId !== null}
        title="Delete Category?"
        message="Are you sure you want to delete this category? Any associated materials might lose their categorization."
        confirmText="Delete Category"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => {
          if (!isDeleting) setDeleteCatId(null);
        }}
      />
    </div>
  );
}
