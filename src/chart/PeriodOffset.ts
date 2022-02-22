import 'd3-transition'
import { select } from 'd3-selection'
import { max } from 'd3-array'
import { axisRight, axisBottom } from 'd3-axis'
import { scaleBand, scaleLinear, scaleTime } from 'd3-scale'
import type { Selection, EnterElement } from 'd3-selection'
import { area } from 'd3-shape'
import type { Area } from 'd3-shape'
import type { Axis } from 'd3-axis'
import type { ScaleLinear, ScaleBand, ScaleTime } from 'd3-scale'
import type { D3ZoomEvent } from 'd3-zoom'
import { humanInt } from '../format/number'
import { shortDate } from '../format/date'
import dataset from '../Dataset'
import { Base } from './Base'

import type { History, EnrichHistory } from '../types'

interface PeriodOffsetItem {
  date: Date
  recoveryPeriod: number
  activePatients: number
}

type GroupBarSelection = Selection<SVGGElement, unknown, HTMLElement, unknown>
type PathSelection = Selection<
  SVGPathElement,
  PeriodOffsetItem[],
  HTMLElement,
  unknown
>
type BarSelection = Selection<
  SVGRectElement,
  PeriodOffsetItem,
  SVGGElement,
  unknown
>
type BarEnterSelection = Selection<
  EnterElement,
  PeriodOffsetItem,
  SVGGElement,
  unknown
>

export type PeriosOffsetChartType = 'recoveryPeriod' | 'activePatients'

export class PeriodOffset extends Base {
  marginBottom = 80

  lossPercent = 1.04

  maxTickWidth = 60

  private type: PeriosOffsetChartType = 'activePatients'

  private pureDataset: History[] = []

  private dataset: PeriodOffsetItem[] = []

  private countScale: ScaleLinear<number, number> = scaleLinear()

  private timeScale: ScaleBand<string> = scaleBand()

  private timeLinearScale: ScaleTime<number, number> = scaleTime()

  private countAxis: Axis<number> = axisRight<number>(scaleLinear())

  private countAxisBox?: Selection<SVGGElement, unknown, HTMLElement, unknown>

  private timeAxis: Axis<string> = axisBottom<string>(scaleBand())

  private timeAxisBox?: Selection<SVGGElement, unknown, HTMLElement, unknown>

  private overBarsGroup?: GroupBarSelection

  private overBars?: BarSelection

  private offsetsGroup?: GroupBarSelection

  private offsetsArea: Area<PeriodOffsetItem> = area()

  private offsetsPath?: PathSelection

  constructor(selector: string) {
    super(selector)
    this.updateZoom()
    this.initScales()

    dataset.getAll().then(({ data, updateDate }) => {
      this.render(data)
      this.renderInfo(updateDate)
    })
  }

  private render(data: EnrichHistory[]): void {
    this.pureDataset = data.map((item) => ({
      date: item.date,
      cases: item.cases,
      recover: item.recover,
      deaths: item.deaths,
    }))
    this.prepareDataset()
    this.updateDomains()
    this.renderBars()
    this.renderAxes()
    this.updateBars()
    this.updateAxes()
  }

  private prepareDataset(): void {
    const startNotNullIndex = this.pureDataset.findIndex(
      (item) => item.recover + item.deaths > 10,
    )

    this.dataset = this.pureDataset
      .slice(startNotNullIndex)
      .map((item, index) => {
        const unCases = item.recover * this.lossPercent + item.deaths
        const recoveryPeriod = this.pureDataset
          .slice(0, index + startNotNullIndex)
          .reverse()
          .reduce(
            (res, subItem, subIndex) =>
              subItem.cases < unCases ? res : subIndex,
            0,
          )
        return {
          date: item.date,
          recoveryPeriod,
          activePatients: item.cases - Math.ceil(unCases),
        }
      })
  }

  private initScales(): void {
    this.countScale.range([
      Number(this.height) - this.marginBottom,
      this.marginTop,
    ])

    this.timeScale
      .range([this.marginLeft, Number(this.width) - this.marginRight])
      .padding(0.1)

    this.timeLinearScale.range([
      this.marginLeft,
      Number(this.width) - this.marginRight,
    ])
  }

  private updateDomains(): void {
    const maxCount =
      (max(this.dataset, (item) => item[this.type]) as number) * 1.05
    this.countScale.domain([0, maxCount]).nice()
    this.timeScale.domain(this.dataset.map((item) => shortDate(item.date)))
    this.timeLinearScale.domain([
      this.dataset[0].date,
      this.dataset[this.dataset.length - 1].date,
    ])
  }

