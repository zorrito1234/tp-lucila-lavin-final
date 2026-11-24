import {
  cerrarSesion,
  escucharCambiosDeSesion,
  iniciarSesion,
  obtenerSesion,
  registrarUsuario
} from "./auth.js";
import {
  agregarComentarioBD,
  crearSerieBD,
  editarSerieBD,
  eliminarSerieBD,
  eliminarImagenStorage,
  obtenerComentariosBD,
  obtenerSeriesBD,
  subirImagenStorage
} from "./series.js";

const authForm = document.getElementById("auth-form");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const authMessage = document.getElementById("auth-message");
const signupButton = document.getElementById("signup-button");
const logoutButton = document.getElementById("logout-button");
const sessionLabel = document.getElementById("session-label");
const accountPanel = document.getElementById("account-panel");
const recommendationPanel = document.getElementById("recommendation-panel");
const seriesForm = document.getElementById("series-form");
const seriesId = document.getElementById("series-id");
const titleInput = document.getElementById("title");
const genreInput = document.getElementById("genre");
const scoreInput = document.getElementById("score");
const coverInput = document.getElementById("cover");
const reviewInput = document.getElementById("review");
const saveSeriesButton = document.getElementById("save-series-button");
const cancelEditButton = document.getElementById("cancel-edit-button");
const seriesMessage = document.getElementById("series-message");
const catalogMessage = document.getElementById("catalog-message");
const catalogCount = document.getElementById("catalog-count");
const seriesGrid = document.getElementById("series-grid");
const seriesFilter = document.getElementById("series-filter");
const filterName = document.getElementById("filter-name");
const filterGenre = document.getElementById("filter-genre");
const filterScore = document.getElementById("filter-score");
const clearSeriesFilter = document.getElementById("clear-series-filter");

let usuarioActual = null;
let comentariosActuales = [];
let seriesCatalogoActual = [];
let cargaCatalogoId = 0;
let serieEditando = null;

function mostrarMensaje(elemento, mensaje, tipo = "") {
  elemento.textContent = mensaje;
  if (tipo) elemento.dataset.kind = tipo;
  else delete elemento.dataset.kind;
}

function mostrarError(elemento, error, contexto) {
  console.error(contexto, error);
  mostrarMensaje(elemento, `${contexto}: ${error.message || "Ocurrió un error."}`, "error");
}

function actualizarInterfazDeSesion(usuario) {
  usuarioActual = usuario;
  const conectado = Boolean(usuarioActual);
  sessionLabel.textContent = conectado ? usuarioActual.email : "Visitante";
  logoutButton.hidden = !conectado;
  accountPanel.hidden = conectado;
  recommendationPanel.hidden = !conectado;

  if (!conectado) cancelarEdicion();
  void cargarCatalogo();
}

function crearElemento(tag, className, text) {
  const elemento = document.createElement(tag);
  if (className) elemento.className = className;
  if (text !== undefined) elemento.textContent = text;
  return elemento;
}

function crearBoton(texto, className, onClick) {
  const boton = crearElemento("button", `button ${className}`, texto);
  boton.type = "button";
  boton.addEventListener("click", onClick);
  return boton;
}

function renderizarComentario(comentario) {
  const articulo = crearElemento("article", "comment");
  const encabezado = crearElemento("div", "comment-heading");
  const autor = crearElemento("strong", "", comentario.user_email || "Usuario");
  const fecha = comentario.created_at
    ? new Date(comentario.created_at).toLocaleDateString("es-AR")
    : "";
  encabezado.append(autor, crearElemento("span", "", fecha));
  articulo.append(encabezado, crearElemento("p", "", comentario.texto));
  return articulo;
}

