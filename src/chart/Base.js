import { select } from 'd3-selection'
import { debounce } from '../util'
import { fullDate } from '../format/date'
import Tooltip from '../Tooltip'

export default class Base {
  marginLeft = 50
  marginRight = 30
  marginBottom = 30
  marginTop = 42
  svg = null

  constructor(id) {
    this.container = select(`#${id}`)
    this.updateSizes()
    this.initSvg()

    const onResize = debounce(() => {
      this.onResize()
    }, 400)

    select(window).on(`resize.${id}`, () => { onResize() })
    this.tooltip = new Tooltip(this.container)
  }

  updateSizes() {
    this.width = this.container.node().clientWidth
    this.height = this.container.node().clientHeight
    this.innerHeight = this.height - this.marginBottom - this.marginTop
    this.innerWidth = this.width - this.marginLeft - this.marginRight
  }

  initSvg() {
    this.svg = this.container
      .append('svg')
      .classed('chart', true)
      .style('height', this.height)
      .style('width', this.width)
  }

  renderInfo(updateTime) {
    this.updateText = this.svg
      .append('text')
      .classed('updateTime', true)
      .attr('x', this.marginLeft + 10)
      .attr('y', this.marginTop + 20)
      .text(`Обновлено ${fullDate(updateTime)}`)
  }

  onResize() {
    this.updateSizes()
    this.svg
      .style('height', this.height)
      .style('width', this.width)
  }
}