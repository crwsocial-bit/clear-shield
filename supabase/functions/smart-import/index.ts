const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const TODAY_ISO = new Date().toISOString().split('T')[0]

const EXTRACT_PROMPT = `Today's date is ${TODAY_ISO}. Extract structured data from this compliance certificate document. The document may cover a single product or multiple products (e.g. a product family certificate listing several part numbers). Return ONLY a valid JSON object with these exact keys:

{
  "products": [
    {
      "product_name": "product or component name, or null",
      "part_number": "part number or model number, or null",
      "manufacturer": "manufacturer or company name, or null",
      "issuing_body": "certifying organization name such as NSF International, IAPMO, CSA Group, UL, Bureau Veritas, or null",
      "cert_number": "certificate number or ID, or null",
      "issue_date": "date issued in YYYY-MM-DD format, or null",
      "expiration_date": "expiration date in YYYY-MM-DD format, or null",
      "lead_content_percent": "lead content percentage as a number if stated, or null",
      "notes": "standards referenced and product scope (e.g. NSF/ANSI 372, lead-free brass fittings 1/2 to 2 inch), or null",
      "warnings": [
        "Plain-English warning string for each issue found for THIS product. Include one for each of the following that applies:",
        "- expiration_date not found in document",
        "- cert_number not found in document",
        "- issuing_body not found or not a recognized accredited body (NSF International, IAPMO, CSA Group, UL, Bureau Veritas)",
        "- manufacturer not found in document",
        "- lead_content_percent exceeds 0.25 — may not meet NSF/ANSI 372 threshold",
        "- certificate appears to be expired (expiration_date is before today)",
        "- any other significant compliance issue or ambiguity visible in the document for this product",
        "Empty array [] if no warnings apply. Do NOT include the bullet descriptions above verbatim — write natural warnings based on what you actually find."
      ]
    }
  ],
  "document_warnings": [
    "Plain-English warning string for each document-level issue found, e.g. 'document appears to cover 6 products — please verify all were captured' or 'document image quality is poor, some fields may be inaccurate'. Empty array [] if none apply."
  ]
}

If the document contains only one product, return "products" as an array with a single item. If it contains multiple products, return one object per product in the array. Return only the JSON object, no other text or markdown.`

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function normalizeMediaType(type: string): string {
  if (type === 'image/jpg') return 'image/jpeg'
  return type
}

function jsonError(message: string, status = 400): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
  )
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405)
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return jsonError('No file provided')

    if (file.size > 10 * 1024 * 1024) {
      return jsonError('File too large (max 10MB)')
    }

    const mediaType = normalizeMediaType(file.type)
    const isPDF = mediaType === 'application/pdf'
    const isImage = ['image/png', 'image/jpeg', 'image/webp'].includes(mediaType)

    if (!isPDF && !isImage) {
      return jsonError('Unsupported file type. Upload PDF, PNG, JPG, or WEBP.')
    }

    const base64 = arrayBufferToBase64(await file.arrayBuffer())

    const contentBlock = isPDF
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
      : { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) return jsonError('API key not configured', 500)

    const anthropicHeaders: Record<string, string> = {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    }
    if (isPDF) anthropicHeaders['anthropic-beta'] = 'pdfs-2024-09-25'

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: anthropicHeaders,
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [contentBlock, { type: 'text', text: EXTRACT_PROMPT }],
          },
        ],
      }),
    })

    if (!anthropicRes.ok) {
      console.error('Anthropic error:', await anthropicRes.text())
      return jsonError('AI processing failed. Please try again.', 500)
    }

    const anthropicData = await anthropicRes.json()
    const text: string = anthropicData.content?.[0]?.text ?? ''

    let extracted: { products?: unknown; document_warnings?: unknown }
    try {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      extracted = JSON.parse(match ? match[1] : text.trim())
    } catch {
      console.error('Parse error, raw response:', text)
      return jsonError('Failed to parse AI response', 500)
    }

    if (!Array.isArray(extracted.products)) {
      console.error('Unexpected AI response shape:', text)
      return jsonError('AI response missing product data', 500)
    }

    return new Response(
      JSON.stringify({
        data: {
          products: extracted.products,
          document_warnings: Array.isArray(extracted.document_warnings) ? extracted.document_warnings : [],
        },
      }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Edge function error:', err)
    return jsonError('Internal server error', 500)
  }
})
