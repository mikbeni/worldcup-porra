export const APP_TIME_ZONE = 'Europe/Madrid'

type DateInput = Date | string | number

export function formatAppDate(input: DateInput, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: APP_TIME_ZONE,
    ...options,
  }).format(new Date(input))
}

export function formatAppDay(input: DateInput) {
  return formatAppDate(input, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatAppTime(input: DateInput) {
  return formatAppDate(input, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatAppShortDateTime(input: DateInput) {
  return formatAppDate(input, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatAppNumericDateTime(input: DateInput) {
  return formatAppDate(input, {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatAppLongDateTime(input: DateInput) {
  return formatAppDate(input, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function appDateKey(input: DateInput) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(input))

  const get = (type: string) => parts.find((part) => part.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')}`
}
