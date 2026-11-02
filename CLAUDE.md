# Talento FCEN (código)

Plataforma que conecta a estudiantes de la FCEN (UNAL Manizales) con empresas: perfiles con habilidades, búsqueda de talento por niveles de visibilidad, guía didáctica de la normativa y administración propia. El plan, las decisiones y los contenidos están en la carpeta de arriba (`../plan-beta.md`, `../guia-contenidos.md`, `../CLAUDE.md`): leer el plan antes de cambiar algo de fondo.

## Infraestructura

- **Repositorio**: `github.com/fcenwebunal/talento-fcen` (rama `main`). Repositorio propio dentro de FCEN DEV, que lo ignora. Commit y push al terminar cada cambio.
- **Supabase**: proyecto `talento-fcen`, ref `iwpnsyuvqvmdlsbkbzly`, región `us-east-1`, Postgres 17. URL `https://iwpnsyuvqvmdlsbkbzly.supabase.co`. La publishable key es pública y va en el código y en `apphosting.yaml`.
- **Firebase**: proyecto `talentofcen` (número 857627517671), plan Blaze, creado por el usuario con `fcenwebunaldos@gmail.com`; la CLI de Claude entra como `juanmanueldiazgomez247@gmail.com` (propietario). El backend de App Hosting previsto es `talento-fcen` en `us-east4`, con URL `https://talento-fcen--talentofcen.us-east4.hosted.app` (ya registrada en Supabase como sitio y retorno). Si el backend queda con otro ID o región, actualizar `SITE` en `scripts/configure-auth.mjs` y correr `npm run auth:configure`.
- **Inicio de sesión con Google**: cliente OAuth creado por Firebase Authentication en `talentofcen` (ID `857627517671-0qtve299itfvsnmomkas00hqvjvo8833.apps.googleusercontent.com`), con el retorno de Supabase autorizado. Su secreto va en `.env.local` y lo activa `npm run auth:configure`.
- **Secretos**: `.env.local` (`SUPABASE_SECRET_KEY`, `SUPABASE_DB_PASSWORD`, `SUPABASE_ACCESS_TOKEN`, `GOOGLE_CLIENT_SECRET`). Lo mantiene el usuario; **Claude no lo lee ni lo edita** (regla de permisos de FCEN DEV) y nunca imprime sus valores: los comandos lo cargan con `node --env-file=.env.local` o `set -a && . ./.env.local && set +a`. La app desplegada usa `SUPABASE_SECRET_KEY` solo en el servidor, desde Cloud Secret Manager (secreto de App Hosting, activo desde el 2026-11-01), para el ingreso con Google dentro de la FCEN.

## Comandos

| Para | Comando |
|---|---|
| Aplicar migraciones | `set -a && . ./.env.local && set +a && npx supabase db push --linked --password "$SUPABASE_DB_PASSWORD" --yes` |
| Configurar Auth (sitio, retornos, Google, sin confirmación por correo) | `npm run auth:configure` |
| Prueba completa de niveles de visibilidad (crea y borra cuentas de prueba) | `npm run test:smoke` |
| Revisar en producción las páginas de cada rol con las cuentas demo (usa `DEMO_PASSWORD`) | `npm run check:pages` |
| Cargar descripción e ícono de las habilidades del catálogo que no los tengan | `npm run skills:catalog` |
| Completar en los estudiantes demo los datos de la hoja de vida (logros, PAPA, publicaciones…) | `npm run demo:cv` |
| Dar un rol (la persona debe haber ingresado una vez) | `npm run role -- correo@unal.edu.co admin` |
| Datos de demostración: crear (reemplaza los anteriores), borrar, fijar contraseña | `npm run demo:seed`, `npm run demo:clean`, `npm run demo:passwords` (usa `DEMO_PASSWORD` de `.env.local`) |
| Compilar | `npx tsc --noEmit` y `npx next build` |
| Servidor local | `exec node node_modules/next/dist/bin/next start -p 3000` en segundo plano. Con `npx next start` el proceso de Node queda huérfano al detener la tarea |

## Cómo está hecho

