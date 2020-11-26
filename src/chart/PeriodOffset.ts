import { select, event } from 'd3-selection'
import type { Selection, EnterElement } from 'd3-selection'
import 'd3-transition'
import { max } from 'd3-array'
import { scaleBand, scaleLinear } from 'd3-scale'
import type { ScaleLinear, ScaleBand } from 'd3-scale'
import { axisRight, axisBottom } from 'd3-axis'
import type { Axis } from 'd3-axis'
import { shortDate } from '../format/date'
import dataset from '../Dataset'
import transition from '../transition'
import BaseChart from './Base'

import type { History, EnrichHistory } from '../types'

interface PeriodOffsetItem {
  date: string
  recoveryPeriod: number
  activePatients: number
}

type TGroupBarSelection = Selection<SVGGElement, undefined, null, undefined>
type TBarSelection = Selection<
  SVGRectElement,
  PeriodOffsetItem,
  SVGGElement,
  undefined
>
type TBarEnterSelection = Selection<
  EnterElement,
  PeriodOffsetItem,
  SVGGElement,
  undefined
>

type ChartType = 'recoveryPeriod' | 'activePatients'

export class PeriodOffset extends BaseChart {
  marginBottom = 80

  lossPercent = 1.1

  maxTickWidth = 35

  private type: ChartType = 'activePatients'

  private pureDataset: History[] = []

  private dataset: PeriodOffsetItem[] = []

  private countScale: ScaleLinear<number, number> = scaleLinear()

  private timeScale: ScaleBand<string> = scaleBand()

  private countAxis: Axis<number> = axisRight<number>(scaleLinear())

  private countAxisBox?: Selection<SVGGElement, undefined, null, undefined>

  private timeAxis: Axis<string> = axisBottom<string>(scaleBand())

  private timeAxisBox?: Selection<SVGGElement, undefined, null, undefined>

  private overBars?: TGroupBarSelection

  private offsets?: TGroupBarSelection

  constructor(selector: string) {
    super(selector)
    this.updateSizes()
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
    this.countScale.range([this.height - this.marginBottom, this.marginTop])

    this.timeScale
      .range([this.marginLeft, this.width - this.marginRight])
      .padding(0.1)
  }

  private updateDomains(): void {
    const maxCount =
      (max(this.dataset, (item) => item[this.type]) as number) * 1.05
    this.countScale.domain([0, maxCount])
    this.timeScale.domain(this.dataset.map((item) => shortDate(item.date)))
  }

  private updateRanges(): void {
    this.countScale.range([this.height - this.marginBottom, this.marginTop])
    this.timeScale.range([this.marginLeft, this.width - this.marginRight])
  }

  private renderAxes(): void {
    this.countAxis.tickSizeOuter(0)

    this.countAxisBox = (this.svg as Selection<
      SVGSVGElement,
      undefined,
      null,
      undefined
    >)
      .append<SVGGElement>('g')
      .classed('count_axis', true)

    this.timeAxis.tickSize(0).tickPadding(10)

    this.timeAxisBox = (this.svg as Selection<
      SVGSVGElement,
      undefined,
      null,
      undefined
    >)
      .append<SVGGElement>('g')
      .classed('time_axis', true)
  }

  private updateAxes(): void {
    this.countAxis.scale(this.countScale)

    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    this.countAxisBox!.transition(transition as any)
      .attr('transform', `translate(${this.marginLeft + this.innerWidth!}, 0)`)
      .call(this.countAxis)

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
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    this.timeAxisBox!.transition(transition as any)
      .attr('transform', `translate(0, ${this.height - this.marginBottom})`)
      .call(this.timeAxis)
  }

  private renderBars(): void {
    this.overBars = this.svg
      .append('g')
      .attr('clip-path', `url(#clip-${this.id})`)

    this.overBars!.selectAll<SVGRectElement, PeriodOffsetItem>('.overBar')
      .data(this.dataset, ({ date }) => date)
      .join((enter) => this._enterOvers(enter))

    this.offsets = this.svg
      .append('g')
      .classed('cases', true)
      .attr('clip-path', `url(#clip-${this.id})`)

    this.offsets!.selectAll<SVGRectElement, PeriodOffsetItem>('.caseBar')
      .data(this.dataset, ({ date }) => date)
      .join((enter) => this._enterCases(enter))
  }

