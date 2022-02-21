import 'd3-transition'
import { max } from 'd3-array'
import { select } from 'd3-selection'
import type { EnterElement, Selection } from 'd3-selection'
import { scaleBand, scaleLinear, scalePow, scaleTime } from 'd3-scale'
import type { ScaleBand, ScaleLinear, ScalePower, ScaleTime } from 'd3-scale'
import { area, line } from 'd3-shape'
import type { Area, Line } from 'd3-shape'
import { axisRight, axisBottom } from 'd3-axis'
import type { Axis } from 'd3-axis'
import type { D3ZoomEvent } from 'd3-zoom'
import { shortDate as sortDateFn } from '../format/date'
import dataset from '../Dataset'
import { Base } from './Base'
import { humanInt } from '../format/number'
import type { EnrichHistory, HistoryDay, HistoryMoment } from '../types'

interface DataItem extends Pick<EnrichHistory, 'date'> {
  shortDate: string
  cases: number
  deaths: number
  recover: number
}

type GroupBarSelection = Selection<SVGGElement, unknown, HTMLElement, unknown>

type BarSelection = Selection<SVGRectElement, DataItem, SVGGElement, unknown>
type PathSelection = Selection<SVGPathElement, DataItem[], HTMLElement, unknown>
type EnterBarSelection = Selection<EnterElement, DataItem, SVGGElement, unknown>

const ChartTypeEnum = {
  All: 'all',
  Period: 'period',
  AllSicks: 'allSicks',
} as const

export type SimpleChartType = typeof ChartTypeEnum[keyof typeof ChartTypeEnum]

type Property = 'cases' | 'recover' | 'deaths'
type ValueFn = (prop: Property, item: EnrichHistory) => number

const valueByType: Record<SimpleChartType, ValueFn> = {
  [ChartTypeEnum.All]: (prop, item) => item[prop],
  [ChartTypeEnum.Period]: (prop, item) =>
    item[`${prop}Day` as keyof HistoryDay],
  [ChartTypeEnum.AllSicks]: (prop, item) =>
    item[`${prop}Moment` as keyof HistoryMoment],
}

export type SimpleScaleType = 'linear' | 'pow'

export class Simple extends Base {
  private type: SimpleChartType = ChartTypeEnum.Period

  private scaleType: SimpleScaleType = 'linear'

  private maxTickWidth = 60

  private pureDataset: EnrichHistory[] = []

  private dataset: DataItem[] = []

  private linearScale: ScaleLinear<number, number> = scaleLinear()

  private powScale: ScalePower<number, number, never> = scalePow()

  private countScale:
    | ScaleLinear<number, number>
    | ScalePower<number, number, never> = this.linearScale

  private timeScale: ScaleBand<string> = scaleBand()

  private timeLinearScale: ScaleTime<number, number> = scaleTime()

  private countAxis: Axis<number> = axisRight<number>(this.countScale)

  private countAxisBox?: Selection<SVGGElement, unknown, HTMLElement, unknown>

  private timeAxis: Axis<string> = axisBottom<string>(this.timeScale)

  private timeAxisBox?: Selection<SVGGElement, unknown, HTMLElement, unknown>

  private overBarsGroup?: GroupBarSelection

  private overBars?: BarSelection

  private caseArea: Area<DataItem> = area()

  private casePath?: PathSelection

  private caseGroup?: GroupBarSelection

  private recoverLine: Line<DataItem> = line()

  private recoverPath?: PathSelection

  private recoverGroup?: GroupBarSelection

  private deathsLine: Line<DataItem> = line()

  private deathsPath?: PathSelection

  private deathsGroup?: GroupBarSelection

  private maxCount = 1

  constructor(selector: string) {
    super(selector)
    this.initScales()

    dataset.getAll().then(({ data, updateDate }) => {
      this.render(data)
      this.renderInfo(updateDate)
    })
  }

  render(data: EnrichHistory[]): void {
    this.pureDataset = data

    this.prepareDataset()
    this.updateDomains()
    this.renderAxes()
    this.updateAxes()
    this.renderBars()
    this.updateBars()
  }