- Next.js 16 (App Router; `proxy.ts` en lugar de middleware; `cookies()`, `params` y `searchParams` son asíncronos), React 19, Tailwind 4, `@supabase/ssr`. Todas las rutas son dinámicas (sesión por cookies), lo que evita la trampa del CDN de Hosting que tuvo fcenedit.
- **La seguridad vive en la base** (RLS y funciones `security definer` en `supabase/migrations/`): niveles 0 público, 1 empresa registrada (anónimo), 2 empresa autorizada o Facultad (`public.access_level()`). Las empresas nunca leen tablas de estudiantes: solo `search_students`, `get_student_detail` y `export_students`. Disparadores protegen roles, estado de empresas y verificación del avance. `pg_cron` corre `run_daily_maintenance()` a las 06:00 hora de Colombia.
- Las cuentas de Google deben ser `@unal.edu.co` (disparador `handle_new_user`) y quedan como estudiantes; las de correo y contraseña son empresas. El rol «Facultad» se da en `/admin/usuarios` o con `npm run role`.
- Archivos en Storage: bucket privado `documentos` (`<uid>/<tipo>/<archivo>`) y público `logos`.
- La prueba `test:smoke` no puede simular un ingreso real con Google (la API de administración crea cuentas de correo): el rechazo de cuentas que no son `@unal.edu.co` se verifica con un ingreso real.

## Incrustado en fcen.unal.edu.co (2026-11-01)

- Página publicada: Facultad > Prácticas, https://fcen.unal.edu.co/menu/facultad/practicas/ (pid 645, elemento c4596), oculta en el menú y accesible solo por enlace; carpeta local `../../../sitio/facultad/practicas/`. El elemento HTML es un iframe a todo el ancho de `/?embed=1` que ajusta su alto con `postMessage`.
- `?embed=1` deja la cookie `tf_embed` (particionada): el layout quita el pie de página y la barra superior deja de ser fija; `EmbedBridge` envía `talento:height` y `talento:navigate` a `https://fcen.unal.edu.co`. Solo ese origen puede embeber la app (`frame-ancestors` en `next.config.ts`).
- Cookies de sesión en producción con `SameSite=None; Secure; Partitioned` (`COOKIE_OPTIONS` en `src/lib/config.ts`) para que funcionen dentro del iframe.
- Google no carga dentro de un iframe: dentro de la FCEN el ingreso abre una ventana emergente (`/auth/popup`), el retorno (`/auth/callback?handoff=`) genera un enlace mágico con la secret key y lo deja en `login_handoffs`, y el iframe lo recoge por `/api/handoff` y llama `verifyOtp`. **Requiere el secreto `SUPABASE_SECRET_KEY` en App Hosting** (y su línea en `apphosting.yaml`); sin él ese ingreso muestra un aviso y lo demás funciona.
- Cuentas de Google: la lista `google_admins` de `app_settings` entra como administración; `@unal.edu.co` y la lista `google_students` (vacía: el botón de estudiantes pide `hd=unal.edu.co` y Google manda las cuentas ajenas al SSO de la UNAL, lo que es deseable) entran como estudiantes; cualquier otra cuenta de Google entra como empresa.
- Cuentas de prueba del usuario (2026-11-01): administración `judiazgom@unal.edu.co` (ya con rol admin), empresa `juanmanueldiazgomez247@gmail.com` (pestaña Empresas, «Continuar con Google»; tras ingresar registra su organización), estudiante `comunicacionesfcen_man@unal.edu.co`. `fcenwebunal@gmail.com` quedó como empresa sin organización registrada.
- `/cuenta`: foto (bucket público `avatars`), nombre, cargo y descripción para cualquier rol; las empresas además editan su organización y logo.
- Datos demo: correos terminados en `.demo@` (formato institucional, no coinciden con cuentas reales), logos PNG generados y subidos al bucket `logos`, rostros generados por IA en `scripts/demo-assets/rostros/`, empresas ficticias registradas en `app_settings.demo_company_ids`.

## Diseño (2026-11-01, segunda vuelta)

