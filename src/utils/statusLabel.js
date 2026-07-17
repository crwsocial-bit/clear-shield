// Single source of truth for converting a raw compliance status value
// (however it happens to be spelled/cased) into the label shown in the UI.
// Does not affect what's stored anywhere — display only.
const STATUS_LABELS = {
  sellable:        'Compliant',
  'not-sellable':  'Not Compliant',
  not_sellable:    'Not Compliant',
  compliant:       'Compliant',
  'not-compliant': 'Not Compliant',
  not_compliant:   'Not Compliant',
  valid:           'Compliant',
  'not-valid':     'Not Compliant',
  not_valid:       'Not Compliant',
  invalid:         'Not Compliant',
  expiring:        'Expiring Soon',
  expired:         'Expired',
  missing:         'No Cert on File',
  'no-cert':       'No Cert on File',
  no_cert:         'No Cert on File',
}

export function statusLabel(rawStatus) {
  if (!rawStatus) return STATUS_LABELS.missing
  const key = String(rawStatus).trim().toLowerCase()
  return STATUS_LABELS[key] ?? rawStatus
}
