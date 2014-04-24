class Workspace extends Backbone.Router
  routes:
    "maps/schools.html"       : "schools"
    "maps/vulnerable.html"    : "vulnerable"
    "maps/discretionary.html" : "discretionary"
    "maps/walkability.html"   : "walkability"
    "maps/property.html"      : "property"
    "maps/carbon.html"        : "carbon"
    "maps/governance.html"    : "governance"

  governance: ->

    moveLayerTracker = (state)->
      # Move the layer_tracker's active state
      $("#layer_tracker li").removeClass("active")
      $("#layer_tracker li").slice(0,state).map((l)->
        $(this).addClass("active")
      )
    moveSlide = (state)->
      $(".slides img").removeClass("active")
      i = state - 1
      console.log i
      $(".slides img:eq(#{i})").addClass("active")



    slideshow = undefined
    max = 10
    clickerState = 1
    $("#clicker").on "click", (e)->
      # figure out if it's a prev or next
      $a = $(e.target).closest("a")
      if $a.hasClass("prev")
        clickerState = (if clickerState is 1 then max - 1 else clickerState - 1)
      else if $a.hasClass("next")
        clickerState = (if clickerState is max - 1 then 1 else clickerState + 1)

      moveLayerTracker(clickerState)
      moveSlide(clickerState)


  _governance: ->
    id = "governance"
    url = "http://rpa.cartodb.com/api/v2/viz/6f7a3bee-c3ed-11e3-ad6c-0edbca4b5057/viz.json"
    cartodb
      .createVis(id, url, searchControl: true, layer_selector: false, legends: true, cartodb_logo:false, scrollwheel: false, center_lat: 40.7, center_lon: -73.9, zoom:10)
      .done (vis,layers)->
        layer = layers[1]
        region = layer.getSubLayer(0)


        tables =
          region:
            c: "#ff0000"
            n: "rpa_region_u83_line"
          states:
            c:
              ct: "#000000"
              ny: "#ff0000"
              nj: "#ffff00"
            n: "states"
          counties:
            c: "#ffffff"
            n: "counties"
          municipalities:
            c: "#ffffff"
            n: [
              "nj_towns"
              "ct_towns"
              "ny_towns"
            ]
          school_districts:
            c: "#ffffff"
            n: "school_districts2014"
          fire_districts:
            c: "#ffffff"
            n: "rpa_spcialdistricts_v2_fire"
          sewer_districts:
            c: "#ffffff"
            n: "rpa_spcialdistricts_v2_sewer"
          housing_authorities:
            c: "#ffffff"
            n: "rpa_housing_authorities"
          bids:
            c: "#ffffff"
            n: "rpa_bid"


        _.each tables,(table,k)->
          sql = undefined
          css = undefined
          t = table.n
          if _.isArray(t)
            q = _.map t, (n)->
                "SELECT #{n}.cartodb_id, #{n}.the_geom, #{n}.the_geom_webmercator FROM #{n}"
            sql = q.join(" UNION ALL ")
          else
            sql = "SELECT * FROM #{t}"
          if _.isObject(table.c)
            # TODO: each state should have a different polygon
            css =  """
                    ##{t} [name="New York"] {
                      polygon-fill: #{table.c.ny};
                    }
                    ##{t} [name="New Jersey"] {
                      polygon-fill: #{table.c.nj};
                    }
                    ##{t} [name="Connecticut"] {
                      polygon-fill: #{table.c.ct};
                    }
                  """
          else
            hex = table.c
            if table.n is "rpa_region_u83_line"
              css = """
                      ##{t} {
                        line-color: #{hex};
                      }
                    """
            else
              css =  """
                      ##{t} {
                        marker-fill: #{hex};
                        marker-line-color: #{hex};
                        marker-line-width: 1;
                      }
                    """
          table.sublayer = layer.createSubLayer(
            sql: sql,
            cartocss: css
          )

        sublayers = _.map _.toArray(tables), (t)-> t.sublayer
        clickerState = 1
        # hide the sublayers after the clicker state
        sublayers.slice(clickerState).map((l)-> l.hide())
        $("#clicker").on "click", (e)->
          # figure out if it's a prev or next
          a = e.target
          clickerState = if a.classList.contains("prev")
            if clickerState is 1 then sublayers.length-1 else clickerState - 1
          else
            if clickerState is sublayers.length-1 then 1 else clickerState + 1

          # hide the sublayers after the clicker state
          sublayers.slice(clickerState).map((l)-> l.hide())
          # show the sublayers before the clicker state
          sublayers.slice(0,clickerState).map((l)-> l.show())

          # Move the layer_tracker's active state
          $("#layer_tracker li").removeClass("active")
          $("#layer_tracker li").slice(0,clickerState).map((l)->
            $(this).addClass("active")
          )


  carbon: ->
    id = "carbon"
    url = "http://rpa.cartodb.com/api/v2/viz/7d0015c0-aed2-11e3-a656-0e73339ffa50/viz.json"
    cartodb
      .createVis(id, url, searchControl: true, layer_selector: false, legends: true, cartodb_logo:false, scrollwheel: false, center_lat: 40.7, center_lon: -73.9, zoom:10)
      .done (vis,layers)->
        map = vis.getNativeMap()

        layer = layers[1]
        layer_county = layers[1].getSubLayer(0)
        layer_zip = layers[1].getSubLayer(1)
        layer.setInteraction(true)
        layer_zip.hide()

        default_sublayers = {county: layer_county, zip: layer_zip}

        colors =
          transport: "#f9b314"
          housing: "#eb0000"
          food: "#2fb0c4"
          goods: "#3f4040"
          services: "#695b94"
          total: "#008000" #TEMPORARY


        shared_cols = "food,goods,services,total,transport,housing"
        county_cols = "county_n,#{shared_cols}"
        zip_cols = "#{shared_cols},po_name,zip"
        columns = (table)-> if table is "rpa_carbonfootprint" then zip_cols else county_cols

        # Describe and define the sublayers
        tables = ["rpa_carbonfootprint","rpa_carbonfootprint_county"]
        sublayers = {}

        _.each(tables,(table,k)->
          others = ", " + columns(table)
          sql = "SELECT #{table}.cartodb_id, #{table}.the_geom, #{table}.the_geom_webmercator #{others} FROM #{table}"

          # Create the CSS
          _.each(colors, (hex, column)->
              css = """
                      ##{table} [#{column} > 60] {
                        //Darkest
                        polygon-fill: #{hex};
                      }
                      ##{table} [#{column} > 40][#{column} < 60] {
                        //Lighter
                        polygon-fill: #{shade(hex,-0.1)};
                      }
                      ##{table} [#{column} < 40] {
                        //Lightest
                        polygon-fill: #{shade(hex,-0.2)};
                      }
                    """
              interactivity = ["cartodb_id"]
              interactivity = interactivity.concat(columns(table).split(","))
              sublayer = layer.createSubLayer(
                sql: sql,
                cartocss: css
                interactivity: interactivity
              )
              tlayers = sublayers[column]
              t = {}
              t[table] = sublayer
              if tlayers
                sublayers[column] = _.extend(tlayers, t)
              else
                sublayers[column] = t
            )
        )

        # Create a tooltip for every single sublayer
        _.each(sublayers,(value,layer_name)->
          _.each(tables, (table)->
            vis.addOverlay(
              layer: value[table]
              type: 'tooltip'
              offset_top: -30
              template: """
                <h3 class="title-case">
                  Avg. household carbon emissions (MTCO2E)
                </h3>
                {{#county_n}}
                  <b>County: <span>{{county_n}}</span></b>
                {{/county_n}}
                {{#zip}}
                  <b>Zip code: <span>{{zip}}</span></b>
                {{/zip}}
                <div class="progressive">

                </div>
                <div class="tooltip-legend clearfix">
                  <div class="food">Food</div>
                  <div class="goods">Goods</div>
                  <div class="services">Services</div>
                  <div class="transport">Transport</div>
                  <div class="housing">Housing</div>
                </div>
              """
            )
          )
        )
        adjust_layer_vis = (opts)->
          default_sublayers[opts["show"]].show()
          default_sublayers[opts["hide"]].hide()

        activeSublayer = "total"
        adjust_sublayer_vis = (opts)->
          # loop through sublayer and show/hide layers
          _.each(sublayers, (value, layer_name)->
              value[opts["hide"]].hide()
              if layer_name is activeSublayer
                value[opts["show"]].show()
            )
        # By default, hide the zip layer, and show the county layer
        adjust_sublayer_vis(show: tables[1], hide: tables[0])

        map = vis.getNativeMap()
        map.on 'zoomend', (a,b,c)->
          $(".cartodb-tooltip").hide()
          zoomLevel = map.getZoom()
          if zoomLevel > 9
            # hide the sublayers in the county layer, show the zip layer
            adjust_sublayer_vis(show: tables[0], hide: tables[1])
            adjust_layer_vis(show: "zip", hide: "county")
          else
            # hide the sublayers in the zip layer, show the county layer
            adjust_sublayer_vis(show: tables[1], hide: tables[0])
            adjust_layer_vis(show: "county", hide: "zip")


        vent.on("tooltip:rendered", (d,$el)->
            data = [d["transport"],d["housing"],d["food"],d["goods"],d["services"]]
            makeStackedChart(data, $el.find(".progressive").get(0))
          )
        vent.on "infowindow:rendered", (d, $el)->
          return if d["null"] is "Loading content..."
          data = [d["transport"],d["housing"],d["food"],d["goods"],d["services"]]
          region = [12.7, 11.7, 8.0, 6.0, 6.8]
          makeStackedChart([data,region], $el.find(".progressive").get(0), true)

        $("#layer_selector li").on "click", (e)->
          $li = $(e.target)
          $li.siblings("li").removeClass("active")
          $li.addClass("active")

          layerName = $li.data("sublayer")
          activeSublayer = layerName
          legend = $(".cartodb-legend .cartodb-legend")
          legend.removeClass()
          legend.addClass("cartodb-legend #{layerName}-layer")

          zoomLevel = map.getZoom()
          current_table = if zoomLevel > 9 then tables[0] else tables[1]
          _.each(sublayers, (sublayer,k)->
            sublayer[current_table].hide()
          )
          sublayers[layerName][current_table].show()


  property: ->
    id = "property"
    url = "http://rpa.cartodb.com/api/v2/viz/f368bbb4-aebd-11e3-a057-0e10bcd91c2b/viz.json"
    cartodb
      .createVis(id, url, searchControl: true, layer_selector: false, legends: true, cartodb_logo:false, scrollwheel: false, center_lat: 40.7, center_lon: -73.9, zoom:10)
      .done (vis,layers)->
        map = vis.getNativeMap()

        color1 = "#ffefc9"
        color2 = "#fdde9c"
        color3 = "#80c5d8"
        # Create the sublayer for subway routes
        layers[1].setInteraction(true)
        propertyLayerNoNYC = layers[1].getSubLayer(0)
        propertyLayerNYC = layers[1].getSubLayer(1)

        propertyLayerNoNYC = propertyLayerNoNYC.setInteractivity("namelsad10, localname, retaxrate, retax_acs, med_val")
        propertyLayerNYC = propertyLayerNYC.setInteractivity("namelsad10, localname, retaxrate, retax_acs, med_val")

        # Start with NYC layer well hidden
        propertyLayerNYC.hide()

        tooltip = new cdb.geo.ui.Tooltip(
            template: """
              <div class="cartodb-popup">
                 <div class="cartodb-popup-content-wrapper">
                    <div class="cartodb-popup-content">
                      <p><b>{{namelsad10}}</b></p>
                      <p>{{localname}}</p>
                      <p class="property-tax">Property tax: <b class="tax-rate">{{retaxrate}}</b></p>
                    </div>
                 </div>
              </div>
            """
            layer: propertyLayerNoNYC
            offset_top: -50
        )
        vis.container.append(tooltip.render().el)

        tooltip2 = new cdb.geo.ui.Tooltip(
            template: """
              <div class="cartodb-popup">
                 <div class="cartodb-popup-content-wrapper">
                    <div class="cartodb-popup-content">
                      <p><b>{{namelsad10}}</b></p>
                      <p>{{localname}}</p>
                      <p class="property-tax">Property Tax: <b class="tax-rate">{{retaxrate}}</b></p>
                    </div>
                 </div>
              </div>
            """
            layer: propertyLayerNYC
            offset_top: -50
        )
        vis.container.append(tooltip2.render().el)


        map = vis.getNativeMap()
        map.on 'zoomend', (a,b,c)->
          zoomLevel = map.getZoom()
          if zoomLevel > 9
            propertyLayerNoNYC.hide()
            propertyLayerNYC.show()
          else
            propertyLayerNoNYC.show()
            propertyLayerNYC.hide()


        rate_to_color = (rate)->
          rate = parseFloat(rate)
          if rate <= 0.005
            "color1"
          else if rate > 0.005 and rate <= 0.01
            "color2"
          else if rate > 0.01 and rate <= 0.015
            "color3"
          else if rate > 0.015 and rate <= 0.02
            "color4"
          else if rate > 0.02
            "color5"
        vent.on("tooltip:rendered", (data, $el)->
            $(".tax-rate").text((parseFloat(data["retaxrate"])*100).toFixed(2)+"%")
            color = rate_to_color(data["retaxrate"])
            $el.find(".property-tax").attr("id", color)
          )

  walkability: ->
    id = "walkability"
    url = "http://rpa.cartodb.com/api/v2/viz/e2c8a5ba-ae10-11e3-87a1-0e230854a1cb/viz.json"
    cartodb
      .createVis(id, url, searchControl: true, layer_selector: false, legends: false, cartodb_logo:false, scrollwheel: false, center_lat: 40.7, center_lon: -73.9, zoom:10)
      .done (vis,layers)->
        map = vis.getNativeMap()

        color1 = "#fae2ab"
        color2 = "#ffbb67"
        color3 = "#a6a9de"
        color4 = "#8e6eb1"
        color5 = "#753384"



        # TODO: how can we interpret the walkability score? (walk_score)
        # Create the sublayer for subway routes
        layer = layers[1]
        layer.setInteraction(true)
        walkabilityLayer = layer.getSubLayer(0)

        station_layers = [
            {
              type: "Train station"
              name_column: "stn_name"
              table: "rpa_alltransit_stations"
            }
            {
              type: "Subway station"
              name_column: "station_na"
              table: "rpa_subwaystations"
            }
          ]
        # Describe and define the sublayers
        _.each(station_layers,(value,k)->
          table = value["table"]
          ret = "#{table}.cartodb_id,#{table}.the_geom, #{table}.the_geom_webmercator, #{table}.#{value['name_column']}"
          sql = "SELECT #{ret} FROM #{table}"

          # Create the CSS
          dot_color = "#606060"
          css = """
                  ##{table} {
                    marker-fill: #{dot_color};
                    marker-line-width:0;
                    ::line {
                      line-width: 1;
                    }
                    [zoom <= 10] {
                      marker-width: 4;
                    }
                    [zoom > 10] {
                      marker-width: 6;
                    }

                    ::labels {
                      text-name: [#{value['name_column']}];
                      text-face-name: 'DejaVu Sans Book';
                      text-size: 12;
                      text-label-position-tolerance: 10;
                      text-fill: #ffffff;
                      text-halo-fill:  transparent;
                      text-halo-radius: 1;
                      text-dy: -10;
                      text-allow-overlap: false;
                      text-placement: point;
                      text-placement-type: simple;

                      [zoom > 10]{

                      }

                      [zoom <= 10]{
                        text-fill:transparent;
                        text-halo-fill: transparent;
                      }
                    }
                  }
                """

          if table is "rpa_subwaystations"
            css += "##{table}[zoom < 10] {marker-opacity: 0;}"

          if sql and css
            interactivity = ["cartodb_id", value['name_column']]
            sublayer = layer.createSubLayer(
              sql: sql,
              cartocss: css
              interactivity: interactivity
            )
            value["layer"] = sublayer
        )


        walkabilityLayer = walkabilityLayer.setInteractivity("cartodb_id, namelsad10, locality, walk_score, walk_sco_1")


        tooltip = new cdb.geo.ui.Tooltip(
            template: """
              <div class="cartodb-popup">
                 <div class="cartodb-popup-content-wrapper">
                    <div class="cartodb-popup-content">
                      <div class='title'>
                        <b>{{locality}}</b>
                        <p>{{namelsad10}}</p>
                      </div>
                      <div class="clearfix">
                        <div class="progress walk_score pull-left" style="margin-bottom:5px;width:100%"><div class="progress-bar" style="width:{{walk_score}}%"></div></div>
                        <div class="pull-left">Walk Score®: <b class="walkability-score">{{walk_score}}</b></div>
                      </div>
                    </div>
                 </div>
              </div>
            """
            layer: walkabilityLayer
            offset_top: -50
        )
        vis.container.append(tooltip.render().el)

        infowindow =
          """
            <div class="cartodb-popup">
              <a href="#close" class="cartodb-popup-close-button close">x</a>
              <div class="cartodb-popup-content-wrapper">
                <div class="cartodb-popup-content">
                  <div class='title'>
                    <b>{{content.data.locality}}</b>
                    <p>{{content.data.namelsad10}}</p>
                  </div>
                  <div class="clearfix" style="margin-bottom:5px">
                    <div class="progress walk_score pull-left" style="width:100%"><div class="progress-bar" style="width:{{content.data.walk_score}}%"></div></div>
                    <div class="pull-left">Walk Score®: <b class="walkability-score">{{content.data.walk_score}}</b></div>
                  </div>

                  <div style="color:#ccc;font-size:0.9em;border-top:solid 1px #ccc;padding-top:3px;margin-top:10px;margin-bottom:10px">Other scores</div>

                  <div class="clearfix" style="margin-bottom:5px">
                    <div class="progress pull-left" style="width:100%"><div class="progress-bar" style="width:{{content.data.dining_and}}%"></div></div>
                    <div class="pull-left">Dining and restaurant: <b class="walkability-score">{{content.data.dining_and}}</b></div>
                  </div>


                  <div class="clearfix" style="margin-bottom:5px">
                    <div class="progress pull-left" style="width:100%"><div class="progress-bar" style="width:{{content.data.shopping_s}}%"></div></div>
                    <div class="pull-left">Shopping: <b class="walkability-score">{{content.data.shopping_s}}</b></div>
                  </div>

                  <div class="clearfix" style="margin-bottom:5px">
                    <div class="progress pull-left" style="width:100%"><div class="progress-bar" style="width:{{content.data.culture_sc}}%"></div></div>
                    <div class="pull-left">Culture: <b class="walkability-score">{{content.data.culture_sc}}</b></div>
                  </div>

                </div>
              </div>
              <div class="cartodb-popup-tip-container"></div>
            </div>
          """
        walkabilityLayer.infowindow.set('template', infowindow)

        score_to_color =
          "Very Car Dependent": "#fae2ab"
          "Somewhat Car Dependent": "#ffbb67"
          "Somewhat Walkable": "#a6a9de"
          "Very Walkable": "#8e6eb1"
          "Walker's Paradise": "#753384"


        vent.on "infowindow:rendered", (obj,$el)->
          return if obj["null"] is "Loading content..."
          data = obj.content.data

          color = score_to_color[data["walk_sco_1"]]
          $el.find(".progress .progress-bar").css("background-color", "#8e8e8e")
          $el.find(".progress.walk_score .progress-bar").css("background-color", color)

          $el.find(".walkability-score").each(->
              text = $(this).text()
              return unless text
              $(this).text(parseFloat(text).toFixed(0))
            )

        vent.on "tooltip:rendered", (data,$el)->
          color = score_to_color[data["walk_sco_1"]]

          $el.find(".progress.walk_score .progress-bar").css("background-color", color)

  schools: ->
    cartodb
      .createVis('schools', 'http://rpa.cartodb.com/api/v2/viz/5bc0d9be-a264-11e3-bc17-0e10bcd91c2b/viz.json', searchControl: true, layer_selector: false, legends: true, cartodb_logo:false, scrollwheel: false, center_lat: 40.7, center_lon: -73.9, zoom:10)
      .done (vis,layers)->
        map = vis.getNativeMap()

        # Create the sublayer for subway routes
        layers[1].setInteraction(true)
        raceLayer = layers[1].getSubLayer(0)

        schoolLayer = layers[1].getSubLayer(1)
        schoolLayer = schoolLayer.setInteractivity("cartodb_id, schlrank, rank_perce, schnam, localname, namelsad10, hh_median, whiteprcnt")
        # SELECT schools.*, poverty.hh_median FROM schoolperformancerank2012_withlocalities_rpare as schools INNER JOIN schoolrank2012_racepoverty_income_rparegion as poverty ON schools.namelsad10 = poverty.namelsad10

        tooltip = new cdb.geo.ui.Tooltip(
          template: """
            <div class="cartodb-popup">
               <div class="cartodb-popup-content-wrapper">
                  <div class="cartodb-popup-content">
                    <div class="title">
                      <b>{{schnam}}</b>
                      <p>{{localname}} ({{namelsad10}})</p>
                    </div>
                    <div class="clearfix rank-container ">
                      {{#rank_perce}}
                        <div class="progress" style="height:5px;-webkit-border-radius:0;position:relative;overflow: visible;width:95%">
                          <div class="progress-bar low" style="width:25%;background-color:#dc0000;"></div>
                          <div class="progress-bar average" style="width:50%;background-color:#70706e;"></div>
                          <div class="progress-bar high" style="width:25%;background-color:#0c7caa;"></div>
                          <span class="dot">•</span>
                        </div>
                      {{/rank_perce}}
                      <b>School rank</b>:<b class="school-rank">{{rank_perce}}</b>
                    </div>

                    {{#hh_median}}
                      <div class="clearfix rank-container">
                        <div class="progress" style="height:5px;-webkit-border-radius:0;position:relative;overflow: visible;width:95%">
                          <div class="progress-bar low" style="width:20%;background-color:#f2f0ee;"></div>
                          <div class="progress-bar average" style="width:20%;background-color:#e5e1dd;"></div>
                          <div class="progress-bar high" style="width:20%;background-color:#d7d2cc;"></div>
                          <div class="progress-bar progress-bar-warning" style="width:20%;background-color:#cbc4bd;"></div>
                          <div class="progress-bar progress-bar-warning" style="width:20%;background-color:#beb4aa;"></div>
                          <span class="dot">•</span>
                        </div>
                        <b>Median household income</b>: <b class="hh-rank currency">{{hh_median}}</b>
                      </div>
                    {{/hh_median}}
                    {{^hh_median}}
                      <i>No data available</i>
                    {{/hh_median}}





                    {{#whiteprcnt}}
                      <div class="clearfix rank-container">
                        <div class="progress" style="height:5px;-webkit-border-radius:0;position:relative;overflow: visible;width:95%">
                          <div class="progress-bar low" style="width:20%;background-color:#f5f5f5;"></div>
                          <div class="progress-bar average" style="width:20%;background-color:#e8e8e4;"></div>
                          <div class="progress-bar high" style="width:20%;background-color:#daded5;"></div>
                          <div class="progress-bar progress-bar-warning" style="width:20%;background-color:#cdd3c3;"></div>
                          <div class="progress-bar progress-bar-warning" style="width:20%;background-color:#b5c0a6;"></div>
                          <span class="dot">•</span>
                        </div>
                        <b>Percentage of white population</b>: <b class="race-rank">{{whiteprcnt}}</b>
                      </div>
                    {{/whiteprcnt}}
                    {{^whiteprcnt}}
                      <i>No data available</i>
                    {{/whiteprcnt}}
                  </div>
               </div>
            </div>
          """
          layer: schoolLayer
          offset_top: -50
        )
        vis.container.append(tooltip.render().el)




        vent.on("tooltip:rendered", (data)->
            rank = data["rank_perce"]
            if rank is 0
              $(".school-rank").html(" <i> No data available</i>")
            else
              rank = (parseFloat(rank) * 100).toFixed(0)
              $(".school-rank").text("#{rank}%").parent().find(".dot").css("left","#{rank}%")

            hhRank = data["hh_median"]
            hhRank = hhRank / 250000
            hhRank = (parseFloat(hhRank) * 100).toFixed(0)
            $(".hh-rank").parent().find(".dot").css("left","#{hhRank}%")

            raceRank = data["whiteprcnt"]
            raceRank = (parseFloat(raceRank) * 100).toFixed(0)
            $(".race-rank").text("#{raceRank}%").parent().find(".dot").css("left","#{raceRank}%")

            formatMoney()
          )

        $("#layer_selector a").on "click", (e)->
          $a = $(e.target)
          layerName = $a.data("sublayer")

          return true if $a.hasClass("active")

          activeLink =  $a.parent().find(".active")
          activeLink.removeClass("active")

          # Toggle the active class
          $a.toggleClass("active")

          activeSublayer = $a.data("sublayer")


          if activeSublayer is "race"
            table = "whiteprcnt"
            color = "#b5c0a6"
            borders = [0.1,0.25,0.50,0.75,1]
          else
            table = "hh_median"
            color = "#beb4aa"
            borders = [40125,57344,76061,99075,250000]
          # TODO: change the css on the racepoverty layer
          css = """
              #schoolrank2012_racepoverty_income_rparegion{

                polygon-fill: #{color};

                [ #{table} <= #{borders[0]}] {
                   polygon-opacity: 0.2;
                }
                [ #{table} > #{borders[0]}][ #{table} <= #{borders[1]}] {
                   polygon-opacity: 0.4;
                }
                [ #{table} > #{borders[1]}][ #{table} <= #{borders[2]}] {
                   polygon-opacity: 0.6;
                }
                [ #{table} > #{borders[2]}][ #{table} <= #{borders[3]}] {
                   polygon-opacity: 0.8;
                }
                [ #{table} > #{borders[3]}][ #{table} <= #{borders[4]}] {
                   polygon-opacity: 1;
                }
              }
            """
          raceLayer.setCartoCSS(css)

          $(".race-legend").toggle()
          $(".hh-legend").toggle()



  vulnerable: ->
    cartodb
      .createVis('vulnerable', 'http://rpa.cartodb.com/api/v2/viz/533c5970-9f4f-11e3-ad24-0ed66c7bc7f3/viz.json', cartodb_logo:false, scrollwheel: false, center_lat: 40.7, center_lon: -73.9, zoom:11, searchControl: true, layer_selector: false, legends: true, zoomControl: true)
      .done (vis,layers)->
        map = vis.getNativeMap()

        layer = layers[1]
        floodZoneLayer = layer.getSubLayer(0)
        layer.setInteraction(true)

        # Declare the database tables backing the layers
        affected = "#fc4f4b"
        dbs = {
          power_plants: {
            flood_column: "flood"
            type: "Power plant"
            name_column: "plant_name"
            loss_column: "total_cap"
            affected_type: "Capacity (MWh)"
            localities: true
            tables: ["rpa_powerplants_eia_latlong_withlocalities_201"]
          }
          hospitals: {
            flood_column: "flood"
            type: "Hospital"
            name_column: "name"
            loss_column: "total_beds"
            affected_type: "Number of beds"
            localities: true
            tables: [
              "rpa_nj_hsip_hospitals_compressed_withlocalitie"
              "ny_rpa_hospitalsnamesbeds_withlocalities"
              "rpa_ct_hospitals_names_beds_withlocalities"
            ]
          }
          nursing_homes:{
            flood_column: "flood"
            type: "Nursing home"
            name_column: "name"
            loss_column: "beds"
            affected_type: "Number of beds"
            localities: true
            tables: [
              "rpa_ct_nursinghomes_namesaddressesbeds_withloc"
              "rpa_nj_hsip_nursinghomes_compressed_withlocali"
              "ny_rpa_nursinghomesnamesbedsflood_withlocaliti"
            ]
          }
          public_housing: {
            flood_column: "flood"
            type: "Public housing"
            name_column: "project_na"
            loss_column: "total_unit"
            affected_type: "Affected units"
            localities: true
            tables: [
              "publichousing_rparegion_1"
            ]
          }
          train_stations: {
            flood_column: "flood"
            type: "Train station"
            name_column: "station_na"
            affected_type: "Affected stations"
            loss_column: false
            localities: false
            tables: [
              "rpa_trainstations"
            ]
          }
          rail_lines: {
            flood_column: "flood"
            type: "Rail line"
            name_column: "line_name"
            affected_type: "Affected units"
            loss_column: false
            localities: false
            tables: ["rpa_raillines_flood"]
            no_tooltip: true
          }
          subway_stations: {
            flood_column: "flood"
            type: "Subway station"
            name_column: "station_na"
            loss_column: false
            affected_type: "Affected stations"
            localities: false
            tables: [
              "rpa_subwaystations"
            ]
          }
          subway_routes: {
            flood_column: "am"  #TODO: replace with the real column
            type: "Subway route"
            name_column: "route_name"
            loss_column: false
            affected_type: "Affected routes"
            localities: false
            tables: [
              "rpa_subwayroutes_flood"
            ]
            no_tooltip: true
          }
          subway_yards: {
            flood_column: "flood"
            type: null
            name_column: "yard_name"
            loss_column: false
            affected_type: "Affected yards"
            localities: false
            tables: [
              "nyct_subway_yards"
            ]
          }
          transit_tunnels: {
            flood_column: "flood"
            type: null
            name_column: "name"
            loss_column: "carries"
            affected_type: "Services"
            localities: false
            tables: [
              "nyc_transit_tunnels2014"
              "nyc_train_crossings_for_map"
            ]
          }
          airports: {
            flood_column: "flood"
            type: null
            name_column: "name"
            loss_column: false
            affected_type: "Affected airports"
            localities: false
            tables: [
              "rpa_majorregionalairports_042014"
            ]
          }
          ports: {
            flood_column: "flood"
            type: null
            name_column: "name"
            loss_column: false
            affected_type: "Affected ports"
            localities: false
            tables: [
              "rpa_ports_042014"
            ]
          }
          elem_schools: {
            flood_column: "flood"
            type: "Elementary school"
            name_column: "schnam"
            loss_column: false
            affected_type: "Affected schools"
            localities: false
            tables: [
              "elem_schools"
            ]
          }
        }

        # Describe and define the sublayers
        _.each(dbs,(value,k)->
          # Take a union of all the tables
          sql = _.map(value["tables"], (table)->
              ret = "#{table}.cartodb_id,#{table}.#{value['flood_column']}, #{table}.the_geom, #{table}.the_geom_webmercator, #{table}.#{value['name_column']}"
              ret = ret + ", #{table}.localname" if value["localities"]
              ret = ret + ", #{table}.#{value["loss_column"]}" if value["loss_column"]
              "SELECT #{ret} FROM #{table}"
            )
          sql = sql.join(" UNION ALL ")
          # Create the CSS
          notAffected = "#adadad"
          css = _.map(value["tables"], (table)->
              """
                ##{table} {

                  marker-line-width:1;
                  marker-line-color:white;


                  ::line {
                    line-width: 1;
                    line-color: #{affected};
                  }
                  marker-fill: #{notAffected};
                  [#{value['flood_column']} < 1]{
                    marker-fill: #{notAffected};
                    marker-width: 10px;
                  }
                  [#{value['flood_column']} = 1]{
                    marker-fill: #{affected};
                    marker-width: 15px;
                  }
                }
              """
            )
          css = css.join(" ")

          if sql and css
            interactivity = ["cartodb_id", value['name_column']]
            if value["loss_column"]
              interactivity.push(value['loss_column'])
            if value['localities']
              interactivity.push("localname")
            if value['flood_column']
              interactivity.push(value["flood_column"])
            sublayer = layer.createSubLayer(
              sql: sql,
              cartocss: css
              interactivity: interactivity
            )
            value["layer"] = sublayer
        )

        # Create a tooltip for every single sublayer

        # TODO: make sure the flood column display the correct value

        _.each(dbs,(value,k)->
          return if value.no_tooltip
          vis.addOverlay(
            layer: value["layer"]
            type: 'tooltip'
            offset_top: -30
            template: """
              <div class="cartodb-popup">
                <div class="cartodb-popup-content-wrapper">
                  <div class="cartodb-popup-content">
                    <div class="title">
                      <b>{{ #{value['name_column']} }}</b>
                      {{#localname}}
                        <p>{{localname}}</p>
                      {{/localname}}
                    </div>

                    {{##{value['type']}}}
                      <div>
                        #{value['type']}
                      </div>
                    {{/#{value['type']}}}

                    {{##{value['loss_column']}}}
                      <p class="{{##{value['flood_column']}}}affected{{/#{value['flood_column']}}}">#{value['affected_type']}: {{ #{value['loss_column']} }}</p>
                    {{/#{value['loss_column']}}}
                  </div>
                </div>
              </div>
            """
          )
        )


        $("#layer_selector li").on "click", (e)->
          $li = $(e.target).closest("li")
          layerName = $li.data("sublayer")

          return true if $li.hasClass("active")
          return true if $li.hasClass("disabled")

          activeLi =  $li.parents("ul").find(".active")
          activeLi.removeClass("active")

          # Toggle the active class
          $li.toggleClass("active")

          activeSublayer = $li.data("sublayer")

          # Show the last active layer
          dbs_and_flood_zone = _.extend(dbs,{flood_zone: []})
          _.each(dbs_and_flood_zone, (value,k)->
            # TODO: handle the case of the All
            if activeSublayer is "All"
              value["layer"].show()
            else
              if k is "flood_zone"
                # TODO:
              else
                if k is activeSublayer or _.contains(activeSublayer, k)
                  value["layer"].show()
                else
                  value["layer"].hide()
          )
        $("#layer_selector li:eq(0)").click()

  discretionary: ->


    # DISCRETIONARY INCOME
    startZoom = 10
    cartodb
      .createVis('discretionary', 'http://rpa.cartodb.com/api/v2/viz/62e94d78-9f1e-11e3-b420-0ed66c7bc7f3/viz.json', legends: true, searchControl: true, cartodb_logo:false, scrollwheel: false, center_lat: 40.7, center_lon: -73.9, zoom: startZoom, infowindow: true, layer_selector: false)
      .done (vis,layers)->
        map = vis.getNativeMap()

        dataLayers = layers[1]
        dataLayers.setInteraction(true)


        countyLayer = dataLayers.getSubLayer(0)
        censusLayer = dataLayers.getSubLayer(1)


        countyLayer.hide()
        map.on('zoomend', (a,b,c)->
          zoomLevel = map.getZoom()
          if zoomLevel >= startZoom
            censusLayer.show()
            countyLayer.hide()
          else
            censusLayer.hide()
            countyLayer.show()
        )



        # Customize the infowindows
        colors =
          housing: "#7d2b0f"
          taxes: "#ecad12"
          transport: "#f13319"
          disp_inc: "#41b3d4"


        infoTmpl = """
            <div class="cartodb-popup">
              <a href="#close" class="cartodb-popup-close-button close">x</a>
               <div class="cartodb-popup-content-wrapper">
                  <div class="title">
                    <b>{{content.data.county}}{{content.data.localname}}</b>
                    {{# content.data.namelsad10}}
                    <p>{{content.data.namelsad10}}</p>
                    {{/ content.data.namelsad10}}
                  </div>
                  <table style="margin-bottom:10px">
                    <tr>
                      <td>
                        <b>Housing costs</b>
                        <h5 class="currency" style="margin: 0 10px 0 0;color:#{colors['housing']}">{{content.data.housingcos}}{{content.data.avg_hous}}</h5>
                      </td>
                      <td>
                        <b>Transportation costs</b>
                        <h5 class="currency" style="margin: 0 10px 0 0;color:#{colors['transport']}">{{content.data.avg_transc}}{{content.data.avg_trans}}</h5>
                      </td>
                      <td>
                        <b>Taxes</b>
                        <h5 class="currency" style="margin: 0 10px 0 0;color:#{colors['taxes']}">{{content.data.avg_ttl}}</h5>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="3" style="font-size:1.4em;padding-top:5px">
                        <b>Left-over income</b>
                        <span class="currency" style="color:#{colors['disp_inc']}">{{content.data.disp_inc}}</span>
                      </td>
                    </tr>
                  </table>

                  <div>
                    Median income: <b class="currency">{{content.data.mhi}}{{content.data.avg_mhi}}</b>
                  </div>
                  <div class="barCharts" style="position:relative;top:-3px"></div>
                  <div class="regional-mhi" style="position:relative;top:-48px;border-top:solid 1px #ccc;padding-top:5px">
                    RPA regional median income: <b>$72,140</b>
                  </div>
               </div>
               <div class="cartodb-popup-tip-container"></div>
             </div>
          """
        censusLayer.infowindow.set('template', infoTmpl)
        countyLayer.infowindow.set('template', infoTmpl)

        # Regional Data
        rd =
          housing: 21460
          taxes: 10344
          transport: 10519
          disp_inc: 29817

        localColors = [colors.housing,colors.taxes,colors.transport,colors.disp_inc]





        # Customize tooltips
        countyLayer = countyLayer.setInteractivity("cartodb_id, county, disp_inc, avg_trans, avg_hous, avg_ttl, avg_mhi")
        censusLayer = censusLayer.setInteractivity("cartodb_id, namelsad10, disp_inc, localname, avg_transc, housingcos, avg_ttl, mhi")

        tooltipTmpl = """
              <div class="cartodb-popup">
                <div class="title">
                  <b>{{county}}{{localname}}</b>
                </div>
                <table style="width:70%">
                  <tr>
                    <td>
                      Median income:
                    </td>
                    <td>
                      <span class="currency">{{avg_mhi}}{{mhi}}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      Fixed expenses:
                    </td>
                    <td>
                      <span class="fixed-income currency"></span>
                    </td>
                  <tr style="font-weight:bold;border-top:solid 1px black">
                    <td>
                      = Income left over:
                    </td>
                    <td>
                      <b class="currency">{{disp_inc}}</b>
                    </td>
                  </tr>
                </table>
              </div>
            """


        tooltips = []
        _.each [countyLayer,censusLayer], (item)->
          tooltip = new cdb.geo.ui.Tooltip(
              template: tooltipTmpl
              layer: item
              offset_top: -30
          )
          tooltips.push(tooltip)
          vis.container.append(tooltip.render().el)


        vent.on("tooltip:rendered", (d, $el)->
            $(".cartodb-tooltip").hide()
            $el.show()
            fixed = d.avg_trans || d.avg_transc + d.avg_hous || d.housingcos + d.avg_ttl
            $(".fixed-income").text(fixed)
            formatMoney()
          )



        vent.on "infowindow:rendered", (obj, $el)->
          return if obj["null"] is "Loading content..."
          data = (->
              d = obj.content.data
              [d.avg_hous || d.housingcos, d.avg_ttl, d.avg_trans || d.avg_transc, d.disp_inc]
            )()

          regionData = [rd.housing,rd.taxes,rd.transport,rd.disp_inc]

          makeStackedChart([data,regionData], $el.find(".barCharts").get(0), false, localColors)

          formatMoney()

          # Disable tooltip
          _.each(tooltips, (tooltip)->
              tooltip.disable()
              tooltip.hide()
            )

        # Enable tooltips
        vent.on "infowindow:closed", ->
          _.each(tooltips, (tooltip)->
              tooltip.enable()
            )




