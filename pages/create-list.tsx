import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  TrashIcon,
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ShoppingBagIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface ListItem {
  name: string;
  quantity: number;
  unit: string;
  id?: string;
}

interface FormData {
  title: string;
  description: string;
  budget: string;
  delivery_address: string;
  delivery_deadline: string;
}

interface FormErrors {
  title?: string;
  delivery_address?: string;
  items?: string;
  budget?: string;
}

export default function CreateList() {
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ListItem[]>([{ name: '', quantity: 1, unit: '' }]);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    budget: '',
    delivery_address: '',
    delivery_deadline: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validation functions
  const validateTitle = useCallback((title: string): string | undefined => {
    if (!title.trim()) return 'Title is required';
    if (title.length < 3) return 'Title must be at least 3 characters';
    if (title.length > 100) return 'Title must be less than 100 characters';
    return undefined;
  }, []);

  const validateDeliveryAddress = useCallback((address: string): string | undefined => {
    if (!address.trim()) return 'Delivery address is required';
    if (address.length < 5) return 'Please enter a complete address';
    return undefined;
  }, []);

  const validateBudget = useCallback((budget: string): string | undefined => {
    if (!budget) return undefined;
    const amount = parseFloat(budget);
    if (isNaN(amount) || amount <= 0) return 'Budget must be a positive number';
    if (amount > 1000000) return 'Budget is too high';
    return undefined;
  }, []);

  const validateItems = useCallback((items: ListItem[]): string | undefined => {
    const validItems = items.filter(item => item.name.trim());
    if (validItems.length === 0) return 'At least one item is required';
    const emptyItem = items.find(item => item.name.trim() === '' && items.length > 1);
    if (emptyItem) return 'Please remove empty items';
    return undefined;
  }, []);

  const validateField = useCallback((name: string, value: any) => {
    switch (name) {
      case 'title':
        return validateTitle(value);
      case 'delivery_address':
        return validateDeliveryAddress(value);
      case 'budget':
        return validateBudget(value);
      case 'items':
        return validateItems(value);
      default:
        return undefined;
    }
  }, [validateTitle, validateDeliveryAddress, validateBudget, validateItems]);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof FormData]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1, unit: '' }]);
    // Clear items error when adding
    if (errors.items) {
      const itemsError = validateItems([...items, { name: '', quantity: 1, unit: '' }]);
      setErrors(prev => ({ ...prev, items: itemsError }));
    }
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    if (errors.items) {
      const itemsError = validateItems(newItems);
      setErrors(prev => ({ ...prev, items: itemsError }));
    }
  };

  const updateItem = (index: number, field: keyof ListItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
    
    // Clear items error when user adds an item
    if (errors.items && updated.some(item => item.name.trim())) {
      const itemsError = validateItems(updated);
      setErrors(prev => ({ ...prev, items: itemsError }));
    }
  };

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {
      title: validateTitle(formData.title),
      delivery_address: validateDeliveryAddress(formData.delivery_address),
      budget: validateBudget(formData.budget),
      items: validateItems(items),
    };
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== undefined);
  }, [formData, items, validateTitle, validateDeliveryAddress, validateBudget, validateItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      title: true,
      delivery_address: true,
      items: true,
    });
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    if (!profile) {
      toast.error('Please log in again');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Creating your shopping list...');

    try {
      // Create shopping list
      const listData = {
        client_id: profile.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        delivery_address: formData.delivery_address.trim(),
        delivery_deadline: formData.delivery_deadline || null,
        status: 'open',
      };

      const { data: list, error: listError } = await supabase
        .from('shopping_lists')
        .insert([listData])
        .select()
        .single();

      if (listError) throw listError;

      // Create list items
      const validItems = items.filter(item => item.name.trim());
      if (validItems.length > 0) {
        const itemsToInsert = validItems.map(item => ({
          list_id: list.id,
          name: item.name.trim(),
          quantity: item.quantity,
          unit: item.unit || null,
        }));
        
        const { error: itemsError } = await supabase
          .from('list_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      toast.success('Shopping list created successfully!', { id: loadingToast });
      
      // Small delay before redirect for better UX
      setTimeout(() => {
        router.push(`/list/${list.id}`);
      }, 500);
    } catch (error) {
      console.error('Error creating list:', error);
      toast.error('Failed to create shopping list. Please try again.', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = useMemo(() => {
    return (
      formData.title.trim() !== '' &&
      formData.delivery_address.trim() !== '' &&
      items.some(item => item.name.trim()) &&
      !errors.title &&
      !errors.delivery_address &&
      !errors.budget &&
      !errors.items
    );
  }, [formData, items, errors]);

  return (
    <ProtectedRoute allowedUserType="client">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Create Shopping List
            </h1>
            <p className="text-gray-600 mt-2">
              Fill in the details below to create a new shopping task
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="p-6 md:p-8 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  List Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    onBlur={() => handleBlur('title')}
                    className={`text-gray-700 w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      touched.title && errors.title
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                    }`}
                    placeholder="e.g., Weekly Groceries, Office Supplies..."
                  />
                  {touched.title && errors.title && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <ExclamationTriangleIcon className="w-3 h-3" />
                      {errors.title}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="text-gray-700 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Add any special instructions or notes for the shopper..."
                />
              </div>

              {/* Budget & Deadline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <CurrencyDollarIcon className="w-4 h-4 inline mr-1" />
                    Budget <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    onBlur={() => handleBlur('budget')}
                    className={`text-gray-700 w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      touched.budget && errors.budget
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  {touched.budget && errors.budget && (
                    <p className="text-red-500 text-xs mt-1">{errors.budget}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <CalendarIcon className="w-4 h-4 inline mr-1" />
                    Delivery Deadline <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.delivery_deadline}
                    onChange={(e) => setFormData({ ...formData, delivery_deadline: e.target.value })}
                    className="text-gray-700 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPinIcon className="w-4 h-4 inline mr-1" />
                  Delivery Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.delivery_address}
                  onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                  onBlur={() => handleBlur('delivery_address')}
                  className={`text-gray-700 w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    touched.delivery_address && errors.delivery_address
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Full delivery address"
                />
                {touched.delivery_address && errors.delivery_address && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <ExclamationTriangleIcon className="w-3 h-3" />
                    {errors.delivery_address}
                  </p>
                )}
              </div>

              {/* Shopping Items */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <ShoppingBagIcon className="w-4 h-4 inline mr-1" />
                  Shopping Items <span className="text-red-500">*</span>
                </label>
                
                <div className="space-y-3">
                  <AnimatePresence>
                    {items.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex gap-2 items-center"
                      >
                        <input
                          type="text"
                          placeholder="Item name"
                          value={item.name}
                          onChange={(e) => updateItem(index, 'name', e.target.value)}
                          className="text-gray-700 flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="text-gray-700 w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                        />
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => updateItem(index, 'unit', e.target.value)}
                          className="text-gray-700 w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="kg, pcs, etc"
                        />
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Add Item
                  </button>
                  
                  {touched.items && errors.items && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <ExclamationTriangleIcon className="w-3 h-3" />
                      {errors.items}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 md:px-8 py-4 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="px-6 py-2.5 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      Create Shopping List
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.form>
        </div>
      </div>
    </ProtectedRoute>
  );
}