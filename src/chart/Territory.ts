import 'd3-transition'
import axios from 'axios'
import isMobile from 'ismobilejs'
import { max, mean } from 'd3-array'
import { select } from 'd3-selection'
import { scaleDiverging, scaleLinear } from 'd3-scale'
import { axisBottom } from 'd3-axis'
import { geoPath, geoMercator } from 'd3-geo'
import {
  interpolateOranges,
  interpolateGreens,
  interpolateReds,
} from 'd3-scale-chromatic'
import { format } from 'd3-format'
import type {
  ExtendedFeatureCollection,
  ExtendedFeature,
  GeoGeometryObjects,
  GeoProjection,
  GeoPath,
} from 'd3-geo'
import type { Selection, EnterElement } from 'd3-selection'
import type { ScaleDiverging } from 'd3-scale'
import type { D3ZoomEvent } from 'd3-zoom'
import dataset from '../Dataset'
import { serverDate } from '../format/date'
import { humanInt } from '../format/number'
import type { RegionData, RegionDataInfoTypes } from '../types'
import { Base } from './Base'
import type { Region } from './Region'

const int = format(',d')

type Scale = ScaleDiverging<number, undefined>

export type TerritoryViewType = 'confirmed' | 'deaths'

export type TerritoryRelativeType = 'Relative' | ''

type ViewTypes = `${TerritoryViewType}${TerritoryRelativeType}`

type Scales = Record<ViewTypes, Scale>

type Interpolations = Record<RegionDataInfoTypes, (n: number) => string>

interface RegionPropertyDto {
  name: string
  // eslint-disable-next-line camelcase
  full_name: string
  population: number
}

type RegionFeatureDto = ExtendedFeature<GeoGeometryObjects, RegionPropertyDto>

type RegionFeatureCollectionResponse = ExtendedFeatureCollection<
  RegionFeatureDto
>

interface RegionProperty extends RegionPropertyDto {
  stat: RegionData
}

type Feature = ExtendedFeature<GeoGeometryObjects, RegionProperty>

type FeatureCollection = ExtendedFeatureCollection<Feature>

type EnterSelection = Selection<EnterElement, Feature, SVGGElement, unknown>

export type TerritoryScaleType = 'full' | 'europe'

export class Territory extends Base {
  marginLeft = 0

  marginRight = 0

  marginBottom = 40

  marginTop = 0

  meanRatio = 0.5

  axesPadding = 30

  mapParts = 1

  VERSION = 'v1.1'

  private view: TerritoryScaleType = 'full'

  type: ViewTypes = 'confirmed'

  private regionChart: Region

  private progress: Selection<HTMLElement, unknown, HTMLElement, unknown>

  private chromaticLeftAxisBox: Selection<
    SVGGElement,
    unknown,
    HTMLElement,
    unknown
  >

  private chromaticRightAxisBox: Selection<
    SVGGElement,
    unknown,
    HTMLElement,
    unknown
  >

  private chromaticColor: Selection<
    SVGRectElement,
    unknown,
    HTMLElement,
    unknown
  >

  private map?: Selection<SVGGElement, unknown, HTMLElement, unknown>

  private projection?: GeoProjection

  private geoPath?: GeoPath

  private byRegions: RegionData[] = []

  private scales: Scales = {
    confirmed: scaleDiverging(),
    confirmedRelative: scaleDiverging(),
    deaths: scaleDiverging(),
    deathsRelative: scaleDiverging(),
  }

  private scale: Scale = this.scales.confirmed

