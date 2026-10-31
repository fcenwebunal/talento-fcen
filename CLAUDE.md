# Talento FCEN (código)

Plataforma que conecta a estudiantes de la FCEN (UNAL Manizales) con empresas: perfiles con habilidades, búsqueda de talento por niveles de visibilidad, guía didáctica de la normativa y administración propia. El plan, las decisiones y los contenidos están en la carpeta de arriba (`../plan-beta.md`, `../guia-contenidos.md`, `../CLAUDE.md`): leer el plan antes de cambiar algo de fondo.

- **Repositorio**: `github.com/fcenwebunal/talento-fcen` (rama `main`). Es un repositorio propio dentro de FCEN DEV, que lo ignora. Commit y push al terminar cada cambio.
- **Supabase**: proyecto `talento-fcen`, ref `iwpnsyuvqvmdlsbkbzly`, región `us-east-1`. URL `https://iwpnsyuvqvmdlsbkbzly.supabase.co`. La publishable key es pública y puede ir en el código del cliente.
- **Secretos**: en `.env.local` (`SUPABASE_SECRET_KEY`, `SUPABASE_DB_PASSWORD`, `SUPABASE_ACCESS_TOKEN`, `GOOGLE_CLIENT_SECRET`). Lo crea y mantiene el usuario; **Claude no lo lee ni lo edita** (regla de permisos de FCEN DEV). La secret key nunca va al navegador ni a git.
- **Estado** (2026-10-31): repositorio iniciado, sin aplicación todavía. Pendiente: decisión de hosting (ver `../plan-beta.md`) e inicio de sesión con Google.
