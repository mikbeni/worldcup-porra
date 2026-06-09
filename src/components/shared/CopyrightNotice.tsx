export function CopyrightNotice({ compact = false }: { compact?: boolean }) {
  return (
    <p className={`text-center text-slate-600 ${compact ? 'text-[11px]' : 'text-xs'}`}>
      © 2026 Maik Beni. Aplicación desarrollada por Maik Beni. Todos los derechos reservados.
    </p>
  )
}
