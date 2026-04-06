import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircleIcon,
  EnvelopeIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  StarIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XMarkIcon,
  CameraIcon,
  ShieldCheckIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

export default function Profile() {
  const { user, profile, loading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
  });
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'success' });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
    }
  }, [profile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setMessage({ text: '', type: 'success' });

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setEditing(false);
      
      // Auto-hide message after 3 seconds
      setTimeout(() => setMessage({ text: '', type: 'success' }), 3000);
    } catch (error) {
      setMessage({ text: 'Error updating profile', type: 'error' });
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const getRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center space-x-1">
        {[...Array(fullStars)].map((_, i) => (
          <StarSolidIcon key={`full-${i}`} className="w-5 h-5 text-yellow-400" />
        ))}
        {hasHalfStar && (
          <StarSolidIcon className="w-5 h-5 text-yellow-400" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <StarIcon key={`empty-${i}`} className="w-5 h-5 text-gray-300" />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              My Profile
            </h1>
            <p className="text-gray-600 mt-2">Manage your personal information and preferences</p>
          </motion.div>

          {/* Message Toast */}
          <AnimatePresence>
            {message.text && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`mb-4 p-4 rounded-lg shadow-lg flex items-center space-x-2 ${
                  message.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircleIcon className="w-5 h-5" />
                ) : (
                  <XMarkIcon className="w-5 h-5" />
                )}
                <span className="font-medium">{message.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Cover Image */}
            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600" />

            <div className="relative px-6 pb-6">
              {/* Avatar Section */}
              <div className="flex justify-between items-start -mt-12 mb-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                      <UserCircleIcon className="w-16 h-16 text-white" />
                    </div>
                  </div>
                  <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all group-hover:scale-110">
                    <CameraIcon className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                
                {!editing && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditing(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </motion.button>
                )}
              </div>

              {/* Profile Info */}
              <div className="space-y-6">
                {editing ? (
                  <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleUpdate}
                    className="space-y-5"
                  >
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <UserIcon className="w-4 h-4 inline mr-2" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <PhoneIcon className="w-4 h-4 inline mr-2" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="+1 234 567 8900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <MapPinIcon className="w-4 h-4 inline mr-2" />
                        Address
                      </label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Your full address"
                      />
                    </div>

                    <div className="flex space-x-3 pt-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={updating}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
                      >
                        {updating ? 'Saving...' : 'Save Changes'}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => {
                          setEditing(false);
                          if (profile) {
                            setFormData({
                              full_name: profile.full_name || '',
                              phone: profile.phone || '',
                              address: profile.address || '',
                            });
                          }
                        }}
                        className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all"
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <EnvelopeIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                          <p className="font-medium text-gray-900">{user?.email}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <UserIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Full Name</p>
                          <p className="font-medium text-gray-900">{profile?.full_name || 'Not set'}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <PhoneIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Phone</p>
                          <p className="font-medium text-gray-900">{profile?.phone || 'Not set'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <ShieldCheckIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Account Type</p>
                          <p className="font-medium text-gray-900 capitalize">{profile?.user_type}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Address</p>
                          <p className="font-medium text-gray-900">{profile?.address || 'Not set'}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <StarIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Rating</p>
                          <div className="flex items-center space-x-2">
                            {getRatingStars(profile?.rating || 0)}
                            <span className="text-sm text-gray-600">
                              ({profile?.total_ratings || 0} reviews)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Stats Cards */}
                {!editing && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                    <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{profile?.total_ratings || 0}</p>
                      <p className="text-xs text-gray-600 uppercase tracking-wider">Total Reviews</p>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{profile?.rating?.toFixed(1) || '0.0'}</p>
                      <p className="text-xs text-gray-600 uppercase tracking-wider">Average Rating</p>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {new Date(profile?.created_at || '').getFullYear()}
                      </p>
                      <p className="text-xs text-gray-600 uppercase tracking-wider">Member Since</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Additional Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 bg-white rounded-2xl shadow-md p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Account Information</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CalendarIcon className="w-4 h-4" />
              <span>Joined on {new Date(profile?.created_at || '').toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <p>
                Last updated:{' '}
                {profile
                  ? new Date(((profile as any).updated_at || '') as string).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}