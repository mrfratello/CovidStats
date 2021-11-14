import axios from 'axios'
import { select } from 'd3-selection'
import { serverToDate, serverShortToDate, cacheDate } from './format/date'
import { compose } from './util'

import type {
  Data,
  InfoDataDto,
  InfoData,
  EnrichHistory,
  HistoryDto,
  History,
  HistoryMoment,
} from './types'

interface PromiseFn<T> {
  (): Promise<T>
}

interface IDataset {
  location: string

  getAll: PromiseFn<Data>
  requestData: PromiseFn<EnrichHistory[]>
  requestInfo: PromiseFn<InfoData>
}

class Dataset implements IDataset {
  public location = 'ru'

  private waiting: Promise<Data> | null = null

  private convertHistory: (data: History[]) => EnrichHistory[]

  private cache: string = cacheDate(new Date())

  constructor() {
    this.convertHistory = this.converter()
    this.waiting = this.request()
  }

  public getAll(): Promise<Data> {
    return this.waiting === null
      ? Promise.reject(new Error('Request not started'))
      : this.waiting
  }

  private request() {
    const body = select('body').classed('loaded', false)

    return Promise.all([this.requestData(), this.requestInfo()])
      .then(
        ([data, info]): Data => ({
          data,
          updateDate: info.date,
          regions: info.items,
        }),
      )
      .finally(() => {
        body.classed('loaded', true)
      })
  }

  public requestData() {
    return axios
      .get<History[]>(`/api/json/history.${this.location}.json`, {
        params: { cache: this.cache },
      })
      .then((response) => this.convertHistory(response.data))
  }

  public requestInfo() {
    return axios
      .get<InfoDataDto>(`/api/json/by-territory.${this.location}.json`, {
        params: { cache: this.cache },
      })
      .then(
        ({ data }): InfoData => ({
          ...data,
          date: serverToDate(data.date) ?? new Date(),
        }),
      )
  }

  private converter(): (data: History[]) => EnrichHistory[] {
    return compose(this.getPeriodParams, this.getCasesInMoment, this.formatDate)
  }

  private getPeriodParams(
    data: Array<History & HistoryMoment>,
  ): EnrichHistory[] {
    return data
      .reduce<EnrichHistory[]>((res, item) => {
        const prev = res[res.length - 1]
        return [
          ...res,
          {
            ...item,
            casesDay: item.cases - prev.cases,
            deathsDay: item.deaths - prev.deaths,
            recoverDay: item.recover - prev.recover,
          },
        ]
      }, data.slice(0, 1) as EnrichHistory[])
      .slice(1)
  }

  private getCasesInMoment(data: History[]): Array<History & HistoryMoment> {
    return data.map((item) => ({
      ...item,
      casesMoment: item.cases - (item.recover + item.deaths),
      recoverMoment: 0,
      deathsMoment: 0,
    }))
  }

  private formatDate(data: HistoryDto[]): History[] {
    return data.map((item) => ({
      ...item,
      date: serverShortToDate(item.date) ?? new Date(),
    }))
  }
}

export default new Dataset()
