import { max } from 'd3-array'
import { select } from 'd3-selection'
import { scaleBand, scaleLinear, scalePow } from 'd3-scale'
import { axisRight, axisBottom } from 'd3-axis'
import { shortDate } from '../format/date'
import dataset from '../Dataset'
import BaseChart from './Base'
import transition from '../transition'
import {
  ALL_TYPE,
  ALL_SICKS_TYPE,
  valueByType,
} from '../constants'

export default class Chart extends BaseChart {
  type = ALL_TYPE
  scaleType = 'linear'
  maxTickWidth = 35

  constructor(selector) {
    super(selector)
    this.initScales()

    dataset.getAll()
      .then(({ data, updateDate }) => {
        this.render(data)
        this.renderInfo(updateDate)
      })
  }

  render(data) {
    this.pureDataset = data

    this.prepareDataset()
    this.updateDomains()
    this.renderAxes()
    this.updateAxes()
    this.renderBars()
    this.updateBars()
  }

  prepareDataset() {
    this.dataset = this.pureDataset
      .map((item) => ({
        date: item.date,
        shortDate: shortDate(item.date),
        cases: valueByType[this.type]('cases', item),
        deaths: valueByType[this.type]('deaths', item),
        recover: valueByType[this.type]('recover', item),
      }))

    this.maxCount = max(
      this.dataset.flatMap(
        (item) => [item.cases, item.deaths, item.recover],
      ),
    )
  }

  initScales() {
    this.linearScale = scaleLinear()
      .range([this.height - this.marginBottom, this.marginTop])

    this.powScale = scalePow()
      .exponent(0.4)
      .range([this.height - this.marginBottom, this.marginTop])

    this.timeScale = scaleBand()
      .padding(0.1)
      .range([this.marginLeft, this.width - this.marginRight])

    this.countScale = this[`${this.scaleType}Scale`]
  }

  updateDomains() {
    this.linearScale.domain([0, this.maxCount])
    this.powScale.domain([0, this.maxCount])
    this.timeScale.domain(this.dataset.map((item) => item.shortDate))
  }

  updateRanges() {
    this.linearScale.range([this.height - this.marginBottom, this.marginTop])
    this.powScale.range([this.height - this.marginBottom, this.marginTop])
    this.timeScale.range([this.marginLeft, this.width - this.marginRight])
  }

  renderAxes() {
    this.countAxis = axisRight()
      .tickSizeOuter(0)

    this.countAxisBox = this.svg.append('g')
      .classed('cound_axis', true)
      .attr('transform', `translate(${this.width - this.marginRight}, 0)`)

    this.timeAxis = axisBottom()
      .tickSize(0)
      .tickPadding(10)

    this.timeAxisBox = this.svg.append('g')
      .classed('time_axis', true)
      .attr('transform', `translate(0, ${this.height - this.marginBottom})`)
  }

  updateAxes() {
    this.countAxis.scale(this.countScale)
    this.countAxisBox
      .transition(transition)
      .attr('transform', `translate(${this.width - this.marginRight}, 0)`)
      .call(this.countAxis)

    const tickTextOverBars = Math.ceil(this.maxTickWidth / this.timeScale.bandwidth())
    const dataLength = this.dataset.length
    const ticksTime = Math.floor(dataLength / tickTextOverBars)
    const divisorTime = Math.ceil(dataLength / ticksTime)

    this.timeAxis
      .scale(this.timeScale)
      .tickFormat((value, i) => (
        (dataLength - i - 1) % divisorTime
          ? ''
          : value
      ))

    this.timeAxisBox
      .transition(transition)
      .attr('transform', `translate(0, ${this.height - this.marginBottom})`)
      .call(this.timeAxis)
  }

  getDataValue(property, dataItem) {
    return valueByType[this.type](property, dataItem)
  }

