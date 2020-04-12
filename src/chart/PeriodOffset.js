import { axisBottom } from 'd3-axis'
import { shortDate } from '../format/date'
import transition from '../transition'

export class PeriodOffset {
  offsetDays = 13

  constructor(chart) {
    this.chart = chart
    this.svg = this.chart.svg

    this.axes = axisBottom()
      .tickSize(chart.timeAxes.tickSize())
      .tickPadding(chart.timeAxes.tickPadding())
    this.axesBox = this.svg
      .select('.time_axes')
      .clone(true)
        .classed('time_axes', false)
        .classed('offset_time_axes', true)
  }

  update() {
    this.updateAxes()
    this.updateBars()
  }

  updateAxes() {
    this.scale = this.chart.timeAxes
      .scale()
      .copy()

    this.axes
      .scale(this.scale)
      .tickFormat(this.chart.timeAxes.tickFormat())

    this.xOffset =  -this.offsetDays * this.scale.bandwidth() / (1 - this.scale.padding())
    this.yOffset = this.chart.height - this.chart.marginBottom + 30

    this.axesBox
      .interrupt()
      .transition(transition)
      .attr('transform', `translate(0, ${this.yOffset})`)
      .transition(transition)
      .attr('transform', `translate(${this.xOffset }, ${this.yOffset})`)
      .call(this.axes)
  }

  updateBars() {
    const bandWidth = this.scale.bandwidth() / 2
    const xScale = this.chart.scale
    this.chart.cases.selectAll('.caseBar')
      .transition(transition)
      .attr('width', bandWidth)
    this.chart.recover.selectAll('.recoverBar')
      .transition(transition)
      .attr('x', ({ date }) => this.scale(shortDate(date)) + bandWidth)
      .attr('width', bandWidth)
      .transition(transition)
      .attr('y', (item) => this.scale(item.deathsDay))
      .attr('y', (item) => xScale(item.recoverDay + item.deathsDay))
      .attr('height', (item) => xScale(item.deathsDay) - xScale(item.recoverDay + item.deathsDay))
      .attr('transform', `translate(${this.xOffset }, 0)`)
    this.chart.deaths.selectAll('.deathsBar')
      .transition(transition)
      .attr('x', ({ date }) => this.scale(shortDate(date)) + bandWidth)
      .attr('width', bandWidth)
      .transition(transition)
      .attr('transform', `translate(${this.xOffset }, 0)`)
  }

  destroy() {
    this.axesBox
      .transition(transition)
      .attr('transform', `translate(0, ${this.chart.height - this.chart.marginBottom + 30})`)
      .transition(transition)
      .attr('transform', `translate(0, ${this.chart.height - this.chart.marginBottom})`)
      .remove()

    const bandWidth = this.scale.bandwidth()
    this.chart.cases.selectAll('.caseBar')
      .transition(transition)
      .attr('width', bandWidth)
    this.chart.recover.selectAll('.recoverBar')
      .transition(transition)
      .attr('transform', `translate(0, 0)`)
    this.chart.deaths.selectAll('.deathsBar')
      .transition(transition)
      .attr('transform', `translate(0, 0)`)

  }
}

PeriodOffset.type = 'period_offset'

export default PeriodOffset
