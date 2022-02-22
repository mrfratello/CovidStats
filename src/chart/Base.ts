import { select } from 'd3-selection'
import type { Selection } from 'd3-selection'
import { zoom } from 'd3-zoom'
import type { D3ZoomEvent, ZoomBehavior } from 'd3-zoom'
import ResizeObserver from 'resize-observer-polyfill'
import { debounce } from '../util'
import { fullDate } from '../format/date'
import { Tooltip } from '../Tooltip'

export abstract class Base {
  protected width?: number

  protected height?: number

  protected innerWidth?: number

  protected innerHeight?: number

  protected marginLeft = 30

  protected marginRight = 50

  protected marginBottom = 30

  protected marginTop = 42

  protected container: Selection<HTMLElement, unknown, HTMLElement, unknown>

  protected svg: Selection<SVGSVGElement, unknown, HTMLElement, unknown>

  protected tooltip: Tooltip

  protected defs?: Selection<SVGDefsElement, unknown, HTMLElement, unknown>

  protected clipPath?: Selection<SVGRectElement, unknown, HTMLElement, unknown>

  protected zoom?: ZoomBehavior<SVGSVGElement, unknown>

  abstract onZoom(event: D3ZoomEvent<SVGElement, unknown>): void

  constructor(protected id: string) {
    this.id = id
    this.container = select(`#${id}`)
    this.svg = this.container.append('svg')
    this.updateSizes()
    this.initSvg()
    this.initZoom()

    this.initResizer()
    this.tooltip = new Tooltip(this.container)
  }

  private updateSizes() {
    this.width = this.container.node()?.clientWidth
    this.height = this.container.node()?.clientHeight
    this.innerHeight = Number(this.height) - this.marginBottom - this.marginTop
    this.innerWidth = Number(this.width) - this.marginLeft - this.marginRight
  }

  private initSvg() {
    this.svg
      .classed('chart', true)
      .attr('viewBox', `0, 0, ${this.width}, ${this.height}`)

    this.defs = this.svg.append('defs')
    this.clipPath = this.defs
      .append('clipPath')
      .attr('id', `clip-${this.id}`)
      .append('rect')
      .attr('width', this.innerWidth ?? 0)
      .attr('height', this.height ?? 0)
      .attr('x', this.marginLeft)
      .attr('y', 0)
  }

  private initZoom() {
    const extent: [[number, number], [number, number]] = [
      [this.marginLeft, this.marginTop],
      [
        Number(this.width) - this.marginRight,
        Number(this.height) - this.marginBottom,
      ],
    ]
    this.zoom = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 1])
      .translateExtent(extent)
      .extent(extent)
      .on(`zoom.${this.id}`, (event) => {
        this.onZoom(event)
      })

    this.svg.call(this.zoom)
  }

  protected updateZoom(): void {
    const extent: [[number, number], [number, number]] = [
      [this.marginLeft, this.marginTop],
      [
        Number(this.width) - this.marginRight,
        Number(this.height) - this.marginBottom,
      ],
    ]
    this.zoom?.translateExtent(extent).extent(extent)
  }

  protected resetZoom(): void {
    this.zoom?.translateTo(this.svg, 0, 0)
    this.zoom?.scaleTo(this.svg, 1)
  }

  private initResizer() {
    const onResize = debounce(() => {
      this.onResize()
    }, 400)

    select(window).on(`resize.${this.id}`, () => {
      onResize()
    })

    const resizer = new ResizeObserver(() => {
      onResize()
    })
    const containerNode = this.container.node()
    if (containerNode) {
      resizer.observe(containerNode)
    }
  }

  protected renderInfo(updateTime: Date): void {
    this.svg
      .append('text')
      .classed('update-time', true)
      .attr('x', this.marginLeft + 10)
      .attr('y', this.marginTop + 20)
      .text(`Обновлено ${fullDate(updateTime)}`)
  }

  protected onResize(): void {
    this.updateSizes()
    this.updateZoom()
    this.resetZoom()
    this.svg.attr('viewBox', `0, 0, ${this.width}, ${this.height}`)
    this.clipPath
      ?.attr('width', this.innerWidth ?? 0)
      .attr('height', this.height ?? 0)
      .attr('x', this.marginLeft)
  }
}
