import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineSparkles } from 'react-icons/hi2';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surface-950 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-accent mb-4 shadow-lg shadow-primary-500/20">
            <HiOutlineSparkles className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">JobLens AI</h1>
          <p className="text-surface-200/60 text-sm mt-1">
            AI-Powered Job Application Tracker
          </p>
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl p-8 border border-white/6"
          style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)' }}
        >
          <h2 className="text-xl font-semibold text-surface-100 mb-6">
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              icon={HiOutlineEnvelope}
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
            <Input
              label="Password"
              type="password"
              icon={HiOutlineLockClosed}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
            <Button
              type="submit"
              loading={loading}
              variant="accent"
              size="lg"
              className="w-full"
            >
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-surface-200/60 mt-6">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
