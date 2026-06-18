import Papa from 'papaparse'

const COLUMN_MAP = {
  sku:             ['sku', 'sku#', 'sku number', 'item', 'item#', 'item number'],
  part_number:     ['part number', 'part#', 'part no', 'part no.', 'partno', 'part'],
  description:     ['description', 'desc', 'product description', 'item description', 'name', 'product name'],
  manufacturer:    ['manufacturer', 'mfr', 'mfg', 'brand', 'vendor'],
  cert_number:     ['cert number', 'cert#', 'cert no', 'cert no.', 'certification number', 'certificate number', 'nsf cert', 'nsf cert#'],
  cert_issued_date: ['issued date', 'issue date', 'cert issued', 'cert issued date', 'certification date', 'cert date', 'date issued'],
  cert_expiration:  ['expiration date', 'expiration', 'exp date', 'exp', 'cert expiration', 'cert exp', 'expiry', 'expiry date'],
  issuing_body:     ['issuing body', 'issuer', 'certifying body', 'certification body', 'cert body'],
  po_number:       ['po number', 'po#', 'po no', 'po no.', 'purchase order', 'purchase order number'],
}

function normalizeHeader(h) {
  return h.trim().toLowerCase().replace(/[_-]/g, ' ')
}

function mapHeaders(headers) {
  const mapping = {}
  for (const header of headers) {
    const normalized = normalizeHeader(header)
    for (const [field, aliases] of Object.entries(COLUMN_MAP)) {
      if (aliases.includes(normalized)) {
        mapping[header] = field
        break
      }
    }
  }
  return mapping
}

function parseDate(value) {
  if (!value) return null
  const str = String(value).trim()

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str

  const mdy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (mdy) {
    const [, m, d, y] = mdy
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  const mdyDash = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (mdyDash) {
    const [, m, d, y] = mdyDash
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  return null
}

export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, errors }) => {
        if (errors.length) {
          reject(new Error(errors[0].message))
          return
        }
        if (!data.length) {
          reject(new Error('CSV file is empty.'))
          return
        }

        const headers = Object.keys(data[0])
        const headerMap = mapHeaders(headers)
        const rows = []
        const skipped = []

        for (const [i, row] of data.entries()) {
          const mapped = {}
          for (const [header, field] of Object.entries(headerMap)) {
            mapped[field] = row[header]?.trim() || null
          }

          if (!mapped.sku) {
            skipped.push(i + 2)
            continue
          }

          if (mapped.cert_issued_date) {
            mapped.cert_issued_date = parseDate(mapped.cert_issued_date)
          }
          if (mapped.cert_expiration) {
            mapped.cert_expiration = parseDate(mapped.cert_expiration)
          }

          rows.push(mapped)
        }

        resolve({ rows, skipped, unmappedHeaders: headers.filter(h => !headerMap[h]) })
      },
      error: err => reject(new Error(err.message)),
    })
  })
}
