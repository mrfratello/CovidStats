import axios from 'axios'
import { serverToDate, serverShortToDate } from './format/date'
import {
  webpackReducer,
  compose,
} from './util'

export default class Dataset {
  location = 'ru'

  request() {
    this.convert = this.converter()
    return Promise.all([
      this.requestData(),
      this.requestInfo(),
    ])
  }

  requestData() {
    return axios.get(`/api/json/history.${this.location}.json`)
      .then((responce) => this.convert(responce.data))
  }

  requestInfo() {
    return axios.get(`/api/json/by-territory.${this.location}.json`)
      .then((responce) => responce.data.date)
      .then((date) => serverToDate(date))
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