  private prepareDataset(): void {
    this.dataset = this.pureDataset.map<DataItem>((item) => ({
      date: item.date,
      shortDate: sortDateFn(item.date),
      cases: valueByType[this.type]('cases', item),
      deaths: valueByType[this.type]('deaths', item),
      recover: valueByType[this.type]('recover', item),
    }))

    this.maxCount =
      max(
        this.dataset.flatMap((item) => [item.cases, item.deaths, item.recover]),
      ) ?? 1 * 1.05
  }

  private initScales() {
    this.linearScale.range([
      Number(this.height) - this.marginBottom,
      this.marginTop,
    ])

    this.timeLinearScale.range([
      this.marginLeft,
      Number(this.width) - this.marginRight,
    ])

    this.powScale
      .exponent(0.4)
      .range([Number(this.height) - this.marginBottom, this.marginTop])

    this.timeScale
      .padding(0.1)
      .range([this.marginLeft, Number(this.width) - this.marginRight])

    const scaleProperty = `${this.scaleType}Scale` as const
    this.countScale = this[scaleProperty]
  }

  private updateDomains() {
    this.linearScale.domain([0, this.maxCount])
    this.powScale.domain([0, this.maxCount])
    this.timeScale.domain(this.dataset.map((item) => item.shortDate))
    this.timeLinearScale.domain([
      this.dataset[0].date,
      this.dataset[this.dataset.length - 1].date,
    ])
  }

