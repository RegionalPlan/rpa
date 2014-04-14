class Workspace extends Backbone.Router
  routes:
    "maps/schools.html"       : "schools"
    "maps/vulnerable.html"    : "vulnerable"
    "maps/discretionary.html" : "discretionary"
    "maps/walkability.html"   : "walkability"
    "maps/property.html"      : "property"
    "maps/carbon.html"        : "carbon"

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
              # console.log css
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
                  Avg. Household Carbon Emissions (MTCO2E)
                </h3>
                {{#county_n}}
                  <b>County: <span>{{county_n}}</span></b>
                {{/county_n}}
                {{#zip}}
                  <b>Zip Code: <span>{{zip}}</span></b>
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
                      <p class="property-tax">Property Tax: <b class="tax-rate">{{retaxrate}}</b></p>
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
            # console.log "Do stuff", data
            $(".tax-rate").text((parseFloat(data["retaxrate"])*100).toFixed(2)+"%")
            color = rate_to_color(data["retaxrate"])
            $el.find(".property-tax").attr("id", color)
          )

  walkability: ->
    id = "walkability"
    url = "http://rpa.cartodb.com/api/v2/viz/e2c8a5ba-ae10-11e3-87a1-0e230854a1cb/viz.json"
    cartodb
      .createVis(id, url, searchControl: true, layer_selector: false, legends: true, cartodb_logo:false, scrollwheel: false, center_lat: 40.7, center_lon: -73.9, zoom:10)
      .done (vis,layers)->
        map = vis.getNativeMap()

        color1 = "#fae2ab"
        color2 = "#ffbb67"
        color3 = "#a6a9de"
        color4 = "#8e6eb1"
        color5 = "#753384"



        # TODO: how can we interpret the walkability score? (Walk_Sco_1)
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
          # Take a union of all the tables
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

        walkabilityLayer = walkabilityLayer.setInteractivity("cartodb_id, namelsad10, localities, walk_sco_1, walk_sco_2, rail_stops, bank_score, books_scor, coffee_sco, entertainm, grocery_sc, park_score, restaurant, school_sco, shopping_s")


        tooltip = new cdb.geo.ui.Tooltip(
            template: """
              <div class="cartodb-popup">
                 <div class="cartodb-popup-content-wrapper">
                    <div class="cartodb-popup-content">
                      <div class='walkability-title'>
                        <p style="padding-bottom:2px"><b>{{localities}}</b></p>
                        <p style="color:#ccc;font-size:0.9em">{{namelsad10}}</p>
                      </div>
                      <div class="clearfix">
                        <span class="pull-left" style="">Walk Score®</span>
                        <div class="progress walk_sco_1 pull-left" style="width:175px;margin:5px 10px 0 10px"><div class="progress-bar" style="width:{{walk_sco_1}}%"></div></div>
                        <b class="walkability-score pull-left">{{walk_sco_1}}</b>
                      </div>
                      <b style="margin-left:94px">{{walk_sco_2}}</b>
                    </div>
                 </div>
              </div>
            """
            layer: walkabilityLayer
            offset_top: -50
        )
        vis.container.append(tooltip.render().el)


        score_to_color =
          "Very Car-Dependent": "#fae2ab"
          "Car-Dependent": "#ffbb67"
          "Somewhat Walkable": "#a6a9de"
          "Very Walkable": "#8e6eb1"
          "Walker's Paradise": "#753384"
        vent.on "infowindow:rendered", (data,$el)->
          color = score_to_color[data["walk_sco_2"]]
          $el.find(".progress .progress-bar").css("background-color", "#8e8e8e")
          $el.find(".progress.walk_sco_1 .progress-bar").css("background-color", color)

          $el.find(".walkability-score").each(->
              text = $(this).text()
              return unless text
              $(this).text(parseFloat(text).toFixed(0))
            )
        vent.on "tooltip:rendered", (data,$el)->
          # console.log "Do stuff", data
          color = score_to_color[data["walk_sco_2"]]
          $el.find(".progress.walk_sco_1 .progress-bar").css("background-color", color)

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
                      <div class="title"  style="padding-bottom:10px">
                        <h3>{{schnam}}</h3>
                        <span>{{localname}} ({{namelsad10}})</span>
                      </div>
                      {{#rank_perce}}
                        <div><b>School Rank</b></div>
                        <div class="progress" style="height:5px;-webkit-border-radius:0;position:relative;overflow: visible;">
                          <div class="progress-bar low" style="width:25%;background-color:#0c7caa;"></div>
                          <div class="progress-bar average" style="width:50%;background-color:#70706e;"></div>
                          <div class="progress-bar high" style="width:25%;background-color:#dc0000;"></div>
                          <span style="position:relative;text-align:center">
                            <span style="font-size: 2em;line-height: 1em;position: absolute;top: -18px;left: 5px;">•</span>
                            <b class="school-rank">{{rank_perce}}</b>
                          </span>
                        </div>
                      {{/rank_perce}}
                      {{^rank_perce}}
                        <i>No data available</i>
                      {{/rank_perce}}

                      {{#hh_median}}
                        <div><b>Median Household Income</b></div>
                        <div class="progress" style="height:5px;-webkit-border-radius:0;position:relative;overflow: visible;">
                          <div class="progress-bar low" style="width:20%;background-color:#f2f0ee;"></div>
                          <div class="progress-bar average" style="width:20%;background-color:#e5e1dd;"></div>
                          <div class="progress-bar high" style="width:20%;background-color:#d7d2cc;"></div>
                          <div class="progress-bar progress-bar-warning" style="width:20%;background-color:#cbc4bd;"></div>
                          <div class="progress-bar progress-bar-warning" style="width:20%;background-color:#beb4aa;"></div>


                          <span style="position:relative;text-align:center">
                            <span style="font-size: 2em;line-height: 1em;position: absolute;top: -18px;left: 5px;">•</span>
                            <b class="hh-rank">{{hh_median}}</b>
                          </span>
                        </div>
                      {{/hh_median}}
                      {{^hh_median}}
                        <i>No data available</i>
                      {{/hh_median}}


                      {{#whiteprcnt}}
                        <div><b>Percentage of White Population</b></div>
                        <div class="progress" style="height:5px;-webkit-border-radius:0;position:relative;overflow: visible;">
                          <div class="progress-bar low" style="width:20%;background-color:#f2f0ee;"></div>
                          <div class="progress-bar average" style="width:20%;background-color:#e5e1dd;"></div>
                          <div class="progress-bar high" style="width:20%;background-color:#d7d2cc;"></div>
                          <div class="progress-bar progress-bar-warning" style="width:20%;background-color:#cbc4bd;"></div>
                          <div class="progress-bar progress-bar-warning" style="width:20%;background-color:#beb4aa;"></div>


                          <span style="position:relative;text-align:center">
                            <span style="font-size: 2em;line-height: 1em;position: absolute;top: -18px;left: 5px;">•</span>
                            <b class="race-rank">{{whiteprcnt}}</b>
                          </span>
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
            hhRank = data["hh_median"]
            raceRank = data["whiteprcnt"]
            return unless rank
            rank = (parseFloat(rank) * 100).toFixed(0)
            hhRank = (hhRank - 40673) / (250000 - 40673)
            hhRank = (parseFloat(hhRank) * 100).toFixed(0)
            raceRank = (parseFloat(raceRank) * 100).toFixed(0)
            $(".school-rank").text("#{rank}%").parent().css("left","#{rank}%")
            $(".hh-rank").text("#{hhRank}%").parent().css("left","#{hhRank}%")
            $(".race-rank").text("#{raceRank}%").parent().css("left","#{raceRank}%")
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
      .createVis('vulnerable', 'http://rpa.cartodb.com/api/v2/viz/533c5970-9f4f-11e3-ad24-0ed66c7bc7f3/viz.json', cartodb_logo:false, scrollwheel: false, center_lat: 40.7, center_lon: -73.9, zoom:10, searchControl: true, layer_selector: false, legends: true, zoomControl: false)
      .done (vis,layers)->
        map = vis.getNativeMap()

        layer = layers[1]
        floodZoneLayer = layer.getSubLayer(0)
        layer.setInteraction(true)

        # Declare the database tables backing the layers
        red = "#ba0000"
        dbs = {
          power_plants: {
            flood_column: "flood"
            type: "Power plant"
            name_column: "plant_name"
            loss_column: "total_cap"
            affected_type: "plants"
            localities: true
            tables: ["rpa_powerplants_eia_latlong_withlocalities_201"]
          }
          hospitals: {
            flood_column: "flood"
            type: "Hospital"
            name_column: "name"
            loss_column: "total_beds"
            affected_type: "beds"
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
            affected_type: "beds"
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
            affected_type: "units"
            localities: true
            tables: [
              "rpa_publichousing_withlocalities_hud2013_short"
            ]
          }
          train_stations: {
            flood_column: "flood"
            type: "Train station"
            name_column: "station_na"
            affected_type: "stations"
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
            affected_type: "units"
            loss_column: false
            localities: false
            tables: ["rpa_raillines_flood"]
          }
          subway_stations: {
            flood_column: "flood"
            type: "Subway station"
            name_column: "station_na"
            loss_column: false
            affected_type: "stations"
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
            affected_type: "routes"
            localities: false
            tables: [
              "rpa_subwayroutes_flood"
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
          css = _.map(value["tables"], (table)->
              """
                ##{table} {marker-fill: #{red};marker-line-width:0;::line {line-width: 1;line-color: #{red};}[#{value['flood_column']} < 1]{marker-fill: #575757;}[zoom <= 13] {marker-width: 5;}[zoom > 13] {marker-width: 15;}}
              """
            )
          css = css.join(" ")

          if sql and css
            interactivity = ["cartodb_id", value['name_column']]
            if value["loss_column"]
              interactivity.push(value['loss_column'])
            if value['localities']
              interactivity.push("localname")
            sublayer = layer.createSubLayer(
              sql: sql,
              cartocss: css
              interactivity: interactivity
            )
            value["layer"] = sublayer
        )

        # Create a tooltip for every single sublayer
        _.each(dbs,(value,k)->
          vis.addOverlay(
            layer: value["layer"]
            type: 'tooltip'
            offset_top: -30
            template: """
              <div style="background:white;padding:5px 10px;">
                <div style="margin-bottom:10px">
                  <h3 class="title-case" style="margin:0">{{ #{value['name_column']} }}</h3>
                  {{#localname}}
                    <span>{{localname}}</span>
                  {{/localname}}
                </div>
                <div>
                  #{value['type']}
                </div>
                {{##{value['loss_column']} }}
                  <p>Affected #{value['affected_type']}: {{ #{value['loss_column']} }}</p>
                {{/#{value['loss_column']} }}
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
    makeChart = (data, mhi, id="#donut")->
      blue       =  "#47b3d2";  # disp_income
      reddish    =  "#f12b15";  # trans
      brown      =  "#b92b15";  # housing
      dark_brown =  "#7c2b15";  # taxes

      chartData = [
        {value : data["disp_inc"], color : blue }
        {value : data["trans"],    color : reddish}
        {value : data["housing"],  color : brown}
        {value : data["taxes"],    color : dark_brown}
      ]

      ctx = $(id).get(0).getContext("2d");
      donut_options =
        percentageInnerCutout: 70
        animationEasing : "easeOutQuart"
        animationSteps : 30
      options =
        tooltips:
          background: "#000"
          labelTemplate: "<%= (value / #{mhi} * 100 ).toFixed(2) %>%"
      new Chart(ctx,options).Doughnut(chartData,donut_options)

    data =
      disp_inc: 29817
      trans: 10519
      housing: 21460
      taxes: 10344

    # $ ->
    if $("#standalone_donut").length > 0
      makeChart(data, 72140, "#standalone_donut")

    # DISCRETIONARY INCOME
    cartodb
      .createVis('discretionary', 'http://rpa.cartodb.com/api/v2/viz/62e94d78-9f1e-11e3-b420-0ed66c7bc7f3/viz.json', legends: true, searchControl: true, cartodb_logo:false, scrollwheel: false, center_lat: 40.7, center_lon: -73.9, zoom:10, infowindow: true, layer_selector: false)
      .done (vis,layers)->
        map = vis.getNativeMap()

        dataLayers = layers[1]
        dataLayers.setInteraction(true)


        countyLayer = dataLayers.getSubLayer(0)
        censusLayer = dataLayers.getSubLayer(1)


        censusLayer.hide()
        map.on('zoomend', (a,b,c)->
          zoomLevel = map.getZoom()
          if zoomLevel > 10
            censusLayer.show()
            countyLayer.hide()
            # TODO: update the zoom legend
            $(".please_zoom_in").text("Zoom out to see county level data.")
          else
            censusLayer.hide()
            countyLayer.show()
            $(".please_zoom_in").text("Zoom in to the map to see neighborhood level data.")
        )


        # Customize the infowindows
        tmpl= (type,type_name,mhi,disp_inc,trans,housing,taxes)-> _.template("""
            <div class="cartodb-popup">
              <a href="#close" class="cartodb-popup-close-button close">x</a>
               <div class="cartodb-popup-content-wrapper">
                 <div class="cartodb-popup-content" data-disp_inc="<%=content.data.#{disp_inc}%>" data-trans="<%=content.data.#{trans}%>" data-housing="<%=content.data.#{housing}%>" data-taxes="<%=content.data.#{taxes}%>">
                  <div class="title">
                    <h2>
                      <%=content.data.#{type_name}%>
                    </h2>
                    <% if("#{type}"=="Census Tract"){ %>
                      <p><%=content.data.localname  %></p>
                    <% } %>
                  </div>

                  <div class="leftColumn">
                    <b>Income Components</b>
                    <div class="discretionary">
                      <div>Discretionary Income</div>
                      <b class="currency"><%=content.data.#{disp_inc}%></b>
                    </div>

                    <div class="trans">
                      <div>Transportation</div>
                      <b class="currency"><%=content.data.#{trans}%></b>
                    </div>

                    <div class="housing">
                      <div>Housing and other related costs</div>
                      <b class="currency"><%=content.data.#{housing}%></b>
                    </div>

                    <div class="taxes">
                      <div>State and local personal income tax</div>
                      <b class="currency"><%=content.data.#{taxes}%></b>
                    </div>
                  </div>

                  <div class="rightColumn">
                    <div class="mhi text-center">
                      <div>Median <br/> Income</div>
                      <b class="median-income currency"><%=Math.round(Number(content.data.#{mhi}))%></b>
                    </div>

                    <canvas id="donut" width="130" height="130"></canvas>

                  </div>
                 </div>
               </div>
            </div>
          """)

        censusLayer.infowindow.set('template', tmpl("Census Tract", "namelsad10", "mhi", "disp_inc", "avg_transc", "housingcos", "avg_ttl"))
        countyLayer.infowindow.set('template', tmpl("County", "county", "avg_mhi", "disp_inc", "avg_trans", "avg_hous", "avg_ttl"))


        countyLayer = countyLayer.setInteractivity("cartodb_id, county, disp_inc")
        tooltip = new cdb.geo.ui.Tooltip(
            template: """
              <div class="cartodb-popup" style="height:100px !important;overflow:hidden">
                 <div class="cartodb-popup-content-wrapper">
                    <div class="cartodb-popup-content">
                      <div class="title">
                        <h3 >{{county}}</h3>
                      </div>
                      <div>
                        Discretionary Income: <b class="currency">{{disp_inc}}</b>
                      </div>
                    </div>
                 </div>
              </div>
            """
            layer: countyLayer
            offset_top: -30
        )
        vis.container.append(tooltip.render().el)

        censusLayer = censusLayer.setInteractivity("cartodb_id, namelsad10, disp_inc, localname")
        tooltip = new cdb.geo.ui.Tooltip(
            template: """
              <div class="cartodb-popup" style="height:100px !important;overflow:hidden">
                 <div class="cartodb-popup-content-wrapper">
                    <div class="cartodb-popup-content">
                      <div class="title">
                        <h3>{{namelsad10}}</h3>
                        <small>{{localname}}</small>
                      </div>
                      <div>
                        Discretionary Income: <b class="currency">{{disp_inc}}</b>
                      </div>
                    </div>
                 </div>
              </div>
            """
            layer: censusLayer
            offset_top: -30
        )
        vis.container.append(tooltip.render().el)

        vent.on("tooltip:rendered", ->
            formatMoney()
          )


        # HACK: the code below requires a feature added to a customized version of the cartodb.js liburary
        vent.on "infowindow:rendered", (obj)->
          return if obj["null"] is "Loading content..."
          # Create a bar chart in the infowindow for the clicked feature
          data = $(".cartodb-popup-content").data()
          mhi = $("#discretionary .median-income").text()
          makeChart(data, Number(mhi))
          formatMoney()


$ ->

  window.router = new Workspace()
  Backbone.history.start(pushState: true, root: root)

  # TODO: update the links of the navigation paths on the chapter pages
  fci = 1 #firstChapterIndex
  lci = 5 #lastChapterIndex
  lastChapter = (cc)-> if cc > fci then cc - 1 else lci
  nextChapter = (cc)-> if cc < lci then cc + 1 else fci

  # setChapterHref
  sch = (anchor,chapter)->
    anchor.attr("href","#{root}c/#{chapter}.html")

  chapter = parseInt location.pathname.match(/c\/(.+)\.html/)?[1]
  if chapter
    liIndex = chapter - 1
    $(".ch-nav li:eq(#{liIndex})").addClass("active")
    $(".hero-nav a, .bottom-nav a").each ->
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

  # Load the requested map
  if mapId
    router[mapId]()