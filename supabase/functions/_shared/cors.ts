export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function jsonError(message: string, status = 400): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
  )
}

export function jsonOk(data: unknown, status = 200): Response {
  return new Response(
    JSON.stringify({ data }),
    { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
  )
}
