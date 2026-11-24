const SUPABASE_URL = "https://rbfanqkznjxpxifbgcqu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Sd_Rv9U76_582AvL0MBf5g_5ANloY-z";

if (!window.supabase) {
  throw new Error("No se cargó la librería de Supabase. Revisá la conexión a internet.");
}

const urlIncompleta = SUPABASE_URL.includes("PEGÁ_ACÁ");
const keyIncompleta = SUPABASE_PUBLISHABLE_KEY.includes("PEGÁ_ACÁ");

if (urlIncompleta || keyIncompleta) {
  throw new Error("Falta configurar la URL y la Publishable Key de tu proyecto Supabase.");
}

try {
  const url = new URL(SUPABASE_URL);
  if (!/^https:/.test(url.protocol) || !url.hostname.endsWith(".supabase.co")) {
    throw new Error();
  }
} catch {
  throw new Error("La URL de Supabase no tiene un formato válido (debe ser https://TU_PROYECTO.supabase.co).");
}

export const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
