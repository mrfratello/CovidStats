import { select } from 'd3-selection'
import { zoom } from 'd3-zoom'
import { debounce } from '../util'
import { fullDate } from '../format/date'
import Tooltip from '../Tooltip'

export default class Base {
  marginLeft = 30
  marginRight = 50
  marginBottom = 30
  marginTop = 42
  svg = null

  constructor(id) {
    this.id = id
    this.container = select(`#${id}`)
    this.updateSizes()
    this.initSvg()
    this.initZoom()

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

    this.defs = this.svg.append('defs')
    this.clipPath = this.defs.append('clipPath')
      .attr('id', `clip-${this.id}`)
      .append('rect')
        .attr('width', this.innerWidth)
        .attr('height', this.height)
        .attr('x', this.marginLeft)
        .attr('y', 0)
  }

  initZoom() {
    const me = this
    const extent = [
      [this.marginLeft, this.marginTop],
      [this.width - this.marginRight, this.height - this.marginBottom],
    ]
    this.zoom = zoom()
      .scaleExtent([1, 6])
      .translateExtent(extent)
      .extent(extent)
      .on(`zoom.${this.id}`, function() {
        me.onZoom()
      })

    this.svg.call(this.zoom)
  }

  updateZoom() {
    const extent = [
      [this.marginLeft, this.marginTop],
      [this.width - this.marginRight, this.height - this.marginBottom],
    ]
    this.zoom
      .translateExtent(extent)
      .extent(extent)
  }

  resetZoom() {
    this.zoom.translateTo(this.svg, 0, 0)
    this.zoom.scaleTo(this.svg, 1)
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
    this.updateZoom()
    this.resetZoom()
    this.svg
      .style('height', this.height)
      .style('width', this.width)
    this.clipPath
      .attr('width', this.innerWidth)
      .attr('height', this.height)
      .attr('x', this.marginLeft)
  }

  onZoom() {}
}