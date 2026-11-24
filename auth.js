import { supabase } from "./supabaseClient.js";

export async function obtenerSesion() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function escucharCambiosDeSesion(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    queueMicrotask(() => callback(session?.user ?? null));
  });
}

export async function registrarUsuario(email, password) {
  const emailNormalizado = email.trim().toLowerCase();
  const result = await supabase.auth.signUp({
    email: emailNormalizado,
    password,
    options: {
      emailRedirectTo: new URL(window.location.pathname, window.location.origin).href
    }
  });

  if (result.error) {
    const mensaje = result.error.message?.toLowerCase() || "";
    if (mensaje.includes("fetch")) {
      throw new Error("No se pudo contactar con Supabase. Verificá la URL del proyecto y su conexión.");
    }
    if (mensaje.includes("signup is disabled")) {
      throw new Error("El registro está deshabilitado en Supabase. Habilitá Email en Authentication > Providers.");
    }
    if (mensaje.includes("already registered") || mensaje.includes("already been registered")) {
      throw new Error("Ya existe una cuenta con ese correo. Iniciá sesión o usá otro correo.");
    }
    if (mensaje.includes("password")) {
      throw new Error("La contraseña debe tener al menos 6 caracteres.");
    }
  }
  return result;
}

export async function iniciarSesion(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
