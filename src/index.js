import { selectAll, select } from 'd3-selection'
import './format'
import { OFFSET_VALUES } from './constants'
import SimpleChart from './chart/Simple'
import PeriodChart from './chart/PeriodOffset'
import './style/main.scss'

const simpleChart = new SimpleChart('chart')
const periodChart = new PeriodChart('period-offset-chart')

selectAll('.scaleTypeBtn')
  .on('click', function() {
    const scaleType = this.dataset.value
    selectAll('.scaleTypeBtn')
      .each(function() {
        select(this).classed('active', this.dataset.value === scaleType)
      })
    simpleChart.setScaleType(scaleType)
  })

selectAll('.chartTypeBtn')
  .on('click', function() {
    const chartType = this.dataset.value
    selectAll('.chartTypeBtn')
      .each(function() {
        select(this).classed('active', this.dataset.value === chartType)
      })
    selectAll('.typeDescription')
      .each(function() {
        select(this).classed('active', this.dataset.type === chartType)
      })
    simpleChart.setType(chartType)
  })

selectAll('.periodOffsetChartTypeBtn')
  .on('click', function() {
    const chartType = this.dataset.value
    selectAll('.periodOffsetChartTypeBtn')
      .each(function() {
        select(this).classed('active', this.dataset.value === chartType)
      })
    periodChart.onUpdateType(chartType)
  })

selectAll('.periodOffsetChartOffsetBtn')
  .on('click', function() {
    const chartOffset = this.dataset.value
    selectAll('.periodOffsetChartOffsetBtn')
      .each(function() {
        select(this).classed('active', this.dataset.value === chartOffset)
      })
    periodChart.onUpdateOffset(chartOffset)
  })

const offsetLabel = select('label[for=periodOffsetChartOffset]')
select('.periodOffsetChartOffset')
  .on('change', function() {
    periodChart.onUpdateOffset(+this.value)
  })
  .on('input', function() {
    offsetLabel.html(`Смещение на <em>${OFFSET_VALUES[this.value]}</em>`)
  })
