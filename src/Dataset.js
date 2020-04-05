import { serverToDate } from './format/date'
import {
  webpackReducer,
  compose,
} from './util'

export default class Dataset {
  request() {
    this.convert = this.converter()
    return new Promise((resolve) => {
      window.test = (webpackModule) => {
        resolve(this.ejectData(webpackModule))
      }

      const script = document.createElement('script')
      script.src = '/api/dataset.php?callback=test'
      document.head.appendChild(script)
    })
  }

  ejectData(webpackModule) {
    delete window.test
    const intermediate = {}

    webpackModule(null, intermediate, webpackReducer)
    return this.convert(intermediate.history())
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