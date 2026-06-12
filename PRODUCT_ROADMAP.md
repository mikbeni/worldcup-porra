# Proyecto: Plataforma de Porras Deportivas

## Vision

Convertir la app actual de Porra Mundial 2026 en una plataforma comercial para crear porras privadas de competiciones deportivas, empezando por futbol y preparada para extenderse a otros deportes.

La propuesta inicial:

> Plataforma para crear porras deportivas privadas para empresas, comunidades y grupos, con clasificacion en vivo, reglas configurables, branding propio y sincronizacion de resultados.

## Punto de partida

Producto actual:

- App Next.js 14 con Prisma y PostgreSQL.
- Deploy en Vercel + Neon.
- Login/registro con usuario y PIN.
- Una competicion fija: Mundial 2026.
- 48 equipos, 12 grupos y 72 partidos de fase de grupos.
- Picks por tiers con multiplicadores.
- Clasificacion privada y publica.
- Panel admin para resultados, grupos, fases KO, usuarios y reset de PIN.
- Sync de resultados desde ESPN Scoreboard, sin API key.

Lecciones aprendidas:

- Los datos de competicion no deben estar acoplados a codigo fijo.
- Los proveedores de resultados deben ser intercambiables.
- API-Football Free no permite consultar Mundial 2026.
- ESPN Scoreboard funciona como fuente gratuita, pero no tiene contrato comercial formal.
- La app necesita separar torneo, organizacion, usuarios, picks, reglas y proveedores.

## Objetivo comercial

Crear un SaaS ligero y vendible en tres lineas:

- B2B pequeno: porras privadas para empresas.
- Comunidades: grupos, peñas, bares, clubes y creadores.
- White-label basico: una porra con logo, colores y URL propia.

Primer producto vendible:

- "Crea una porra privada para tu empresa o grupo en minutos."
- Foco inicial: futbol.
- Sin configuracion tecnica por parte del cliente.
- Ranking automatico, administracion sencilla y enlace de invitacion.

## Principios de producto

- Primero hacer una plataforma buena para futbol; despues abrir a otros deportes.
- Mantener el flujo de usuario muy simple.
- Evitar configuradores gigantes al principio.
- Los administradores no deben tocar base de datos.
- Todo lo que hoy esta en seeds debe poder configurarse o importarse.
- Las reglas deben estar versionadas para que una competicion ya empezada no cambie por accidente.
- Los resultados manuales deben convivir con sync automatico.

## Modelo conceptual futuro

### Organization

Representa una empresa, comunidad o cliente.

Campos previstos:

- name
- slug
- logoUrl
- primaryColor
- ownerUserId
- plan
- createdAt

### User

Usuario global de la plataforma.

Evolucion:

- Mantener PIN para grupos simples.
- Preparar email/password o magic link para uso comercial.
- Roles por organizacion.

### Membership

Relacion entre usuario y organizacion.

Roles:

- owner
- admin
- player

### Competition

Plantilla deportiva reutilizable.

Ejemplos:

- Mundial 2026
- Champions League 2026/27
- Eurocopa
- Liga
- Formula 1
- NBA Playoffs

Campos:

- sport
- name
- season
- startDate
- endDate
- dataProvider
- status

### Pool

La porra concreta que crea un cliente.

Ejemplo:

- "Porra Mundial Layde 2026"
- "Porra Clientes Bar X"

Campos:

- organizationId
- competitionId
- name
- slug
- visibility
- scoringRulesetId
- lockPolicy
- branding overrides

### Team / Participant / Competitor

Entidad que participa en eventos.

Debe ser generica:

- Equipo de futbol.
- Piloto de F1.
- Jugador de tenis.
- Franquicia NBA.

### Event

Partido, carrera, jornada o evento puntuable.

Campos:

- competitionId
- eventNumber
- round
- group
- scheduledAt
- status
- homeCompetitorId
- awayCompetitorId
- result payload
- externalProviderId

### Pick

Prediccion o seleccion de usuario.

Tipos futuros:

- Seleccionar equipos por tiers.
- 1X2.
- Resultado exacto.
- Campeon.
- Clasificados.
- Ganador de carrera.
- Podio.

### ScoringRule / Ruleset

Reglas de puntuacion versionadas.

Ejemplos:

- Victoria de equipo elegido.
- Empate.
- Resultado exacto.
- Campeon.
- Primero de grupo.
- Bonus por underdog.

## Arquitectura objetivo

### Data providers

Crear una capa comun:

```text
DataProvider
  getEvents(competition)
  getResults(competition, dateRange)
  normalizeCompetitor(raw)
  normalizeEvent(raw)
```

Adaptadores previstos:

- ESPN Scoreboard: gratuito, actual fuente recomendada.
- API-Football: premium si se paga plan.
- CSV/manual import: para competiciones sin API.
- Provider mock: para testing y demos.

### Scoring engine

Extraer la puntuacion a un motor independiente:

```text
scoreEvent(event, picks, ruleset)
scoreMilestone(competitor, milestone, picks, ruleset)
```

Requisitos:

- Idempotente: no duplicar puntos.
- Auditable: guardar razon y regla aplicada.
- Recalculable: poder borrar/recalcular una pool si cambia un resultado.
- Versionado: una regla activa en una pool no debe cambiar retroactivamente sin confirmacion.

### Multi-tenant

Todos los datos privados deben colgar de:

- organizationId
- poolId

Objetivo:

- Un solo deploy.
- Una sola base de datos.
- Multiples clientes aislados por datos.

