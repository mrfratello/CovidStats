import { max } from 'd3-array'
import { select } from 'd3-selection'
import { scaleBand, scaleLinear } from 'd3-scale'
import { axisLeft, axisBottom } from 'd3-axis'
import { shortDate } from './format/date'
import transition from './transition'

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
    this.innerHeight = this.height - this.paddingBottom - this.paddingTop
    this.innerWidth = this.width - this.paddingLeft - this.paddingRight
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
        .range([this.paddingLeft, this.width - this.paddingRight])
        .padding(0.1),
      cases: scaleLinear()
        .domain([0, this.max.cases])
        .range([this.height - this.paddingBottom, this.paddingTop]),
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

  initBars() {
    this.cases = this.svg.append('g')
      .classed('cases', true)
    this.cases.selectAll('.caseBar')
      .data(this.dataset, ({ date }) => date)
      .enter()
      .append('rect')
        .classed('caseBar', true)
        .attr('x', ({ date }) => this.scale.time(shortDate(date)))
        .attr('y', () => this.scale.cases.range()[0])
        .attr('width', this.scale.time.bandwidth())
        .attr('height', () => 0)

    this.recover = this.svg.append('g')
      .classed('recover', true)
    this.recover.selectAll('.recoverBar')
      .data(this.dataset, ({ date }) => date)
      .enter()
      .append('rect')
        .classed('recoverBar', true)
        .attr('x', ({ date }) => this.scale.time(shortDate(date)))
        .attr('y', () => this.scale.cases.range()[0])
        .attr('width', this.scale.time.bandwidth())
        .attr('height', () => 0)

    this.deaths = this.svg.append('g')
      .classed('deaths', true)
    this.deaths.selectAll('.deathsBar')
      .data(this.dataset, ({ date }) => date)
      .enter()
      .append('rect')
        .classed('deathsBar', true)
        .attr('x', ({ date }) => this.scale.time(shortDate(date)))
        .attr('y', () => this.scale.cases.range()[0])
        .attr('width', this.scale.time.bandwidth())
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
    this.update()
  }

  update() {
    this.cases.selectAll('.caseBar')
      .data(this.dataset, ({ date }) => date)
      .transition(transition)
      .attr('y', ({ cases }) => this.scale.cases(cases))
      .attr('height', ({ cases }) => this.height - this.paddingBottom - this.scale.cases(cases))
    this.recover.selectAll('.recoverBar')
      .data(this.dataset, ({ date }) => date)
      .transition(transition)
      .attr('y', ({ recover }) => this.scale.cases(recover))
      .attr('height', ({ recover }) => this.height - this.paddingBottom - this.scale.cases(recover))
    this.deaths.selectAll('.deathsBar')
      .data(this.dataset, ({ date }) => date)
      .transition(transition)
      .attr('y', ({ deaths }) => this.scale.cases(deaths))
      .attr('height', ({ deaths }) => this.height - this.paddingBottom - this.scale.cases(deaths))
  }
}
