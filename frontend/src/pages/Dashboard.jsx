import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { boardsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

function CreateBoardModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', accentColor: '#6366f1' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await boardsApi.create(form);
      onCreated(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create board');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">Create feedback board</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Board name</label>
            <input
              className="input"
              placeholder="e.g. My Startup"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              maxLength={80}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea
              className="input h-20 resize-none"
              placeholder="What kind of feedback are you collecting?"
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
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating…' : 'Create board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    boardsApi.mine()
      .then(({ data }) => setBoards(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreated = (board) => {
    setBoards((prev) => [board, ...prev]);
    setShowCreate(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Your boards</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name}</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            + New board
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && boards.length === 0 && (
          <div className="card p-16 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="font-semibold text-gray-700 mb-2">No boards yet</h3>
            <p className="text-gray-400 text-sm mb-5">Create your first feedback board to get started.</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              Create your first board
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <div key={board.id} className="card p-5 flex flex-col gap-3">
              <div
                className="w-8 h-8 rounded-lg"
                style={{ backgroundColor: board.accentColor }}
              />
              <div>
                <h3 className="font-semibold text-gray-900">{board.name}</h3>
                {board.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{board.description}</p>
                )}
              </div>
              <div className="text-xs text-gray-400">
                {board._count?.posts ?? 0} posts
                {!board.isPublic && <span className="ml-2 bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Private</span>}
              </div>
              <div className="flex gap-2 pt-1 mt-auto border-t border-gray-50">
                <Link
                  to={`/board/${board.slug}`}
                  target="_blank"
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  View public ↗
                </Link>
                <Link
                  to={`/boards/${board.id}/analytics`}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  Analytics
                </Link>
                <Link
                  to={`/boards/${board.id}/settings`}
                  className="btn-secondary text-xs px-3 py-1.5 ml-auto"
                >
                  Settings
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      {showCreate && (
        <CreateBoardModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
