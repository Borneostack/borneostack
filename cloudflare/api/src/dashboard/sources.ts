// The five public datasets the dashboard follows. Every id below was called on api.data.gov.my and returned rows.
// A source can need two requests (Sabah, then Malaysia as the comparison); each request is small on purpose.
export type SeriesDef = { id: string; label: string; geo: string; unit: string; decimals: number }

export type Point = { series: string; date: string; value: number }

export type RequestDef = {
  endpoint: 'data-catalogue' | 'opendosm'
  dataset: string
  filter?: string
  include: string
  // Newest rows first, so `limit` is the number of most recent rows.
  historyLimit: number
  recentLimit: number
  // Turn the API's rows into points. Rows with a missing value are skipped by the caller.
  map: (row: Record<string, unknown>) => { series: string; value: unknown }[]
}

export type SourceDef = {
  id: string
  title: string
  publisher: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  pageUrl: string
  note: string
  series: SeriesDef[]
  requests: RequestDef[]
}

export const LICENCE = {
  name: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
  url: 'https://creativecommons.org/licenses/by/4.0/',
  // Wording copied from the licence line on each dataset page on data.gov.my and open.dosm.gov.my.
  statement: 'This data is made open under the Creative Commons Attribution 4.0 International License (CC BY 4.0).'
}

const col = (column: string, series: string) => (row: Record<string, unknown>) => [{ series, value: row[column] }]

