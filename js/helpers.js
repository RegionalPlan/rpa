(function() {
  this.formatMoney = function() {
    return $(".currency").each(function() {
      var c;
      c = $(this).text();
      if (c[0] === "$") {
        return true;
      }
      c = accounting.formatMoney(Number(c), {
        precision: 0
      });
      return $(this).text(c);
    });
  };

  this.shade = function(color, percent) {
    var B, G, R, f, p, t;
    f = parseInt(color.slice(1), 16);
    t = (percent < 0 ? 0 : 255);
    p = (percent < 0 ? percent * -1 : percent);
    R = f >> 16;
    G = f >> 8 & 0x00FF;
    B = f & 0x0000FF;
    return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
  };

  this.makeStackedChart = function(data, target, showXAxis, receivedColors) {
    var axisPos, bottomMargin, color, d, has2Samples, height, itemHeight, layer, layers, m, margin, n, stack, svg, width, x, xAxis, y, yGroupMax, yStackMax, _i, _ref, _results;
    if (showXAxis == null) {
      showXAxis = true;
    }
    if (receivedColors == null) {
      receivedColors = ["#f9b314", "#eb0000", "#2fb0c4", "#3f4040", "#695b94"];
    }
    n = receivedColors.length;
    has2Samples = _.isArray(data[0]);
    m = has2Samples ? 2 : 1;
    stack = d3.layout.stack();
    d = (function() {
      _results = [];
      for (var _i = 0, _ref = n - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
      return _results;
    }).apply(this).map(function(i) {
      if (has2Samples) {
        return [0, 1].map(function(j) {
          return {
            x: j,
            y: parseFloat(data[j][i].toFixed(2))
          };
        });
      } else {
        return [
          {
            x: 0,
            y: parseFloat(data[i].toFixed(2))
          }
        ];
      }
    });
    layers = stack(d);
    yGroupMax = d3.max(layers, function(layer) {
      return d3.max(layer, function(d) {
        return d.y;
      });
    });
    yStackMax = d3.max(layers, function(layer) {
      return d3.max(layer, function(d) {
        return d.y0 + d.y;
      });
    });
    yStackMax = yStackMax < 60 ? 60 : yStackMax;
    bottomMargin = showXAxis ? 40 : 0;
    margin = {
      top: 0,
      right: 5,
      bottom: bottomMargin,
      left: 0
    };
    width = 375 - margin.left - margin.right;
    itemHeight = has2Samples ? 25 : 80;
    height = (itemHeight * m) - margin.top - margin.bottom;
    x = d3.scale.linear().domain([0, yStackMax]).range([0, width]);
    y = d3.scale.ordinal().domain(d3.range(m)).rangeRoundBands([2, height], .08);
    color = function(i) {
      return receivedColors[i];
    };
    svg = d3.select(target).append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom + 40).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    layer = svg.selectAll(".layer").data(layers).enter().append("g").attr("class", "layer").style("fill", function(d, i) {
      return color(i);
    });
    layer.selectAll("rect").data(function(d) {
      return d;
    }).enter().append("rect").attr("y", function(d) {
      var base;
      base = y(d.x);
      if (has2Samples) {
        if (d.x === 1) {
          return base + 40;
        } else {
          return base;
        }
      } else {
        return base;
      }
    }).attr("x", function(d) {
      return x(d.y0);
    }).attr("height", y.rangeBand()).attr("width", function(d) {
      return x(d.y);
    });
    xAxis = d3.svg.axis().scale(x).tickSize(0.8).tickPadding(6).orient("bottom");
    if (showXAxis) {
      axisPos = has2Samples ? height + 20 : height;
      return svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + axisPos + ")").call(xAxis);
    }
  };

}).call(this);
