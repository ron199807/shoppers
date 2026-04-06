import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabaseClient";
import ListDetails from "../../components/lists/ListDetails";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import Link from "next/link";
import { ShoppingList, Bid, ListItem, Profile } from "../../types";

export default function ListDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, profile } = useAuth();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

const fetchList = async () => {
  if (!id) return;

  try {
    setLoading(true);

    // 1. Fetch the shopping list
    const { data: listData, error: listError } = await supabase
      .from("shopping_lists")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (listError) throw listError;
    if (!listData) {
      setError("List not found");
      setLoading(false);
      return;
    }

    // 2. Fetch the client profile
    const { data: clientData, error: clientError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", listData.client_id)
      .maybeSingle();

    if (clientError) {
      console.error("Error fetching client:", clientError);
    }

    // 3. Fetch list items - FIXED: specify which foreign key to use
    const { data: itemsData, error: itemsError } = await supabase
      .from("list_items")  // ← Explicit foreign key
      .select("*")
      .eq("list_id", id);

    if (itemsError) {
      console.error("Error fetching items:", itemsError);
    }

    // 4. Fetch bids for this list
    const { data: bidsData, error: bidsError } = await supabase
      .from("bids")
      .select("*")
      .eq("list_id", id);

    if (bidsError) console.error("Error fetching bids:", bidsError);

    // 5. Fetch shopper profiles for each bid
    let bidsWithShoppers: Bid[] = [];
    if (bidsData && bidsData.length > 0) {
      const shopperIds = [...new Set(bidsData.map((b) => b.shopper_id))];
      const { data: shoppersData, error: shoppersError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", shopperIds);

      if (!shoppersError && shoppersData) {
        bidsWithShoppers = bidsData.map((bid) => ({
          ...bid,
          shopper: shoppersData.find((s) => s.id === bid.shopper_id),
        }));
      } else {
        bidsWithShoppers = bidsData;
      }
    }

    // 6. Find the selected bid
    const selectedBid = bidsWithShoppers.find(
      (b) => b.id === listData.selected_bid_id,
    );

    // 7. Assemble the complete list object
    const completeList: ShoppingList = {
      ...listData,
      client: clientData || null,
      items: itemsData || [],
      bids: bidsWithShoppers || [],
      selected_bid: selectedBid || null,
    };

    console.log("Complete list:", completeList);
    setList(completeList);
  } catch (err) {
    console.error("Error fetching list:", err);
    setError("Failed to load list");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchList();
  }, [id]);

  const handleUpdate = async (updates: Partial<ShoppingList>) => {
    if (!list) return;

    const { error } = await supabase
      .from("shopping_lists")
      .update(updates)
      .eq("id", list.id);

    if (error) throw error;
    await fetchList();
  };

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
          <p className="text-red-600 text-xl mb-4">
            {error || "List not found"}
          </p>
          <Link href="/" className="text-blue-600 hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

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
            userType={profile?.user_type as "client" | "shopper"}
            userId={user?.id}
            onUpdate={handleUpdate}
            onBidPlaced={fetchList}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
