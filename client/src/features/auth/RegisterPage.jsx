import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineUser, HiOutlineSparkles } from 'react-icons/hi2';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const RegisterPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (formData.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      await register(formData.name, formData.email, formData.password);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const p = formData.password;
    if (!p) return { width: '0%', color: 'bg-surface-700', text: '' };
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const levels = [
      { width: '20%', color: 'bg-danger', text: 'Weak' },
      { width: '40%', color: 'bg-danger', text: 'Weak' },
      { width: '60%', color: 'bg-warning', text: 'Fair' },
      { width: '80%', color: 'bg-info', text: 'Good' },
      { width: '100%', color: 'bg-success', text: 'Strong' },
    ];
    return levels[Math.min(score, 4)];
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surface-950 relative overflow-hidden">
      <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-accent mb-4 shadow-lg shadow-primary-500/20">
            <HiOutlineSparkles className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">JobLens AI</h1>
          <p className="text-surface-200/60 text-sm mt-1">Start your career journey</p>
        </div>

        <div
          className="rounded-2xl p-8 border border-white/6"
          style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)' }}
        >
          <h2 className="text-xl font-semibold text-surface-100 mb-6">Create your account</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name"
              icon={HiOutlineUser}
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              icon={HiOutlineEnvelope}
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <div>
              <Input
                label="Password"
                type="password"
                icon={HiOutlineLockClosed}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              {formData.password && (
                <div className="mt-2">
                  <div className="h-1 bg-surface-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300 rounded-full`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <p className="text-xs mt-1 text-surface-200/50">{strength.text}</p>
                </div>
              )}
            </div>
            <Input
              label="Confirm Password"
              type="password"
              icon={HiOutlineLockClosed}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
            <Button type="submit" loading={loading} variant="accent" size="lg" className="w-full">
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-surface-200/60 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