$ ->

  window.router = new Workspace()
  Backbone.history.start(pushState: true, root: root)

  # TODO: update the links of the navigation paths on the chapter pages
  fci = 1 #firstChapterIndex
  lci = 6 #lastChapterIndex
  lastChapter = (cc)-> if cc > fci then cc - 1 else lci
  nextChapter = (cc)-> if cc < lci then cc + 1 else fci

  # setChapterHref
  sch = (anchor,chapter)->
    anchor.attr("href","#{root}c/#{chapter}.html")

  chapter = parseInt location.pathname.match(/c\/(.+)\.html/)?[1]
  if chapter
    liIndex = chapter - 1
    $(".ch-nav li:eq(#{liIndex})").addClass("active")
    $(".hero-nav a, .bottom-nav a.prev, .bottom-nav a.next").each ->
      $a = $(this)
      if $a.hasClass("prev")
        sch($a,lastChapter(chapter))
        if chapter is fci then $a.remove()
      else
        sch($a,nextChapter(chapter))
        if chapter is lci then $a.remove()


  $(".ch-nav li").each (i)->
    $a = $(this).find("a")
    sch($a,i+1)

  wrapMaps = ->
    $("iframe.wrap-map").each ->
      $map = $(this)
      # Get the width of the browser
      width = $(window).innerWidth()
      # Get the offset left of the $map iframe element
      left = $map.parent(".item").offset()["left"] + 20
      $map.css({width: width+"px", left: -1 * left, position: "relative", overflow: "hidden"})
      $map.attr("scrolling","no")
  wrapMaps()

  $(window).on "resize", ->
    wrapMaps()

  # valid = $.cookie("valid")

  # if !valid
  #   $("body").remove()
  #   password = prompt("Please say the magic word")
  #   if password isnt "maphead"
  #     location.href = "http://rpa.org"
  #   else
  #     $.cookie("valid", true)
  #     location.reload()
