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