Decisiones del usuario: nada de banners propios dentro de las páginas; diseño de sistema y no de infografía (las infografías van dentro de las guías); portada como llamado a la acción; tras ingresar, un espacio de trabajo por rol (`components/app-shell.tsx`, barra lateral y pestañas inferiores en celular, con las acciones principales de estudiante, empresa y administración); arriba, el banner FCEN estándar del sitio tal cual (`components/fcen-banner.tsx` y `.fcen-masthead` en `globals.css`, copiado de `sitio/eventos-fcen`; si cambia allá, se actualiza aquí) y el menú debajo, en una barra clara que se queda fija al bajar (2026-11-01); decoraciones de la temática de conexión practicante y empresa (`components/ui/connect-art.tsx`: red de conexión con estudiantes variados, organizaciones de varios tipos, un apretón de manos en el punto medio de cada enlace y los textos de fondo «ESTUDIANTES» y «ORGANIZACIONES» en proporción natural, opacidad 0.05 y desvanecidos hacia los extremos; al mover figuras, comprobar que los apretones no se monten entre sí ni sobre otras líneas; piezas que encajan, hoja de vida hacia organización, patrón `bg-links`), no figuras geométricas genéricas. `PageHeader` es un título compacto, no un banner. Las etiquetas (`.chip`, contador de la barra lateral, esqueletos de carga) son paralelogramos inclinados 12° con esquinas de 0.3125rem: la forma la dibuja un `::before` y sus colores van en `--chip-bg` y `--chip-line` (para cambiar el fondo o el borde de un chip se cambian esas variables, no `bg-` ni `border-`).

Los manejadores de ruta redirigen con `localRedirect` (`src/lib/redirect.ts`): detrás de App Hosting el origen de la petición es `https://0.0.0.0:8080` y una redirección absoluta mandaba ahí al cerrar sesión.

## Diseño (primera vuelta)

Identidad UNAL (Ancizar Sans, paleta institucional) con un sistema propio en `src/app/globals.css`: esquinas mixtas (redondeadas con una recta), `card`, `card-dark`, `notch`, `icon-tile`, chips con puntos de nivel, fondos decorativos (`bg-hero`, `bg-dots`, `bg-grid`), animaciones (`page-in`, `stagger`, `reveal` con `components/ui/reveal.tsx`, esqueletos y barra de carga en los `loading.tsx`) que respetan `prefers-reduced-motion`. Íconos de `lucide-react` (sin íconos de marcas: la versión instalada no los tiene). Componentes en `src/components/ui/`: `PageHeader`, `HelpTip` (ayudas «?» discretas), `Counter`, `ProgressRing`, `Avatar`, `Stat`, `EmptyState`, decoraciones SVG. Buscador rápido Ctrl+K (`command-palette.tsx`, destinos por rol en `nav-items.ts`).

## Datos de demostración

`scripts/demo-seed.mjs` crea 22 estudiantes ficticios (pregrado, posgrado y egresados, en todos los estados de disponibilidad) con foto ilustrada, hoja de vida e historia académica en PDF, y 9 empresas ficticias con logo en todos los estados, con favoritos, consultas y exportaciones. Marcas: correos de estudiantes `demo.*@unal.edu.co`, de empresas `demo.*@example.com`, NIT `DEMO-*`. **Se borran con `npm run demo:clean` antes de abrir la beta a usuarios reales.**

## Estado (2026-10-31)

Beta **en línea** en https://talento-fcen--talentofcen.us-east4.hosted.app (Firebase App Hosting, backend `talento-fcen`, `us-east4`; cada push a `main` despliega). Google activo en Supabase. 22 verificaciones de visibilidad en verde. La conexión de App Hosting con GitHub está autorizada por la cuenta `fcenwebunal` (dueña del repositorio); si se rehace, tiene que ser con esa cuenta. Pendiente: verificar con un ingreso real que se rechazan cuentas de Google que no son `@unal.edu.co`.

## Habilidades: descripción, ícono y propuestas (2026-11-01)

- Cada habilidad tiene `description` e `icon_path` (bucket público `skill-icons`, SVG recomendado, máximo 256 KB; se muestra siempre como `<img>`, nunca en línea). Los 79 iniciales son de Tabler Icons (MIT) recoloreados a `#13477C` por `scripts/skill-catalog.mjs`, con copia en `scripts/skill-icons/`. Plataformas para íconos nuevos: Tabler Icons (tabler.io/icons), Lucide (lucide.dev), Phosphor (phosphoricons.com), Iconoir (iconoir.com) y, para logos de herramientas, Simple Icons (simpleicons.org).
- `skills.status` es `approved` o `pending`. Un estudiante propone con `propose_skill(nombre, grupo, descripción)` desde el selector de su perfil (máximo 5 pendientes; si el nombre o un alias ya existe, devuelve esa habilidad). La propuesta queda en su perfil marcada «en revisión» (borde punteado, `chip-pending`) y las empresas la ven así; no sale en el catálogo público, en los filtros del buscador ni en las sugerencias de otros estudiantes.
- Administración revisa en `/admin/propuestas` (contador `pendingSkills` en la barra lateral) con `review_skill`: aprobar (corrigiendo nombre, grupo, descripción e ícono), unir con una aprobada (los estudiantes pasan a la existente) o rechazar (se quita de los perfiles). En `/admin/catalogo` se edita la descripción, el grupo y el ícono de cada habilidad aprobada.
- Toda consulta de catálogo o sugerencias filtra `status = 'approved'`; el perfil del estudiante incluye además las que él propuso (`proposed_by`).

