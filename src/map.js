import { selectAll, select } from 'd3-selection'
import './format'
import './ui/navbar'
import './ui/dropdown'
import { Territory as TerritoryChart } from './chart/Territory'
import { Region as RegionChart } from './chart/Region'
import MapTimelapse from './timelapse/Map'

const regionChart = new RegionChart('region-chart')
const territoryChart = new TerritoryChart('territory-chart', regionChart)
const compositeType = ['confirmed', '']

// eslint-disable-next-line no-new
new MapTimelapse(
  document.getElementById('confirmed-timelapse'),
  territoryChart,
  selectAll('.showTypeBtn'),
)

selectAll('.showType0Btn').on('change', function () {
  compositeType[0] = this.dataset.value
  territoryChart.setType(compositeType.join(''))
})
selectAll('.showType1Btn').on('change', function () {
  compositeType[1] = this.dataset.value
  territoryChart.setType(compositeType.join(''))
})

selectAll('.setViewBtn').on('click', function () {
  const view = this.dataset.value
  if (view === 'full') {
    territoryChart.setFullProjection()
  }
  if (view === 'europe') {
    territoryChart.setEuropeProjection()
  }
})

selectAll('.regionTypeBtn').on('click', function () {
  const type = this.dataset.value
  selectAll('.regionTypeBtn').each(function () {
    select(this).classed('active', this.dataset.value === type)
  })
  regionChart.setType(type)
})