  private updateRanges(): void {
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

  private renderAxes(): void {
    this.countAxis.tickSizeOuter(0).tickFormat(humanInt)

    this.countAxisBox = this.svg
      .append<SVGGElement>('g')
      .classed('count_axis', true)

    this.timeAxis.tickSize(0).tickPadding(10)

    this.timeAxisBox = this.svg
      .append<SVGGElement>('g')
      .classed('time_axis', true)
  }

  private updateAxes(): void {
    this.countAxis.scale(this.countScale)

    if (this.countAxisBox) {
      this.countAxisBox
        .transition('base')
        .attr(
          'transform',
          `translate(${this.marginLeft + this.innerWidth!}, 0)`,
        )
        .call(this.countAxis)
    }

    const tickTextOverBars = Math.ceil(
      this.maxTickWidth / this.timeScale.bandwidth(),
    )
    const dataLength = this.dataset.length
    const ticksTime = Math.floor(dataLength / tickTextOverBars)
    const divisorTime = Math.ceil(dataLength / ticksTime)

    this.timeAxis
      .scale(this.timeScale)
      .tickFormat((value, i) =>
        (dataLength - i - 1) % divisorTime ? '' : value,
      )
    if (this.timeAxisBox) {
      this.timeAxisBox
        .transition('base')
        .attr(
          'transform',
          `translate(0, ${Number(this.height) - this.marginBottom})`,
        )
        .call(this.timeAxis)
    }
  }

  private renderBars(): void {
    this.overBarsGroup = this.svg
      .append('g')
      .attr('clip-path', `url(#clip-${this.id})`)

    this.overBars = this.overBarsGroup
      .selectAll<SVGRectElement, PeriodOffsetItem>('.overBar')
      .data(this.dataset, (item) => item?.date.toDateString())
      .join((enter) => this._enterOvers(enter))

    this.offsetsGroup = this.svg
      .append('g')
      .classed('cases', true)
      .attr('clip-path', `url(#clip-${this.id})`)

    this.offsetsPath = this.offsetsGroup
      .append('path')
      .classed('caseArea', true)
      .datum<PeriodOffsetItem[]>([])
      .attr('d', this.offsetsArea)
  }

  private updateBars(): void {
    this.overBarsGroup
      ?.selectAll<SVGRectElement, PeriodOffsetItem>('.overBar')
      .data(this.dataset, ({ date }) => date.toDateString())
      .join(
        (enter) => this._enterOvers(enter),
        (update) => update,
        (exit) => exit.remove(),
      )
      .call(this.updateOvers.bind(this))

    this.offsetsArea
      .x((d) => this.timeLinearScale(d.date))
      .y0((d) => this.countScale(d[this.type]))
      .y1(() => this.countScale.range()[0])

    this.offsetsPath
      ?.datum(this.dataset)
      .transition('base')
      .attr('d', this.offsetsArea)
  }

  private zoomBars(): void {
    this.overBars
      ?.selectAll<SVGRectElement, PeriodOffsetItem>('.overBar')
      .attr('x', ({ date }) => this.timeScale(shortDate(date)) ?? null)
      .attr('width', this.timeScale.bandwidth())
  }

  private _enterOvers(enter: BarEnterSelection): BarSelection {
    const me = this

    return enter
      .append<SVGRectElement>('rect')
      .classed('overBar', true)
      .attr('x', ({ date }) => this.timeScale(shortDate(date)) ?? null)
      .attr('y', () => this.countScale.range()[1] ?? null)
      .attr('width', this.timeScale.bandwidth() ?? null)
      .attr('height', () => this.innerHeight ?? null)
      .on('mouseover', function (_event, data) {
        const index = me.dataset.indexOf(data)
        const rect = select(this)
        me.tooltip.show({
          data: {
            cases: data[me.type] < 0 ? 0 : data[me.type],
            recover: null,
            deaths: null,
          },
          right:
            index > me.dataset.length / 2
              ? `${
                  Number(me.width) - (+rect.attr('x') + +rect.attr('width'))
                }px`
              : 'auto',
          left: index <= me.dataset.length / 2 ? `${rect.attr('x')}px` : 'auto',
        })
      })
      .on('mouseout', () => {
        me.tooltip.hide()
      })
  }

  private updateOvers(update: BarSelection) {
    return update
      .attr('x', ({ date }) => this.timeScale(shortDate(date)) ?? null)
      .attr('width', this.timeScale.bandwidth())
      .attr('y', () => this.countScale.range()[1])
      .attr('height', this.innerHeight!)
  }

  public onResize(): void {
    super.onResize()

    this.updateRanges()
    this.updateAxes()
    this.updateBars()
  }

  private onUpdateOptions(): void {
    this.prepareDataset()
    this.updateDomains()
    this.updateAxes()
    this.updateBars()
  }

  public onUpdateType(type: PeriosOffsetChartType): void {
    this.type = type
    this.onUpdateOptions()
  }

  public onUpdateLossPercent(lossPercent: number): void {
    this.lossPercent = 1 + lossPercent / 100
    this.onUpdateOptions()
  }

  public onZoom(event: D3ZoomEvent<SVGElement, unknown>): void {
    const range = [
      this.marginLeft,
      Number(this.width) - this.marginRight,
    ].map((d) => event.transform.applyX(d))
    this.timeScale.range(range)
    if (this.timeAxisBox) {
      this.timeAxisBox.call(this.timeAxis)
    }
    this.zoomBars()
  }
}
