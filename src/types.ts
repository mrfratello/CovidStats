export interface HistoryDto {
  date: string
  cases: number
  recover: number
  deaths: number
}

export interface History extends Omit<HistoryDto, 'date'> {
  date: Date
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

export type EnrichHistory = History & HistoryDay & HistoryMoment

export interface HistoryTerritory {
  date: string
  confirmed: number
  recover: number
  deaths: number
}

export interface RegionData {
  territoryName: string
  history: HistoryTerritory[]
  confirmed: number
  confirmedInc: number
  confirmedRelative: number
  deaths: number
  deathsInc: number
  deathsRelative: number
  recovered: number
  recoveredInc: number
}

export type RegionDataInfoTypes =
  | 'confirmed'
  | 'deaths'
  | 'recovered'
  | 'confirmedRelative'
  | 'deathsRelative'

export interface InfoDataDto {
  date: string
  items: RegionData[]
}

export interface InfoData extends Omit<InfoDataDto, 'date'> {
  date: Date
}

export interface Data {
  updateDate: Date
  data: EnrichHistory[]
  regions: InfoData['items']
}
