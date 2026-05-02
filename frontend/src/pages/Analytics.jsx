import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { boardsApi } from '../api';
import Navbar from '../components/Navbar';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts';

const STATUS_COLORS = {
  OPEN: '#94a3b8',
  UNDER_REVIEW: '#f59e0b',
  PLANNED: '#3b82f6',
  IN_PROGRESS: '#6366f1',
  DONE: '#22c55e',
  DECLINED: '#ef4444',
};

export default function Analytics() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      boardsApi.byId(id),
      boardsApi.analytics(id),
    ])
      .then(([boardRes, analyticsRes]) => {
        setBoard(boardRes.data.data);
        setData(analyticsRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return null;

  const statusData = Object.entries(data.postsByStatus).map(([status, count]) => ({
    name: status.replace('_', ' '),
    count,
    fill: STATUS_COLORS[status] || '#94a3b8',
  }));

  const volumeData = data.postVolume.map((row) => ({
    date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    posts: row.count,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-bold">{board?.name} — Analytics</h1>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total posts', value: data.overview.totalPosts },
            { label: 'Total upvotes', value: data.overview.totalUpvotes },
            { label: 'Total comments', value: data.overview.totalComments },
          ].map((stat) => (
            <div key={stat.label} className="card p-5">
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Posts by status */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Posts by status</h3>
            {statusData.length === 0 ? (
              <p className="text-gray-400 text-sm">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusData} barSize={28}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {statusData.map((entry, i) => (
                      <rect key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Post volume */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Post volume (last 30 days)</h3>
            {volumeData.length === 0 ? (
              <p className="text-gray-400 text-sm">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="posts" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top posts */}
        <div className="card p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Top posts</h3>
          <div className="space-y-2">
            {data.topPosts.map((post, i) => (
              <div key={post.id} className="flex items-center gap-3 text-sm">
                <span className="text-gray-300 font-mono w-5">{i + 1}</span>
                <span className="flex-1 text-gray-700 font-medium truncate">{post.title}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  {post.status.replace('_', ' ')}
                </span>
                <span className="text-indigo-600 font-semibold w-12 text-right">▲ {post.upvoteCount}</span>
              </div>
            ))}
            {data.topPosts.length === 0 && (
              <p className="text-gray-400 text-sm">No posts yet</p>
            )}
          </div>
        </div>

        {/* Categories */}
        {data.categories.length > 0 && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {data.categories.map((cat) => (
                <span key={cat.name} className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full font-medium">
                  {cat.name} · {cat.count}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
