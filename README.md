# RecomendApp

Aplicación web instalable (PWA) para compartir recomendaciones de series. El catálogo y los comentarios se pueden consultar sin cuenta; las publicaciones y los comentarios requieren una sesión de Supabase. Solo quien creó una recomendación puede editarla o eliminarla.

## Conectar Supabase paso a paso

La aplicación ya se conecta a un proyecto Supabase mediante `supabaseClient.js`. Si Lucila va a usar ese mismo proyecto, Ramiro debe invitar su cuenta desde la sección de miembros/acceso de la organización o proyecto en Supabase; no hace falta compartir contraseñas ni cambiar las credenciales de la app. Después, verificá el acceso y seguí desde el paso 2. Para usar un proyecto nuevo propio, seguí todos los pasos.

1. **Crear o abrir el proyecto.** Ingresá a [Supabase](https://supabase.com/), iniciá sesión y creá un proyecto. Guardá la contraseña de la base de datos en un lugar seguro; la app no la necesita.
2. **Crear las tablas y permisos.** En el panel del proyecto, abrí **SQL Editor > New query**. Abrí `supabase-setup.sql` desde esta carpeta, copiá todo su contenido, pegalo en la consulta y presioná **Run**. El script crea o actualiza las tablas `series` y `comentarios`, activa RLS y sus políticas, y configura el bucket público `portadas` para imágenes PNG/JPG/WebP/GIF de hasta 5 MB. Si ya hay tablas de una versión anterior, intenta conservar sus registros.
3. **Copiar los datos de conexión.** En **Project Settings > API** (o **API Keys**, según la versión del panel), copiá la **Project URL** y la **Publishable key** (`sb_publishable_...`). En proyectos antiguos, Supabase puede mostrar la clave pública como `anon`.
4. **Configurar la app si el proyecto es nuevo.** Abrí `supabaseClient.js` y reemplazá `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` por los valores de este proyecto. No agregues comillas extra ni espacios. La clave publicable está pensada para usarse en el navegador; nunca pongas en este archivo la clave `service_role`, una secret key ni la contraseña de la base de datos. RLS y las políticas del paso 2 protegen los datos.
5. **Habilitar el registro por correo.** En **Authentication > Providers > Email**, dejá habilitado Email. En **Authentication > URL Configuration**, configurá como **Site URL** la dirección local de la app para probarla, por ejemplo `http://127.0.0.1:3000` (si usás el Live Preview de VS Code) o `http://127.0.0.1:5502` (si usás Live Server en esta carpeta). Agregá la dirección correspondiente a **Redirect URLs**, con `/**` al final y sin parámetros como `?vscode-livepreview=true`. Si está activada la confirmación de correo, cada cuenta tendrá que abrir el correo de confirmación antes de iniciar sesión.
6. **Comprobar el almacenamiento.** En **Storage**, verificá que exista el bucket `portadas` y que sea público. El script lo crea automáticamente. Si Supabase muestra una advertencia de que los clientes pueden listar todos los archivos, elegí **Remove policy** para quitar la política general de lectura/listado; no elijas solamente **Dismiss**. Las imágenes seguirán pudiéndose mostrar porque el bucket es público, mientras que las políticas de subida y borrado siguen limitando esas acciones. El script elimina esa política general si ya existía y no la vuelve a crear.

## Probar en la computadora

1. Abrí esta carpeta con Visual Studio Code e instalá/activá la extensión **Live Server**.
2. Hacé clic derecho en `index.html` y elegí **Open with Live Server**. En esta carpeta Live Server usa el puerto `5502` para evitar el conflicto con el puerto `5500`. No abras el HTML con doble clic: los módulos JavaScript necesitan servirse por HTTP.
3. En la app, creá una cuenta. Si Supabase pide confirmar el correo, abrí el enlace que te envía y luego iniciá sesión.
4. Publicá una recomendación, subí una portada, dejá un comentario y probá editar y borrar esa recomendación. Recargá la página para verificar que los datos siguen guardados.
5. Probá con una segunda cuenta: debe poder ver y comentar la recomendación de la primera, pero no editarla ni borrarla. También podés consultar el catálogo sin iniciar sesión.

Si aparece un error de conexión, revisá que la URL y la clave correspondan al mismo proyecto en `supabaseClient.js`. Si la app conecta pero no puede leer o escribir datos, volvé a ejecutar `supabase-setup.sql` en el SQL Editor y revisá la consola del navegador.

## Publicar y abrir como app en el celular

1. Creá en GitHub un repositorio público nuevo, sin inicializarlo con README ni otros archivos.
2. En la terminal de VS Code, desde esta carpeta, ejecutá:

   ```bash
   git init
   git add .
   git commit -m "Crear app de recomendaciones con autenticación"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git push -u origin main
   ```

   Reemplazá la URL por la del repositorio que acabás de crear. Si Git informa que el repositorio ya existe localmente, no vuelvas a ejecutar `git init`; continuá desde `git add .`.
3. En GitHub, abrí **Settings > Pages**. Elegí **Deploy from a branch**, seleccioná `main` y `/ (root)`, y guardá.
4. Cuando Pages publique el sitio, copiá la dirección indicada por GitHub y agregala a **Authentication > URL Configuration > Redirect URLs** en Supabase (con `/**` al final). Establecé esa dirección también como **Site URL**.
5. Abrí la dirección en Chrome en el celular y elegí **Instalar aplicación** o **Agregar a la pantalla principal**.

La app consulta Supabase en línea; el catálogo no queda disponible sin conexión.
