
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
   * The stroke color of the line chart.
   */
  color: 'red',

  /**
   * The stroke width of the line chart.
   */
  stroke_width: 1,

  /**
   * The line type of the line chart.
   */
  dasharray: '0',

  /**
   * The stroke color of the baseline chart.
   */
  color_baseline: 'black',

  /**
   * The stroke width of the baseline chart.
   */
  stroke_width_baseline: 1,

  /**
   * The line type of the baseline chart.
   */
  dasharray_baseline: '0',

  /**
   * The radius of the marker points.
   */
  point_radius: 6,

  /**
   * A callbackc for the tooltip content.
   */
  tooltip_callback: null
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
    let { width, height, target, ratio } = this;
    // Get the font size of the target element for use in width height calculation
    this.chart = d3.select(target).append('svg')
      .attr('class', 'd3-sparkline')
      .attr('width', width)
      .attr('height', height + 6)
      .style('padding', this.point_radius + 'px')
      .style('overflow', 'visible')
      .append('g');
  }

  hasTooltips() {
    return this.tooltip_callback != 'undefined' && this.tooltip_callback != null;
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
      .attr('stroke', self.color)
      .attr('stroke-width', self.stroke_width)
      .attr('stroke-dasharray', self.dasharray ? self.dasharray : ("0"))
      .style("stroke-linecap", "round")
      .attr('d', line);

    if (typeof baseline != 'undefined') {
      let line_baseline = d3.line()
        .x(function(d, i) { return x(i) })
        .y(function(d, i) { return y(baseline) })

      this.chart.append('path')
        .datum(data)
        .attr('class', 'sparkline-baseline')
        .attr('fill', 'transparent')
        .attr('stroke', self.color_baseline)
        .attr('stroke-width', self.stroke_width_baseline)
        .attr('stroke-dasharray', self.dasharray_baseline ? self.dasharray_baseline : ("0"))
        .style("stroke-linecap", "round")
        .attr('d', line_baseline);
    }

    // Define the div for the tooltip.
    if (self.hasTooltips()) {
      var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style('background-color', 'black')
        .style('color', 'white')
        .style('border-radius', '3px  ')
        .style('display', 'inline-block')
        .style('position', 'absolute')
        .style('z-index', '10')
        .style('padding', '0.5rem')
        .style('opacity', '0.9')
        .style("visibility", 'hidden');
    }

    // Add the scatterplot.
    this.chart.selectAll("dot")
      .data(data)
      .enter().append("circle")
      .attr("r", self.point_radius)
      .attr("cx", function(d, i) { return x(i); })
      .attr("cy", function(d) { return y(d); })
      .on("mouseover", function(d, i) {
        if (self.hasTooltips()) {

          // Set the tooltip content.
          tooltip.html(self.tooltip_callback(d, i));

          // Position the tooltip-
          let tooltip_width = tooltip.node().getBoundingClientRect().width;
          let tooltip_height = tooltip.node().getBoundingClientRect().height;
          tooltip.style("left", (d3.event.pageX - d3.event.offsetX + d3.event.target.cx.baseVal.value - 2 * d3.event.target.r.baseVal.value) + "px")
            .style("top", (d3.event.pageY - tooltip_height - 10) + "px");

          // Make the tooltip visible.
          tooltip.transition()
            .duration(0)
            .style("visibility", 'visible');
        }
      })
      .on("mouseout", function(d) {
        if (self.hasTooltips()) {
          tooltip.transition()
            .duration(0)
            .style("visibility", 'hidden');
        }
      });
  }

  /**
   * Render the chart
   */
  render(data, baseline) {
    this.render_line(data, baseline);
  }

  /**
   * Update the chart with new `data`.
   */
  update(data, baseline) {
    this.render(data, baseline, options);
  }
}

// Sets on window.
global.SparkLine = SparkLine
