import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURATION SUPABASE
 * Hardcoded credentials for production stability.
 */
export const supabase = createClient(
  'https://lloswaqfitxhfmunebzx.supabase.co',
  'sb_publishable_m5jRBHnF3_dQkQ_R4R6wWA_RHQNwKv-'
);