import './webVitals'
import { selectAll, select } from 'd3-selection'
import './format'
import './ui/navbar'
import './ui/dropdown'
import { Territory as TerritoryChart } from './chart/Territory'
import type {
  TerritoryViewType,
  TerritoryRelativeType,
} from './chart/Territory'
import { Region as RegionChart } from './chart/Region'
import type { RegionViewType } from './chart/Region'
import MapTimelapse from './timelapse/Map'

const regionChart = new RegionChart('region-chart')
const territoryChart = new TerritoryChart('territory-chart', regionChart)
let territoryView1: TerritoryViewType = 'confirmed'
let territoryView2: TerritoryRelativeType = ''

// eslint-disable-next-line no-new
new MapTimelapse(
  document.getElementById('confirmed-timelapse'),
  territoryChart,
  selectAll('.showTypeBtn'),
)

selectAll<HTMLButtonElement, unknown>('.showType0Btn').on(
  'change',
  function () {
    territoryView1 = this.dataset.value as TerritoryViewType
    territoryChart.setType(`${territoryView1}${territoryView2}`)
  },
)
selectAll<HTMLButtonElement, unknown>('.showType1Btn').on(
  'change',
  function () {
    territoryView2 = this.dataset.value as TerritoryRelativeType
    territoryChart.setType(`${territoryView1}${territoryView2}`)
  },
)

selectAll<HTMLButtonElement, unknown>('.setViewBtn').on('click', function () {
  const view = this.dataset.value
  if (view === 'full') {
    territoryChart.setFullProjection()
  }
  if (view === 'europe') {
    territoryChart.setEuropeProjection()
  }
})

selectAll<HTMLButtonElement, unknown>('.regionTypeBtn').on(
  'click',
  function () {
    const type = this.dataset.value as RegionViewType
    selectAll<HTMLButtonElement, unknown>('.regionTypeBtn').each(function () {
      select(this).classed('active', this.dataset.value === type)
    })
    regionChart.setType(type)
  },
)
