import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURATION SUPABASE
 * Using process.env to avoid TypeScript errors with ImportMeta.
 */
const supabaseUrl = (process.env as any).VITE_SUPABASE_URL || 'https://lloswaqfitxhfmunebzx.supabase.co';
const supabaseKey = (process.env as any).VITE_SUPABASE_ANON_KEY || 'sb_publishable_m5jRBHnF3_dQkQ_R4R6wWA_RHQNwKv-';

export const supabase = createClient(supabaseUrl, supabaseKey);