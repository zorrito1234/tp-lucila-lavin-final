import { supabase } from "./supabaseClient.js";

export async function obtenerSeriesBD() {
  return supabase
    .from("series")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function obtenerComentariosBD() {
  return supabase
    .from("comentarios")
    .select("*")
    .order("created_at", { ascending: true });
}

export async function subirImagenStorage(archivo, usuarioId) {
  const tiposPermitidos = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  if (!tiposPermitidos.includes(archivo.type)) {
    throw new Error("La portada debe ser PNG, JPG, WebP o GIF.");
  }
  if (archivo.size > 5 * 1024 * 1024) {
    throw new Error("La portada no puede superar los 5 MB.");
  }

  const extensionesPorTipo = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif"
  };
  const extension = extensionesPorTipo[archivo.type];
  const identificador = typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const ruta = `${usuarioId}/${identificador}.${extension}`;
  const { error } = await supabase.storage
    .from("portadas")
    .upload(ruta, archivo, { contentType: archivo.type, upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from("portadas").getPublicUrl(ruta);
  return data.publicUrl;
}

export async function crearSerieBD(nuevaSerie, usuario) {
  return supabase.from("series").insert({
    ...nuevaSerie,
    user_id: usuario.id,
    user_email: usuario.email
  });
}

export async function editarSerieBD(id, cambios) {
  return supabase.from("series").update(cambios).eq("id", id);
}

export async function eliminarSerieBD(id) {
  return supabase.from("series").delete().eq("id", id);
}

export async function eliminarImagenStorage(imagenUrl) {
  if (!imagenUrl) return;

  const marcador = "/storage/v1/object/public/portadas/";
  const indice = imagenUrl.indexOf(marcador);
  if (indice === -1) return;

  const ruta = decodeURIComponent(imagenUrl.slice(indice + marcador.length));
  if (!ruta) return;

  const { error } = await supabase.storage.from("portadas").remove([ruta]);
  if (error) throw error;
}

export async function agregarComentarioBD(comentario, usuario) {
  return supabase.from("comentarios").insert({
    ...comentario,
    user_id: usuario.id,
    user_email: usuario.email
  });
}
