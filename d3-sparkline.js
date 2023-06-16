(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('d3')) :
	typeof define === 'function' && define.amd ? define(['d3'], factory) :
	(factory(global, global.d3));
}(this, (function (global, d3) { 'use strict';

  /**
   * The default config.
   */
  const defaults = {

    /**
     * The element to render the svg inside.
     */
    target: '#sparkline',

    /**
     * Width height ratio (5 is recommended).
     */
    ratio: 5,

    /**
     * Inherit size from parent if set to "parent".
     */
    size: null,

    /**
     * Optional font size used in width / height calculation.
     */
    font_size: null,

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
    point_radius: 3,

    /**
     * A callback for the tooltip content.
     */
    tooltip: null
  };

  class SparkLine {

    /**
     * Construct with the given config.
     */
    constructor(config) {
      this.set(config);
      this.set_dimensions();
      this.init();
    }

    /**
     * Assign the configuration.
     */
    set(config) {
      Object.assign(this, defaults, config);
    }

    /**
     * Set the dimensions.
     */
    set_dimensions() {
      if (this.font_size) {
        // If a font size is given, use that.
        this.width = this.font_size * this.ratio;
      } else if (this.size == 'parent') {
        // If size is set to 'parent', inherit it's width.
        var element = document.querySelector(this.target);
        this.width = parseInt(window.getComputedStyle(element, null).getPropertyValue('width'));
      } else {
        // In all other cases, inherit the font size and use that for the width calculation.
        var _element = document.querySelector(this.target);
        var font_size = parseInt(window.getComputedStyle(_element, null).getPropertyValue('font-size'));
        this.width = font_size * this.ratio;
      }
      this.height = this.width / this.ratio;
    }

    /**
     * Initialize the chart area.
     */
    init() {
      this.chart = d3.select(this.target).style('position', 'relative')
        .append('svg')
        .attr('class', 'd3-sparkline')
        .attr('width', this.width)
        .attr('height', this.height + 2 * this.point_radius)
        .style('padding', this.point_radius + 'px')
        .style('overflow', 'visible')
        .append('g');

      if (this.hasTooltips()) {
        this.tooltip_container = d3.select('body').append("div")
          .attr("class", "d3-sparkline-tooltip tooltip top")
          .style('opacity', '0.9')
          .style('position', 'absolute')
          .style("visibility", 'hidden');
        this.focussed_point = null;
      }

    }

    /**
     * Check if there is a tooltip callback.
     */
    hasTooltips() {
      return this.tooltip != 'undefined' && this.tooltip != null;
    }

    /**
     * See if the given index represents a middle point between 2 valid points.
     */
    isMiddlePoint(data, i) {
      let index_prev = this.getPreviousPointIndex(data, i);
      let index_next = this.getNextPointIndex(data, i);
      if (index_prev === null || index_next === null) {
        return false;
      }
      return this.hasPoint(data, this.getPreviousPointIndex(data, i)) && this.hasPoint(data, this.getNextPointIndex(data, i));
    }

    /**
     * See if the given index represents a point.
     *
     * A point is a numerical value that is not null.
     */
    hasPoint(data, i) {
      return typeof data[i] == 'number' && !Number.isNaN(data[i]);
    }

    /**
     * Get the index of the previous point.
     */
    getPreviousPointIndex(data, i) {
      if (i <= 0) {
        return null;
      }
      for (let j = i - 1; j >= 0; j--) {
        if (this.hasPoint(data, j)) {
          return j;
        }
      }
      return null;
    }

    /**
     * Get the index of the next point.
     */
    getNextPointIndex(data, i) {
      if (i >= data.length - 1) {
        return null;
      }
      for (let j = i + 1; j < data.length; j++) {
        if (this.hasPoint(data, j)) {
          return j;
        }
      }
      return null;
    }

    /**
     * Get the y coordinate for possible null values.
     *
     * Null values appearing in the middle of a data set will be interpolated.
     */
    getNullableY(y, d, i, data) {
      if (Number.isNaN(d)) {
        if (this.isMiddlePoint(data, i)) {
          // If we have a predecessor and a successor, calculate the
          // average and use that.
          let index_prev = this.getPreviousPointIndex(data, i);
          let index_next = this.getNextPointIndex(data, i);
          return y((data[index_prev] + data[index_next]) / 2)
        }
        // Otherwhise just use the average of all data points to place this
        // data point. This prevents visual artifacts on data sets that have
        // very high numbers, compared to placing the point at y(0).
        return y(Math.min(...data.filter((value) => !Number.isNaN(value))));
      }
      else {
        return y(d);
      }
    }

    /**
     * Render the chart line.
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
        .domain([0, data.length - 1])
        .range([0, self.width])

      let line = d3.line()
        .x(function(d, i) { return x(i) })
        .y(function(d, i) { return self.getNullableY(y, d, i, data) });

      // Create a unique id for the gradient.
      let gradient_id = 'gradient-' + URL.createObjectURL(new Blob([])).slice(-36);

      // Create the gradient, which controls the color for the line segments.
      // We want the visible parts of the sparkline to have our standard color,
      // and the invisible parts to be transparent.
      var defs = this.chart.append("defs");
      var gradient = defs.append("linearGradient")
        .attr("id", gradient_id)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", "0%")
        .attr("x2", "100%");

      let max_x = x(data.length - 1);
      for (let i = 0; i < data.length - 1; i++) {

        // Define the segment color.
        let color = self.color;
        if (Number.isNaN(data[i]) && !self.isMiddlePoint(data, i)) {
          color = 'transparent';
        }
        if (!self.getNextPointIndex(data, i)) {
          color = 'transparent';
        }

        gradient.append("stop")
          .attr("offset", (1 / max_x * x(i)))
          .attr("stop-color", color);

        gradient.append("stop")
          .attr("offset", (1 / max_x * x(i + 1)))
          .attr("stop-color", color);
      }

      this.chart.append('path')
        .datum(data)
        .attr('class', 'sparkline')
        .attr('fill', 'transparent')
        .attr("stroke", "url(#" + gradient_id + ")")
        .attr('stroke-width', self.stroke_width)
        .attr('stroke-dasharray', self.dasharray ? self.dasharray : ("0"))
        .style("stroke-linecap", "round")
        .attr('d', line);

      if (typeof baseline != 'undefined') {
        let line_baseline = d3.line()
          .x(function(d, i) { return x(i) })
          .y(function(d, i) { return y(baseline) });

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

      // Add tooltip behaviors and make sure the tooltip stays open while
      // hovering with the mouse.
      this.checkTooltipVisibility = function(_this) {
        let self = _this;
        setTimeout(function () {
          if (!self.tooltip_container.node().matches(':hover') && self.focussed_point != null && !self.focussed_point.matches(':hover')) {
          // Make the tooltip invisible.
          self.tooltip_container.transition()
            .duration(0)
            .style("visibility", 'hidden');
          self.focussed_point = null;
          }
          else {
            self.checkTooltipVisibility(_this);
          }
        }, 100);
      }

      // Add the scatterplot.
      this.chart.selectAll("dot")
        .data(data)
        .enter().append("circle")
        .attr("r", self.point_radius)
        .attr("cx", function(d, i) { return x(i); })
        .attr("cy", function(d, i) { return self.getNullableY(y, d, i, data); })
        .attr("class", function(d, i) { return Number.isNaN(d) ? 'hidden' : ''});

      // Add a transparent layer on top to extend the mouse areas.
      this.chart.selectAll("dot")
        .data(data)
        .enter().append("circle")
        .attr("r", 10)
        .attr('fill', 'transparent')
        .attr("cx", function(d, i) { return x(i); })
        .attr("cy", function(d, i) { return self.getNullableY(y, d, i, data); })
        .attr("i", function(d, i) { return i; })
        .on("mouseenter", function(event, d) {
          if (!self.hasTooltips()) {
            return;
          }

          let tooltip_content = self.tooltip(event.target.attributes.i.value);
          if (!tooltip_content) {
            return;
          }

          self.focussed_point = this;

          // Set the tooltip content.
          self.tooltip_container.html(tooltip_content);

          // Position the tooltip.
          let tooltip_width = self.tooltip_container.node().getBoundingClientRect().width;
          let tooltip_height = self.tooltip_container.node().getBoundingClientRect().height;
          self.tooltip_container
            .style("left", (event.pageX - event.offsetX + event.target.cx.baseVal.value - tooltip_width / 2 + 2) + "px")
            .style("top", (event.pageY - event.offsetY + event.target.cy.baseVal.value - tooltip_height - 2) + "px");

          // Make the tooltip visible.
          self.tooltip_container.transition()
            .duration(0)
            .style("visibility", 'visible');
        })
        .on("mouseleave", function(d) {
          if (!self.hasTooltips()) {
            return;
          }
          self.checkTooltipVisibility(self);
        });
    }

    /**
     * Render the chart.
     */
    render() {
      this.render_line(this.data, this.baseline);
    }

    /**
     * Update the chart with new data.
     */
    update(data, baseline) {
      this.data = data;
      this.baseline = baseline;
      this.render();
    }
  }

  global.SparkLine = SparkLine;

})));