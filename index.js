
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
    console.log(d3)
    this.chart = d3.select(target).append('svg')
      .attr('class', 'd3-sparkline')
      .attr('width', width)
      .attr('height', height)
      .append('g');
  }

  /**
   * render the chart line
   */

  render_line(data) {
    let x = d3.scaleLinear().range([0, this.width]);
    let y = d3.scaleLinear().range([0, this.height]);
    let line = d3.line().interpolate(this.interpolate).x(d => x(d[0])).y(d => y(d[1]));

    y.domain(d3.extent(data, d => d[1]));
    x.domain(d3.extent(data, d => d[0]));

    this.chart.append('path').datum(data).attr('class', 'sparkline').attr('d', line);
  }

  /**
   * render the chart
   */

  render(data) {
    this.render_line(data);
  }

  /**
   * update the chart with new `data`
   */

  update(data) {
    this.render(data, options);
  }
}

// Sets on window
global.SparkLine = SparkLine
