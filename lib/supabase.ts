

import { createClient } from '@supabase/supabase-js';

// URL e Chave do projeto Supabase
const supabaseUrl = 'https://ghsgaeeiocucaqyygisg.supabase.co';
// Verifique se esta chave está correta. Chaves anon padrão do Supabase começam com "eyJ..."
const supabaseKey = 'sb_publishable_BJG8QW0sc-_BZdObPfPeMQ_d4UTwoRb';

// Removed redundant comparison with the string 'undefined' as the supabaseKey is a hardcoded constant, resolving the TypeScript overlap error.
if (!supabaseUrl || !supabaseKey) {
  console.error("ERRO CRÍTICO: Configurações do Supabase ausentes ou inválidas.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
