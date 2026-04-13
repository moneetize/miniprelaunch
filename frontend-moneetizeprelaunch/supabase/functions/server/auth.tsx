import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

// Admin client for user creation
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Regular client for auth operations
const getSupabaseClient = () => createClient(supabaseUrl, supabaseAnonKey);

interface SignupRequest {
  email: string;
  password: string;
  name?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Sign up a new user
 */
export async function signup(body: SignupRequest) {
  try {
    console.log('Signup request received:', { email: body?.email, hasPassword: !!body?.password, name: body?.name });
    
    const { email, password, name } = body || {};

    // Validate input
    if (!email || !password) {
      console.error('Signup validation failed: missing email or password');
      return {
        success: false,
        error: 'Email and password are required',
        status: 400
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('Signup validation failed: invalid email format');
      return {
        success: false,
        error: 'Invalid email format',
        status: 400
      };
    }

    // Validate password strength
    if (password.length < 6) {
      console.error('Signup validation failed: password too short');
      return {
        success: false,
        error: 'Password must be at least 6 characters long',
        status: 400
      };
    }

    // Create user with admin privileges
    console.log('Creating user with Supabase admin...');
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || '' },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.error('Supabase createUser error:', error);
      
      // Check for duplicate user error - more comprehensive check
      const isDuplicateError = 
        error.code === 'email_exists' || 
        error.code === '23505' || // PostgreSQL unique violation code
        error.message?.toLowerCase().includes('already') || 
        error.message?.toLowerCase().includes('registered') ||
        error.message?.toLowerCase().includes('duplicate') ||
        error.message?.toLowerCase().includes('unique');
        
      if (isDuplicateError) {
        return {
          success: false,
          error: 'This email is already registered. Please login instead.',
          code: 'email_exists',
          status: 400
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to create user',
        status: 400
      };
    }

    if (!data.user) {
      console.error('No user data returned from Supabase');
      return {
        success: false,
        error: 'Failed to create user - no user data returned',
        status: 500
      };
    }

    console.log('User created successfully, now signing in...');
    
    // Now sign in the user to get a session
    const supabase = getSupabaseClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (sessionError) {
      console.error('Session creation error after signup:', sessionError);
      return {
        success: false,
        error: 'User created but failed to create session. Please try logging in.',
        status: 500
      };
    }

    console.log('Signup successful!');
    return {
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name
        },
        session: {
          access_token: sessionData.session?.access_token,
          refresh_token: sessionData.session?.refresh_token
        }
      },
      status: 201
    };

  } catch (error) {
    console.error('Unexpected signup error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during signup',
      status: 500
    };
  }
}

/**
 * Login an existing user
 */
export async function login(body: LoginRequest) {
  try {
    console.log('Login request received:', { email: body?.email, hasPassword: !!body?.password });
    
    const { email, password } = body || {};

    // Validate input
    if (!email || !password) {
      console.error('Login validation failed: missing email or password');
      return {
        success: false,
        error: 'Email and password are required',
        status: 400
      };
    }

    console.log('Attempting to sign in with Supabase...');
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Supabase login error:', error);
      return {
        success: false,
        error: 'Invalid email or password',
        status: 401
      };
    }

    if (!data.session || !data.user) {
      console.error('No session or user data returned from Supabase');
      return {
        success: false,
        error: 'Failed to create session',
        status: 500
      };
    }

    console.log('Login successful!');
    return {
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        }
      },
      status: 200
    };

  } catch (error) {
    console.error('Unexpected login error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during login',
      status: 500
    };
  }
}

/**
 * Get user profile from access token
 */
export async function getProfile(accessToken: string) {
  try {
    if (!accessToken) {
      return {
        success: false,
        error: 'Access token is required',
        status: 401
      };
    }

    // Use admin client to get user from JWT
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !user) {
      console.error('Get profile error:', error);
      return {
        success: false,
        error: 'Invalid or expired access token',
        status: 401
      };
    }

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name,
          created_at: user.created_at
        }
      },
      status: 200
    };

  } catch (error) {
    console.error('Unexpected get profile error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while fetching profile',
      status: 500
    };
  }
}

