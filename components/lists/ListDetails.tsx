import { useState, useEffect } from "react";
import { ShoppingList, Bid } from "../../types";
import BidForm from "../bids/BidForm";
import BidList from "../bids/BidList";
import { supabase } from "../../lib/supabaseClient";
import {
  updateDeliveryStatus,
  createPayment,
  createRating,
  createNotification,
} from "../../lib/api/delivery";

interface ListDetailsProps {
  list: ShoppingList;
  userType: "client" | "shopper";
  userId: string;
  onUpdate: (updates: Partial<ShoppingList>) => Promise<void>;
  onBidPlaced?: () => void;
}

export default function ListDetails({
  list,
  userType,
  userId,
  onUpdate,
  onBidPlaced,
}: ListDetailsProps) {
  const [showBidForm, setShowBidForm] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [localList, setLocalList] = useState(list);

  // Update localList when prop changes
  useEffect(() => {
    setLocalList(list);
    console.log("ListDetails received list:", list);
  }, [list]);

  const isOwner = localList.client_id === userId;
  const hasBid = localList.bids?.some((bid) => bid.shopper_id === userId);
  const canPlaceBid =
    userType === "shopper" && localList.status === "open" && !hasBid;
  const pendingBids = localList.bids?.filter((b) => b.status === "pending") || [];
  const selectedBid = localList.selected_bid;
  const isSelectedShopper = selectedBid?.shopper_id === userId;

  const handleAcceptBid = async (bid: Bid) => {
    if (
      !confirm(
        `Accept bid of $${bid.amount?.toFixed(2) || bid.amount} from ${bid.shopper?.full_name}?`,
      )
    ) {
      return;
    }

    setUpdating(true);
    try {
      // Update the list status
      await onUpdate({
        selected_bid_id: bid.id,
        status: "in_progress",
      });

      // Create delivery record
      await supabase.from("deliveries").insert({
        list_id: localList.id,
        shopper_id: bid.shopper_id,
        status: "shopping",
      });

      // Notify shopper
      await createNotification(
        bid.shopper_id,
        "Bid Accepted! 🎉",
        `Your bid of $${bid.amount} for "${localList.title}" has been accepted!`,
        "bid_accepted",
        { list_id: localList.id },
      );

      // Reject other bids
      const otherBids = localList.bids?.filter(
        (b) => b.id !== bid.id && b.status === "pending",
      );
      for (const otherBid of otherBids || []) {
        await createNotification(
          otherBid.shopper_id,
          "Bid Not Selected",
          `Your bid for "${localList.title}" was not selected. Better luck next time!`,
          "bid_rejected",
          { list_id: localList.id },
        );
        await supabase
          .from("bids")
          .update({ status: "rejected" })
          .eq("id", otherBid.id);
      }
      
      // Refresh the list
      await onUpdate({});
    } catch (error) {
      console.error("Error accepting bid:", error);
      alert("Failed to accept bid");
    } finally {
      setUpdating(false);
    }
  };

  const handleStartShopping = async () => {
    if (!localList.selected_bid) {
      alert("No shopper selected for this list.");
      return;
    }
    
    if (!confirm('Are you ready to start shopping? This will mark the list as "In Progress".')) {
      return;
    }
    
    try {
      setUpdating(true);
      
      // Update the list status directly in the database
      const { error: updateError } = await supabase
        .from('shopping_lists')
        .update({ 
          status: 'in_progress',
          delivery_status: 'shopping'
        })
        .eq('id', localList.id);
      
      if (updateError) throw updateError;
      
      // Update delivery status
      await updateDeliveryStatus(
        localList.id,
        localList.selected_bid.shopper_id,
        'shopping',
        localList.client_id,
        localList.title
      );
      
      alert('Shopping started! You can now mark items as purchased.');
      
      // Refresh the list to get updated status
      await onUpdate({ 
        status: 'in_progress',
        delivery_status: 'shopping'
      });
    } catch (error) {
      console.error('Error starting shopping:', error);
      alert('Failed to start shopping. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleReadyForDelivery = async () => {
    if (!confirm("Are all items purchased and ready for delivery?")) return;

    setUpdating(true);
    try {
      // Update delivery status
      await updateDeliveryStatus(localList.id, userId, "ready_for_delivery");
      
      // Update the list's delivery_status field
      const { error: updateError } = await supabase
        .from('shopping_lists')
        .update({ delivery_status: 'ready_for_delivery' })
        .eq('id', localList.id);
      
      if (updateError) throw updateError;
      
      await createNotification(
        localList.client_id,
        "Ready for Delivery! 📦",
        `${selectedBid?.shopper?.full_name} has finished shopping and is ready to deliver your items.`,
        "delivery_update",
        { list_id: localList.id },
      );
      
      alert("Marked as ready for delivery!");
      
      // Refresh the list
      await onUpdate({ delivery_status: "ready_for_delivery" });
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!selectedBid?.shopper_id) {
      alert("No shopper selected for this list.");
      return;
    }
    const shopperId = selectedBid.shopper_id;

    if (!confirm("Have you received all items?")) return;

    setUpdating(true);
    try {
      // Update delivery status
      await updateDeliveryStatus(localList.id, shopperId, "delivered");
      
      // Update the list's delivery_status field
      const { error: updateError } = await supabase
        .from('shopping_lists')
        .update({ delivery_status: 'delivered' })
        .eq('id', localList.id);
      
      if (updateError) throw updateError;
      
      await createNotification(
        shopperId,
        "Delivery Confirmed! ✓",
        `${localList.client?.full_name} has confirmed receipt of items for "${localList.title}".`,
        "delivery_update",
        { list_id: localList.id },
      );
      
      setShowRatingModal(true);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to confirm delivery");
    } finally {
      setUpdating(false);
    }
  };

  const handleCompletePayment = async () => {
    if (!selectedBid) return;

    setUpdating(true);
    try {
      await createPayment(
        localList.id,
        userId,
        selectedBid.shopper_id,
        selectedBid.amount,
      );
      
      // Update the list status
      const { error: updateError } = await supabase
        .from('shopping_lists')
        .update({ 
          payment_status: "paid",
          status: "completed",
          delivery_status: "completed"
        })
        .eq('id', localList.id);
      
      if (updateError) throw updateError;
      
      await createNotification(
        selectedBid.shopper_id,
        "Payment Received! 💰",
        `You have received $${selectedBid.amount} for "${localList.title}".`,
        "payment_received",
        { list_id: localList.id },
      );
      
      alert("Payment completed!");
      
      // Refresh the list
      await onUpdate({
        payment_status: "paid",
        status: "completed",
        delivery_status: "completed"
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to process payment");
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!selectedBid) return;

    setUpdating(true);
    try {
      await createRating(
        localList.id,
        userId,
        selectedBid.shopper_id,
        rating,
        review,
      );
      await createNotification(
        selectedBid.shopper_id,
        "New Rating! ⭐",
        `${localList.client?.full_name} rated you ${rating}/5 for "${localList.title}".`,
        "rating_received",
        { list_id: localList.id },
      );
      setShowRatingModal(false);
      alert("Thank you for rating!");
      await onUpdate({});
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to submit rating");
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return "Not specified";
    return `$${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!localList) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">Loading list details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* List Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-gray-600 text-3xl font-bold">
            {localList.title || "Untitled List"}
          </h1>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(localList.status)}`}
          >
            {localList.status?.toUpperCase() || "UNKNOWN"}
          </span>
        </div>

        <p className="text-gray-600 mb-4 whitespace-pre-wrap">
          {localList.description || "No description provided"}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Budget</p>
            <p className="font-semibold text-lg text-blue-600">
              {formatCurrency(localList.budget)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Delivery Address</p>
            <p className="text-blue-600 font-medium">
              {localList.delivery_address || "Not specified"}
            </p>
          </div>
          {localList.delivery_deadline && (
            <div>
              <p className="text-sm text-gray-500">Delivery Deadline</p>
              <p className="text-blue-600 font-medium">
                {new Date(localList.delivery_deadline).toLocaleString()}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Posted by</p>
            <p className="text-blue-600 font-medium">
              {localList.client?.full_name || "Anonymous"}
            </p>
          </div>
        </div>
      </div>

      {/* Shopping Items */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-gray-600 text-xl font-semibold mb-4">
          Shopping Items
        </h2>
        {localList.items && localList.items.length > 0 ? (
          <div className="space-y-2">
            {localList.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 border-b"
              >
                <div>
                  <span className="text-gray-600 font-medium">{item.name}</span>
                  <span className="text-gray-500 text-sm ml-2">
                    ×{item.quantity} {item.unit || ""}
                  </span>
                  {item.notes && (
                    <p className="text-xs text-gray-400 mt-1">{item.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No items added to this list yet.</p>
        )}
      </div>

      {/* Bids Section (for clients) */}
      {userType === "client" &&
        isOwner &&
        localList.status === "open" &&
        pendingBids.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-gray-700 text-xl font-semibold mb-4">
              Received Bids ({pendingBids.length})
            </h2>
            <BidList bids={pendingBids} onAcceptBid={handleAcceptBid} />
          </div>
        )}

      {/* Selected Shopper Section */}
      {selectedBid && (
        <div className="bg-green-50 border border-green-200 rounded-lg shadow-md p-6">
          <h2 className="text-gray-700 text-xl font-semibold mb-2 text-green-800">
            ✓ Selected Shopper
          </h2>
          <p className="text-green-700">
            <strong>{selectedBid.shopper?.full_name}</strong> was selected with
            a bid of <strong>{formatCurrency(selectedBid.amount)}</strong>.
          </p>
          <p className="text-green-700 text-sm mt-1">
            Delivery Status: <strong>{localList.delivery_status || "Pending"}</strong>
          </p>
        </div>
      )}

      {/* Place Bid Section */}
      {userType === "shopper" && !isOwner && canPlaceBid && (
        <div className="bg-white rounded-lg shadow-md p-6">
          {!showBidForm ? (
            <button
              onClick={() => setShowBidForm(true)}
              className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700"
            >
              Place a Bid
            </button>
          ) : (
            <BidForm
              listId={localList.id}
              onBidPlaced={() => {
                setShowBidForm(false);
                if (onBidPlaced) onBidPlaced();
              }}
              onCancel={() => setShowBidForm(false)}
            />
          )}
        </div>
      )}

      {/* My Bid Status */}
      {userType === "shopper" && !isOwner && hasBid && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-2 text-blue-800">
            Your Bid Status
          </h2>
          {localList.bids?.map((bid) => {
            if (bid.shopper_id === userId) {
              return (
                <div key={bid.id}>
                  <p className="text-gray-600">
                    Bid:{" "}
                    <strong className="text-blue-400">
                      {formatCurrency(bid.amount)}
                    </strong>
                  </p>
                  <p className="text-gray-600">
                    Status:{" "}
                    <strong className="text-blue-400 capitalize">
                      {bid.status}
                    </strong>
                  </p>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Delivery Status for Shopper */}
      {userType === "shopper" &&
        isSelectedShopper &&
        localList.status === "in_progress" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-gray-600 text-xl font-semibold mb-4">
              Delivery Status
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Shopping Status:</span>
                {!localList.delivery_status || localList.delivery_status === "pending" ? (
                  <button
                    onClick={handleStartShopping}
                    disabled={updating}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updating ? "Processing..." : "Start Shopping"}
                  </button>
                ) : localList.delivery_status === "shopping" && (
                  <span className="text-green-600">✓ In Progress</span>
                )}
              </div>
              {localList.delivery_status === "shopping" && (
                <button
                  onClick={handleReadyForDelivery}
                  disabled={updating}
                  className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {updating ? "Processing..." : "Ready for Delivery"}
                </button>
              )}
            </div>
          </div>
        )}

      {/* Delivery Confirmation for Client */}
      {userType === "client" &&
        isOwner &&
        localList.delivery_status === "ready_for_delivery" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Confirm Delivery</h2>
            <p className="text-gray-600 mb-3">
              The shopper has marked this order as ready for delivery. Please confirm when you receive the items.
            </p>
            <button
              onClick={handleConfirmDelivery}
              disabled={updating}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {updating ? "Processing..." : "Confirm Receipt"}
            </button>
          </div>
        )}

      {/* Payment Section */}
      {userType === "client" &&
        isOwner &&
        localList.delivery_status === "delivered" &&
        localList.payment_status !== "paid" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Complete Payment</h2>
            <p className="text-gray-600">Amount: {formatCurrency(selectedBid?.amount)}</p>
            <button
              onClick={handleCompletePayment}
              disabled={updating}
              className="mt-3 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {updating ? "Processing..." : "Pay Now"}
            </button>
          </div>
        )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Rate Your Shopper</h2>
            <div className="mb-4">
              <label className="block mb-2">Rating</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-3xl ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="block mb-2">Review (Optional)</label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Share your experience..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleSubmitRating}
                className="flex-1 bg-blue-600 text-white py-2 rounded"
              >
                Submit
              </button>
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 bg-gray-300 py-2 rounded"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}