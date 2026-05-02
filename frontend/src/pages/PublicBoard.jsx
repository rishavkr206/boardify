import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { boardsApi, postsApi, commentsApi } from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  OPEN: 'bg-gray-100 text-gray-600',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
  PLANNED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  DONE: 'bg-green-100 text-green-700',
  DECLINED: 'bg-red-100 text-red-700',
};

const STATUS_LABELS = {
  OPEN: 'Open',
  UNDER_REVIEW: 'Under review',
  PLANNED: 'Planned',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
  DECLINED: 'Declined',
};

function PostCard({ post, accentColor, onUpvote, onSelect }) {
  return (
    <div
      className="card p-4 flex gap-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onSelect(post)}
    >
      <button
        className={`flex flex-col items-center justify-center w-12 h-16 rounded-lg border text-sm font-semibold flex-shrink-0 transition-colors ${
          post.hasUpvoted
            ? 'text-white border-transparent'
            : 'text-gray-500 border-gray-200 hover:border-gray-300 bg-white'
        }`}
        style={post.hasUpvoted ? { backgroundColor: accentColor, borderColor: accentColor } : {}}
        onClick={(e) => { e.stopPropagation(); onUpvote(post.id); }}
      >
        <svg className="w-4 h-4 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
        {post.upvoteCount}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <h3 className="font-medium text-gray-900">{post.title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[post.status]}`}>
            {STATUS_LABELS[post.status]}
          </span>
        </div>
        {post.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          {post.category && <span className="bg-gray-50 px-2 py-0.5 rounded">{post.category}</span>}
          <span>{post._count?.comments ?? 0} comments</span>
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

function PostModal({ post, boardOwnerId, accentColor, onClose, onStatusChange }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const isOwner = user?.id === boardOwnerId;

  useEffect(() => {
    commentsApi.list(post.id)
      .then(({ data }) => setComments(data.data))
      .finally(() => setLoadingComments(false));
  }, [post.id]);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const payload = { content: comment };
      if (!user) payload.authorName = guestName || 'Anonymous';
      const { data } = await commentsApi.create(post.id, payload);
      setComments((prev) => [...prev, data.data]);
      setComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (status) => {
    await postsApi.updateStatus(post.id, status);
    onStatusChange(post.id, status);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-gray-900">{post.title}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[post.status]}`}>
                {STATUS_LABELS[post.status]}
              </span>
            </div>
            {post.description && <p className="text-sm text-gray-500 mt-1">{post.description}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">✕</button>
        </div>

        {isOwner && (
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-medium text-gray-500 mb-2">Update status (board owner)</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => updateStatus(key)}
                  className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
                    post.status === key
                      ? 'border-transparent text-white'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                  }`}
                  style={post.status === key ? { backgroundColor: accentColor } : {}}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-5">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            {comments.length} comment{comments.length !== 1 ? 's' : ''}
          </h3>

          {loadingComments ? (
            <div className="h-10 flex items-center">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3 mb-5">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: accentColor }}
                  >
                    {(c.author?.name || c.authorName || 'A')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">
                      {c.author?.name || c.authorName || 'Anonymous'}
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={submitComment} className="space-y-2">
            {!user && (
              <input
                className="input"
                placeholder="Your name (optional)"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
            )}
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="Add a comment…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
              <button type="submit" disabled={submitting} className="btn-primary flex-shrink-0">
                {submitting ? '…' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function PublicBoard() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [board, setBoard] = useState(null);
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ sort: 'top', status: '', search: '' });
  const [showSubmit, setShowSubmit] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPost, setNewPost] = useState({ title: '', description: '', category: '', authorName: '', authorEmail: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    boardsApi.bySlug(slug)
      .then(({ data }) => setBoard(data.data))
      .catch(console.error);
  }, [slug]);

  useEffect(() => {
    if (!board) return;
    setLoading(true);
    postsApi.list(board.id, filters)
      .then(({ data }) => {
        setPosts(data.data.posts);
        setPagination(data.data.pagination);
      })
      .finally(() => setLoading(false));
  }, [board, filters]);

  const handleUpvote = async (postId) => {
    try {
      await postsApi.upvote(postId);
      setPosts((prev) => prev.map((p) => {
        if (p.id !== postId) return p;
        const wasUpvoted = p.hasUpvoted;
        return {
          ...p,
          hasUpvoted: !wasUpvoted,
          upvoteCount: wasUpvoted ? p.upvoteCount - 1 : p.upvoteCount + 1,
        };
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = { ...newPost };
      if (user) {
        delete payload.authorName;
        delete payload.authorEmail;
      }
      const { data } = await postsApi.create(board.id, payload);
      setPosts((prev) => [{ ...data.data, hasUpvoted: false }, ...prev]);
      setShowSubmit(false);
      setNewPost({ title: '', description: '', category: '', authorName: '', authorEmail: '' });
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = (postId, status) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, status } : p)));
    if (selectedPost?.id === postId) setSelectedPost((p) => ({ ...p, status }));
  };

  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const accent = board.accentColor || '#6366f1';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Board Header */}
      <div className="py-10 px-6 text-center" style={{ backgroundColor: `${accent}18` }}>
        <div
          className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold"
          style={{ backgroundColor: accent }}
        >
          {board.name[0]}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{board.name}</h1>
        {board.description && <p className="text-gray-500 mt-2 max-w-xl mx-auto text-sm">{board.description}</p>}
        <button
          className="mt-5 px-5 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
          style={{ backgroundColor: accent }}
          onClick={() => setShowSubmit(true)}
        >
          + Submit feedback
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            className="input flex-1 min-w-[160px]"
            placeholder="Search feedback…"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <select
            className="input w-auto"
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
          >
            <option value="top">Top voted</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
          <select
            className="input w-auto"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Post List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-400">No feedback yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                accentColor={accent}
                onUpvote={handleUpvote}
                onSelect={setSelectedPost}
              />
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              className="btn-secondary"
              disabled={pagination.page === 1}
              onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-500 self-center">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              className="btn-secondary"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Submit Modal */}
      {showSubmit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Submit feedback</h2>
            <form onSubmit={handleSubmitPost} className="space-y-3">
              <input
                className="input"
                placeholder="Title *"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                required maxLength={200}
              />
              <textarea
                className="input h-24 resize-none"
                placeholder="More details… (optional)"
                value={newPost.description}
                onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
                maxLength={2000}
              />
              <input
                className="input"
                placeholder="Category (optional)"
                value={newPost.category}
                onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
              />
              {!user && (
                <>
                  <input
                    className="input"
                    placeholder="Your name (optional)"
                    value={newPost.authorName}
                    onChange={(e) => setNewPost({ ...newPost, authorName: e.target.value })}
                  />
                  <input
                    type="email"
                    className="input"
                    placeholder="Email (optional)"
                    value={newPost.authorEmail}
                    onChange={(e) => setNewPost({ ...newPost, authorEmail: e.target.value })}
                  />
                </>
              )}
              {submitError && <p className="text-red-600 text-sm">{submitError}</p>}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowSubmit(false)} className="btn-secondary">Cancel</button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: accent }}
                >
                  {submitting ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          boardOwnerId={board.owner?.id}
          accentColor={accent}
          onClose={() => setSelectedPost(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