## Hoja de vida (2026-11-02)

- Análisis y propuesta en `../analisis-hoja-de-vida.md` (fuentes: Ladders, NN/g, Europass, JSON Resume, LinkedIn, Harvard, Uniandes, NACE, fórmula XYZ, formatos colombianos, Ley 1581).
- `components/student-detail.tsx` (`StudentDetailView`) es ahora la hoja de vida: banda FCEN con foto, nombre y titular (Ancízar Serif Bold Italic en `public/fonts`), franja de datos clave (avance, PAPA, grado, práctica, idioma), dos columnas por consulta de contenedor (`@2xl`, la ancha con perfil, logros, experiencia en línea de tiempo por tipo, proyectos, formación y publicaciones; la angosta con contacto, competencias con tres puntos y leyenda, idiomas, transversales, disponibilidad e intereses) y pie con la Ley 1581. La ven empresas, Facultad y el estudiante («Cómo me ven», con `lib/cv.ts` para simular cada nivel); la prop `viewer` dice desde qué nivel se mira.
- «Descargar CV» baja un PDF que arma el servidor en `/cv/[id]` (`src/app/cv/[id]/route.ts` y `src/lib/cv-pdf.tsx`, con `@react-pdf/renderer`): se genera en cada descarga con los permisos de quien la pide (la misma `get_student_detail`; en «Cómo me ven» el estudiante pasa `?nivel=registrada|autorizada`) y se envía como adjunto con `Cache-Control: private, no-store`; **nunca se guarda en Supabase**. Si la descarga la hace una empresa que ve el contacto, queda en `contact_events` como `download_cv`.
- Diseño del PDF, pensado para imprimir: carta, franja superior gris clara con letras negras y la regla verde, una sola columna con rejillas internas (competencias en 3 columnas con los puntos de nivel delante, proyectos de a 2, cierre en 2 × 2), entradas que no se parten entre páginas (`wrap={false}`), títulos que no quedan solos al pie (`minPresenceAhead`), encabezado corrido y número de página desde la página 2, enlaces escritos a la vista y fotos convertidas a JPEG con `sharp` (0.35.5, ya corregido; Next trae su propia copia vulnerable, ver pendientes). Fuentes Ancízar desde `public/fonts` (incluidas con `outputFileTracingIncludes`; si faltan, las copia del sitio a una carpeta temporal y en último caso usa Helvetica). **Sin marcas de la plataforma**: ni pie con «Talento FCEN» ni metadatos con ese nombre; solo una frase al final de la última hoja que dice que se generó desde el sistema de prácticas de la FCEN. La página en pantalla no cambió.
- Datos nuevos (migración `20261102000008_cv_fields.sql`): `experiences.kind` (laboral, práctica, monitoría, investigación o semillero, voluntariado, extensión, emprendimiento), `students.highlights` (hasta 3 logros de 220 caracteres), `students.papa_visibility` (nadie, facultad, autorizadas; el PAPA lo registra solo la Facultad en «Verificar avance y PAPA», el estudiante no puede cambiarlo), `projects.role` y `projects.tools`, `courses.url` y la tabla `student_outputs` (artículo, ponencia, póster, capítulo, evento, otro). `graduation_date` se pide también a estudiantes activos (fecha estimada) y `target_companies` se muestra como sectores de interés.
- Reglas de `get_student_detail`: el PAPA lo ve el estudiante, la Facultad (salvo «nadie») y las empresas autorizadas si eligió «autorizadas»; los títulos y enlaces de publicaciones, y los enlaces de cursos y proyectos, solo con contacto autorizado (un título identifica a quien lo escribió). El PDF que sube el propio estudiante ya no lo descargan las empresas (se quitó el botón y su ruta); queda para la Facultad. Pendiente de la confirmación del usuario: la migración que quita su ruta de `get_student_detail` y el permiso de lectura de las empresas autorizadas en el bucket (borrador en el scratchpad de la sesión del 2026-11-02, `20261102000009_cv_private.sql`).

