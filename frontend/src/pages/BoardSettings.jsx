import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { boardsApi } from '../api';
import Navbar from '../components/Navbar';

export default function BoardSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '', accentColor: '#6366f1', isPublic: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    boardsApi.byId(id)
      .then(({ data }) => {
        const b = data.data;
        setForm({
          name: b.name,
          description: b.description || '',
          accentColor: b.accentColor,
          isPublic: b.isPublic,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await boardsApi.update(id, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this board and all its posts? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await boardsApi.delete(id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-bold">Board settings</h1>
        </div>

        <div className="card p-6 mb-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Board name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required maxLength={80}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="input h-20 resize-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={300}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Accent colour</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border border-gray-200"
                />
                <span className="text-sm text-gray-500">{form.accentColor}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPublic"
                checked={form.isPublic}
                onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                className="w-4 h-4 accent-indigo-600"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-700">Public board (anyone can view and submit)</label>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Danger zone */}
        <div className="card p-6 border-red-100">
          <h3 className="text-sm font-semibold text-red-700 mb-2">Danger zone</h3>
          <p className="text-xs text-gray-500 mb-4">
            Deleting this board will permanently remove all posts, comments, and upvotes.
          </p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete this board'}
          </button>
        </div>
      </main>
    </div>
  );
}
