import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import { ShoppingList, ListItem } from '../../types';

export default function EditList() {
  const router = useRouter();
  const { id } = router.query;
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    delivery_address: '',
    delivery_deadline: '',
  });

  useEffect(() => {
    if (!id) return;

    const fetchList = async () => {
      try {
        const { data, error } = await supabase
          .from('shopping_lists')
          .select(`
            *,
            items:list_items(*)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        
        setList(data);
        setItems(data.items || []);
        setFormData({
          title: data.title,
          description: data.description || '',
          budget: data.budget?.toString() || '',
          delivery_address: data.delivery_address,
          delivery_deadline: data.delivery_deadline || '',
        });
      } catch (error) {
        console.error('Error fetching list:', error);
        alert('Failed to load list');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [id]);

  const addItem = () => {
    setItems([...items, { id: '', list_id: '', name: '', quantity: 1, unit: '', created_at: '' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!list) return;

    setSaving(true);

    try {
      // Update shopping list
      const { error: listError } = await supabase
        .from('shopping_lists')
        .update({
          title: formData.title,
          description: formData.description,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          delivery_address: formData.delivery_address,
          delivery_deadline: formData.delivery_deadline || null,
        })
        .eq('id', list.id);

      if (listError) throw listError;

      // Delete existing items
      const { error: deleteError } = await supabase
        .from('list_items')
        .delete()
        .eq('list_id', list.id);

      if (deleteError) throw deleteError;

      // Insert updated items
      const validItems = items.filter(item => item.name && item.name.trim());
      if (validItems.length > 0) {
        const { error: itemsError } = await supabase
          .from('list_items')
          .insert(
            validItems.map(item => ({
              list_id: list.id,
              name: item.name.trim(),
              quantity: item.quantity,
              unit: item.unit || null,
            }))
          );

        if (itemsError) throw itemsError;
      }

      alert('List updated successfully!');
      router.push(`/list/${list.id}`);
    } catch (error) {
      console.error('Error updating list:', error);
      alert('Failed to update shopping list');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedUserType="client">
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-3xl font-bold mb-8">Edit Shopping List</h1>
          
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
            {/* Basic Info - Same as create form */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget (optional)
                </label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Deadline
                </label>
                <input
                  type="datetime-local"
                  value={formData.delivery_deadline}
                  onChange={(e) => setFormData({ ...formData, delivery_deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Address *
              </label>
              <input
                type="text"
                required
                value={formData.delivery_address}
                onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Shopping Items */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shopping Items *
              </label>
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                  <input
                    type="text"
                    placeholder="Unit"
                    value={item.unit || ''}
                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addItem}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                + Add Item
              </button>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/list/${list?.id}`)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}