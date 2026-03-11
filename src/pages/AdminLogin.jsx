import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError('Failed to log in. Please check your credentials.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="glass-card w-full max-w-md p-7 sm:p-9">
        <div className="text-center mb-7">
          <p className="badge badge-brand">Admin Panel</p>
          <h1 className="text-4xl font-bold mt-4">Control Center</h1>
          <p className="text-muted mt-3">Войдите, чтобы управлять игрой и вопросами</p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-300 bg-red-50 text-red-800 px-4 py-3 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="field-input"
              required
            />
          </div>

          <div>
            <label className="field-label block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="field-input"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2">
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-[#1f6b6f] font-semibold hover:underline">
            Назад к квизу
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
