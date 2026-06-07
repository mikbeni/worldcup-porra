# Deploy en Vercel + Postgres gestionado

Esta app es Next.js + Prisma + PostgreSQL. En produccion conviene desplegar la app en Vercel y usar una base de datos gestionada como Neon o Supabase.

## 1. Preparar el repositorio

Sube esta carpeta limpia a GitHub. No subas `.env`, `.next` ni `node_modules`.

```bash
git init
git add .
git commit -m "Prepare Vercel deployment"
git branch -M main
git remote add origin <URL_DE_TU_REPO>
git push -u origin main
```

## 2. Crear PostgreSQL

Opcion A: Neon

1. Crea un proyecto en Neon.
2. Copia la connection string pooled o serverless compatible.
3. Guardala como `DATABASE_URL`.

Opcion B: Supabase

1. Crea un proyecto en Supabase.
2. Ve a Project Settings -> Database.
3. Copia la connection string de PostgreSQL.
4. Guardala como `DATABASE_URL`.

## 3. Crear el proyecto en Vercel

1. Importa el repositorio desde GitHub.
2. Framework: Next.js.
3. Build command: `npm run build`.
4. Output directory: deja el valor por defecto.

Variables de entorno de produccion:

```env
DATABASE_URL="postgresql://..."
ADMIN_SECRET="pon_un_secreto_largo_y_unico"
NEXTAUTH_URL="https://tu-proyecto.vercel.app"
```

Aunque la app no usa NextAuth directamente, `NEXTAUTH_URL` queda documentada para mantener el entorno claro.

## 4. Inicializar la base de datos

Despues del primer deploy, ejecuta una vez:

```bash
npx prisma db push
npm run db:seed
```

Puedes hacerlo localmente apuntando a la base de produccion:

```bash
$env:DATABASE_URL="postgresql://..."
npx prisma db push
npm run db:seed
```

## 5. Checklist antes de invitar amigos

- Entra con el usuario `admin`.
- Cambia `ADMIN_SECRET` si lo dejaste provisional.
- Prueba crear un usuario normal.
- Guarda picks para un usuario.
- Comprueba `/clasificacion`.
- Activa backups en Neon o Supabase.

## Notas

- No ejecutes el seed en cada arranque en produccion; solo una vez o cuando quieras restaurar datos iniciales.
- `npm run build` ejecuta `prisma generate` para que Vercel tenga el cliente Prisma listo durante el build.
