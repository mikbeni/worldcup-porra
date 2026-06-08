# Porra Mundial 2026

Aplicacion privada para gestionar una porra del Mundial 2026 entre amigos.

Estado actual:

- Next.js 14 App Router + TypeScript
- PostgreSQL + Prisma
- Deploy preparado para Vercel + Neon/Supabase
- 48 equipos y 12 grupos
- 72 partidos de fase de grupos
- Login/registro por usuario + PIN de 4 digitos
- Picks bloqueables al empezar el torneo
- Clasificacion publica
- Panel admin para resultados, grupos, fases KO, usuarios y sync con API-Football

## Stack

- Frontend/backend: Next.js 14
- UI: React + TailwindCSS + lucide-react
- Base de datos: PostgreSQL
- ORM: Prisma
- Graficos: Recharts
- Password/PIN: bcryptjs
- Deploy recomendado: Vercel

## Inicio local

Requisitos:

- Node.js 20+
- PostgreSQL local o remoto

```powershell
npm install
copy .env.example .env
```

Edita `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require"
ADMIN_SECRET="un_secreto_largo"
API_FOOTBALL_KEY="tu_api_key_opcional"
```

Crear tablas y cargar datos iniciales completos:

```powershell
npx.cmd prisma db push
npm.cmd run db:seed
```

Arrancar:

```powershell
npm.cmd run dev
```

La app queda en:

```text
http://localhost:3000
```

## Scripts

```json
"dev": "next dev",
"build": "prisma generate && next build",
"start": "next start",
"db:push": "prisma db push",
"db:seed": "tsx prisma/seed.ts && tsx prisma/seed-teams-2026.ts && tsx prisma/seed-matches-2026.ts",
"db:seed:base": "tsx prisma/seed.ts",
"db:seed:teams": "tsx prisma/seed-teams-2026.ts",
"db:seed:matches": "tsx prisma/seed-matches-2026.ts",
"db:studio": "prisma studio"
```

Importante:

- `npm.cmd run db:seed` recarga base + equipos + partidos.
- `db:seed:teams` borra picks porque reemplaza equipos.
- Para recuperar solo partidos sin tocar usuarios, picks ni equipos, usa `db:seed:matches`.

## Datos del torneo

El seed actual carga:

- 48 equipos
- 12 grupos, de A a L
- 72 partidos de fase de grupos

Archivos relevantes:

```text
prisma/seed.ts
prisma/seed-teams-2026.ts
prisma/seed-matches-2026.ts
```

## Sistema de picks

Cada usuario elige 10 equipos:

| Tier | Nombre | Picks | Multiplicador |
|---:|---|---:|---:|
| 1 | Favoritos | 1 | x1.0 |
| 2 | Fuertes | 2 | x1.5 |
| 3 | Competitivos | 3 | x2.5 |
| 4 | Outsiders | 4 | x3.0 |

No se puede repetir equipo.

## Puntuacion

| Logro | Base |
|---|---:|
| Victoria | 3 |
| Empate | 2 |
| Primero de grupo | 8 |
| Segundo de grupo | 4 |
| Octavos | 5 |
| Cuartos | 12 |
| Semifinales | 20 |
| Final | 30 |
| Campeon | 50 |

Los puntos base se multiplican por el tier del equipo elegido.

## Rutas principales

| URL | Descripcion | Auth |
|---|---|---|
| `/login` | Login/registro por usuario y PIN | No |
| `/dashboard` | Resumen personal | Si |
| `/picks` | Seleccion de equipos | Si |
| `/grupos` | Grupos, tablas y partidos | Si |
| `/matches` | Calendario de partidos | Si |
| `/standings` | Clasificacion privada con grafico | Si |
| `/info` | Reglas y puntuacion | Si |
| `/admin` | Administracion | Si, admin |
| `/clasificacion` | Clasificacion publica | No |

Las rutas con datos vivos estan marcadas como dinamicas para evitar cache de Vercel en clasificaciones y APIs.

## Panel admin

Funciones:

- Ver resumen
- Crear partidos
- Guardar resultados
- Cerrar grupos y asignar puntos de primero/segundo
- Asignar fases KO: octavos, cuartos, semis, final y campeon
- Ver usuarios y picks
- Resetear PIN de usuarios
- Sincronizar partidos del dia con API-Football

Para hacer admin a un usuario:

```sql
UPDATE "User"
SET "isAdmin" = true
WHERE "username" = 'tu_usuario';
```

## Sync con API-Football

El boton `Sync ahora` llama a:

```text
POST /api/admin/sync
```

Requiere:

```env
API_FOOTBALL_KEY="..."
```

Comportamiento:

- Busca fixtures del Mundial 2026 para la fecha actual.
- Mapea nombres de API-Football a equipos internos.
- Actualiza partidos existentes cuando coinciden ronda/grupo/equipos.
- Crea partido `apif-*` solo como fallback.
- Si el partido esta finalizado, asigna puntos de victoria/empate sin duplicar.

Incluye alias para nombres como:

- `Spain` -> `ESP`
- `Germany` -> `GER`
- `Netherlands` -> `NED`
- `South Korea` -> `KOR`
- `Ivory Coast` -> `CIV`
- `Cape Verde` -> `CPV`
- `Saudi Arabia` -> `KSA`
- `DR Congo` / `Congo DR` -> `COD`

## Deploy en Vercel

Variables necesarias:

```env
DATABASE_URL="postgresql://..."
ADMIN_SECRET="un_secreto_largo"
API_FOOTBALL_KEY="opcional_para_sync"
```

Build command:

```text
npm run build
```

Despues del primer deploy:

```powershell
$env:DATABASE_URL="postgresql://URL_REAL_DE_PRODUCCION"
npx.cmd prisma db push
npm.cmd run db:seed
```

## Mantenimiento seguro

### Recuperar solo partidos

Si borraste partidos pero quieres mantener usuarios, picks y equipos:

```powershell
$env:DATABASE_URL="postgresql://URL_REAL_DE_PRODUCCION"
npm.cmd run db:seed:matches
```

### Resetear resultados sin tocar picks

En SQL:

```sql
BEGIN;

DELETE FROM "PointsHistory";

DELETE FROM "Match"
WHERE "round" <> 'GROUP'
  AND (
    "venue" ILIKE '%simulado%'
    OR "matchNumber" > 72
  );

UPDATE "Match"
SET
  "status" = 'SCHEDULED',
  "homeScore" = NULL,
  "awayScore" = NULL,
  "homePenalties" = NULL,
  "awayPenalties" = NULL
WHERE "round" = 'GROUP';

UPDATE "Team"
SET
  "eliminated" = false,
  "finalPosition" = NULL;

COMMIT;
```

### Borrar usuarios de simulacion

```sql
BEGIN;

DELETE FROM "Pick"
WHERE "userId" IN (
  SELECT "id" FROM "User"
  WHERE "username" LIKE 'sim\_%' ESCAPE '\'
);

DELETE FROM "User"
WHERE "username" LIKE 'sim\_%' ESCAPE '\';

COMMIT;
```

## Notas

- Las banderas se guardan como emoji en `flagEmoji`. En algunos PC Windows pueden no verse igual que en movil.
- No ejecutes `db:seed:teams` cuando ya haya picks reales, porque reemplaza equipos y borra picks.
- Para cambios de datos en produccion, usa siempre la `DATABASE_URL` real de Neon/Supabase.
