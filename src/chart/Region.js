import { max } from 'd3-array'
import { select } from 'd3-selection'
import { scaleBand, scaleLinear } from 'd3-scale'
import { axisRight, axisBottom } from 'd3-axis'
import { format } from 'd3-format'
import { shortDate, serverShortToDate } from '../format/date'
import BaseChart from './Base'
import transition from '../transition'

const int = format(',d')

export default class RegionChart extends BaseChart {
  marginTop = 18
  maxTickWidth = 35
  history = []

  constructor(selector) {
    super(selector)
    this.updateSizes()
    this.box = select('#region-chart-box')
    this.title = this.box.select('.region-title')
    this.description = this.box.select('.region-description')

    this.renderAxes()
    this.renderBars()
  }

  getHistory() {
    return this.history
  }

  renderAxes() {
    this.countAxis = axisRight()
      .tickSizeOuter(0)
    this.countAxisBox = this.svg.append('g')
      .classed('count_axis', true)

    this.timeAxis = axisBottom()
      .tickSize(0)
      .tickPadding(10)
    this.timeAxisBox = this.svg.append('g')
      .classed('time_axis', true)
  }

  updateAxes() {
    this.countAxis.scale(this.countScale)

    this.countAxisBox
      .transition(transition)
      .attr('transform', `translate(${this.marginLeft + this.innerWidth}, 0)`)
      .call(this.countAxis)

    const tickTextOverBars = Math.ceil(this.maxTickWidth / this.timeScale.bandwidth())
    const dataLength = this.history.length
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

  renderBars() {
    this.overBars = this.svg.append('g')

    this.confirmedBars = this.svg.append('g')
      .classed('cases', true)
  }

  setDataset(data) {
    this.renderData(data)
    this.prepareDataset(data.history)
    this.updateScales()
    this.updateAxes()
    this.updateBars()
  }

  renderData(data) {
    this.title.html(data.territoryName)
    this.description
      .classed('text-center', false)
      .html(`
        <span class="cases">${this.getTooltipValue(data, 'confirmed')}</span>&nbsp;
        <span class="recover">${this.getTooltipValue(data, 'recovered')}</span>&nbsp;
        <span class="deaths">${this.getTooltipValue(data, 'deaths')}</span>&nbsp;
      `)
  }

  getTooltipValue(data, type) {
    let value = int(data[type])
    const inc = data[`${type}Inc`]
    if (inc) {
      value += ` (+${int(inc)})`
    }
    return value
  }

  prepareDataset(history) {
    this.history = history
      .reduce((res, item) => {
        const prev = res[res.length - 1]
        res.push({
          date: serverShortToDate(item.date),
          confirmed: item.confirmed,
          confirmedInc: item.confirmed - prev.confirmed,
        })
        return res
      }, history.slice(0, 1))
      .slice(1)
    this.maxConfirmed = max(this.history.map((item) => item.confirmed))
  }

  updateScales() {
    this.countScale = scaleLinear()
      .domain([0, this.maxConfirmed])
      .range([this.height - this.marginBottom, this.marginTop])
    this.timeScale = scaleBand()
      .domain(this.history.map((item) => shortDate(item.date)))
      .range([this.marginLeft, this.width - this.marginRight])
      .padding(0.1)
  }

  updateBars() {
    this.overBars.selectAll('.overBar')
      .data(this.history, ({ date }) => date)
      .join(
        (enter) => this._enterOvers(enter),
        (update) => update,
        (exit) => exit.remove(),
      )
      .call(this._updateBars.bind(this))
      .attr('y', () => this.countScale.range()[1])
      .attr('height', () => this.innerHeight)

    this.confirmedBars.selectAll('.caseBar')
      .data(this.history, ({ date }) => date)
      .join(
        (enter) => this._enterCases(enter),
        (update) => update,
        (exit) => exit
          .transition(transition)
          .attr('x', ({ date }) => this.timeScale(shortDate(date)) + this.width)
          .remove()
      )
      .transition(transition)
      .call(this._updateBars.bind(this))
      .attr('y', (item) => this.countScale(item.confirmed))
      .attr('height', (item) => this.countScale(0) - this.countScale(item.confirmed))
  }

  _enterOvers(enter) {
    const me = this

    return enter.append('rect')
      .classed('overBar', true)
      .on('mouseover', function(data, index) {
        const rect = select(this)
        const history = me.getHistory()
        me.tooltip.show({
          data: {
            cases: data.confirmed,
            recover: null,
            deaths: null,
          },
          right: index > history.length / 2
            ? me.width - (+rect.attr('x') + +rect.attr('width')) + 'px'
            : 'auto',
          left: index <= history.length / 2
            ? rect.attr('x') + 'px'
            : 'auto',
        })
      })
      .on('mouseout', () => {
        me.tooltip.hide()
      })
  }

  _enterCases(enter) {
    return enter.append('rect')
      .classed('caseBar', true)
      .attr('x', ({ date }) => this.timeScale(shortDate(date)))
      .attr('y', () => this.countScale.range()[0])
      .attr('width', this.timeScale.bandwidth())
      .attr('height', 0)
  }

  _updateBars(update) {
    return update
      .attr('x', ({ date }) => this.timeScale(shortDate(date)))
      .attr('width', this.timeScale.bandwidth())
  }

  onResize() {
    super.onResize()

    this.updateScales()
    this.updateAxes()
    this.updateBars()
  }
}