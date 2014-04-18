@formatMoney = ->
  $(".currency").each(()->
      c = $(this).text()
      # Do not proceed if it's already been formatted
      return true if c[0] is "$"
      c = accounting.formatMoney(Number(c), precision:0)
      $(this).text(c)
    )
@shade = (color, percent) ->
  f = parseInt(color.slice(1), 16)
  t = (if percent < 0 then 0 else 255)
  p = (if percent < 0 then percent * -1 else percent)
  R = f >> 16
  G = f >> 8 & 0x00FF
  B = f & 0x0000FF
  "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1)



@makeStackedChart = (data,target, showXAxis=true, receivedColors=["#f9b314", "#eb0000", "#2fb0c4", "#3f4040", "#695b94"])->

  n = receivedColors.length # number of layers
  has2Samples = _.isArray(data[0])
  m = if has2Samples then 2 else 1

  stack = d3.layout.stack()
  # Transorm data, an object literal, into an array that can be fed into the function below
  d = [0..n-1].map((i)->
            if has2Samples
              [0..1].map((j)->
                {x: j, y: parseFloat(data[j][i].toFixed(2))}
              )
            else
              [{x: 0, y: parseFloat(data[i].toFixed(2))}]
           )
  layers = stack(d)


  #the largest single layer
  yGroupMax = d3.max(layers, (layer)-> d3.max(layer, (d)-> d.y ) )
  #the largest stack
  yStackMax = d3.max(layers, (layer)-> d3.max(layer, (d)-> d.y0 + d.y ) )
  yStackMax = if yStackMax < 60 then 60 else yStackMax

  bottomMargin = if showXAxis then 40 else 0
  margin  = {top: 0, right: 5, bottom: bottomMargin, left: 0}
  width   = 375 - margin.left - margin.right
  itemHeight = if has2Samples then 15 else 80
  height  = (itemHeight*m) - margin.top - margin.bottom

  x = d3.scale.linear()
      .domain([0, yStackMax])
      .range([0, width])
  y = d3.scale.ordinal()
      .domain(d3.range(m))
      .rangeRoundBands([2, height], .08)
  color = (i)-> receivedColors[i]
  svg = d3.select(target).append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom + 40)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
  layer = svg.selectAll(".layer")
      .data(layers)
      .enter()
        .append("g")
        .attr("class", "layer")
        .style("fill", (d, i)-> color(i) )
  layer.selectAll("rect")
      .data((d)-> d)
      .enter()
        .append("rect")
        .attr("y", (d)->
            base = y(d.x)
            if has2Samples
              if d.x is 1
                base + 40
              else
                base
            else
              base
          )
        .attr("x", (d)-> x(d.y0))
        .attr("height", y.rangeBand())
        .attr("width", (d)-> x(d.y))

  # layer.selectAll("text")
  #   .data((d)-> d)
  #   .enter()
  #   .append("text")
  #   .text((d)-> d.y )
  #   .attr("font-family", "sans-serif")
  #   .attr("font-size", "11px")
  #   .attr("fill", "white")
  #   .attr("y", (d, i)->
  #       h = margin.top + (height * (i + 1))/2
  #       if has2Samples
  #         if d.x is 1
  #           h
  #         else
  #           h - 17
  #       else h

  #     )
  #   .attr("x", (d)-> ((d.y0 + (d.y/2))/yStackMax * width) - parseInt(String(d.y).split("").length * 3))
  xAxis = d3.svg.axis()
      .scale(x)
      .tickSize(0.8)
      .tickPadding(6)
      .orient("bottom")
  if showXAxis
    axisPos = if has2Samples
      height + 20
    else
      height
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + axisPos + ")")
        .call(xAxis)