/**
 * Update user profile (name)
 */
export async function updateProfile(accessToken: string, updates: { name?: string }) {
  try {
    if (!accessToken) {
      return {
        success: false,
        error: 'Access token is required',
        status: 401
      };
    }

    console.log('Update profile request:', { hasToken: !!accessToken, updates });

    // First verify the token and get the user
    const supabase = getSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      console.error('Update profile - user verification error:', userError);
      return {
        success: false,
        error: 'Invalid or expired access token',
        status: 401
      };
    }

    // Update user metadata using admin client
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          ...updates
        }
      }
    );

    if (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update profile',
        status: 500
      };
    }

    console.log('Profile updated successfully');
    return {
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name
        }
      },
      status: 200
    };

  } catch (error) {
    console.error('Unexpected update profile error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while updating profile',
      status: 500
    };
  }
}

/**
 * Verify access token middleware
 */
export async function verifyToken(accessToken: string) {
  // Use admin client for consistent token verification
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

/**
 * List all users (admin only)
 */
export async function listAllUsers() {
  try {
    console.log('Fetching all users from Supabase Auth...');
    
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error('List users error:', error);
      return {
        success: false,
        error: error.message || 'Failed to list users',
        status: 500
      };
    }

    console.log(`Found ${data.users.length} users`);
    return {
      success: true,
      data: {
        users: data.users.map(user => ({
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          name: user.user_metadata?.name
        })),
        total: data.users.length
      },
      status: 200
    };

  } catch (error) {
    console.error('Unexpected list users error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while listing users',
      status: 500
    };
  }
}

/**
 * Delete all users (admin only - use with caution!)
 */
export async function deleteAllUsers() {
  try {
    console.log('Starting bulk user deletion...');
    
    // First, list all users
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error('Failed to list users for deletion:', error);
      return {
        success: false,
        error: error.message || 'Failed to list users',
        status: 500
      };
    }

    const userIds = data.users.map(user => user.id);
    console.log(`Found ${userIds.length} users to delete`);

    if (userIds.length === 0) {
      return {
        success: true,
        data: {
          message: 'No users to delete',
          deleted: 0
        },
        status: 200
      };
    }

    // Delete each user
    const deletePromises = userIds.map(userId => 
      supabaseAdmin.auth.admin.deleteUser(userId)
    );

    const results = await Promise.allSettled(deletePromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Deletion complete: ${successful} successful, ${failed} failed`);

    return {
      success: true,
      data: {
        message: `Successfully deleted ${successful} users`,
        deleted: successful,
        failed: failed,
        total: userIds.length
      },
      status: 200
    };

  } catch (error) {
    console.error('Unexpected delete all users error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while deleting users',
      status: 500
    };
  }
}

/**
 * Delete a specific user by ID (admin only)
 */
export async function deleteUser(userId: string) {
  try {
    console.log('Deleting user:', userId);
    
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Delete user error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete user',
        status: 500
      };
    }

    console.log('User deleted successfully');
    return {
      success: true,
      data: {
        message: 'User deleted successfully',
        userId
      },
      status: 200
    };

  } catch (error) {
    console.error('Unexpected delete user error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while deleting user',
      status: 500
    };
  }
}

/**
 * Delete a user by email address (admin only)
 */
export async function deleteUserByEmail(email: string) {
  try {
    console.log('Deleting user by email:', email);
    
    // First, find the user by email
    const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('Failed to list users:', listError);
      return {
        success: false,
        error: listError.message || 'Failed to find user',
        status: 500
      };
    }

    const user = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      console.log('User not found with email:', email);
      return {
        success: false,
        error: `No user found with email: ${email}`,
        status: 404
      };
    }

    console.log('Found user:', user.id, 'deleting...');
    
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (error) {
      console.error('Delete user error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete user',
        status: 500
      };
    }

    console.log('User deleted successfully');
    return {
      success: true,
      data: {
        message: 'User deleted successfully',
        email: user.email,
        userId: user.id
      },
      status: 200
    };

  } catch (error) {
    console.error('Unexpected delete user by email error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while deleting user',
      status: 500
    };
  }
}