  private updateBars(): void {
    this.overBars!.selectAll<SVGRectElement, PeriodOffsetItem>('.overBar')
      .data(this.dataset, ({ date }) => date)
      .join(
        (enter) => this._enterOvers(enter),
        (update) => update,
        (exit) => exit.remove(),
      )
      .attr('x', ({ date }) => this.timeScale(shortDate(date)) ?? null)
      .attr('width', this.timeScale.bandwidth())
      .attr('y', () => this.countScale.range()[1])
      .attr('height', this.innerHeight!)

    this.offsets!.selectAll<SVGRectElement, PeriodOffsetItem>('.caseBar')
      .data(this.dataset, ({ date }) => date)
      .join(
        (enter) => this._enterCases(enter),
        (update) => update,
        (exit) =>
          exit
            // eslint-disable-next-line  @typescript-eslint/no-explicit-any
            .transition(transition as any)
            .attr('x', ({ date }) => this.timeScale(shortDate(date)) ?? 0 + 100)
            .remove(),
      )
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      .transition(transition as any)
      .attr('x', ({ date }) => this.timeScale(shortDate(date)) ?? null)
      .attr('width', this.timeScale.bandwidth())
      .attr('y', (item) => this.countScale(item[this.type]))
      .attr(
        'height',
        (item) => this.countScale(0) - this.countScale(item[this.type]),
      )
  }

  private zoomBars(): void {
    const bandWidth = this.timeScale.bandwidth()

    this.overBars!.selectAll<SVGRectElement, PeriodOffsetItem>('.overBar')
      .attr('x', ({ date }) => this.timeScale(shortDate(date)) ?? null)
      .attr('width', this.timeScale.bandwidth())

    this.offsets!.selectAll<SVGRectElement, PeriodOffsetItem>('.caseBar')
      .attr('x', ({ date }) => this.timeScale(shortDate(date)) ?? null)
      .attr('width', bandWidth)
  }

  private _enterOvers(enter: TBarEnterSelection): TBarSelection {
    const me = this

    return enter
      .append<SVGRectElement>('rect')
      .classed('overBar', true)
      .attr('x', ({ date }) => this.timeScale(shortDate(date)) ?? null)
      .attr('y', () => this.countScale.range()[1] ?? null)
      .attr('width', this.timeScale.bandwidth() ?? null)
      .attr('height', () => this.innerHeight ?? null)
      .on('mouseover', function (data, index) {
        const rect = select(this)
        me.tooltip.show({
          data: {
            cases: data[me.type],
            recover: null,
            deaths: null,
          },
          right:
            index > me.dataset.length / 2
              ? `${me.width - (+rect.attr('x') + +rect.attr('width'))}px`
              : 'auto',
          left: index <= me.dataset.length / 2 ? `${rect.attr('x')}px` : 'auto',
        })
      })
      .on('mouseout', () => {
        me.tooltip.hide()
      })
  }

  private _enterCases(enter: TBarEnterSelection): TBarSelection {
    return enter
      .append<SVGRectElement>('rect')
      .classed('caseBar', true)
      .attr('x', ({ date }) => this.timeScale(shortDate(date)) ?? null)
      .attr('y', this.countScale.range()[0])
      .attr('width', this.timeScale.bandwidth() / 2)
      .attr('height', 0)
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

  public onUpdateType(type: ChartType): void {
    this.type = type
    this.onUpdateOptions()
  }

  public onUpdateLossPercent(lossPercent: number): void {
    this.lossPercent = 1 + lossPercent / 100
    this.onUpdateOptions()
  }

  public onZoom(): void {
    const range = [this.marginLeft, this.width - this.marginRight].map((d) =>
      event.transform.applyX(d),
    )
    this.timeScale.range(range)
    this.timeAxisBox!.call(this.timeAxis)
    this.zoomBars()
  }
}

export default PeriodOffset