export const SOURCES: SourceDef[] = [
  {
    id: 'fuel',
    title: 'Fuel prices',
    publisher: 'Ministry of Finance',
    frequency: 'weekly',
    pageUrl: 'https://data.gov.my/data-catalogue/fuelprice',
    note:
      'General retail prices announced each week. Prices under the subsidy schemes (BUDI 95 and SKPS petrol, BUDI Diesel) are separate columns in the dataset and are not shown here.',
    series: [
      { id: 'fuel.ron95', label: 'RON95 petrol', geo: 'Malaysia', unit: 'RM per litre', decimals: 2 },
      { id: 'fuel.ron97', label: 'RON97 petrol', geo: 'Malaysia', unit: 'RM per litre', decimals: 2 },
      { id: 'fuel.diesel', label: 'Diesel, East Malaysia', geo: 'East Malaysia', unit: 'RM per litre', decimals: 2 }
    ],
    requests: [
      {
        endpoint: 'data-catalogue',
        dataset: 'fuelprice',
        filter: 'level@series_type',
        include: 'date,ron95,ron97,diesel_eastmsia',
        historyLimit: 600,
        recentLimit: 8,
        map: row => [
          { series: 'fuel.ron95', value: row.ron95 },
          { series: 'fuel.ron97', value: row.ron97 },
          { series: 'fuel.diesel', value: row.diesel_eastmsia }
        ]
      }
    ]
  },
  {
    id: 'fx',
    title: 'US dollar in ringgit',
    publisher: 'Bank Negara Malaysia',
    frequency: 'daily',
    pageUrl: 'https://data.gov.my/data-catalogue/exchangerates_daily_1700',
    note: "Bank Negara Malaysia's end-of-day reference rate, set at 5 pm on each working day: the middle of its buying and selling rates. Higher means a weaker ringgit.",
    series: [{ id: 'fx.usd', label: 'RM per US dollar', geo: 'Malaysia', unit: 'RM per USD', decimals: 3 }],
    requests: [
      {
        endpoint: 'data-catalogue',
        dataset: 'exchangerates_daily_1700',
        filter: 'middle@rate_type',
        include: 'date,usd',
        historyLimit: 520,
        recentLimit: 10,
        map: col('usd', 'fx.usd')
      }
    ]
  },
  {
    id: 'inflation',
    title: 'Consumer price inflation',
    publisher: 'Department of Statistics Malaysia',
    frequency: 'monthly',
    pageUrl: 'https://open.dosm.gov.my/data-catalogue/cpi_state_inflation',
    note: 'Change in the consumer price index, all goods and services, compared with the same month a year earlier.',
    series: [
      { id: 'cpi.sabah', label: 'Sabah', geo: 'Sabah', unit: '% on a year earlier', decimals: 1 },
      { id: 'cpi.malaysia', label: 'Malaysia', geo: 'Malaysia', unit: '% on a year earlier', decimals: 1 }
    ],
    requests: [
      {
        endpoint: 'opendosm',
        dataset: 'cpi_state_inflation',
        filter: 'Sabah@state,overall@division',
        include: 'date,inflation_yoy',
        historyLimit: 200,
        recentLimit: 6,
        map: col('inflation_yoy', 'cpi.sabah')
      },
      {
        endpoint: 'opendosm',
        dataset: 'cpi_headline_inflation',
        filter: 'overall@division',
        include: 'date,inflation_yoy',
        historyLimit: 190,
        recentLimit: 6,
        map: col('inflation_yoy', 'cpi.malaysia')
      }
    ]
  },
  {
    id: 'labour',
    title: 'Unemployment rate',
    publisher: 'Department of Statistics Malaysia',
    frequency: 'quarterly',
    pageUrl: 'https://open.dosm.gov.my/data-catalogue/lfs_qtr_state',
    note: 'Unemployed people as a share of the labour force, from the quarterly Labour Force Survey.',
    series: [
      { id: 'lfs.sabah', label: 'Sabah', geo: 'Sabah', unit: '% of labour force', decimals: 1 },
      { id: 'lfs.malaysia', label: 'Malaysia', geo: 'Malaysia', unit: '% of labour force', decimals: 1 }
    ],
    requests: [
      {
        endpoint: 'opendosm',
        dataset: 'lfs_qtr_state',
        filter: 'Sabah@state',
        include: 'date,u_rate',
        historyLimit: 100,
        recentLimit: 6,
        map: col('u_rate', 'lfs.sabah')
      },
      {
        endpoint: 'opendosm',
        dataset: 'lfs_qtr',
        include: 'date,u_rate',
        historyLimit: 39,
        recentLimit: 6,
        map: col('u_rate', 'lfs.malaysia')
      }
    ]
  },
  {
    id: 'gdp',
    title: 'Economic output (GDP)',
    publisher: 'Department of Statistics Malaysia',
    frequency: 'yearly',
    pageUrl: 'https://data.gov.my/data-catalogue/gdp_state_real_supply',
    note: 'Gross domestic product at constant 2015 prices. State figures come from the state-level dataset, the Malaysia comparison from the national one.',
    series: [
      { id: 'gdp.sabah.growth', label: 'Sabah', geo: 'Sabah', unit: '% on a year earlier', decimals: 1 },
      { id: 'gdp.malaysia.growth', label: 'Malaysia', geo: 'Malaysia', unit: '% on a year earlier', decimals: 1 },
      { id: 'gdp.sabah.level', label: 'Sabah GDP', geo: 'Sabah', unit: 'RM million, 2015 prices', decimals: 0 }
    ],
    requests: [
      {
        endpoint: 'data-catalogue',
        dataset: 'gdp_state_real_supply',
        filter: 'Sabah@state,p0@sector',
        include: 'date,value,series',
        historyLimit: 60,
        recentLimit: 6,
        map: row =>
          row.series === 'growth_yoy'
            ? [{ series: 'gdp.sabah.growth', value: row.value }]
            : row.series === 'abs'
              ? [{ series: 'gdp.sabah.level', value: row.value }]
              : []
      },
      {
        endpoint: 'data-catalogue',
        dataset: 'gdp_annual_real_supply',
        filter: 'p0@sector',
        include: 'date,value,series',
        historyLimit: 60,
        recentLimit: 6,
        map: row => (row.series === 'growth_yoy' ? [{ series: 'gdp.malaysia.growth', value: row.value }] : [])
      }
    ]
  }
]

export const sourceById = (id: string) => SOURCES.find(s => s.id === id)
