// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://vjpbwraolyradypeemmz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqcGJ3cmFvbHlyYWR5cGVlbW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyMTM2MTIsImV4cCI6MjA1NTc4OTYxMn0.5iZTUju56K5undaAohwE3XEGnIt1jnHl5ro0KhL5YjQ";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);