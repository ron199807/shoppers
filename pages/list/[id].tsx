import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { useList } from '../../hooks/useLists';
import ListDetails from '@/components/lists/ListDetails';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Link from 'next/link';

export default function ListDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, profile } = useAuth();
  const { list, loading, error, refetch, updateList } = useList(id as string);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error || 'List not found'}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  const handleUpdate = async (updates: Partial<typeof list>) => {
    await updateList(updates);
    await refetch();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-4">
            <Link href="/" className="text-blue-600 hover:underline">
              ← Back to Dashboard
            </Link>
          </div>
          
          <ListDetails
            list={list}
            userType={profile?.user_type as 'client' | 'shopper'}
            userId={user?.id}
            onUpdate={handleUpdate}
            onBidPlaced={refetch}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}