function renderizarSerie(serie) {
  const tarjeta = crearElemento("article", "series-card");

  if (serie.imagen_url) {
    const imagen = crearElemento("img", "series-cover");
    imagen.src = serie.imagen_url;
    imagen.alt = `Portada de ${serie.titulo}`;
    imagen.loading = "lazy";
    imagen.addEventListener("error", () => {
      imagen.replaceWith(crearElemento("div", "series-cover series-cover-placeholder", "L"));
    }, { once: true });
    tarjeta.append(imagen);
  } else {
    tarjeta.append(crearElemento("div", "series-cover series-cover-placeholder", "L"));
  }

  const contenido = crearElemento("div", "series-card-content");
  const meta = crearElemento("div", "card-meta");
  meta.append(
    crearElemento("span", "genre-tag", serie.genero || "Sin género"),
    crearElemento("span", "score", `★ ${Number(serie.puntuacion).toFixed(1)}`)
  );
  contenido.append(meta);
  contenido.append(crearElemento("h3", "series-title", serie.titulo));
  contenido.append(crearElemento("p", "series-review", serie.resena));

  const footer = crearElemento("div", "card-footer");
  footer.append(
    crearElemento("span", "", `Recomendada por ${serie.user_email || "un usuario"}`)
  );
  contenido.append(footer);

  if (usuarioActual?.id === serie.user_id) {
    const acciones = crearElemento("div", "card-actions");
    acciones.append(
      crearBoton("Editar", "button-secondary", () => prepararEdicion(serie)),
      crearBoton("Eliminar", "button-danger", () => borrarSerie(serie))
    );
    contenido.append(acciones);
  }

  const zonaComentarios = crearElemento("section", "comments");
  zonaComentarios.append(crearElemento("h4", "", "Comentarios"));
  const listaComentarios = crearElemento("div", "comment-list");
  const comentariosSerie = comentariosActuales.filter(
    (comentario) => String(comentario.serie_id) === String(serie.id)
  );

  if (comentariosSerie.length) {
    comentariosSerie.forEach((comentario) => listaComentarios.append(renderizarComentario(comentario)));
  } else {
    listaComentarios.append(crearElemento("p", "comment-login-note", "Todavía no hay comentarios."));
  }
  zonaComentarios.append(listaComentarios);

  if (usuarioActual) {
    const formulario = crearElemento("form", "comment-form");
    const campo = crearElemento("textarea");
    campo.name = "texto";
    campo.rows = 2;
    campo.maxLength = 500;
    campo.placeholder = "Escribí un comentario…";
    campo.setAttribute("aria-label", `Comentario para ${serie.titulo}`);
    campo.required = true;
    const boton = crearElemento("button", "button button-secondary", "Comentar");
    boton.type = "submit";
    formulario.append(campo, boton);
    formulario.addEventListener("submit", (evento) => enviarComentario(evento, formulario, serie.id, boton));
    zonaComentarios.append(formulario);
  } else {
    zonaComentarios.append(
      crearElemento("p", "comment-login-note", "Iniciá sesión para dejar un comentario.")
    );
  }

  contenido.append(zonaComentarios);
  tarjeta.append(contenido);
  return tarjeta;
}

async function cargarCatalogo() {
  const cargaId = ++cargaCatalogoId;
  catalogMessage.textContent = "Cargando recomendaciones…";
  catalogMessage.dataset.kind = "";
  seriesGrid.replaceChildren();

  try {
    const [respuestaSeries, respuestaComentarios] = await Promise.all([
      obtenerSeriesBD(),
      obtenerComentariosBD()
    ]);
    if (respuestaSeries.error) throw respuestaSeries.error;
    if (respuestaComentarios.error) throw respuestaComentarios.error;
    if (cargaId !== cargaCatalogoId) return;

    const seriesActuales = respuestaSeries.data || [];
    comentariosActuales = respuestaComentarios.data || [];
    seriesCatalogoActual = seriesActuales;
    renderizarCatalogoFiltrado();
  } catch (error) {
    if (cargaId !== cargaCatalogoId) return;
    catalogCount.textContent = "";
    if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
      mostrarMensaje(
        catalogMessage,
        "La base de datos todavía no está configurada. Ejecutá supabase-setup.sql en el SQL Editor de Supabase.",
        "error"
      );
    } else {
      mostrarError(catalogMessage, error, "No se pudo cargar el catálogo");
    }
  }
}

