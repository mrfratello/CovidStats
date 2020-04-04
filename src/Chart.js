import { max } from 'd3-array'
import { select } from 'd3-selection'
import { scaleBand, scaleLinear, scalePow } from 'd3-scale'
import { axisLeft, axisBottom } from 'd3-axis'
import { shortDate } from './format/date'
import Dataset from './Dataset'
import transition from './transition'
import {
  ALL_TYPE,
  PERIOD_TYPE,
  PERIOD_OFFSET_TYPE,
  ALL_SICKS_TYPE,
} from './constants'

const scaleByType = {
  [ALL_TYPE]: 'cases',
  [PERIOD_TYPE]: 'allDay',
  [PERIOD_OFFSET_TYPE]: 'allDay',
  [ALL_SICKS_TYPE]: 'moment',
}

const valueByType = {
  [ALL_TYPE]: (prop, item, scale) => scale(item[prop]),
  [PERIOD_TYPE]: (prop, item, scale) => scale(item[`${prop}Day`]),
  [PERIOD_OFFSET_TYPE]: (prop, item, scale) => scale(item[`${prop}Day`]),
  [ALL_SICKS_TYPE]: (prop, item, scale) => scale(item[`${prop}Moment`]),
}

export default class Chart {
  paddingLeft = 50
  paddingRight = 30
  paddingBottom = 30
  paddingTop = 10
  svg = null
  type = ALL_TYPE
  scaleType = 'linear'

  constructor(selector) {
    this.container = select(selector)
    this.updateSizes()

    const dataset = new Dataset()
    dataset.request()
      .then((data) => { this.render(data) })
  }

  updateSizes() {
    this.width = this.container.node().clientWidth
    this.height = this.container.node().clientHeight
    this.innerHeight = this.height - this.paddingBottom - this.paddingTop
    this.innerWidth = this.width - this.paddingLeft - this.paddingRight
  }

  initExtremums(data) {
    const cases = max(data, (item) => item.cases)
    const allDay = max(data.flatMap(
        (item) => [item.casesDay, item.deathsDay, item.recoverDay],
      ))
    const moment = max(data, (item) => item.casesMoment)
    this.max = {
      cases,
      allDay,
      moment,
    }
  }

  initScales(data) {
    const cases = scaleLinear()
      .domain([0, this.max.cases])
      .range([this.height - this.paddingBottom, this.paddingTop])

    const casesLog = scalePow()
      .exponent(0.4)
      .domain([0, this.max.cases])
      .range([this.height - this.paddingBottom, this.paddingTop])

    this.scale = cases
    this.scales = {
      time: scaleBand()
        .domain(data.map((item) => shortDate(item.date)))
        .range([this.paddingLeft, this.width - this.paddingRight])
        .padding(0.1),
      linear: {
        cases,
        allDay: cases.copy().domain([0, this.max.allDay]),
        moment: cases.copy().domain([0, this.max.moment]),
      },
      pow: {
        cases: casesLog,
        allDay: casesLog.copy().domain([0, this.max.allDay]),
        moment: casesLog.copy().domain([0, this.max.moment]),
      }
    }
  }

  renderAxis() {
    this.casesAxis = axisLeft()
      .tickSizeOuter(0)
      .scale(this.scale)

    this.svg.append('g')
      .classed('cases_axis', true)
      .attr('transform', `translate(${this.paddingLeft}, 0)`)
      .call(this.casesAxis)

    const ticksTime = 6
    const dataLength = this.dataset.length
    const divisorTime = Math.ceil(dataLength / ticksTime)
    const offsetIndexTime = Math.floor(dataLength % Math.floor(dataLength / divisorTime))
    const timeAxis = axisBottom()
      .scale(this.scales.time)
      .tickSize(0)
      .tickPadding(10)
      .tickFormat((value, i) => (
        (i + offsetIndexTime) % divisorTime
          ? ''
          : value
      ))

    this.svg.append('g')
      .attr('transform', `translate(0, ${this.height - this.paddingBottom})`)
      .call(timeAxis)
  }

  initBars() {
    this.cases = this.svg.append('g')
      .classed('cases', true)
    this.cases.selectAll('.caseBar')
      .data(this.dataset, ({ date }) => date)
      .enter()
      .append('rect')
        .classed('caseBar', true)
        .attr('x', ({ date }) => this.scales.time(shortDate(date)))
        .attr('y', () => this.scale.range()[0])
        .attr('width', this.scales.time.bandwidth())
        .attr('height', () => 0)

    this.recover = this.svg.append('g')
      .classed('recover', true)
    this.recover.selectAll('.recoverBar')
      .data(this.dataset, ({ date }) => date)
      .enter()
      .append('rect')
        .classed('recoverBar', true)
        .attr('x', ({ date }) => this.scales.time(shortDate(date)))
        .attr('y', () => this.scale.range()[0])
        .attr('width', this.scales.time.bandwidth())
        .attr('height', () => 0)

    this.deaths = this.svg.append('g')
      .classed('deaths', true)
    this.deaths.selectAll('.deathsBar')
      .data(this.dataset, ({ date }) => date)
      .enter()
      .append('rect')
        .classed('deathsBar', true)
        .attr('x', ({ date }) => this.scales.time(shortDate(date)))
        .attr('y', () => this.scale.range()[0])
        .attr('width', this.scales.time.bandwidth())
        .attr('height', () => 0)
  }

  render(data) {
    this.dataset = data
    this.svg = this.container
      .html('')
      .append('svg')
      .classed('chart', true)
      .style('height', this.height)
      .style('width', this.width)
    this.initExtremums(data)
    this.initScales(data)
    this.renderAxis()
    this.initBars()
    this.updateBars()
  }

  updateBars() {
    const value = valueByType[this.type]
    this.cases.selectAll('.caseBar')
      .data(this.dataset, ({ date }) => date)
      .transition(transition)
      .attr('y', (item) => value('cases', item, this.scale))
      .attr('height', (item) => this.height - this.paddingBottom - value('cases', item, this.scale))
    this.recover.selectAll('.recoverBar')
      .data(this.dataset, ({ date }) => date)
      .transition(transition)
      .attr('y', (item) => value('recover', item, this.scale))
      .attr('height', (item) => this.height - this.paddingBottom - value('recover', item, this.scale))
    this.deaths.selectAll('.deathsBar')
      .data(this.dataset, ({ date }) => date)
      .transition(transition)
      .attr('y', (item) => value('deaths', item, this.scale))
      .attr('height', (item) => this.height - this.paddingBottom - value('deaths', item, this.scale))
  }

  updateAxis() {
    this.casesAxis.scale(this.scale)
    this.svg.select('.cases_axis')
      .transition(transition)
      .call(this.casesAxis)
  }

  update() {
    this.scale = this.scales[this.scaleType][scaleByType[this.type]]
    this.updateAxis()
    this.updateBars()
  }

  setType(type) {
    this.type = type
    this.update()
  }

  setScaleType(scaleType) {
    this.scaleType = scaleType
    this.update()
  }
}
