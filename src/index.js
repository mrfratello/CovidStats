import './format'
import { serverToDate } from './format/date'
import Chart from './Chart'
import './style/main.scss'

const chart = new Chart('#chart')

fetch('./data.json')
  .then((response) => response.json())
  .then((data) => data
    .reduce(
      (res, item) => {
        const prev = res[res.length - 1]
        return [
          ...res,
          {
            ...item,
            casesDay: item.cases - prev.cases,
            deathsDay: item.deaths - prev.deaths,
            recoverDay: item.recover - prev.recover,
          }
        ]
      },
      data.slice(0, 1),
    )
    .slice(1)
    .map((item) => ({
      ...item,
      date: serverToDate(item.date),
    }))
  )
  .then((data) => chart.render(data))
