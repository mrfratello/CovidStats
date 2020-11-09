export interface HistoryTerritory {
  date: string
  confirmed: number
}

export interface History {
  date: string
  cases: number
  recover: number
  deaths: number
}

export interface HistoryDay {
  casesDay: number
  recoverDay: number
  deathsDay: number
}

export interface HistoryMoment {
  casesMoment: number
  recoverMoment: number
  deathsMoment: number
}

export interface EnrichHistory extends History, HistoryDay, HistoryMoment {}

export interface InfoData {
  date: string
  items: Array<Record<string, unknown>>
}
