import './webVitals'
import { selectAll, select } from 'd3-selection'
import './format'
import './ui/navbar'
import './ui/scrollLink'
import { Simple as SimpleChart } from './chart/Simple'
import type { SimpleChartType, SimpleScaleType } from './chart/Simple'
import { PeriodOffset as PeriodChart } from './chart/PeriodOffset'
import type { PeriosOffsetChartType } from './chart/PeriodOffset'

function renderSimpleChart() {
  const simpleChart = new SimpleChart('chart')

  selectAll<HTMLButtonElement, unknown>('.scaleTypeBtn').on(
    'click',
    function () {
      const scaleType = this.dataset.value as SimpleScaleType
      selectAll<HTMLButtonElement, unknown>('.scaleTypeBtn').each(function () {
        select(this).classed('active', this.dataset.value === scaleType)
      })
      simpleChart.setScaleType(scaleType)
    },
  )

  selectAll<HTMLButtonElement, unknown>('.chartTypeBtn').on(
    'click',
    function () {
      const chartType = this.dataset.value as SimpleChartType
      selectAll<HTMLButtonElement, unknown>('.chartTypeBtn').each(function () {
        select(this).classed('active', this.dataset.value === chartType)
      })
      selectAll<HTMLParagraphElement, unknown>('.type-description').each(
        function () {
          select(this).classed('active', this.dataset.type === chartType)
        },
      )
      simpleChart.setType(chartType)
    },
  )
}

function renderPeriodChart() {
  const periodChart = new PeriodChart('period-offset-chart')

  selectAll<HTMLButtonElement, unknown>('.periodOffsetChartTypeBtn').on(
    'click',
    function () {
      const chartType = this.dataset.value as PeriosOffsetChartType
      selectAll<HTMLButtonElement, unknown>('.periodOffsetChartTypeBtn').each(
        function () {
          select(this).classed('active', this.dataset.value === chartType)
        },
      )
      selectAll<HTMLParagraphElement, unknown>('.offset-type-description').each(
        function () {
          select(this).classed('active', this.dataset.type === chartType)
        },
      )
      periodChart.onUpdateType(chartType)
    },
  )

  const offsetLabel = select<HTMLLabelElement, unknown>(
    'label[for=lossPercentChartOffset]',
  )
  select<HTMLInputElement, unknown>('.lossPercentChartOffset')
    .on('change', function () {
      periodChart.onUpdateLossPercent(+this.value)
    })
    .on('input', function () {
      offsetLabel.html(`Доля неучтенных вылечившихся <em>${this.value}%</em>`)
    })
}

renderSimpleChart()
renderPeriodChart()
