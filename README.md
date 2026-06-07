# ⚽ Porra Mundial 2026

Plataforma completa para gestionar una porra privada del Mundial de Fútbol entre amigos.

## Stack

- **Frontend/Backend**: Next.js 14 (App Router) + TypeScript
- **Estilos**: TailwindCSS
- **Base de datos**: PostgreSQL + Prisma ORM
- **Gráficos**: Recharts
- **Auth**: Sesión por nombre de usuario (MVP)

---

## 🚀 Inicio Rápido

### Opción A: Docker (recomendado)

```bash
# 1. Clonar y entrar
git clone <repo> && cd worldcup-porra

# 2. Arrancar todo (PostgreSQL + App)
docker-compose up -d

# La app estará disponible en http://localhost:3000
# Usuario admin: "admin"
```

### Opción B: Manual

**Requisitos**: Node.js 20+, PostgreSQL 14+

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL

# 3. Crear tablas y poblar datos
npx prisma db push
npm run db:seed

# 4. Arrancar en desarrollo
npm run dev
```

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── (app)/               # Rutas protegidas (requieren auth)
│   │   ├── dashboard/       # Página principal
│   │   ├── picks/           # Selección de equipos por tier
│   │   ├── standings/       # Clasificación + gráfico evolución
│   │   ├── matches/         # Lista de partidos
│   │   └── admin/           # Panel de administración
│   ├── api/
│   │   ├── auth/            # Login/logout
│   │   ├── picks/           # Guardar/leer selecciones
│   │   ├── standings/       # Clasificación general
│   │   ├── matches/         # Partidos
│   │   ├── tiers/           # Tiers + equipos
│   │   ├── history/         # Historial de puntos para gráficos
│   │   └── admin/           # Resultados + avance de fases
│   ├── clasificacion/       # Página pública de clasificación
│   └── login/               # Acceso
├── components/
│   └── shared/Navbar.tsx
├── lib/
│   ├── db.ts                # Prisma client
│   ├── auth.ts              # Sesión
│   └── scoring.ts           # Motor de puntuación
└── types/index.ts
```

---

## 🎯 Sistema de Selección

| Tier | Nombre | Picks | Multiplicador |
|------|--------|-------|---------------|
| 1 | Favoritos | 1 | ×1.0 |
| 2 | Fuertes | 2 | ×1.5 |
| 3 | Competitivos | 3 | ×2.5 |
| 4 | Outsiders | 4 | ×4.0 |

---

## 📊 Sistema de Puntuación

| Logro | Base | T1 | T2 | T3 | T4 |
|-------|------|-----|-----|-----|-----|
| Victoria | 3 | 3 | 4.5 | 7.5 | 12 |
| Empate | 1 | 1 | 1.5 | 2.5 | 4 |
| Octavos | 5 | 5 | 7.5 | 12.5 | 20 |
| Cuartos | 10 | 10 | 15 | 25 | 40 |
| Semis | 20 | 20 | 30 | 50 | 80 |
| Final | 30 | 30 | 45 | 75 | 120 |
| **Campeón** | **50** | **50** | **75** | **125** | **200** |
| **Máx posible** | — | **~128** | **~192** | **~320** | **~512** |

---

## 🔧 Panel de Administración

Accede con cualquier usuario marcado como `isAdmin = true` en la BD.

**Funciones:**
- **Resumen**: estadísticas del torneo
- **Crear Partido**: programar partidos con equipos, fecha y estadio
- **Resultado**: introducir marcador (asigna puntos automáticamente)
- **Fase**: marcar cuando un equipo avanza a octavos/cuartos/semis/final/campeón
- **Usuarios**: ver participantes y sus picks

**Hacer a un usuario admin:**
```sql
UPDATE "User" SET "isAdmin" = true WHERE username = 'tu_usuario';
```

---

## 🌍 Páginas

| URL | Descripción | Auth |
|-----|-------------|------|
| `/` | Redirect a dashboard o login | — |
| `/login` | Acceso por nombre de usuario | No |
| `/dashboard` | Hub principal con stats | Sí |
| `/picks` | Seleccionar equipos por tier | Sí |
| `/standings` | Clasificación + gráfico | Sí |
| `/matches` | Partidos filtrados por ronda | Sí |
| `/admin` | Panel de administración | Sí (admin) |
| `/clasificacion` | Clasificación pública compartible | No |

---

## 🔌 Integración con APIs Deportivas (futuro)

El modelo de datos está preparado. Solo necesitas un cron job que llame a `/api/admin` con los resultados:

```typescript
// Ejemplo: integrar con API-Football, SportRadar, etc.
await fetch('/api/admin', {
  method: 'POST',
  headers: { 'Cookie': 'porra_session=ADMIN_USER_ID' },
  body: JSON.stringify({
    matchId: 'match_id_interno',
    homeScore: 2,
    awayScore: 1,
  })
})
```

---

## 🌐 Despliegue en Vercel + Neon

```bash
# 1. Crear BD en neon.tech (gratis)
# 2. Copiar DATABASE_URL a Vercel

vercel env add DATABASE_URL
vercel env add ADMIN_SECRET

# 3. Deploy
vercel --prod

# 4. Migrar BD
vercel run -- npx prisma db push
vercel run -- npm run db:seed
```

---

## 🔮 Extensiones Futuras

- Soporte multi-torneo (Eurocopa, Copa América) — ya modelado con `Tournament`
- Integración automática con APIs deportivas
- Notificaciones push / email al actualizar resultados
- Sistema de grupos y ligas privadas
- Predicciones pre-torneo
- App móvil (React Native / PWA)
