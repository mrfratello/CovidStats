import axios from 'axios'
import { select } from 'd3-selection'
import { serverToDate, serverShortToDate, cacheDate } from './format/date'
import {
  webpackReducer,
  compose,
} from './util'

class Dataset {
  location = 'ru'
  waiting = null
  cache = cacheDate(Date.now())

  constructor() {
    this.convertHistory = this.converter()
    this.waiting = this.request()
  }

  getAll() {
    return !this.waiting
      ? Promise.reject('Request not started')
      : this.waiting
  }

  request() {
    const body = select('body')
      .classed('loaded', false)

    return Promise.all([
      this.requestData(),
      this.requestInfo(),
    ])
      .then(([data, info]) => ({
        data,
        updateDate: info.date,
        regions: info.items,
      }))
      .finally(() => {
        body.classed('loaded', true)
      })
  }

  requestData() {
    return axios.get(`/api/json/history.${this.location}.json`, {
      params: { cache: this.cache },
    })
      .then((response) => this.convertHistory(response.data))
  }

  requestInfo() {
    return axios.get(`/api/json/by-territory.${this.location}.json`, {
      params: { cache: this.cache },
    })
      .then(({ data }) => ({
        ...data,
        date: serverToDate(data.date),
      }))
  }

  ejectData(webpackModule, method) {
    const intermediate = {}

    webpackModule(null, intermediate, webpackReducer)
    return intermediate[method]()
  }

  converter() {
    return compose(
      this.getPeriodParams,
      this.getCasesInMoment,
      this.formatDate
    )
  }

  getPeriodParams(data) {
    return data.reduce(
      (res, item) => {
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
      },
      data.slice(0, 1),
    )
      .slice(1)
  }

  getCasesInMoment(data) {
    return data.map((item) => ({
      ...item,
      casesMoment: item.cases - (item.recover + item.deaths),
      recoverMoment: 0,
      deathsMoment: 0,
    }))
  }

  formatDate(data) {
    return data.map((item) => ({
      ...item,
      date: serverShortToDate(item.date),
    }))
  }
}

export default new Dataset()
