import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURATION SUPABASE STABLE
 * Priorité aux variables d'environnement pour avisscore.fr (Vercel).
 */
const supabaseUrl = 'https://lloswaqfitxhfmunebzx.supabase.co';
const supabaseAnonKey = 'sb_publishable_m5jRBHnF3_dQkQ_R4R6wWA_RHQNwKv-';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