function renderizarCatalogoFiltrado() {
  const nombreBuscado = filterName.value.trim().toLocaleLowerCase("es");
  const generoBuscado = filterGenre.value.trim().toLocaleLowerCase("es");
  const puntajeIngresado = filterScore.value.trim();
  const puntajeMinimo = puntajeIngresado === "" ? null : Number(puntajeIngresado);

  const seriesFiltradas = seriesCatalogoActual.filter((serie) => {
    const nombreCoincide = !nombreBuscado
      || (serie.titulo || "").toLocaleLowerCase("es").includes(nombreBuscado);
    const generoCoincide = !generoBuscado
      || (serie.genero || "").toLocaleLowerCase("es").includes(generoBuscado);
    const puntajeCoincide = puntajeMinimo === null
      || (Number.isFinite(Number(serie.puntuacion)) && Number(serie.puntuacion) >= puntajeMinimo);
    return nombreCoincide && generoCoincide && puntajeCoincide;
  });

  seriesGrid.replaceChildren();
  seriesFiltradas.forEach((serie) => seriesGrid.append(renderizarSerie(serie)));
  catalogCount.textContent = `${seriesFiltradas.length} ${seriesFiltradas.length === 1 ? "recomendación" : "recomendaciones"}`;

  const hayFiltros = nombreBuscado || generoBuscado || puntajeIngresado !== "";
  if (!seriesCatalogoActual.length) {
    catalogMessage.textContent = "Todavía no hay recomendaciones. ¡Podés ser la primera persona en compartir una!";
  } else if (!seriesFiltradas.length) {
    catalogMessage.textContent = hayFiltros
      ? "No se encontraron series con esos filtros."
      : "Todavía no hay recomendaciones.";
  } else {
    catalogMessage.textContent = "";
  }
}

function cancelarEdicion() {
  seriesForm.reset();
  seriesId.value = "";
  serieEditando = null;
  saveSeriesButton.textContent = "Publicar recomendación";
  cancelEditButton.hidden = true;
  coverInput.required = false;
  mostrarMensaje(seriesMessage, "");
}

function prepararEdicion(serie) {
  serieEditando = serie;
  seriesId.value = serie.id;
  titleInput.value = serie.titulo;
  genreInput.value = serie.genero;
  scoreInput.value = serie.puntuacion;
  reviewInput.value = serie.resena;
  coverInput.required = false;
  saveSeriesButton.textContent = "Guardar cambios";
  cancelEditButton.hidden = false;
  mostrarMensaje(seriesMessage, "Si elegís una nueva imagen, reemplazará la portada actual.");
  recommendationPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  titleInput.focus({ preventScroll: true });
}

async function enviarFormularioSerie(evento) {
  evento.preventDefault();
  if (!usuarioActual) {
    mostrarMensaje(seriesMessage, "Iniciá sesión para publicar una recomendación.", "error");
    return;
  }

  saveSeriesButton.disabled = true;
  mostrarMensaje(seriesMessage, "");

  try {
    const cambios = {
      titulo: titleInput.value.trim(),
      genero: genreInput.value.trim(),
      puntuacion: Number(scoreInput.value),
      resena: reviewInput.value.trim()
    };
    if (!cambios.titulo || !cambios.genero || !cambios.resena) {
      throw new Error("Completá el título, el género y la reseña.");
    }
    if (!Number.isFinite(cambios.puntuacion) || cambios.puntuacion < 0 || cambios.puntuacion > 10) {
      throw new Error("La puntuación debe estar entre 0 y 10.");
    }
    const archivo = coverInput.files?.[0];
    if (archivo) cambios.imagen_url = await subirImagenStorage(archivo, usuarioActual.id);

    const id = seriesId.value;
    const respuesta = id
      ? await editarSerieBD(id, cambios)
      : await crearSerieBD(cambios, usuarioActual);

    if (respuesta.error) throw respuesta.error;
    if (id && archivo && serieEditando?.imagen_url && serieEditando.imagen_url !== cambios.imagen_url) {
      try {
        await eliminarImagenStorage(serieEditando.imagen_url);
      } catch (error) {
        console.error("No se pudo eliminar la portada anterior.", error);
      }
    }
    cancelarEdicion();
    mostrarMensaje(seriesMessage, id ? "Recomendación actualizada." : "¡Recomendación publicada!", "success");
    await cargarCatalogo();
  } catch (error) {
    mostrarError(seriesMessage, error, "No se pudo guardar la recomendación");
  } finally {
    saveSeriesButton.disabled = false;
  }
}

