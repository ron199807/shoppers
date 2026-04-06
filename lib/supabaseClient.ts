import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Helper function to get current user with retry logic
export const getCurrentUser = async (retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error(`Attempt ${i + 1} - Error getting user:`, error.message)
        
        // If it's a token error, try to refresh the session
        if (error.message.includes('token') || error.message.includes('JWT')) {
          const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()
          if (refreshError) {
            console.error('Error refreshing session:', refreshError)
            if (i === retries - 1) return null
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }
          if (session) {
            // Retry getting user after refresh
            continue
          }
        }
        
        if (i === retries - 1) return null
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      return user
    } catch (err) {
      console.error(`Attempt ${i + 1} - Exception getting user:`, err)
      if (i === retries - 1) return null
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  return null
}

// Helper function to get current user profile with better error handling
export const getCurrentProfile = async () => {
  const user = await getCurrentUser()
  if (!user) {
    console.log('No user found')
    return null
  }
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    
    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }
    
    return data
  } catch (err) {
    console.error('Exception fetching profile:', err)
    return null
  }
}

// Function to create profile if it doesn't exist
export const createProfileIfNotExists = async () => {
  const user = await getCurrentUser()
  if (!user) return null
  
  try {
    // Try to get existing profile
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    
    if (error) {
      console.error('Error checking profile:', error)
      return null
    }
    
    // If profile exists, return it
    if (profile) {
      return profile
    }
    
    // Get user metadata from auth
    const userMetadata = user.user_metadata || {}
    
    // Create new profile with all fields including phone and address
    console.log('Creating new profile for user:', user.id)
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          email: user.email,
          full_name: userMetadata.full_name || user.email?.split('@')[0] || 'User',
          user_type: userMetadata.user_type || 'client',
          phone: userMetadata.phone || null,
          address: userMetadata.address || null,
          rating: 0,
          total_ratings: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ])
      .select()
      .maybeSingle()
    
    if (insertError) {
      console.error('Error creating profile:', insertError)
      return null
    }
    
    console.log('Profile created successfully:', newProfile)
    return newProfile
  } catch (err) {
    console.error('Exception in createProfileIfNotExists:', err)
    return null
  }
}

// Function to update user profile
export const updateUserProfile = async (updates: {
  full_name?: string
  phone?: string
  address?: string
  avatar_url?: string
}) => {
  const user = await getCurrentUser()
  if (!user) {
    console.error('No user found to update profile')
    return null
  }
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .maybeSingle()
    
    if (error) {
      console.error('Error updating profile:', error)
      return null
    }
    
    return data
  } catch (err) {
    console.error('Exception updating profile:', err)
    return null
  }
}

// Function to get user profile by ID
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    
    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
    
    return data
  } catch (err) {
    console.error('Exception fetching user profile:', err)
    return null
  }
}

// Function to update user rating (for shoppers)
export const updateUserRating = async (userId: string, newRating: number) => {
  try {
    // First get current profile
    const profile = await getUserProfile(userId)
    if (!profile) return null
    
    // Calculate new average rating
    const totalRatings = (profile.total_ratings || 0) + 1
    const averageRating = ((profile.rating || 0) * (profile.total_ratings || 0) + newRating) / totalRatings
    
    const { data, error } = await supabase
      .from('profiles')
      .update({
        rating: Number(averageRating.toFixed(2)),
        total_ratings: totalRatings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .maybeSingle()
    
    if (error) {
      console.error('Error updating user rating:', error)
      return null
    }
    
    return data
  } catch (err) {
    console.error('Exception updating user rating:', err)
    return null
  }
}

// Function to search users by name or location
export const searchUsers = async (searchTerm: string, userType?: 'client' | 'shopper') => {
  try {
    let query = supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`)
    
    if (userType) {
      query = query.eq('user_type', userType)
    }
    
    const { data, error } = await query.limit(20)
    
    if (error) {
      console.error('Error searching users:', error)
      return []
    }
    
    return data
  } catch (err) {
    console.error('Exception searching users:', err)
    return []
  }
}