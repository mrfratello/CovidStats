export interface HistoryTerritory {
  date: string
  confirmed: number
}

export interface HistoryDto {
  date: string
  cases: number
  recover: number
  deaths: number
}

export interface History {
  date: Date
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

export interface InfoDataDto {
  date: string
  items: Record<string, unknown>[]
}

export interface InfoData {
  date: Date
  items: Record<string, unknown>[]
}

export interface Data {
  updateDate: Date
  data: EnrichHistory[]
  regions: InfoData['items']
}
