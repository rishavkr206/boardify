import { Link } from 'react-router-dom';

const features = [
  { icon: '📋', title: 'Public feedback boards', desc: 'Give your users a place to submit ideas and vote on what matters most.' },
  { icon: '🗳️', title: 'Upvoting & prioritisation', desc: 'Let the crowd surface the most wanted features automatically.' },
  { icon: '📊', title: 'Analytics dashboard', desc: 'See post volume trends, top requests, and status breakdowns at a glance.' },
  { icon: '🔐', title: 'Multi-tenant auth', desc: 'Every team gets their own board with JWT-secured access and refresh tokens.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-bold text-indigo-600">Boardify</span>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Log in</Link>
            <Link to="/register" className="btn-primary">Get started free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
        <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
          Open source · Self-hostable
        </span>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-5">
          Collect feedback.<br />
          <span className="text-indigo-600">Ship what matters.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8">
          Boardify gives your users a public board to submit feature requests, upvote ideas, and stay informed on what's coming — built with Node.js, PostgreSQL, and React.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/register" className="btn-primary text-base px-6 py-3">Create your board →</Link>
          <a
            href="https://github.com/rishavkr206/boardify"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-base px-6 py-3"
          >
            View on GitHub
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card p-6">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo CTA */}
      <section className="bg-indigo-600 py-16">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">See a live board</h2>
          <p className="text-indigo-200 mb-6">Check out the demo board — no login required.</p>
          <Link to="/board/my-startup" className="bg-white text-indigo-600 font-semibold px-6 py-3 rounded-lg hover:bg-indigo-50 transition-colors">
            Open demo board →
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        Built with Node.js · PostgreSQL · React · Deployed on Railway + Vercel
      </footer>
    </div>
  );
}