  private fullDataset: FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  }

  private europeDataset: FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  }

  private interpolations: Interpolations = {
    confirmed: interpolateOranges,
    recovered: interpolateGreens,
    deaths: interpolateReds,
    confirmedRelative: interpolateOranges,
    deathsRelative: interpolateReds,
  }

  private confirmedRelativeValues: number[] = []

  private deathsRelativeValues: number[] = []

  private _loaded = false

  constructor(selector: string, regionChart: Region) {
    super(selector)
    this.updateClipPath()
    this.initGradients()
    this.initPath()
    this.updateZoom()

    this.regionChart = regionChart
    this.progress = this.container.select('.load-progress')

    this.chromaticLeftAxisBox = this.svg.append<SVGGElement>('g')
    this.chromaticRightAxisBox = this.svg.append<SVGGElement>('g')
    this.chromaticColor = this.svg.append<SVGRectElement>('rect')

    dataset.getAll().then(({ regions }) => {
      this.setStatData(regions)
      this.render()
      this.getRegions()
    })
  }

  private updateClipPath(): void {
    this.clipPath?.attr('y', this.marginTop)
  }

  protected updateZoom(): void {
    const extent: [[number, number], [number, number]] = [
      [0, 0],
      [this.innerWidth ?? 1, this.innerHeight ?? 1],
    ]
    this.zoom?.translateExtent(extent).extent(extent)
  }

  protected resetZoom(): void {
    super.resetZoom()
    this.map?.attr('transform', '')
  }

  private onAfterLoad() {
    this._loaded = true
    this.initEuropeDataset()
    this.setType(this.type)
    setTimeout(() => {
      this.progress.remove()
    }, 1000)
    select('#territory-chart-box').classed('hide-controls', false)
  }

  private initGradients(): void {
    const { interpolations } = this
    this.defs
      ?.selectAll<SVGLinearGradientElement, RegionDataInfoTypes>(
        'linearGradient',
      )
      .data([
        'confirmed',
        'recovered',
        'deaths',
        'confirmedRelative',
        'deathsRelative',
      ] as const)
      .enter()
      .append('linearGradient')
      .attr('id', (d) => `${d}Gradient`)
      .each(function (type) {
        select(this)
          .selectAll('stop')
          .data([0, 25, 50, 75, 100])
          .enter()
          .append('stop')
          .attr('offset', (d) => `${d}%`)
          .attr('stop-color', (d) => interpolations[type](d / 100))
      })
  }

  private getColor(value: number) {
    return this.interpolations[this.type](this.scale(value) ?? 0)
  }

  private setStatData(byRegions: RegionData[]): void {
    this.byRegions = byRegions

    const confirmed = byRegions.map((region) => region.confirmed)
    this.scales.confirmed
      .domain([0, mean(confirmed) ?? 1, max(confirmed) ?? 1])
      .range([0, this.meanRatio, 1])

    const deaths = byRegions.map((region) => region.deaths)
    this.scales.deaths
      .domain([0, mean(deaths) ?? 1, max(deaths) ?? 1])
      .range([0, this.meanRatio, 1])
  }

  private setRelativeStatData(): void {
    this.scales.confirmedRelative
      .domain([
        0,
        mean(this.confirmedRelativeValues) ?? 1,
        max(this.confirmedRelativeValues) ?? 1,
      ])
      .range([0, this.meanRatio, 1])

    this.scales.deathsRelative
      .domain([
        0,
        mean(this.deathsRelativeValues) ?? 1,
        max(this.deathsRelativeValues) ?? 1,
      ])
      .range([0, this.meanRatio, 1])
  }

  private getRegions(index = 0): void {
    if (index >= this.mapParts) {
      this.progress.select('.progress-bar').style('width', '100%')
      this.onAfterLoad()
      return
    }
    const width = this.mapParts !== 1 ? (index / this.mapParts) * 100 : 100
    this.progress.select('.progress-bar').style('width', `${width}%`)
    let filename = `part-${index}.${this.VERSION}`
    if (isMobile(window.navigator).phone) {
      filename += '.slim'
    }
    axios
      .get<RegionFeatureCollectionResponse>(
        `/api/json/regions/${filename}.geojson`,
      )
      .then(({ data }) => {
        this.merdeDataset(data)
        this.updateRegions()
        this.getRegions(index + 1)
      })
  }

  private merdeDataset(geo: RegionFeatureCollectionResponse): void {
    geo.features.forEach((feature) => {
      const stat = this.byRegions.find(
        (region) =>
          region.territoryName === feature.properties.name ||
          region.territoryName === feature.properties.full_name,
      )
      if (!stat) return

      const confirmedRelative =
        (stat.confirmed / feature.properties.population) * 100_000
      const deathsRelative =
        (stat.deaths / feature.properties.population) * 100_000

      this.confirmedRelativeValues.push(confirmedRelative)
      this.deathsRelativeValues.push(deathsRelative)

      this.fullDataset.features.push({
        type: feature.type,
        geometry: feature.geometry,
        properties: {
          ...feature.properties,
          stat: {
            ...stat,
            confirmedRelative,
            deathsRelative,
          },
        },
      })
    })
    this.setRelativeStatData()
  }

  private initEuropeDataset(): void {
    this.europeDataset.features = this.fullDataset.features.filter((item) =>
      [
        'Калининградская область',
        'Карелия',
        'Дагестан',
        'Свердловская область',
      ].includes(item.properties.name),
    )
  }

  private initPath(): void {
    this.projection = geoMercator().rotate([-100, -60, 5])
    this.geoPath = geoPath().projection(this.projection)
  }

  private updatePathBySize(): void {
    const data = this[`${this.view}Dataset`]
    const rotate: [number, number, number] =
      this.view === 'full' ? [-100, -60, 5] : [-80, -60, 0]
    this.projection
      ?.rotate(rotate)
      .fitSize(
        [
          Number(this.innerWidth) - 2 * this.axesPadding,
          Number(this.innerHeight) - 2 * this.axesPadding,
        ],
        data,
      )
  }

  public setFullProjection(): void {
    this.view = 'full'
    this.updatePathBySize()
    this.resetZoom()
    this.resizeRegions()
  }

  public setEuropeProjection(): void {
    this.view = 'europe'
    this.updatePathBySize()
    this.resetZoom()
    this.resizeRegions()
  }

  private render(): void {
    this.renderAxes()

    this.map = this.svg
      .append<SVGGElement>('g')
      .attr('clip-path', `url(#clip-${this.id})`)
      .append<SVGGElement>('g')
      .attr(
        'transform',
        `translate(${this.marginLeft + this.axesPadding}, ${
          this.marginTop + this.axesPadding
        })`,
      )
      .append<SVGGElement>('g')
      .classed('map', true)
      .attr('stroke-width', 0.5)
  }

  private renderAxes(): void {
    this.chromaticColor
      .attr('height', 10)
      .attr('x', this.marginLeft + this.axesPadding)
      .attr('y', this.height ?? 1)
      .attr('fill', 'grey')
  }

  private updateAxes(): void {
    if (!this._loaded) {
      return
    }
    const yPosition = Number(this.height) - this.marginBottom + 15
    const width = Number(this.innerWidth) - 2 * this.axesPadding
    const sizes = [
      this.marginLeft + this.axesPadding,
      this.marginLeft + this.axesPadding + width * this.meanRatio,
      Number(this.width) - this.marginRight - this.axesPadding - 0.5,
    ]
    const domain = this.scale.domain()
    const scaleLeft = scaleLinear<number>()
      .range(sizes.slice(0, 2))
      .domain(domain.slice(0, 2))

    this.chromaticLeftAxisBox
      .attr('transform', `translate(0, ${yPosition})`)
      .interrupt()
      .transition('base')
      .call(
        axisBottom<number>(scaleLeft)
          .ticks(5)
          .tickSizeOuter(0)
          .tickFormat(humanInt),
      )

    const scaleRight = scaleLinear()
      .range(sizes.slice(1))
      .domain(domain.slice(1))

    this.chromaticRightAxisBox
      .attr('transform', `translate(0, ${yPosition})`)
      .interrupt()
      .transition('base')
      .call(
        axisBottom<number>(scaleRight)
          .ticks(3)
          .tickSizeOuter(0)
          .tickFormat(humanInt),
      )

    this.chromaticColor
      .interrupt()
      .transition('base')
      .attr('y', yPosition - 10)
      .attr('width', width)
      .attr('fill', `url(#${this.type}Gradient)`)
  }

  private updateRegions(): void {
    this.updatePathBySize()
    this.map
      ?.selectAll<SVGPathElement, Feature>('path.region')
      .data(this.fullDataset.features, (d) => d.properties.name)
      .join((enter) => this._enterRegion(enter))
      .attr('d', this.geoPath!)
  }

  private resizeRegions(): void {
    this.map
      ?.selectAll<SVGPathElement, Feature>('path.region')
      .attr('d', this.geoPath!)
  }

  private _enterRegion(enter: EnterSelection) {
    const me = this
    const tooltip = select('#tooltip')

    return enter
      .append('path')
      .classed('region', true)
      .attr('fill', '#d1d1d1')
      .on('mouseover', (_event, { properties }) => {
        const { stat } = properties

        const confirmed = stat ? me.getTooltipValue(stat, 'confirmed') : '?'
        const recovered = stat ? me.getTooltipValue(stat, 'recovered') : '?'
        const deaths = stat ? me.getTooltipValue(stat, 'deaths') : '?'
        const confirmedRelative = stat
          ? me.getTooltipValue(stat, 'confirmedRelative')
          : '?'
        const deathsRelative = stat
          ? me.getTooltipValue(stat, 'deathsRelative')
          : '?'

        tooltip.html(`
          ${properties.name}
          <span class="cases">${confirmed}</span>&nbsp;
          <span class="recover">${recovered}</span>&nbsp;
          <span class="deaths">${deaths}</span>&nbsp;
          <br>
          <small>
            На каждые 100 000 человек приходится
            <span class="cases"><strong>${confirmedRelative}</strong> заразившихся</span>
            и
            <span class="deaths"><strong>${deathsRelative}</strong> умерших</span>
          </small>
        `)
      })
      .on('click', (_event, { properties: { stat } }) => {
        me.regionChart.show().then((regionChart) => {
          regionChart.setDataset(stat)
        })
      })
  }

  private getTooltipValue(data: RegionData, type: RegionDataInfoTypes) {
    let value = int(data[type])
    if (type !== 'confirmedRelative' && type !== 'deathsRelative') {
      const inc = data[`${type}Inc`]
      value += ` (+${int(inc)})`
    }
    return value
  }

  protected onResize(): void {
    super.onResize()
    this.updateClipPath()

    this.updatePathBySize()
    this.updateAxes()
    this.resizeRegions()
  }

  public setType(type: ViewTypes, silent = false): void {
    this.type = type
    this.scale = this.scales[type]
    this.updateAxes()
    if (!silent) {
      this.map
        ?.selectAll<SVGPathElement, Feature>('path.region')
        .transition('base')
        .attr('fill', ({ properties: { stat } }) =>
          this.getColor(stat[this.type]),
        )
    }
  }

  public updateConfirmedHistory(dateTime: Date): void {
    if (this.type !== 'confirmed') {
      this.setType('confirmed', true)
    }
    const date = serverDate(dateTime)
    const none = { confirmed: 0 }
    this.map
      ?.selectAll<SVGPathElement, Feature>('path.region')
      .attr('fill', ({ properties: { stat } }) =>
        this.getColor(
          (stat.history.find((item) => item.date === date) || none).confirmed,
        ),
      )
  }

  public onZoom(event: D3ZoomEvent<SVGElement, unknown>): void {
    this.map
      ?.attr('stroke-width', 0.5 / event.transform.k)
      .attr('transform', event.transform.k)
  }
}
