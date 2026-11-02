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
- Cuentas de Google: `@unal.edu.co` y la lista `google_students` de `app_settings` entran como estudiantes; cualquier otra cuenta de Google entra como empresa.
- `/cuenta`: foto (bucket público `avatars`), nombre, cargo y descripción para cualquier rol; las empresas además editan su organización y logo.
- Datos demo: correos terminados en `.demo@` (formato institucional, no coinciden con cuentas reales), logos PNG generados y subidos al bucket `logos`, rostros generados por IA en `scripts/demo-assets/rostros/`, empresas ficticias registradas en `app_settings.demo_company_ids`.

## Diseño (2026-11-01, segunda vuelta)

Decisiones del usuario: nada de banners propios dentro de las páginas; diseño de sistema y no de infografía (las infografías van dentro de las guías); portada como llamado a la acción; tras ingresar, un espacio de trabajo por rol (`components/app-shell.tsx`, barra lateral y pestañas inferiores en celular, con las acciones principales de estudiante, empresa y administración); arriba, el banner FCEN estándar del sitio tal cual (`components/fcen-banner.tsx` y `.fcen-masthead` en `globals.css`, copiado de `sitio/eventos-fcen`; si cambia allá, se actualiza aquí) y el menú debajo, en una barra clara que se queda fija al bajar (2026-11-01); decoraciones de la temática de conexión practicante y empresa (`components/ui/connect-art.tsx`: red de conexión con estudiantes variados, organizaciones de varios tipos, un apretón de manos en el punto medio de cada enlace y los textos de fondo «ESTUDIANTES» y «ORGANIZACIONES»; al mover figuras, comprobar que los apretones no se monten entre sí ni sobre otras líneas; piezas que encajan, hoja de vida hacia organización, patrón `bg-links`), no figuras geométricas genéricas. `PageHeader` es un título compacto, no un banner.

Los manejadores de ruta redirigen con `localRedirect` (`src/lib/redirect.ts`): detrás de App Hosting el origen de la petición es `https://0.0.0.0:8080` y una redirección absoluta mandaba ahí al cerrar sesión.

## Diseño (primera vuelta)

Identidad UNAL (Ancizar Sans, paleta institucional) con un sistema propio en `src/app/globals.css`: esquinas mixtas (redondeadas con una recta), `card`, `card-dark`, `notch`, `icon-tile`, chips con puntos de nivel, fondos decorativos (`bg-hero`, `bg-dots`, `bg-grid`), animaciones (`page-in`, `stagger`, `reveal` con `components/ui/reveal.tsx`, esqueletos y barra de carga en los `loading.tsx`) que respetan `prefers-reduced-motion`. Íconos de `lucide-react` (sin íconos de marcas: la versión instalada no los tiene). Componentes en `src/components/ui/`: `PageHeader`, `HelpTip` (ayudas «?» discretas), `Counter`, `ProgressRing`, `Avatar`, `Stat`, `EmptyState`, decoraciones SVG. Buscador rápido Ctrl+K (`command-palette.tsx`, destinos por rol en `nav-items.ts`).

## Datos de demostración

`scripts/demo-seed.mjs` crea 22 estudiantes ficticios (pregrado, posgrado y egresados, en todos los estados de disponibilidad) con foto ilustrada, hoja de vida e historia académica en PDF, y 9 empresas ficticias con logo en todos los estados, con favoritos, consultas y exportaciones. Marcas: correos de estudiantes `demo.*@unal.edu.co`, de empresas `demo.*@example.com`, NIT `DEMO-*`. **Se borran con `npm run demo:clean` antes de abrir la beta a usuarios reales.**

## Estado (2026-10-31)

Beta **en línea** en https://talento-fcen--talentofcen.us-east4.hosted.app (Firebase App Hosting, backend `talento-fcen`, `us-east4`; cada push a `main` despliega). Google activo en Supabase. 22 verificaciones de visibilidad en verde. La conexión de App Hosting con GitHub está autorizada por la cuenta `fcenwebunal` (dueña del repositorio); si se rehace, tiene que ser con esa cuenta. Pendiente: dar el rol de administrador a `judiazgom@unal.edu.co` después de su primer ingreso y verificar con un ingreso real que se rechazan cuentas de Google que no son `@unal.edu.co`.
