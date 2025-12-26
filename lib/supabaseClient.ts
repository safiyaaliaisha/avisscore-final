
import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURATION SUPABASE DYNAMIQUE
 * يستخدم متغيرات البيئة من Vercel/Vite لضمان الاتصال السريع والآمن.
 */
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lloswaqfitxhfmunebzx.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_m5jRBHnF3_dQkQ_R4R6wWA_RHQNwKv-';

export const supabase = createClient(supabaseUrl, supabaseKey);