## Hoja de ruta

### Fase 0: Estabilizar la porra actual

Objetivo: dejar Mundial 2026 robusto antes de abstraer.

Tareas:

- Actualizar README para reflejar ESPN en vez de API-Football.
- Confirmar que Sync ESPN actualiza resultados reales.
- Anadir auditoria simple de sync: fecha, fuente, fixtures vistos, partidos actualizados.
- Mejorar mensajes admin cuando no se vincula un evento.
- Evitar que reseed de partidos borre resultados sin advertencia.
- Documentar reset seguro de puntuaciones y resultados.

Criterio de salida:

- La porra actual funciona para usuarios reales sin tocar SQL salvo mantenimiento excepcional.

### Fase 1: Preparar multi-pool sin cambiar UX

Objetivo: introducir estructura de plataforma sin romper Mundial 2026.

Tareas:

- Crear modelos `Organization`, `Membership` y `Pool`.
- Asociar usuarios, picks, matches, points history y admin a una pool.
- Crear una organizacion y pool por defecto para migrar datos actuales.
- Mantener rutas actuales apuntando a la pool activa.
- Anadir selector interno de pool para admin.

Criterio de salida:

- La app sigue igual para usuarios, pero la base ya soporta mas de una porra.

### Fase 2: Configuracion de una nueva porra de futbol

Objetivo: que un admin pueda crear una porra nueva sin tocar codigo.

Tareas:

- Pantalla admin para crear pool.
- Importar equipos/participantes desde plantilla.
- Importar calendario por CSV o seed seleccionable.
- Configurar nombre, logo y colores.
- Crear enlace de invitacion.
- Crear usuario admin/owner de la pool.

Criterio de salida:

- Se puede crear una segunda porra de futbol desde la UI.

### Fase 3: Reglas configurables

Objetivo: sacar las reglas del codigo fijo.

Tareas:

- Crear `Ruleset`.
- Crear `ScoringRule`.
- Migrar reglas actuales de tiers a configuracion.
- Admin puede elegir una plantilla de reglas.
- Mostrar reglas dinamicas en `/info`.
- Recalculo seguro de puntos.

Criterio de salida:

- Dos pools pueden tener reglas diferentes.

### Fase 4: Producto comercial minimo

Objetivo: venderlo a primeras empresas/comunidades.

Tareas:

- Landing privada o pagina de demo.
- Flujo de alta de organizacion.
- Branding por organizacion.
- Ranking publico opcional.
- Exportar ranking CSV.
- Terminos, privacidad y aviso legal.
- Planes simples: Free/demo, Basic, White-label.
- Logs de admin: quien cambio un resultado y cuando.

Criterio de salida:

- Se puede ofrecer a una empresa sin setup manual salvo configuracion inicial.

### Fase 5: Otros formatos de futbol

Objetivo: ampliar competiciones sin saltar aun a deportes muy distintos.

Formatos:

- Champions / Europa League.
- Liga domestica.
- Eliminatorias.
- Torneos cortos.

Tareas:

- Soportar jornadas largas.
- Soportar clasificacion por liga.
- Soportar picks 1X2.
- Soportar resultado exacto.
- Soportar campeon y top posiciones.

Criterio de salida:

- La plataforma ya no depende del formato Mundial.

### Fase 6: Otros deportes

Objetivo: abrir a deportes con estructura diferente.

Prioridad sugerida:

1. Formula 1: calendario y predicciones de podio.
2. NBA Playoffs: brackets y ganador de serie.
3. Tenis: ganador de torneo/bracket.

Tareas:

- Generalizar `Team` a `Competitor`.
- Generalizar `Match` a `Event`.
- Crear reglas por tipo de deporte.
- Crear adaptadores de datos especificos.

Criterio de salida:

- Al menos una pool no-futbol funcionando en produccion.

## Riesgos

- Dependencia de fuentes gratuitas sin SLA.
- Complejidad excesiva si se intenta soportar todos los deportes pronto.
- Multi-tenant mal aislado puede mezclar datos entre clientes.
- Recalculo de puntos puede generar inconsistencias si no es idempotente.
- Legal y privacidad son necesarios al pasar de amigos a empresas.

## Decisiones recomendadas

- Mantener Vercel + Neon mientras haya pocos clientes.
- Usar ESPN como fuente gratuita inicial, pero con adaptador intercambiable.
- No construir pagos hasta tener 2-3 clientes piloto.
- Vender primero configuracion asistida, no autoservicio completo.
- Priorizar B2B privado antes que marketplace publico.

## Backlog inicial

Alta prioridad:

- Actualizar README con ESPN Sync.
- Anadir logs de sync.
- Crear modelos Organization, Membership y Pool.
- Migrar datos actuales a una pool por defecto.
- Cambiar queries para filtrar por pool activa.

Media prioridad:

- Branding por pool.
- Invitaciones por enlace.
- Export CSV.
- Recalculo de puntos.
- Import CSV de calendario.

Baja prioridad:

- Pagos.
- Dominio personalizado por cliente.
- Constructor visual avanzado de reglas.
- Deportes distintos a futbol.

## Proximo paso tecnico recomendado

Crear la Fase 1:

1. Disenar migracion Prisma para `Organization`, `Membership` y `Pool`.
2. Crear seed de organizacion/pool por defecto.
3. Asociar datos actuales a esa pool.
4. Mantener compatibilidad visual con la app actual.

Esto convierte la porra actual en el primer tenant de la futura plataforma sin reescribir todo de golpe.
