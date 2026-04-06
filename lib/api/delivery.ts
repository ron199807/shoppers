import { supabase } from "../supabaseClient";

// Update delivery status
// In lib/api/delivery.ts
export const updateDeliveryStatus = async (
  listId: string,
  shopperId: string,
  status: string,
  clientId?: string,
  listTitle?: string,
) => {
  const updates: any = { status, updated_at: new Date().toISOString() };

  if (status === "shopping") {
    updates.shopping_started_at = new Date().toISOString();
  } else if (status === "ready_for_delivery") {
    updates.shopping_completed_at = new Date().toISOString();
  } else if (status === "delivered") {
    updates.delivered_at = new Date().toISOString();
  }

  // Check if delivery record exists
  const { data: existing } = await supabase
    .from("deliveries")
    .select("id")
    .eq("list_id", listId)
    .maybeSingle();

  let result;
  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from("deliveries")
      .update(updates)
      .eq("list_id", listId)
      .select()
      .single();

    if (error) throw error;
    result = data;
  } else {
    // Create new
    const { data, error } = await supabase
      .from("deliveries")
      .insert({
        list_id: listId,
        shopper_id: shopperId,
        ...updates,
      })
      .select()
      .single();

    if (error) throw error;
    result = data;
  }

  // Update the shopping_list delivery_status
  await supabase
    .from("shopping_lists")
    .update({ delivery_status: status })
    .eq("id", listId);

  // Create notification for client if clientId provided
  if (clientId && listTitle) {
    let title = "";
    let message = "";
    let notificationType = "";

    switch (status) {
      case "shopping":
        title = "Shopping Started! 🛒";
        message = `Shopper has started shopping for "${listTitle}".`;
        notificationType = "shopping_started"; // Use correct type
        break;
      case "ready_for_delivery":
        title = "Ready for Delivery! 📦";
        message = `Your items for "${listTitle}" have been purchased and are ready for delivery.`;
        notificationType = "delivery_update"; // Use correct type
        break;
      case "delivered":
        title = "Order Delivered! ✅";
        message = `Your order "${listTitle}" has been delivered. Please confirm and rate your shopper.`;
        notificationType = "delivery_update"; // Use correct type
        break;
    }

    // Create notification with correct type
    await createNotification(clientId, title, message, notificationType, {
      list_id: listId,
      status,
    });
  }

  return result;
};

// Create payment
export const createPayment = async (
  listId: string,
  clientId: string,
  shopperId: string,
  amount: number,
) => {
  const { data, error } = await supabase
    .from("payments")
    .insert({
      list_id: listId,
      client_id: clientId,
      shopper_id: shopperId,
      amount: amount,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // Update shopping_list payment status
  await supabase
    .from("shopping_lists")
    .update({
      payment_status: "paid",
      payment_amount: amount,
      paid_at: new Date().toISOString(),
      status: "completed",
    })
    .eq("id", listId);

  return data;
};

// Create rating
export const createRating = async (
  listId: string,
  clientId: string,
  shopperId: string,
  rating: number,
  review?: string,
) => {
  const { data, error } = await supabase
    .from("ratings")
    .insert({
      list_id: listId,
      client_id: clientId,
      shopper_id: shopperId,
      rating: rating,
      review: review,
    })
    .select()
    .single();

  if (error) throw error;

  // Update shopper's average rating
  const { data: shopperRatings } = await supabase
    .from("ratings")
    .select("rating")
    .eq("shopper_id", shopperId);

  if (shopperRatings && shopperRatings.length > 0) {
    const avgRating =
      shopperRatings.reduce((sum, r) => sum + r.rating, 0) /
      shopperRatings.length;
    await supabase
      .from("profiles")
      .update({
        rating: avgRating,
        total_ratings: shopperRatings.length,
      })
      .eq("id", shopperId);
  }

  return data;
};

export const createNotification = async (userId: string, title: string, message: string, type: string, metadata?: any) => {
  try {
    // Skip notification if no user ID
    if (!userId) {
      console.log('No user ID provided, skipping notification');
      return null;
    }

    console.log('Attempting to create notification:', { userId, title, type });

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: title,
        message: message,
        type: type,
        metadata: metadata || {},
        read: false
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating notification:', error.message);
      // Don't throw - just log and continue
      return null;
    }
    
    console.log('Notification created successfully:', data);
    return data;
  } catch (err) {
    console.error('Failed to create notification:', err);
    // Always return null - don't let notification failures break the main flow
    return null;
  }
};

// Get notifications for user
export const getNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string) => {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);

  if (error) throw error;
};
