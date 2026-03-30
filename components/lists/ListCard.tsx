import Link from 'next/link';
import { ShoppingList } from '@/types';

interface ListCardProps {
  list: ShoppingList;
  userType: 'client' | 'shopper';
}

export default function ListCard({ list, userType }: ListCardProps) {
  const totalItems = list.items?.length || 0;
  

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-800">{list.title}</h3>
          <span className={`px-2 py-1 text-xs rounded ${
            list.status === 'open' ? 'bg-green-100 text-green-800' :
            list.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
            list.status === 'completed' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {list.status}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {list.description || 'No description provided'}
        </p>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Items:</span>
            <span className="font-medium">{totalItems}</span>
          </div>
          {list.budget && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Budget:</span>
              <span className="font-medium">${list.budget}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Posted by:</span>
            <span className="font-medium">{list.client?.full_name || 'Anonymous'}</span>
          </div>
        </div>
        
        <Link href={`/list/${list.id}`}>
          <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">
            {userType === 'client' ? 'View Details' : 'Place Bid'}
          </button>
        </Link>
      </div>
    </div>
  );
}