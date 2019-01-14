
import * as d3 from 'd3';

/**
 * default config
 */
const defaults = {
  /**
   * The element to render the svg inside
   */
  target: '#sparkline',

  /**
   * width height ratio (5 is recommended)
   */
  ratio: 5,

  /**
   * font size used in width / height calculation
   */
  font_size: 12,

  /**
   * when auto is true font size is determined by the parent element
   */
  auto: false,

  /**
   * interpolation method
   */
  interpolate: 'basis'
};

/**
 * SparkLine
 */
export default class SparkLine {

  /**
   * construct with the given `config`
   */
  constructor(config) {
    this.set(config);
    this.set_dimensions();
    this.init();
  }

  /**
   * assign the configuration
   */
  set(config) {
    Object.assign(this, defaults, config);
  }

  /**
   * set the dimensions (can be dynamic if auto is set)
   */
  set_dimensions() {
    if (!this.auto) {
      this.width = this.font_size * this.ratio;
      this.height = this.font_size;
    } else {
      let element = document.querySelector(target);
      let font_size = parseInt(window.getComputedStyle(element, null).getPropertyValue('font-size'));
      this.width = font_size * this.ratio;
      this.height = font_size;
    }
  }

  /**
   * initialize the chart area
   */
  init() {
    let { width, height, target, interpolate, ratio } = this;
    // Get the font size of the target element for use in width height calculation
    this.chart = d3.select(target).append('svg')
      .attr('class', 'd3-sparkline')
      .attr('width', width)
      .attr('height', height)
      .append('g');
  }

  /**
   * render the chart line
   */
  render_line(data, baseline) {
    let self = this;

    var data_range = d3.extent(data, (d) => { return d });
    if (typeof baseline != 'undefined') {
      data_range[1] = Math.max(data_range[1], baseline);
    }

    let y = d3.scaleLinear()
      .domain(data_range)
      .range([self.height, 0])

    let x = d3.scaleLinear()
      .domain([0, data.length])
      .range([0, self.width])

    let line = d3.line()
      .x(function(d, i) { return x(i) })
      .y(function(d) { return y(d) })

    this.chart.append('path')
      .datum(data)
      .attr('class', 'sparkline')
      .attr('fill', 'transparent')
      .attr('stroke', 'red')
      .attr('d', line);

    if (typeof baseline != 'undefined') {
      let line_baseline = d3.line()
        .x(function(d, i) { return x(i) })
        .y(function(d, i) { return y(baseline) })

      this.chart.append('path')
        .datum(data)
        .attr('class', 'sparkline-baseline')
        .attr('fill', 'transparent')
        .attr('stroke', '#000')
        .attr('d', line_baseline);
      }
  }

  /**
   * render the chart
   */
  render(data, baseline) {
    this.render_line(data, baseline);
  }

  /**
   * update the chart with new `data`
   */
  update(data, baseline) {
    this.render(data, baseline, options);
  }
}

// Sets on window
global.SparkLine = SparkLine
