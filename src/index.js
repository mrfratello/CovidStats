import { selectAll, select } from 'd3-selection'
import './format'
import './ui/navbar'
import './ui/scrollLink'
import { Simple as SimpleChart } from './chart/Simple'
import { PeriodOffset as PeriodChart } from './chart/PeriodOffset'

function renderSimpleChart() {
  const simpleChart = new SimpleChart('chart')

  selectAll('.scaleTypeBtn').on('click', function () {
    const scaleType = this.dataset.value
    selectAll('.scaleTypeBtn').each(function () {
      select(this).classed('active', this.dataset.value === scaleType)
    })
    simpleChart.setScaleType(scaleType)
  })

  selectAll('.chartTypeBtn').on('click', function () {
    const chartType = this.dataset.value
    selectAll('.chartTypeBtn').each(function () {
      select(this).classed('active', this.dataset.value === chartType)
    })
    selectAll('.typeDescription').each(function () {
      select(this).classed('active', this.dataset.type === chartType)
    })
    simpleChart.setType(chartType)
  })
}

function renderPeriodChart() {
  const periodChart = new PeriodChart('period-offset-chart')

  selectAll('.periodOffsetChartTypeBtn').on('click', function () {
    const chartType = this.dataset.value
    selectAll('.periodOffsetChartTypeBtn').each(function () {
      select(this).classed('active', this.dataset.value === chartType)
    })
    selectAll('.offsetTypeDescription').each(function () {
      select(this).classed('active', this.dataset.type === chartType)
    })
    periodChart.onUpdateType(chartType)
  })

  const offsetLabel = select('label[for=lossPercentChartOffset]')
  select('.lossPercentChartOffset')
    .on('change', function () {
      periodChart.onUpdateLossPercent(+this.value)
    })
    .on('input', function () {
      offsetLabel.html(`Доля неучтенных вылечившихся <em>${this.value}%</em>`)
    })
}

renderSimpleChart()
renderPeriodChart()