  renderBars() {
    this.overBars = this.svg.append('g')

    this.overBars.selectAll('.overBar')
      .data(this.dataset, ({ shortDate }) => shortDate)
      .join(
        (enter) => this._enterOvers(enter),
      )
      .call(this._updateOvers.bind(this))

    this.cases = this.svg.append('g')
      .classed('cases', true)
    this.cases.selectAll('.caseBar')
      .data(this.dataset, ({ shortDate }) => shortDate)
      .enter()
      .append('rect')
        .classed('caseBar', true)
        .call(this._enterCountBars.bind(this))

    this.recover = this.svg.append('g')
      .classed('recover', true)
    this.recover.selectAll('.recoverBar')
      .data(this.dataset, ({ shortDate }) => shortDate)
      .enter()
      .append('rect')
        .classed('recoverBar', true)
        .call(this._enterCountBars.bind(this))

    this.deaths = this.svg.append('g')
      .classed('deaths', true)
    this.deaths.selectAll('.deathsBar')
      .data(this.dataset, ({ shortDate }) => shortDate)
      .enter()
      .append('rect')
        .classed('deathsBar', true)
        .call(this._enterCountBars.bind(this))
  }

  updateBars() {
    this.overBars.selectAll('.overBar')
      .data(this.dataset, ({ date }) => date)
      .call(this._updateOvers.bind(this))

    this.cases.selectAll('.caseBar')
      .data(this.dataset, ({ date }) => date)
      .call(this._updateCountBars.bind(this), 'cases')
    this.recover.selectAll('.recoverBar')
      .data(this.dataset, ({ date }) => date)
      .call(this._updateCountBars.bind(this), 'recover')
    this.deaths.selectAll('.deathsBar')
      .data(this.dataset, ({ date }) => date)
      .call(this._updateCountBars.bind(this), 'deaths')
  }

  _enterOvers(enter) {
    const me = this
    return enter.append('rect')
      .classed('overBar', true)
      .on('mouseover', function(data, index) {
        const rect = select(this)
        me.tooltip.show({
          data: {
            cases: data.cases,
            recover: me.type !== ALL_SICKS_TYPE
              ? data.recover
              : null,
            deaths: me.type !== ALL_SICKS_TYPE
              ? data.deaths
              : null,
          },
          right: index > me.dataset.length / 2
            ? me.width - (+rect.attr('x') + +rect.attr('width')) + 'px'
            : 'auto',
          left: index <= me.dataset.length / 2
            ? rect.attr('x') + 'px'
            : 'auto',
        })
      })
      .on('mouseout', () => {
        me.tooltip.hide()
      })
  }

  _updateOvers(update) {
    return update
      .attr('x', ({ shortDate }) => this.timeScale(shortDate))
      .attr('width', this.timeScale.bandwidth())
      .attr('y', this.countScale.range()[1])
      .attr('height', this.innerHeight)
  }

  _enterCountBars(enter) {
    return enter
      .attr('x', ({ shortDate }) => this.timeScale(shortDate))
      .attr('width', this.timeScale.bandwidth())
      .attr('y', this.countScale.range()[0])
      .attr('height', 0)
  }

  _updateCountBars(update, property) {
    return update
      .transition(transition)
      .attr('x', ({ shortDate }) => this.timeScale(shortDate))
      .attr('width', this.timeScale.bandwidth())
      .attr('y', (item) => this.countScale(item[property]))
      .attr('height', (item) => this.countScale(0) - this.countScale(item[property]))
  }

  onUpdateOptions() {
    this.updateDomains()
    this.updateAxes()
    this.updateBars()
  }

  setType(type) {
    this.type = type
    this.prepareDataset()
    this.onUpdateOptions()
  }

  setScaleType(scaleType) {
    this.scaleType = scaleType
    this.countScale = this[`${this.scaleType}Scale`]
    this.onUpdateOptions()
  }

  onResize() {
    super.onResize()

    this.updateRanges()
    this.updateAxes()
    this.updateBars()
  }
}
