import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lloswaqfitxhfmunebzx.supabase.co';
const supabaseKey = 'sb_publishable_m5jRBHnF3_dQkQ_R4R6wWA_RHQNwKv-';

export const supabase = createClient(supabaseUrl, supabaseKey);