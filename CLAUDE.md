# Talento FCEN (código)

Plataforma que conecta a estudiantes de la FCEN (UNAL Manizales) con empresas: perfiles con habilidades, búsqueda de talento por niveles de visibilidad, guía didáctica de la normativa y administración propia. El plan, las decisiones y los contenidos están en la carpeta de arriba (`../plan-beta.md`, `../guia-contenidos.md`, `../CLAUDE.md`): leer el plan antes de cambiar algo de fondo.

## Infraestructura

- **Repositorio**: `github.com/fcenwebunal/talento-fcen` (rama `main`). Repositorio propio dentro de FCEN DEV, que lo ignora. Commit y push al terminar cada cambio.
- **Supabase**: proyecto `talento-fcen`, ref `iwpnsyuvqvmdlsbkbzly`, región `us-east-1`, Postgres 17. URL `https://iwpnsyuvqvmdlsbkbzly.supabase.co`. La publishable key es pública y va en el código y en `apphosting.yaml`.
- **Firebase**: proyecto `talentofcen` (número 857627517671), plan Blaze, creado por el usuario con `fcenwebunaldos@gmail.com`; la CLI de Claude entra como `juanmanueldiazgomez247@gmail.com` (propietario). El backend de App Hosting previsto es `talento-fcen` en `us-east4`, con URL `https://talento-fcen--talentofcen.us-east4.hosted.app` (ya registrada en Supabase como sitio y retorno). Si el backend queda con otro ID o región, actualizar `SITE` en `scripts/configure-auth.mjs` y correr `npm run auth:configure`.
- **Inicio de sesión con Google**: cliente OAuth creado por Firebase Authentication en `talentofcen` (ID `857627517671-0qtve299itfvsnmomkas00hqvjvo8833.apps.googleusercontent.com`), con el retorno de Supabase autorizado. Su secreto va en `.env.local` y lo activa `npm run auth:configure`.
- **Secretos**: `.env.local` (`SUPABASE_SECRET_KEY`, `SUPABASE_DB_PASSWORD`, `SUPABASE_ACCESS_TOKEN`, `GOOGLE_CLIENT_SECRET`). Lo mantiene el usuario; **Claude no lo lee ni lo edita** (regla de permisos de FCEN DEV) y nunca imprime sus valores: los comandos lo cargan con `node --env-file=.env.local` o `set -a && . ./.env.local && set +a`. La app desplegada no usa la secret key.

## Comandos

| Para | Comando |
|---|---|
| Aplicar migraciones | `set -a && . ./.env.local && set +a && npx supabase db push --linked --password "$SUPABASE_DB_PASSWORD" --yes` |
| Configurar Auth (sitio, retornos, Google, sin confirmación por correo) | `npm run auth:configure` |
| Prueba completa de niveles de visibilidad (crea y borra cuentas de prueba) | `npm run test:smoke` |
| Dar un rol (la persona debe haber ingresado una vez) | `npm run role -- correo@unal.edu.co admin` |
| Compilar | `npx tsc --noEmit` y `npx next build` |
| Servidor local | `exec node node_modules/next/dist/bin/next start -p 3000` en segundo plano. Con `npx next start` el proceso de Node queda huérfano al detener la tarea |

## Cómo está hecho

- Next.js 16 (App Router; `proxy.ts` en lugar de middleware; `cookies()`, `params` y `searchParams` son asíncronos), React 19, Tailwind 4, `@supabase/ssr`. Todas las rutas son dinámicas (sesión por cookies), lo que evita la trampa del CDN de Hosting que tuvo fcenedit.
- **La seguridad vive en la base** (RLS y funciones `security definer` en `supabase/migrations/`): niveles 0 público, 1 empresa registrada (anónimo), 2 empresa autorizada o Facultad (`public.access_level()`). Las empresas nunca leen tablas de estudiantes: solo `search_students`, `get_student_detail` y `export_students`. Disparadores protegen roles, estado de empresas y verificación del avance. `pg_cron` corre `run_daily_maintenance()` a las 06:00 hora de Colombia.
- Las cuentas de Google deben ser `@unal.edu.co` (disparador `handle_new_user`) y quedan como estudiantes; las de correo y contraseña son empresas. El rol «Facultad» se da en `/admin/usuarios` o con `npm run role`.
- Archivos en Storage: bucket privado `documentos` (`<uid>/<tipo>/<archivo>`) y público `logos`.
- La prueba `test:smoke` no puede simular un ingreso real con Google (la API de administración crea cuentas de correo): el rechazo de cuentas que no son `@unal.edu.co` se verifica con un ingreso real.

## Estado (2026-10-31)

Beta construida y probada en local (22 verificaciones de visibilidad en verde). Google activo en Supabase. Pendiente: crear el backend de App Hosting (lo hace el usuario porque autoriza la app de Firebase en GitHub) y dar el rol de administrador a `judiazgom@unal.edu.co` (cuenta del usuario) después de su primer ingreso con Google.