  private updateRanges() {
    this.linearScale.range([
      Number(this.height) - this.marginBottom,
      this.marginTop,
    ])
    this.powScale.range([
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

  private renderAxes() {
    this.countAxis.tickSizeOuter(0).tickFormat(humanInt)

    this.countAxisBox = this.svg
      .append('g')
      .classed('cound_axis', true)
      .attr(
        'transform',
        `translate(${Number(this.width) - this.marginRight}, 0)`,
      )

    this.timeAxis.tickSize(0).tickPadding(10)

    this.timeAxisBox = this.svg
      .append('g')
      .classed('time_axis', true)
      .attr(
        'transform',
        `translate(0, ${Number(this.height) - this.marginBottom})`,
      )
  }

  private updateAxes() {
    this.countAxis.scale(this.countScale)
    this.countAxisBox
      ?.transition('base')
      .attr(
        'transform',
        `translate(${Number(this.width) - this.marginRight}, 0)`,
      )
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

    this.timeAxisBox
      ?.transition('base')
      .attr(
        'transform',
        `translate(0, ${Number(this.height) - this.marginBottom})`,
      )
      .call(this.timeAxis)
  }

  public getDataValue(
    property: 'cases' | 'recover' | 'deaths',
    dataItem: EnrichHistory,
  ): number {
    return valueByType[this.type](property, dataItem)
  }

  private renderBars() {
    this.overBarsGroup = this.svg
      .append('g')
      .attr('clip-path', `url(#clip-${this.id})`)

    this.overBars = this.overBarsGroup
      .selectAll<SVGRectElement, DataItem>('.overBar')
      .data(this.dataset, ({ shortDate }) => shortDate)
      .join((enter) => this._enterOvers(enter))
      .call(this._updateOvers.bind(this))

    this.caseGroup = this.svg
      .append('g')
      .classed('cases', true)
      .attr('clip-path', `url(#clip-${this.id})`)

    this.casePath = this.caseGroup
      .append<SVGPathElement>('path')
      .classed('caseArea', true)
      .datum<DataItem[]>([])
      .attr('d', this.caseArea)

    this.recoverGroup = this.svg
      .append('g')
      .classed('recover', true)
      .attr('clip-path', `url(#clip-${this.id})`)

    this.recoverPath = this.recoverGroup
      .append<SVGPathElement>('path')
      .classed('recoverLine', true)
      .datum<DataItem[]>([])
      .attr('d', this.recoverLine)

    this.deathsGroup = this.svg
      .append('g')
      .classed('deaths', true)
      .attr('clip-path', `url(#clip-${this.id})`)

    this.deathsPath = this.deathsGroup
      .append<SVGPathElement>('path')
      .classed('deathsLine', true)
      .datum<DataItem[]>([])
      .attr('d', this.deathsLine)
  }

  private updateBars() {
    this.overBarsGroup
      ?.selectAll<SVGRectElement, DataItem>('.overBar')
      .data(this.dataset, ({ shortDate }) => shortDate)
      .call(this._updateOvers.bind(this))

    this.caseArea
      .x((d) => this.timeLinearScale(d.date))
      .y0((d) => this.countScale(d.cases))
      .y1(() => this.countScale.range()[0])
    this.casePath
      ?.datum(this.dataset)
      .transition('base')
      .attr('d', this.caseArea)

    this.recoverLine
      .x((d) => this.timeLinearScale(d.date))
      .y((d) => this.countScale(d.recover))
    this.recoverPath
      ?.datum(this.dataset)
      .transition('base')
      .attr('d', this.recoverLine)

    this.deathsLine
      .x((d) => this.timeLinearScale(d.date))
      .y((d) => this.countScale(d.deaths))
    this.deathsPath
      ?.datum<DataItem[]>(this.dataset)
      .transition('base')
      .attr('d', this.deathsLine)
  }

  private zoomBars() {
    this.overBars
      ?.selectAll<SVGRectElement, DataItem>('.overBar')
      .call(this._zoomBars.bind(this))
  }

  private _enterOvers(enter: EnterBarSelection) {
    const me = this
    return enter
      .append('rect')
      .classed('overBar', true)
      .on('mouseover', function (_event, data) {
        const index = me.dataset.indexOf(data)
        const rect = select(this)
        const width = me.width ?? NaN
        me.tooltip.show({
          data: {
            cases: data.cases,
            recover: me.type !== ChartTypeEnum.AllSicks ? data.recover : null,
            deaths: me.type !== ChartTypeEnum.AllSicks ? data.deaths : null,
          },
          right:
            index > me.dataset.length / 2
              ? `${width - (+rect.attr('x') + +rect.attr('width'))}px`
              : 'auto',
          left: index <= me.dataset.length / 2 ? `${rect.attr('x')}px` : 'auto',
        })
      })
      .on('mouseout', () => {
        me.tooltip.hide()
      })
  }

  private _updateOvers(update: BarSelection) {
    return update
      .attr('x', ({ shortDate }) => this.timeScale(shortDate) ?? null)
      .attr('width', this.timeScale.bandwidth())
      .attr('y', this.countScale.range()[1])
      .attr('height', this.innerHeight ?? null)
  }

  private _zoomBars(update: BarSelection, widthScale = 1) {
    const bandWidth = this.timeScale.bandwidth() * widthScale
    const dx = this.timeScale.bandwidth() - bandWidth

    return update
      .attr('x', ({ shortDate }) => this.timeScale(shortDate) ?? NaN + dx)
      .attr('width', bandWidth)
  }

  private onUpdateOptions() {
    this.updateDomains()
    this.updateAxes()
    this.updateBars()
  }

  public setType(type: SimpleChartType): void {
    this.type = type
    this.prepareDataset()
    this.onUpdateOptions()
  }

  public setScaleType(scaleType: SimpleScaleType): void {
    this.scaleType = scaleType
    this.countScale = this[`${this.scaleType}Scale`]
    this.onUpdateOptions()
  }

  protected onResize(): void {
    super.onResize()

    this.updateRanges()
    this.updateAxes()
    this.updateBars()
  }

  onZoom(event: D3ZoomEvent<SVGElement, unknown>): void {
    if (this.dataset) {
      const range = [
        this.marginLeft,
        Number(this.width) - this.marginRight,
      ].map((item) => event.transform.applyX(item))
      this.timeScale.range(range)
      this.timeAxisBox?.call(this.timeAxis)

      this.zoomBars()
    }
  }
}
