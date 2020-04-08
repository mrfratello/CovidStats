import { max } from 'd3-array'
import { select } from 'd3-selection'
import { scaleBand, scaleLinear, scalePow } from 'd3-scale'
import { axisLeft, axisBottom } from 'd3-axis'
import { shortDate } from './format/date'
import Dataset from './Dataset'
import Tooltip from './Tooltip'
import transition from './transition'
import {
  ALL_TYPE,
  PERIOD_TYPE,
  PERIOD_OFFSET_TYPE,
  ALL_SICKS_TYPE,
  valueByType,
} from './constants'

const scaleByType = {
  [ALL_TYPE]: 'cases',
  [PERIOD_TYPE]: 'allDay',
  [PERIOD_OFFSET_TYPE]: 'allDay',
  [ALL_SICKS_TYPE]: 'moment',
}

export default class Chart {
  marginLeft = 50
  marginRight = 30
  marginBottom = 30
  marginTop = 42
  svg = null
  type = ALL_TYPE
  scaleType = 'linear'

  constructor(selector) {
    this.container = select(selector)
    this.updateSizes()

    const dataset = new Dataset()
    dataset.request()
      .then((data) => { this.render(data) })

    this.tooltip = new Tooltip(this.container)
  }

  updateSizes() {
    this.width = this.container.node().clientWidth
    this.height = this.container.node().clientHeight
    this.innerHeight = this.height - this.marginBottom - this.marginTop
    this.innerWidth = this.width - this.marginLeft - this.marginRight
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
      .range([this.height - this.marginBottom, this.marginTop])

    const casesLog = scalePow()
      .exponent(0.4)
      .domain([0, this.max.cases])
      .range([this.height - this.marginBottom, this.marginTop])

    this.scale = cases
    this.scales = {
      time: scaleBand()
        .domain(data.map((item) => shortDate(item.date)))
        .range([this.marginLeft, this.width - this.marginRight])
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
      .attr('transform', `translate(${this.marginLeft}, 0)`)
      .call(this.casesAxis)

    const maxTickWidth = 35
    const tickTextOverBars = Math.ceil(maxTickWidth / this.scales.time.bandwidth())
    const dataLength = this.dataset.length
    const ticksTime = Math.floor(dataLength / tickTextOverBars)
    const divisorTime = Math.ceil(dataLength / ticksTime)
    const timeAxis = axisBottom()
      .scale(this.scales.time)
      .tickSize(0)
      .tickPadding(10)
      .tickFormat((value, i) => (
        (dataLength - i - 1) % divisorTime
          ? ''
          : value
      ))

    this.svg.append('g')
      .attr('transform', `translate(0, ${this.height - this.marginBottom})`)
      .call(timeAxis)
  }

  initBars() {
    const me = this
    this.overBars = this.svg
      .append('g')
        .selectAll('.overBar')
        .data(this.dataset, ({ date }) => date)
        .enter()
        .append('rect')
          .classed('overBar', true)
          .attr('x', ({ date }) => this.scales.time(shortDate(date)))
          .attr('y', () => this.scale.range()[1])
          .attr('width', this.scales.time.bandwidth())
          .attr('height', () => this.innerHeight)
          .on('mouseover', function(data, index) {
            const rect = select(this)
            me.tooltip.show({
              data,
              right: index > me.dataset.length / 2,
              type: me.type,
              rect: {
                left: +rect.attr('x'),
                right: me.width - (+rect.attr('x') + +rect.attr('width')),
              }
            })
          })
          .on('mouseout', () => {
            me.tooltip.hide()
          })

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
    this.container.select('.loading')
      .remove()
    this.svg = this.container
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
      .attr('y', (item) => this.scale(value('cases', item)))
      .attr('height', (item) => this.height - this.marginBottom - this.scale(value('cases', item)))
    this.recover.selectAll('.recoverBar')
      .data(this.dataset, ({ date }) => date)
      .transition(transition)
      .attr('y', (item) => this.scale(value('recover', item)))
      .attr('height', (item) => this.height - this.marginBottom - this.scale(value('recover', item)))
    this.deaths.selectAll('.deathsBar')
      .data(this.dataset, ({ date }) => date)
      .transition(transition)
      .attr('y', (item) => this.scale(value('deaths', item)))
      .attr('height', (item) => this.height - this.marginBottom - this.scale(value('deaths', item)))
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
