import 'd3-transition'
import { max } from 'd3-array'
import { select } from 'd3-selection'
import { scaleBand, scaleLinear, scaleTime } from 'd3-scale'
import { axisRight, axisBottom } from 'd3-axis'
import { format } from 'd3-format'
import type { Selection, EnterElement } from 'd3-selection'
import { area } from 'd3-shape'
import type { Axis } from 'd3-axis'
import type { ScaleLinear, ScaleBand, ScaleTime } from 'd3-scale'
import type { Area } from 'd3-shape'
import type { D3ZoomEvent } from 'd3-zoom'
import { shortDate, serverShortToDate } from '../format/date'
import { humanInt } from '../format/number'
import { Base } from './Base'

import type {
  RegionData,
  HistoryTerritory,
  RegionDataInfoTypes,
} from '../types'

interface RegionHistory extends Pick<HistoryTerritory, 'date' | 'confirmed'> {
  confirmedInc: number
  dateTime: Date
}

type GroupBarSelection = Selection<SVGGElement, unknown, HTMLElement, unknown>
type PathSelection = Selection<
  SVGPathElement,
  RegionHistory[],
  HTMLElement,
  unknown
>

type BarSelection = Selection<
  SVGRectElement,
  RegionHistory,
  SVGGElement,
  unknown
>
type EnterBarSelection = Selection<
  EnterElement,
  RegionHistory,
  SVGGElement,
  unknown
>

export type RegionViewType = 'full' | 'inc'

const int = format(',d')

export class Region extends Base {
  marginTop = 18

  maxTickWidth = 60

  private suffix: 'Inc' | '' = 'Inc'

  private history: RegionHistory[] = []

  private popup: Selection<HTMLElement, unknown, HTMLElement, unknown>

  private box: Selection<HTMLElement, unknown, HTMLElement, unknown>

  private title: Selection<HTMLElement, unknown, HTMLElement, unknown>

  private description: Selection<HTMLElement, unknown, HTMLElement, unknown>

  private countScale: ScaleLinear<number, number> = scaleLinear()

  private timeScale: ScaleBand<string> = scaleBand()

  private timeLinearScale: ScaleTime<number, number> = scaleTime()

  private countAxis: Axis<number> = axisRight<number>(this.countScale)

  private countAxisBox?: Selection<SVGGElement, unknown, HTMLElement, unknown>

  private timeAxis: Axis<string> = axisBottom<string>(scaleBand())

  private timeAxisBox?: Selection<SVGGElement, unknown, HTMLElement, unknown>

  private overBarsGroup?: GroupBarSelection

  private confirmedBarsGroup?: GroupBarSelection

  private confirmedArea: Area<RegionHistory> = area()

  private confirmedPath?: PathSelection

  private _didSet = false

  constructor(selector: string) {
    super(selector)

    this.initScales()
    this.box = select('#region-chart-box')
    this.popup = select('#region-popup')
    this.title = this.box.select('.region-title')
    this.description = this.box.select('.region-description')

    this.popup.select('.close').on('click', () => {
      this.hide()
    })

    this.renderAxes()
    this.renderBars()
  }

  public setDataset(data: RegionData): void {
    this.renderData(data)
    this.prepareDataset(data.history)
    this.updateDomains()

    setTimeout(() => {
      this.updateAxes()
      this.updateBars()
      if (!this._didSet) {
        this.box.classed('hide-controls', false)
        this._didSet = true
      }
    }, 500)
  }

