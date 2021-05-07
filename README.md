# d3-sparkline
An D3 implementation of tuftes spark lines

## Requirements ##
Minimum d3.js v4

## Usage ##

Embed dependencies and script, e.g.
```
  <script src="https://unpkg.com/d3@6.7.0/dist/d3.min.js"></script>
  <script src="d3-sparkline.js"></script>
```

### Define your data ###
```
  let data = [865,609,991,974,1260,1241,1158,1363,1454,1352];
```

### Sparkline simple ###
```
  <div id="sparkline"></div>
  let sparkchart = new SparkLine({
    target: '#sparkline',
    font_size: 44,
    data: data,
  });
  sparkchart.render();
```

### Sparkline with tooltips ###
```
  <div id="sparkline-tooltips"></div>
  let sparkchart_tooltips = new SparkLine({
    target: '#sparkline-tooltips',
    font_size: 44,
    data: data,
    tooltip: function(i) {
      return data[i];
    }
  });
  sparkchart_tooltips.render();
```

### Sparkline with baseline ###
```
  <div id="sparkline-baseline"></div>
  let sparkchart_baseline = new SparkLine({
    target: '#sparkline-baseline',
    font_size: 44,
    data: data,
    baseline: 1000,
    tooltip: function(i) {
      return 'value: ' + data[i] + '<br />baseline: ' + this.baseline;
    }
   });
  sparkchart_baseline.render();
```

## Options ##
Please refer to `d3-sparkline.js` for additional options.
