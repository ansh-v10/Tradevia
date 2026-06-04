import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let client = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase environment variables! Falling back to local database mode.");
  
  // Create a dummy client proxy that doesn't crash on initial evaluation
  client = new Proxy({}, {
    get(target, prop) {
      if (prop === 'auth') {
        return {
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          getSession: async () => ({ data: { session: null }, error: null }),
          getUser: async () => ({ data: { user: null }, error: null }),
          signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error("Supabase not configured") }),
          signUp: async () => ({ data: { user: null, session: null }, error: new Error("Supabase not configured") }),
          signOut: async () => ({ error: null }),
        };
      }
      return () => {
        // Return chainable mock queries
        const queryBuilder = {
          select: () => queryBuilder,
          insert: () => queryBuilder,
          update: () => queryBuilder,
          delete: () => queryBuilder,
          eq: () => queryBuilder,
          order: () => queryBuilder,
          single: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
          then: (resolve) => resolve({ data: [], error: new Error("Supabase not configured") })
        };
        return queryBuilder;
      };
    }
  });
} else {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
  }
}

export const supabase = client;
