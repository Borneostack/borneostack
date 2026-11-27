// The eight synthetic invoices for the /work/automation example: who sent them, what is on them, and what the
// workflow should do with each. All suppliers and the buyer are fictional. Dates are relative to the day the
// generator runs, so the "overdue" and "due soon" cases stay true when the files are regenerated.

export const BUYER = {
  name: 'Demo Buyer Sdn Bhd',
  lines: ['Lot 12, Jalan Contoh', '88000 Kota Kinabalu, Sabah']
}

// Money is held in sen (integers) so sums are exact.
const rm = ringgit => Math.round(ringgit * 100)

export const SAMPLES = [
  {
    id: 'tanjung-merpati',
    layout: 'classic',
    supplier: 'Tanjung Merpati Packaging Sdn Bhd',
    address: ['No. 8, Lorong Industri 3', 'Kota Kinabalu, Sabah'],
    invoiceNo: 'INV-20418',
    issuedDaysAgo: 6,
    dueInDays: 24,
    dateStyle: 'dMonY',
    terms: 'Net 30 days',
    taxLabel: 'Sales tax 10%',
    taxRate: 0.1,
    lines: [
      ['Corrugated carton 40 x 30 x 25 cm (pack of 25)', 12, rm(38.5)],
      ['Bubble wrap roll, 100 m', 6, rm(42)],
      ['Packing tape 48 mm (6 rolls)', 10, rm(21.6)],
      ['Delivery, Kota Kinabalu', 1, rm(60)]
    ],
    case: 'Clean invoice, due in the future',
    outcome: 'filed',
    expectReasons: []
  },
  {
    id: 'lumut-biru',
    layout: 'modern',
    supplier: 'Lumut Biru Cold Storage Sdn Bhd',
    address: ['Lot 5, Kawasan Perindustrian Kolombong', 'Kota Kinabalu, Sabah'],
    invoiceNo: 'CS/2026/00931',
    issuedDaysAgo: 9,
    dueInDays: 21,
    dateStyle: 'dMY',
    terms: 'Net 30 days',
    taxLabel: 'Service tax 8%',
    taxRate: 0.08,
    lines: [
      ['Chilled pallet storage, November 2026 (pallet-days)', 24, rm(38)],
      ['Goods in and out handling (per pallet)', 36, rm(6.5)],
      ['Temperature log report', 1, rm(80)]
    ],
    case: 'Clean invoice with service tax',
    outcome: 'filed',
    expectReasons: []
  },
  {
    id: 'sungai-kerlap',
    layout: 'typewriter',
    supplier: 'Sungai Kerlap Printing Works',
    address: ['12 Jalan Percetakan', 'Sandakan, Sabah'],
    invoiceNo: 'SKPW-7733',
    issuedDaysAgo: 52,
    dueInDays: -22,
    dateStyle: 'iso',
    terms: 'Net 30 days',
    taxLabel: null,
    taxRate: 0,
    lines: [
      ['Brochure A5, full colour', 1000, rm(0.85)],
      ['Roll-up banner 85 x 200 cm', 2, rm(120)],
      ['Delivery', 1, rm(25)]
    ],
    case: 'Already overdue',
    outcome: 'filed',
    expectReasons: []
  },
  {
    id: 'pulau-senja',
    layout: 'compact',
    supplier: 'Pulau Senja Linen Supply',
    address: ['Lot 31, Jalan Kemajuan', 'Kota Kinabalu, Sabah'],
    invoiceNo: 'PS-2026-0187',
    issuedDaysAgo: 9,
    dueInDays: 5,
    dateStyle: 'dMonthY',
    terms: 'Net 14 days',
    taxLabel: null,
    taxRate: 0,
    lines: [
      ['Bath towel, white, 70 x 140 cm', 80, rm(14.5)],
      ['Pillowcase, white', 120, rm(4.2)],
      ['Hand towel, white', 100, rm(5.9)],
      ['Delivery', 1, rm(40)]
    ],
    case: 'Clean invoice, due within 7 days',
    outcome: 'filed',
    expectReasons: []
  },
  {
    id: 'batu-layar',
    layout: 'serif',
    supplier: 'Batu Layar Electrical Trading',
    address: ['Lot 9, Jalan Elektrik', 'Tawau, Sabah'],
    invoiceNo: 'BLE/11/0562',
    issuedDaysAgo: 12,
    dueInDays: 18,
    dateStyle: 'dMonY',
    terms: 'Net 30 days',
    taxLabel: 'Sales tax 10%',
    taxRate: 0.1,
    // The printed subtotal is RM 120.00 more than the lines add up to, as if a line had been left off.
    printedSubtotalExtra: rm(120),
    lines: [
      ['LED panel light 18 W', 20, rm(22)],
      ['Cable 2.5 mm2, 100 m roll', 4, rm(168)],
      ['Circuit breaker 20 A', 12, rm(15.5)],
      ['Conduit 20 mm, 3 m length', 30, rm(3.4)]
    ],
    case: 'Total does not match its lines',
    outcome: 'review',
    expectReasons: ['lines_vs_subtotal']
  },
  {
    id: 'tanjung-merpati-resent',
    layout: 'modern',
    resendOf: 'tanjung-merpati',
    supplier: 'Tanjung Merpati Packaging Sdn Bhd',
    address: ['No. 8, Lorong Industri 3', 'Kota Kinabalu, Sabah'],
    invoiceNo: 'INV-20418',
    issuedDaysAgo: 6,
    dueInDays: 24,
    dateStyle: 'dMY',
    terms: 'Net 30 days',
    taxLabel: 'Sales tax 10%',
    taxRate: 0.1,
    banner: 'RESENT COPY',
    lines: [
      ['Corrugated carton 40 x 30 x 25 cm (pack of 25)', 12, rm(38.5)],
      ['Bubble wrap roll, 100 m', 6, rm(42)],
      ['Packing tape 48 mm (6 rolls)', 10, rm(21.6)],
      ['Delivery, Kota Kinabalu', 1, rm(60)]
    ],
    case: 'Same invoice number as the first sample, sent again',
    outcome: 'duplicate',
    expectReasons: ['duplicate']
  },
  {
    id: 'bukit-rembulan',
    layout: 'minimal',
    supplier: 'Bukit Rembulan Stationery Sdn Bhd',
    address: ['G-14, Plaza Contoh', 'Kota Kinabalu, Sabah'],
    invoiceNo: 'BR-004219',
    issuedDaysAgo: 4,
    dueInDays: null,
    dateStyle: 'dMonY',
    terms: 'Payment terms: 30 days',
    taxLabel: null,
    taxRate: 0,
    lines: [
      ['A4 paper 80 gsm (ream)', 60, rm(11.9)],
      ['Ballpoint pen, blue (box of 50)', 8, rm(17.5)],
      ['Stapler, heavy duty', 3, rm(28)],
      ['Toner cartridge, compatible', 2, rm(145)]
    ],
    case: 'No due date on the invoice',
    outcome: 'review',
    expectReasons: ['due_date_missing']
  },
  {
    id: 'teluk-pelita',
    layout: 'scan',
    supplier: 'Teluk Pelita Hardware',
    address: ['Lot 22, Jalan Pelabuhan', 'Lahad Datu, Sabah'],
    invoiceNo: 'TPH-90127',
    issuedDaysAgo: 15,
    dueInDays: 15,
    dateStyle: 'dMonY',
    terms: 'Net 30 days',
    taxLabel: null,
    taxRate: 0,
    lines: [
      ['Cement, 50 kg bag', 100, rm(18.4)],
      ['Steel bar 12 mm x 6 m', 40, rm(31)],
      ['Exterior paint, 18 L pail', 6, rm(215)]
    ],
    case: 'Photo of a paper invoice: goes to a person',
    outcome: 'scan',
    expectReasons: ['scan']
  }
]
