import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineMapPin,
  HiOutlineLink,
  HiOutlineLockClosed,
  HiOutlinePencilSquare,
} from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, changePassword } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '', email: '', phone: '', location: '', bio: '',
    linkedIn: '', portfolio: '', github: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
        linkedIn: user.linkedIn || '',
        portfolio: user.portfolio || '',
        github: user.github || '',
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await updateProfile(profileData);
      updateUser(data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (passwordData.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setSaving(true);
    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const profileHandler = (field) => (e) => setProfileData({ ...profileData, [field]: e.target.value });
  const passwordHandler = (field) => (e) => setPasswordData({ ...passwordData, [field]: e.target.value });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Profile Settings</h1>
        <p className="text-sm text-surface-200/50 mt-0.5">Manage your account</p>
      </div>

      {/* Avatar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl gradient-accent flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-primary-500/20">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-surface-100">{user?.name}</h2>
            <p className="text-sm text-surface-200/50">{user?.email}</p>
            {user?.location && (
              <p className="text-xs text-surface-200/40 flex items-center gap-1 mt-1">
                <HiOutlineMapPin /> {user.location}
              </p>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2">
        {['profile', 'password'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20' : 'bg-surface-800/40 text-surface-200/60 border border-transparent hover:bg-surface-800/60'
            }`}>
            {tab === 'profile' ? 'Edit Profile' : 'Change Password'}
          </button>
        ))}
      </div>

      {/* Profile Form */}
      {activeTab === 'profile' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Full Name" icon={HiOutlineUser} value={profileData.name} onChange={profileHandler('name')} required />
                <Input label="Email" type="email" icon={HiOutlineEnvelope} value={profileData.email} onChange={profileHandler('email')} required />
                <Input label="Phone" icon={HiOutlinePhone} value={profileData.phone} onChange={profileHandler('phone')} placeholder="+1 (555) 000-0000" />
                <Input label="Location" icon={HiOutlineMapPin} value={profileData.location} onChange={profileHandler('location')} placeholder="San Francisco, CA" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-surface-200/80">Bio</label>
                <textarea value={profileData.bio} onChange={profileHandler('bio')} rows={3} placeholder="A brief about yourself..."
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 placeholder-surface-200/30 text-sm focus:outline-none focus:border-primary-500/50 resize-none" />
              </div>

              <div className="border-t border-white/5 pt-4">
                <h3 className="text-sm font-medium text-surface-200/60 mb-3">Social Links</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="LinkedIn" icon={HiOutlineLink} value={profileData.linkedIn} onChange={profileHandler('linkedIn')} placeholder="https://linkedin.com/in/..." />
                  <Input label="Portfolio" icon={HiOutlineLink} value={profileData.portfolio} onChange={profileHandler('portfolio')} placeholder="https://yoursite.com" />
                  <Input label="GitHub" icon={HiOutlineLink} value={profileData.github} onChange={profileHandler('github')} placeholder="https://github.com/..." />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="accent" type="submit" loading={saving}>
                  <HiOutlinePencilSquare /> Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {/* Password Form */}
      {activeTab === 'password' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md">
              <Input label="Current Password" type="password" icon={HiOutlineLockClosed}
                value={passwordData.currentPassword} onChange={passwordHandler('currentPassword')} required />
              <Input label="New Password" type="password" icon={HiOutlineLockClosed}
                value={passwordData.newPassword} onChange={passwordHandler('newPassword')} required />
              <Input label="Confirm New Password" type="password" icon={HiOutlineLockClosed}
                value={passwordData.confirmPassword} onChange={passwordHandler('confirmPassword')} required />
              <div className="flex justify-end pt-2">
                <Button variant="accent" type="submit" loading={saving}>
                  <HiOutlineLockClosed /> Change Password
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default ProfilePage;
