import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Shopper
          </Link>

          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-700 hover:text-blue-600">
              Dashboard
            </Link>

            {profile?.user_type === 'client' && (
              <Link href="/create-list" className="text-gray-700 hover:text-blue-600">
                Create List
              </Link>
            )}

            <Link href="/my-lists" className="text-gray-700 hover:text-blue-600">
              My Lists
            </Link>

            {profile?.user_type === 'shopper' && (
              <Link href="/my-bids" className="text-gray-700 hover:text-blue-600">
                My Bids
              </Link>
            )}

            <Link href="/profile" className="text-gray-700 hover:text-blue-600">
              Profile
            </Link>

            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}