async function borrarSerie(serie) {
  const confirmar = window.confirm(`¿Querés eliminar la recomendación de "${serie.titulo}"?`);
  if (!confirmar) return;

  try {
    const { error } = await eliminarSerieBD(serie.id);
    if (error) throw error;
    if (serie.imagen_url) {
      try {
        await eliminarImagenStorage(serie.imagen_url);
      } catch (error) {
        console.error("No se pudo eliminar la portada de la recomendación.", error);
      }
    }
    if (seriesId.value === String(serie.id)) cancelarEdicion();
    await cargarCatalogo();
  } catch (error) {
    mostrarError(catalogMessage, error, "No se pudo eliminar la recomendación");
  }
}

async function enviarComentario(evento, formulario, serieIdComentario, boton) {
  evento.preventDefault();
  if (!usuarioActual) return;

  const texto = new FormData(formulario).get("texto")?.toString().trim();
  if (!texto) return;
  boton.disabled = true;

  try {
    const { error } = await agregarComentarioBD({
      serie_id: serieIdComentario,
      texto
    }, usuarioActual);
    if (error) throw error;
    formulario.reset();
    await cargarCatalogo();
  } catch (error) {
    window.alert(`No se pudo guardar el comentario: ${error.message}`);
  } finally {
    boton.disabled = false;
  }
}

authForm.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const accion = evento.submitter?.value || "login";
  const submitButton = evento.submitter;
  submitButton.disabled = true;
  mostrarMensaje(authMessage, "");

  try {
    if (accion === "signup") {
      const { data, error } = await registrarUsuario(
        authEmail.value.trim(),
        authPassword.value
      );
      if (error) throw error;
      if (data.session) {
        authForm.reset();
        mostrarMensaje(authMessage, "Cuenta creada e iniciada correctamente.", "success");
      } else {
        mostrarMensaje(
          authMessage,
          "Cuenta creada. Revisá tu correo y confirmá la dirección para iniciar sesión.",
          "success"
        );
      }
    } else {
      const { error } = await iniciarSesion(
        authEmail.value.trim().toLowerCase(),
        authPassword.value
      );
      if (error) throw error;
      authForm.reset();
      mostrarMensaje(authMessage, "Sesión iniciada correctamente.", "success");
    }
  } catch (error) {
    mostrarError(
      authMessage,
      error,
      accion === "signup" ? "No se pudo crear la cuenta" : "No se pudo iniciar sesión"
    );
  } finally {
    submitButton.disabled = false;
  }
});

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  try {
    await cerrarSesion();
  } catch (error) {
    mostrarError(authMessage, error, "No se pudo cerrar sesión");
  } finally {
    logoutButton.disabled = false;
  }
});

seriesForm.addEventListener("submit", enviarFormularioSerie);
cancelEditButton.addEventListener("click", cancelarEdicion);
seriesFilter.addEventListener("submit", (evento) => evento.preventDefault());
seriesFilter.addEventListener("input", renderizarCatalogoFiltrado);
clearSeriesFilter.addEventListener("click", () => {
  seriesFilter.reset();
  renderizarCatalogoFiltrado();
  filterName.focus();
});

try {
  const sesion = await obtenerSesion();
  actualizarInterfazDeSesion(sesion?.user ?? null);
  escucharCambiosDeSesion((usuario) => actualizarInterfazDeSesion(usuario));
} catch (error) {
  mostrarError(catalogMessage, error, "No se pudo verificar la sesión");
}
