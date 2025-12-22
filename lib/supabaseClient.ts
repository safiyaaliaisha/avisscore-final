
import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURATION SUPABASE
 * ----------------------
 * Replace these values with your project credentials or use environment variables.
 * In production, ensure process.env.NEXT_PUBLIC_SUPABASE_URL and 
 * process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY are correctly set.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lloswaqfitxhfmunebzx.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_m5jRBHnF3_dQkQ_R4R6wWA_RHQNwKv-';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
