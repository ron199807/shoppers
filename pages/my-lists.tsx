import { useAuth } from '../hooks/useAuth';
import { useLists } from '../hooks/useLists';
import ListCard from '@/components/lists/ListCard';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Link from 'next/link';

export default function MyLists() {
  const { user, profile } = useAuth();
  const { lists, loading, error } = useLists({
    client_id: profile?.user_type === 'client' ? user?.id : undefined,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const activeLists = lists.filter(l => l.status !== 'completed' && l.status !== 'cancelled');
  const completedLists = lists.filter(l => l.status === 'completed' || l.status === 'cancelled');

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">My Shopping Lists</h1>
            {profile?.user_type === 'client' && (
              <Link href="/create-list">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  + Create New List
                </button>
              </Link>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {lists.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg mb-4">No shopping lists yet</p>
              {profile?.user_type === 'client' && (
                <Link href="/create-list">
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
                    Create Your First List
                  </button>
                </Link>
              )}
            </div>
          )}

          {activeLists.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Active Lists</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeLists.map(list => (
                  <ListCard
                    key={list.id}
                    list={list}
                    userType={profile?.user_type as 'client' | 'shopper'}
                  />
                ))}
              </div>
            </div>
          )}

          {completedLists.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Completed & Cancelled</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedLists.map(list => (
                  <ListCard
                    key={list.id}
                    list={list}
                    userType={profile?.user_type as 'client' | 'shopper'}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}