export const ALL_TYPE = 'all'
export const PERIOD_TYPE = 'period'
export const ALL_SICKS_TYPE = 'allSicks'

export const valueByType = {
  [ALL_TYPE]: (prop, item) => item[prop],
  [PERIOD_TYPE]: (prop, item) => item[`${prop}Day`],
  [ALL_SICKS_TYPE]: (prop, item) => item[`${prop}Moment`],
}

export const DYNAMIC_TYPE = 'dynamic'
export const TOTAL_TYPE = 'total'

export const OFFSET_VALUES = {
  13: '2 недели',
  14: '15 дней',
  15: '16 дней',
  16: '17 дней',
  17: '18 дней',
  18: '19 дней',
  19: '20 дней',
  20: '3 недели',
  21: '22 дня',
  22: '23 дня',
  23: '24 дня',
  24: '25 дней',
  25: '26 дней',
  26: '27 дней',
  27: '4 недели',
}
