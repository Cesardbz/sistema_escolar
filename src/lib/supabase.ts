import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Usamos service key si está disponible en desarrollo local para saltar RLS, de lo contrario la anon key
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn("Advertencia: Las variables de entorno de Supabase no están configuradas correctamente.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
