import { max } from 'd3-array'
import { select } from 'd3-selection'
import { scaleBand, scaleLinear } from 'd3-scale'
import { axisLeft, axisBottom } from 'd3-axis'
import { shortDate } from './format/date'

export default class Chart {
  paddingLeft = 50
  paddingRight = 30
  paddingBottom = 30
  paddingTop = 10
  svg = null

  constructor(selector) {
    this.container = select(selector)
    this.updateSizes()
  }

  updateSizes() {
    this.width = this.container.node().clientWidth
    this.height = this.container.node().clientHeight
  }

  initExtremums(data) {
    const cases = max(data, (item) => item.cases)
    const allDay = max(data.flatMap(
        (item) => [item.casesDay, item.deathsDay, item.recoverDay],
      ))
    this.max = {
      cases,
      allDay,
    }
  }

  initScales(data) {
    this.scale = {
      time: scaleBand()
        .domain(data.map((item) => shortDate(item.date)))
        .range([this.paddingLeft, this.width - this.paddingRight]),
      cases: scaleLinear()
        .domain([0, this.max.cases])
        .range([this.height - this.paddingBottom, this.paddingTop])
    }
  }

  renderAxis() {
    const casesAxis = axisLeft()
      .scale(this.scale.cases)

    this.svg.append('g')
      .attr('transform', `translate(${this.paddingLeft}, 0)`)
      .call(casesAxis)

    const timeAxis = axisBottom()
      .scale(this.scale.time)
      .ticks(0)

    this.svg.append('g')
      .attr('transform', `translate(0, ${this.height - this.paddingBottom})`)
      .call(timeAxis)
  }

  render(data) {
    this.svg = this.container
      .html('')
      .append('svg')
      .style('height', this.height)
      .style('width', this.width)
    this.initExtremums(data)
    this.initScales(data)
    this.renderAxis()
  }
}
