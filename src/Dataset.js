import { serverToDate } from './format/date'
import {
  webpackReducer,
  compose,
} from './util'

export default class Dataset {
  request() {
    this.convert = this.converter()
    return Promise.all([
      this.requestData(),
      this.requestInfo(),
    ])
  }

  requestData() {
    return new Promise((resolve) => {
      window.dataCallback = (webpackModule) => {
        delete window.dataCallback
        resolve(
          this.convert(
            this.ejectData(webpackModule, 'history'),
          ),
        )
      }

      const cache = (new Date()).getTime()
      const script = document.createElement('script')
      script.src = `/api/dataset.php?type=data&dc=${cache}`
      document.head.appendChild(script)
    })
  }

  requestInfo() {
    return new Promise((resolve) => {
      window.infoCallback = (webpackModule) => {
        delete window.infoCallback
        resolve(
          serverToDate(
            this.ejectData(webpackModule, 'updateTime'),
          ),
        )
      }

      const cache = (new Date()).getTime()
      const script = document.createElement('script')
      script.src = `/api/dataset.php?type=info&dc=${cache}`
      document.head.appendChild(script)
    })
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
      date: serverToDate(item.date),
    }))
  }
}