import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  ShoppingBagIcon,
  TruckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  XMarkIcon,
  PhoneIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  address: string;
  userType: 'client' | 'shopper';
}

interface VerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

// Verification Dialog Component
const VerificationDialog: React.FC<VerificationDialogProps> = ({ isOpen, onClose, email }) => {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleGoToLogin = () => {
    setIsRedirecting(true);
    // Redirect to login page after a short delay
    setTimeout(() => {
      window.location.href = '/login';
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Dialog */}
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <EnvelopeIcon className="h-6 w-6 text-blue-600" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Verify Your Email Address
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            We've sent a verification email to:
          </p>
          
          <p className="text-sm font-medium text-blue-600 bg-blue-50 rounded-lg p-2 mb-4 break-all">
            {email}
          </p>
          
          <p className="text-sm text-gray-600 mb-6">
            Please check your email inbox and click the verification link to activate your account. 
            After verification, you'll be automatically redirected to the home page.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleGoToLogin}
              disabled={isRedirecting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isRedirecting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Redirecting...
                </>
              ) : (
                <>
                  Go to Login
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </button>
            
            <button
              onClick={() => {
                window.open('https://mail.google.com', '_blank');
              }}
              className="w-full py-2.5 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Open Gmail
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={() => {
                toast.success('Resend verification email functionality would go here');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              click here to resend
            </button>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function Register() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    address: '',
    userType: 'client',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Password strength calculator
  useEffect(() => {
    let strength = 0;
    if (formData.password.length >= 6) strength += 1;
    if (formData.password.length >= 10) strength += 1;
    if (/[A-Z]/.test(formData.password)) strength += 1;
    if (/[0-9]/.test(formData.password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(formData.password)) strength += 1;
    setPasswordStrength(strength);
  }, [formData.password]);

  // Clear error when user starts typing
  useEffect(() => {
    if (error) setError('');
  }, [formData.email, formData.password, formData.fullName, formData.phone, formData.address]);

  // Check for email confirmation on mount and after router events
  useEffect(() => {
    const checkEmailConfirmation = async () => {
      // Check URL hash for Supabase email confirmation
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (accessToken && refreshToken && type === 'signup') {
        // User has confirmed their email
        toast.success('Email confirmed successfully! Redirecting to home page...', {
          duration: 3000,
        });
        
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    };

    checkEmailConfirmation();

    // Listen for hash changes
    const handleHashChange = () => {
      checkEmailConfirmation();
    };

    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [router]);

  const validateField = (field: keyof FormData, value: string): string | undefined => {
    switch (field) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        if (value.length > 50) return 'Name is too long';
        return undefined;
      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return undefined;
      case 'phone':
        if (value && !/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/im.test(value)) {
          return 'Please enter a valid phone number';
        }
        return undefined;
      case 'address':
        if (value && value.length > 200) return 'Address is too long (max 200 characters)';
        return undefined;
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return undefined;
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return undefined;
      default:
        return undefined;
    }
  };

  const handleBlur = (field: keyof FormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const getPasswordStrengthText = (): string => {
    if (passwordStrength === 0) return 'Very Weak';
    if (passwordStrength === 1) return 'Weak';
    if (passwordStrength === 2) return 'Fair';
    if (passwordStrength === 3) return 'Good';
    if (passwordStrength >= 4) return 'Strong';
    return '';
  };

  const getPasswordStrengthColor = (): string => {
    if (passwordStrength === 0) return 'bg-red-500';
    if (passwordStrength === 1) return 'bg-orange-500';
    if (passwordStrength === 2) return 'bg-yellow-500';
    if (passwordStrength === 3) return 'bg-blue-500';
    if (passwordStrength >= 4) return 'bg-green-500';
    return 'bg-gray-200';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const errors = {
      fullName: validateField('fullName', formData.fullName),
      email: validateField('email', formData.email),
      phone: validateField('phone', formData.phone),
      address: validateField('address', formData.address),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword),
    };
    
    const hasErrors = Object.values(errors).some(error => error !== undefined);
    if (hasErrors) {
      const firstError = Object.values(errors).find(error => error !== undefined);
      setError(firstError || 'Please fix the errors above');
      setTouched({ 
        fullName: true, 
        email: true, 
        phone: true, 
        address: true,
        password: true, 
        confirmPassword: true 
      });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await signUp(
        formData.email,
        formData.password,
        formData.userType,
        formData.fullName,
        formData.phone,
        formData.address
      );

      if (error) {
        const errorMessage = (error as any).message || '';
        if (errorMessage?.includes('rate limit')) {
          setError('Too many signup attempts. Please wait a few minutes before trying again.');
        } else if (errorMessage?.includes('User already registered')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else {
          setError(errorMessage || 'Registration failed. Please try again.');
        }
      } else {
        // Show verification dialog instead of immediate redirect
        setRegisteredEmail(formData.email);
        setShowVerificationDialog(true);
        
        // Clear form
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          fullName: '',
          phone: '',
          address: '',
          userType: 'client',
        });
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoData = (type: 'client' | 'shopper') => {
    setFormData({
      email: type === 'client' ? 'client@example.com' : 'shopper@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      fullName: type === 'client' ? 'Demo Client' : 'Demo Shopper',
      phone: '+1 (555) 123-4567',
      address: type === 'client' 
        ? '123 Client Street, New York, NY 10001' 
        : '456 Shopper Avenue, Los Angeles, CA 90210',
      userType: type,
    });
    setTouched({ 
      fullName: true, 
      email: true, 
      phone: true, 
      address: true,
      password: true, 
      confirmPassword: true 
    });
    toast.success('Demo data filled!');
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-8 relative z-10"
        >
          {/* Logo & Header */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-6"
            >
              <UserGroupIcon className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Shopper
            </h1>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Join our community of shoppers and clients
            </p>
          </div>

          {/* Registration Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Alert */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2">
                      <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                  <UserIcon className="w-4 h-4 inline mr-1" />
                  Full Name *
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  onBlur={() => handleBlur('fullName')}
                  className={`w-full text-gray-700 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    touched.fullName && validateField('fullName', formData.fullName)
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                  placeholder="John Doe"
                />
                {touched.fullName && validateField('fullName', formData.fullName) && (
                  <p className="text-red-500 text-xs mt-1">{validateField('fullName', formData.fullName)}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  <EnvelopeIcon className="w-4 h-4 inline mr-1" />
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onBlur={() => handleBlur('email')}
                  className={`w-full text-gray-700 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    touched.email && validateField('email', formData.email)
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                  placeholder="you@example.com"
                />
                {touched.email && validateField('email', formData.email) && (
                  <p className="text-red-500 text-xs mt-1">{validateField('email', formData.email)}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  <PhoneIcon className="w-4 h-4 inline mr-1" />
                  Phone Number (Optional)
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  onBlur={() => handleBlur('phone')}
                  className={`w-full text-gray-700 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    touched.phone && validateField('phone', formData.phone)
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                  placeholder="+1 (555) 123-4567"
                />
                {touched.phone && validateField('phone', formData.phone) && (
                  <p className="text-red-500 text-xs mt-1">{validateField('phone', formData.phone)}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Enter your phone number for easier communication
                </p>
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm  font-semibold text-gray-700 mb-2">
                  <MapPinIcon className="w-4 h-4 inline mr-1" />
                  Address (Optional)
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  onBlur={() => handleBlur('address')}
                  className={`w-full text-gray-700 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                    touched.address && validateField('address', formData.address)
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                  placeholder="123 Main St, Apt 4B, New York, NY 10001"
                />
                {touched.address && validateField('address', formData.address) && (
                  <p className="text-red-500 text-xs mt-1">{validateField('address', formData.address)}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Your address helps shoppers know your location for delivery
                </p>
              </div>

              {/* User Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  I want to *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, userType: 'client' })}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      formData.userType === 'client'
                        ? 'border-blue-600 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <ShoppingBagIcon className={`w-8 h-8 mx-auto mb-2 ${formData.userType === 'client' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div className="font-semibold text-gray-900">Post Shopping Tasks</div>
                    <div className="text-xs text-gray-500 mt-1">I need items shopped</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, userType: 'shopper' })}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      formData.userType === 'shopper'
                        ? 'border-blue-600 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <TruckIcon className={`w-8 h-8 mx-auto mb-2 ${formData.userType === 'shopper' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div className="font-semibold text-gray-900">Shop for Others</div>
                    <div className="text-xs text-gray-500 mt-1">I want to earn money</div>
                  </button>
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  <LockClosedIcon className="w-4 h-4 inline mr-1" />
                  Password *
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    onBlur={() => handleBlur('password')}
                    className={`w-full text-gray-700 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12 ${
                      touched.password && validateField('password', formData.password)
                        ? 'border-red-300'
                        : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{getPasswordStrengthText()}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Use at least 6 characters with letters, numbers, and symbols
                    </p>
                  </div>
                )}
                {touched.password && validateField('password', formData.password) && (
                  <p className="text-red-500 text-xs mt-1">{validateField('password', formData.password)}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    onBlur={() => handleBlur('confirmPassword')}
                    className={`w-full text-gray-700 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12 ${
                      touched.confirmPassword && validateField('confirmPassword', formData.confirmPassword)
                        ? 'border-red-300'
                        : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                {touched.confirmPassword && validateField('confirmPassword', formData.confirmPassword) && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <ExclamationTriangleIcon className="w-3 h-3" />
                    {validateField('confirmPassword', formData.confirmPassword)}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>

          {/* Demo Data Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => fillDemoData('client')}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Fill Client Demo
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => fillDemoData('shopper')}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Fill Shopper Demo
            </button>
          </div>
        </motion.div>
      </div>

      {/* Verification Dialog */}
      <AnimatePresence>
        {showVerificationDialog && (
          <VerificationDialog
            isOpen={showVerificationDialog}
            onClose={() => setShowVerificationDialog(false)}
            email={registeredEmail}
          />
        )}
      </AnimatePresence>
    </>
  );
}