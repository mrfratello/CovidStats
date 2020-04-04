import { serverToDate } from './format/date'

export default class Dataset {
  request() {
    return fetch('./data.json')
      .then((response) => response.json())
      .then((data) => this.getPeriodParams(data))
      .then((data) => this.getCasesInMoment(data))
      .then((data) => this.formatDate(data))
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