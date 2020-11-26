import type { EnrichHistory, HistoryDay, HistoryMoment, History } from './types'

export const ALL_TYPE = 'all'
export const PERIOD_TYPE = 'period'
export const ALL_SICKS_TYPE = 'allSicks'

type TProp = keyof Pick<History, 'cases' | 'recover' | 'deaths'>

export const valueByType = {
  [ALL_TYPE]: (prop: TProp, item: EnrichHistory): number => item[prop],
  [PERIOD_TYPE]: (prop: TProp, item: EnrichHistory): number =>
    item[`${prop}Day` as keyof HistoryDay],
  [ALL_SICKS_TYPE]: (prop: TProp, item: EnrichHistory): number =>
    item[`${prop}Moment` as keyof HistoryMoment],
}