  public show(): Promise<this> {
    this.popup.classed('show', true)

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this)
      }, 400)
    })
  }

  public hide(): void {
    this.popup.classed('show', false)
  }

  public setType(type: RegionViewType): void {
    this.suffix = type === 'full' ? '' : 'Inc'

    this.updateDomains()
    this.updateAxes()
    this.updateBars()
  }

  private prepareDataset(history: HistoryTerritory[]): void {
    const initial: RegionHistory[] = [
      {
        ...history[0],
        confirmedInc: 0,
        dateTime: new Date(),
      },
    ]
    this.history = history
      .reduce<RegionHistory[]>((res, item) => {
        const prev = res[res.length - 1]
        const inc = item.confirmed - prev.confirmed
        const dateTime = serverShortToDate(item.date)!
        res.push({
          dateTime,
          date: shortDate(dateTime),
          confirmed: item.confirmed,
          confirmedInc: inc >= 0 ? inc : 0,
        })
        return res
      }, initial)
      .slice(1)
  }

  private renderData(data: RegionData): void {
    this.title.html(data.territoryName)
    this.description.classed('text-center', false).html(`
        <span class="cases">${this.getTooltipValue(
          data,
          'confirmed',
        )}</span>&nbsp;
        <span class="recover">${this.getTooltipValue(
          data,
          'recovered',
        )}</span>&nbsp;
        <span class="deaths">${this.getTooltipValue(
          data,
          'deaths',
        )}</span>&nbsp;
        <br>
        <small>
          На каждые 100 000 человек приходится
          <span class="cases"><strong>${this.getTooltipValue(
            data,
            'confirmedRelative',
          )}</strong> заразившихся</span>
          и
          <span class="deaths"><strong>${this.getTooltipValue(
            data,
            'deathsRelative',
          )}</strong> умерших</span>
        </small>
      `)
  }

  private getTooltipValue(data: RegionData, type: RegionDataInfoTypes): string {
    let value = int(data[type])
    if (type !== 'confirmedRelative' && type !== 'deathsRelative') {
      const inc = data[`${type}Inc`]
      value += ` (+${int(inc)})`
    }
    return value
  }

  private getHistory() {
    return this.history
  }

  private renderAxes(): void {
    this.countAxis.tickSizeOuter(0).tickFormat(humanInt)
    this.countAxisBox = this.svg
      .append<SVGGElement>('g')
      .classed('count_axis', true)

    this.timeAxis.tickSize(0).tickPadding(10)
    this.timeAxisBox = this.svg.append('g').classed('time_axis', true)
  }

  private updateAxes(): void {
    this.countAxis.scale(this.countScale)

    this.countAxisBox
      ?.transition('base')
      .attr('transform', `translate(${this.marginLeft + this.innerWidth!}, 0)`)
      .call(this.countAxis)

    const tickTextOverBars = Math.ceil(
      this.maxTickWidth / this.timeScale.bandwidth(),
    )
    const dataLength = this.history.length
    const ticksTime = Math.floor(dataLength / tickTextOverBars)
    const divisorTime = Math.ceil(dataLength / ticksTime)

    this.timeAxis
      .scale(this.timeScale)
      .tickFormat((value, i) =>
        (dataLength - i - 1) % divisorTime ? '' : value,
      )
    this.timeAxisBox
      ?.transition('base')
      .attr(
        'transform',
        `translate(0, ${Number(this.height) - this.marginBottom})`,
      )
      .call(this.timeAxis)
  }

  private initScales(): void {
    this.countScale.range([
      Number(this.height) - this.marginBottom,
      this.marginTop,
    ])
    this.timeScale
      .padding(0.1)
      .range([this.marginLeft, Number(this.width) - this.marginRight])

    this.timeLinearScale.range([
      this.marginLeft,
      Number(this.width) - this.marginRight,
    ])
  }

  private renderBars(): void {
    this.overBarsGroup = this.svg
      .append('g')
      .attr('clip-path', `url(#clip-${this.id})`)

    this.overBarsGroup
      .selectAll<SVGRectElement, RegionHistory>('.overBar')
      .data(this.history, ({ date }) => date)
      .join((enter) => this._enterOvers(enter))

    this.confirmedBarsGroup = this.svg
      .append('g')
      .classed('cases', true)
      .attr('clip-path', `url(#clip-${this.id})`)

    this.confirmedPath = this.confirmedBarsGroup
      .append('path')
      .classed('caseArea', true)
      .datum<RegionHistory[]>([])
      .attr('d', this.confirmedArea)
  }

  private updateDomains() {
    const maxCount =
      max(this.history.map((item) => item[`confirmed${this.suffix}`])) ?? 1

    this.countScale.domain([0, maxCount])
    this.timeScale.domain(this.history.map((item) => item.date))
    this.timeLinearScale.domain([
      this.history[0].dateTime,
      this.history[this.history.length - 1].dateTime,
    ])
  }

  private updateRanges() {
    this.countScale.range([
      Number(this.height) - this.marginBottom,
      this.marginTop,
    ])
    this.timeScale.range([
      this.marginLeft,
      Number(this.width) - this.marginRight,
    ])
    this.timeLinearScale.range([
      this.marginLeft,
      Number(this.width) - this.marginRight,
    ])
  }

  private updateBars(): void {
    this.overBarsGroup
      ?.selectAll<SVGRectElement, RegionHistory>('.overBar')
      .data(this.history, ({ date }) => date)
      .join((enter) => this._enterOvers(enter))
      .call(this._updateOvers.bind(this))

    this.confirmedArea
      .x((d) => this.timeLinearScale(d.dateTime))
      .y0((d) => this.countScale(d[`confirmed${this.suffix}`]))
      .y1(() => this.countScale.range()[0])
    this.confirmedPath
      ?.datum(this.history)
      .transition('base')
      .attr('d', this.confirmedArea)
  }

  private zoomBars(): void {
    this.overBarsGroup
      ?.selectAll<SVGRectElement, RegionHistory>('.overBar')
      .call(this._zoomBars.bind(this))
  }

  private _enterOvers(enter: EnterBarSelection) {
    const me = this

    return enter
      .append('rect')
      .classed('overBar', true)
      .on('mouseover', function (_event, data) {
        const rect = select(this)
        const history = me.getHistory()
        const index = history.indexOf(data)
        const width = me.width ?? NaN
        me.tooltip.show({
          data: {
            cases: data[`confirmed${me.suffix}`],
            recover: null,
            deaths: null,
          },
          right:
            index > history.length / 2
              ? `${width - (+rect.attr('x') + +rect.attr('width'))}px`
              : 'auto',
          left: index <= history.length / 2 ? `${rect.attr('x')}px` : 'auto',
        })
      })
      .on('mouseout', () => {
        me.tooltip.hide()
      })
  }

  private _updateOvers(update: BarSelection) {
    return update
      .attr('x', ({ date }) => this.timeScale(date) ?? null)
      .attr('width', this.timeScale.bandwidth())
      .attr('y', () => this.countScale.range()[1])
      .attr('height', () => this.innerHeight ?? null)
  }

  private _zoomBars(update: BarSelection) {
    return update
      .attr('x', ({ date }) => this.timeScale(date) ?? null)
      .attr('width', this.timeScale.bandwidth())
  }

  protected onResize(): void {
    super.onResize()

    this.updateRanges()
    this.updateAxes()
    this.updateBars()
  }

  public onZoom(event: D3ZoomEvent<SVGElement, unknown>): void {
    if (!this._didSet) return
    const range = [
      this.marginLeft,
      Number(this.width) - this.marginRight,
    ].map((item) => event.transform.applyX(item))
    this.timeScale.range(range)
    this.timeAxisBox?.call(this.timeAxis)

    this.zoomBars()
  }
}
