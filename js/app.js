(function() {
  var Workspace,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Workspace = (function(_super) {
    __extends(Workspace, _super);

    function Workspace() {
      return Workspace.__super__.constructor.apply(this, arguments);
    }

    Workspace.prototype.routes = {
      "maps/schools.html": "schools",
      "maps/vulnerable.html": "vulnerable",
      "maps/discretionary.html": "discretionary",
      "maps/walkability.html": "walkability",
      "maps/property.html": "property",
      "maps/carbon.html": "carbon"
    };

    Workspace.prototype.carbon = function() {
      var id, url;
      id = "carbon";
      url = "http://rpa.cartodb.com/api/v2/viz/7d0015c0-aed2-11e3-a656-0e73339ffa50/viz.json";
      return cartodb.createVis(id, url, {
        searchControl: true,
        layer_selector: false,
        legends: true,
        cartodb_logo: false,
        scrollwheel: false,
        center_lat: 40.7,
        center_lon: -73.9,
        zoom: 10
      }).done(function(vis, layers) {
        var activeSublayer, adjust_layer_vis, adjust_sublayer_vis, colors, columns, county_cols, default_sublayers, layer, layer_county, layer_zip, map, shared_cols, sublayers, tables, zip_cols;
        map = vis.getNativeMap();
        layer = layers[1];
        layer_county = layers[1].getSubLayer(0);
        layer_zip = layers[1].getSubLayer(1);
        layer.setInteraction(true);
        layer_zip.hide();
        default_sublayers = {
          county: layer_county,
          zip: layer_zip
        };
        colors = {
          transport: "#f9b314",
          housing: "#eb0000",
          food: "#2fb0c4",
          goods: "#3f4040",
          services: "#695b94",
          total: "#008000"
        };
        shared_cols = "food,goods,services,total,transport,housing";
        county_cols = "county_n," + shared_cols;
        zip_cols = "" + shared_cols + ",po_name,zip";
        columns = function(table) {
          if (table === "rpa_carbonfootprint") {
            return zip_cols;
          } else {
            return county_cols;
          }
        };
        tables = ["rpa_carbonfootprint", "rpa_carbonfootprint_county"];
        sublayers = {};
        _.each(tables, function(table, k) {
          var others, sql;
          others = ", " + columns(table);
          sql = "SELECT " + table + ".cartodb_id, " + table + ".the_geom, " + table + ".the_geom_webmercator " + others + " FROM " + table;
          return _.each(colors, function(hex, column) {
            var css, interactivity, sublayer, t, tlayers;
            css = "#" + table + " [" + column + " > 60] {\n  //Darkest\n  polygon-fill: " + hex + ";\n}\n#" + table + " [" + column + " > 40][" + column + " < 60] {\n  //Lighter\n  polygon-fill: " + (shade(hex, -0.1)) + ";\n}\n#" + table + " [" + column + " < 40] {\n  //Lightest\n  polygon-fill: " + (shade(hex, -0.2)) + ";\n}";
            interactivity = ["cartodb_id"];
            interactivity = interactivity.concat(columns(table).split(","));
            sublayer = layer.createSubLayer({
              sql: sql,
              cartocss: css,
              interactivity: interactivity
            });
            tlayers = sublayers[column];
            t = {};
            t[table] = sublayer;
            if (tlayers) {
              return sublayers[column] = _.extend(tlayers, t);
            } else {
              return sublayers[column] = t;
            }
          });
        });
        _.each(sublayers, function(value, layer_name) {
          return _.each(tables, function(table) {
            return vis.addOverlay({
              layer: value[table],
              type: 'tooltip',
              offset_top: -30,
              template: "<h3 class=\"title-case\">\n  Avg. Household Carbon Emissions (MTCO2E)\n</h3>\n{{#county_n}}\n  <b>County: <span>{{county_n}}</span></b>\n{{/county_n}}\n{{#zip}}\n  <b>Zip Code: <span>{{zip}}</span></b>\n{{/zip}}\n<div class=\"progressive\">\n\n</div>\n<div class=\"tooltip-legend clearfix\">\n  <div class=\"food\">Food</div>\n  <div class=\"goods\">Goods</div>\n  <div class=\"services\">Services</div>\n  <div class=\"transport\">Transport</div>\n  <div class=\"housing\">Housing</div>\n</div>"
            });
          });
        });
        adjust_layer_vis = function(opts) {
          default_sublayers[opts["show"]].show();
          return default_sublayers[opts["hide"]].hide();
        };
        activeSublayer = "total";
        adjust_sublayer_vis = function(opts) {
          return _.each(sublayers, function(value, layer_name) {
            value[opts["hide"]].hide();
            if (layer_name === activeSublayer) {
              return value[opts["show"]].show();
            }
          });
        };
        adjust_sublayer_vis({
          show: tables[1],
          hide: tables[0]
        });
        map = vis.getNativeMap();
        map.on('zoomend', function(a, b, c) {
          var zoomLevel;
          $(".cartodb-tooltip").hide();
          zoomLevel = map.getZoom();
          if (zoomLevel > 9) {
            adjust_sublayer_vis({
              show: tables[0],
              hide: tables[1]
            });
            return adjust_layer_vis({
              show: "zip",
              hide: "county"
            });
          } else {
            adjust_sublayer_vis({
              show: tables[1],
              hide: tables[0]
            });
            return adjust_layer_vis({
              show: "county",
              hide: "zip"
            });
          }
        });
        vent.on("tooltip:rendered", function(d, $el) {
          var data;
          data = [d["transport"], d["housing"], d["food"], d["goods"], d["services"]];
          return makeStackedChart(data, $el.find(".progressive").get(0));
        });
        vent.on("infowindow:rendered", function(d, $el) {
          var data, region;
          if (d["null"] === "Loading content...") {
            return;
          }
          data = [d["transport"], d["housing"], d["food"], d["goods"], d["services"]];
          region = [12.7, 11.7, 8.0, 6.0, 6.8];
          return makeStackedChart([data, region], $el.find(".progressive").get(0), true);
        });
        return $("#layer_selector li").on("click", function(e) {
          var $li, current_table, layerName, legend, zoomLevel;
          $li = $(e.target);
          $li.siblings("li").removeClass("active");
          $li.addClass("active");
          layerName = $li.data("sublayer");
          activeSublayer = layerName;
          legend = $(".cartodb-legend .cartodb-legend");
          legend.removeClass();
          legend.addClass("cartodb-legend " + layerName + "-layer");
          zoomLevel = map.getZoom();
          current_table = zoomLevel > 9 ? tables[0] : tables[1];
          _.each(sublayers, function(sublayer, k) {
            return sublayer[current_table].hide();
          });
          return sublayers[layerName][current_table].show();
        });
      });
    };

    Workspace.prototype.property = function() {
      var id, url;
      id = "property";
      url = "http://rpa.cartodb.com/api/v2/viz/f368bbb4-aebd-11e3-a057-0e10bcd91c2b/viz.json";
      return cartodb.createVis(id, url, {
        searchControl: true,
        layer_selector: false,
        legends: true,
        cartodb_logo: false,
        scrollwheel: false,
        center_lat: 40.7,
        center_lon: -73.9,
        zoom: 10
      }).done(function(vis, layers) {
        var color1, color2, color3, map, propertyLayerNYC, propertyLayerNoNYC, rate_to_color, tooltip, tooltip2;
        map = vis.getNativeMap();
        color1 = "#ffefc9";
        color2 = "#fdde9c";
        color3 = "#80c5d8";
        layers[1].setInteraction(true);
        propertyLayerNoNYC = layers[1].getSubLayer(0);
        propertyLayerNYC = layers[1].getSubLayer(1);
        propertyLayerNoNYC = propertyLayerNoNYC.setInteractivity("namelsad10, localname, retaxrate, retax_acs, med_val");
        propertyLayerNYC = propertyLayerNYC.setInteractivity("namelsad10, localname, retaxrate, retax_acs, med_val");
        propertyLayerNYC.hide();
        tooltip = new cdb.geo.ui.Tooltip({
          template: "<div class=\"cartodb-popup\">\n   <div class=\"cartodb-popup-content-wrapper\">\n      <div class=\"cartodb-popup-content\">\n        <p><b>{{namelsad10}}</b></p>\n        <p>{{localname}}</p>\n        <p class=\"property-tax\">Property Tax: <b class=\"tax-rate\">{{retaxrate}}</b></p>\n      </div>\n   </div>\n</div>",
          layer: propertyLayerNoNYC,
          offset_top: -50
        });
        vis.container.append(tooltip.render().el);
        tooltip2 = new cdb.geo.ui.Tooltip({
          template: "<div class=\"cartodb-popup\">\n   <div class=\"cartodb-popup-content-wrapper\">\n      <div class=\"cartodb-popup-content\">\n        <p><b>{{namelsad10}}</b></p>\n        <p>{{localname}}</p>\n        <p class=\"property-tax\">Property Tax: <b class=\"tax-rate\">{{retaxrate}}</b></p>\n      </div>\n   </div>\n</div>",
          layer: propertyLayerNYC,
          offset_top: -50
        });
        vis.container.append(tooltip2.render().el);
        map = vis.getNativeMap();
        map.on('zoomend', function(a, b, c) {
          var zoomLevel;
          zoomLevel = map.getZoom();
          if (zoomLevel > 9) {
            propertyLayerNoNYC.hide();
            return propertyLayerNYC.show();
          } else {
            propertyLayerNoNYC.show();
            return propertyLayerNYC.hide();
          }
        });
        rate_to_color = function(rate) {
          rate = parseFloat(rate);
          if (rate <= 0.005) {
            return "color1";
          } else if (rate > 0.005 && rate <= 0.01) {
            return "color2";
          } else if (rate > 0.01 && rate <= 0.015) {
            return "color3";
          } else if (rate > 0.015 && rate <= 0.02) {
            return "color4";
          } else if (rate > 0.02) {
            return "color5";
          }
        };
        return vent.on("tooltip:rendered", function(data, $el) {
          var color;
          $(".tax-rate").text((parseFloat(data["retaxrate"]) * 100).toFixed(2) + "%");
          color = rate_to_color(data["retaxrate"]);
          return $el.find(".property-tax").attr("id", color);
        });
      });
    };

    Workspace.prototype.walkability = function() {
      var id, url;
      id = "walkability";
      url = "http://rpa.cartodb.com/api/v2/viz/e2c8a5ba-ae10-11e3-87a1-0e230854a1cb/viz.json";
      return cartodb.createVis(id, url, {
        searchControl: true,
        layer_selector: false,
        legends: true,
        cartodb_logo: false,
        scrollwheel: false,
        center_lat: 40.7,
        center_lon: -73.9,
        zoom: 10
      }).done(function(vis, layers) {
        var color1, color2, color3, color4, color5, layer, map, score_to_color, station_layers, tooltip, walkabilityLayer;
        map = vis.getNativeMap();
        color1 = "#fae2ab";
        color2 = "#ffbb67";
        color3 = "#a6a9de";
        color4 = "#8e6eb1";
        color5 = "#753384";
        layer = layers[1];
        layer.setInteraction(true);
        walkabilityLayer = layer.getSubLayer(0);
        station_layers = [
          {
            type: "Train station",
            name_column: "stn_name",
            table: "rpa_alltransit_stations"
          }, {
            type: "Subway station",
            name_column: "station_na",
            table: "rpa_subwaystations"
          }
        ];
        _.each(station_layers, function(value, k) {
          var css, dot_color, interactivity, ret, sql, sublayer, table;
          table = value["table"];
          ret = "" + table + ".cartodb_id," + table + ".the_geom, " + table + ".the_geom_webmercator, " + table + "." + value['name_column'];
          sql = "SELECT " + ret + " FROM " + table;
          dot_color = "#606060";
          css = "#" + table + " {\n  marker-fill: " + dot_color + ";\n  marker-line-width:0;\n  ::line {\n    line-width: 1;\n  }\n  [zoom <= 10] {\n    marker-width: 4;\n  }\n  [zoom > 10] {\n    marker-width: 6;\n  }\n\n  ::labels {\n    text-name: [" + value['name_column'] + "];\n    text-face-name: 'DejaVu Sans Book';\n    text-size: 12;\n    text-label-position-tolerance: 10;\n    text-fill: #ffffff;\n    text-halo-fill:  transparent;\n    text-halo-radius: 1;\n    text-dy: -10;\n    text-allow-overlap: false;\n    text-placement: point;\n    text-placement-type: simple;\n\n    [zoom > 10]{\n\n    }\n\n    [zoom <= 10]{\n      text-fill:transparent;\n      text-halo-fill: transparent;\n    }\n  }\n}";
          if (table === "rpa_subwaystations") {
            css += "#" + table + "[zoom < 10] {marker-opacity: 0;}";
          }
          if (sql && css) {
            interactivity = ["cartodb_id", value['name_column']];
            sublayer = layer.createSubLayer({
              sql: sql,
              cartocss: css,
              interactivity: interactivity
            });
            return value["layer"] = sublayer;
          }
        });
        walkabilityLayer = walkabilityLayer.setInteractivity("cartodb_id, namelsad10, localities, walk_sco_1, walk_sco_2, rail_stops, bank_score, books_scor, coffee_sco, entertainm, grocery_sc, park_score, restaurant, school_sco, shopping_s");
        tooltip = new cdb.geo.ui.Tooltip({
          template: "<div class=\"cartodb-popup\">\n   <div class=\"cartodb-popup-content-wrapper\">\n      <div class=\"cartodb-popup-content\">\n        <div class='title'>\n          <b>{{localities}}</b>\n          <p>{{namelsad10}}</p>\n        </div>\n        <div class=\"clearfix\">\n          <span class=\"pull-left\" style=\"\">Walk Score®</span>\n          <div class=\"progress walk_sco_1 pull-left\" style=\"width:175px;margin:5px 10px 0 10px\"><div class=\"progress-bar\" style=\"width:{{walk_sco_1}}%\"></div></div>\n          <b class=\"walkability-score pull-left\">{{walk_sco_1}}</b>\n        </div>\n        <b style=\"margin-left:80px\">{{walk_sco_2}}</b>\n      </div>\n   </div>\n</div>",
          layer: walkabilityLayer,
          offset_top: -50
        });
        vis.container.append(tooltip.render().el);
        score_to_color = {
          "Very Car Dependent": "#fae2ab",
          "Somewhat Car Dependent": "#ffbb67",
          "Somewhat Walkable": "#a6a9de",
          "Very Walkable": "#8e6eb1",
          "Walker's Paradise": "#753384"
        };
        vent.on("infowindow:rendered", function(data, $el) {
          var color;
          color = score_to_color[data["walk_sco_2"]];
          $el.find(".progress .progress-bar").css("background-color", "#8e8e8e");
          $el.find(".progress.walk_sco_1 .progress-bar").css("background-color", color);
          return $el.find(".walkability-score").each(function() {
            var text;
            text = $(this).text();
            if (!text) {
              return;
            }
            return $(this).text(parseFloat(text).toFixed(0));
          });
        });
        return vent.on("tooltip:rendered", function(data, $el) {
          var color;
          color = score_to_color[data["walk_sco_2"]];
          return $el.find(".progress.walk_sco_1 .progress-bar").css("background-color", color);
        });
      });
    };

    Workspace.prototype.schools = function() {
      return cartodb.createVis('schools', 'http://rpa.cartodb.com/api/v2/viz/5bc0d9be-a264-11e3-bc17-0e10bcd91c2b/viz.json', {
        searchControl: true,
        layer_selector: false,
        legends: true,
        cartodb_logo: false,
        scrollwheel: false,
        center_lat: 40.7,
        center_lon: -73.9,
        zoom: 10
      }).done(function(vis, layers) {
        var map, raceLayer, schoolLayer, tooltip;
        map = vis.getNativeMap();
        layers[1].setInteraction(true);
        raceLayer = layers[1].getSubLayer(0);
        schoolLayer = layers[1].getSubLayer(1);
        schoolLayer = schoolLayer.setInteractivity("cartodb_id, schlrank, rank_perce, schnam, localname, namelsad10, hh_median, whiteprcnt");
        tooltip = new cdb.geo.ui.Tooltip({
          template: "<div class=\"cartodb-popup\">\n   <div class=\"cartodb-popup-content-wrapper\">\n      <div class=\"cartodb-popup-content\">\n        <div class=\"title\">\n          <b>{{schnam}}</b>\n          <p>{{localname}} ({{namelsad10}})</p>\n        </div>\n        {{#rank_perce}}\n          <div><b>School Rank</b></div>\n          <div class=\"progress\" style=\"height:5px;-webkit-border-radius:0;position:relative;overflow: visible;width:95%\">\n            <div class=\"progress-bar low\" style=\"width:25%;background-color:#dc0000;\"></div>\n            <div class=\"progress-bar average\" style=\"width:50%;background-color:#70706e;\"></div>\n            <div class=\"progress-bar high\" style=\"width:25%;background-color:#0c7caa;\"></div>\n            <span style=\"position:relative;text-align:center\">\n              <span style=\"font-size: 2em;line-height: 1em;position: absolute;top: -18px;left: 5px;\">•</span>\n              <b class=\"school-rank\">{{rank_perce}}</b>\n            </span>\n          </div>\n        {{/rank_perce}}\n        {{^rank_perce}}\n          <i>No data available</i>\n        {{/rank_perce}}\n\n        {{#hh_median}}\n          <div><b>Median Household Income</b></div>\n          <div class=\"progress\" style=\"height:5px;-webkit-border-radius:0;position:relative;overflow: visible;width:95%\">\n            <div class=\"progress-bar low\" style=\"width:20%;background-color:#f2f0ee;\"></div>\n            <div class=\"progress-bar average\" style=\"width:20%;background-color:#e5e1dd;\"></div>\n            <div class=\"progress-bar high\" style=\"width:20%;background-color:#d7d2cc;\"></div>\n            <div class=\"progress-bar progress-bar-warning\" style=\"width:20%;background-color:#cbc4bd;\"></div>\n            <div class=\"progress-bar progress-bar-warning\" style=\"width:20%;background-color:#beb4aa;\"></div>\n\n\n            <span style=\"position:relative;text-align:center\">\n              <span style=\"font-size: 2em;line-height: 1em;position: absolute;top: -18px;left: 5px;\">•</span>\n              <b class=\"hh-rank\">{{hh_median}}</b>\n            </span>\n          </div>\n        {{/hh_median}}\n        {{^hh_median}}\n          <i>No data available</i>\n        {{/hh_median}}\n\n\n        {{#whiteprcnt}}\n          <div><b>Percentage of White Population</b></div>\n          <div class=\"progress\" style=\"height:5px;-webkit-border-radius:0;position:relative;overflow: visible;width:95%\">\n            <div class=\"progress-bar low\" style=\"width:20%;background-color:#f2f0ee;\"></div>\n            <div class=\"progress-bar average\" style=\"width:20%;background-color:#e5e1dd;\"></div>\n            <div class=\"progress-bar high\" style=\"width:20%;background-color:#d7d2cc;\"></div>\n            <div class=\"progress-bar progress-bar-warning\" style=\"width:20%;background-color:#cbc4bd;\"></div>\n            <div class=\"progress-bar progress-bar-warning\" style=\"width:20%;background-color:#beb4aa;\"></div>\n\n\n            <span style=\"position:relative;text-align:center\">\n              <span style=\"font-size: 2em;line-height: 1em;position: absolute;top: -18px;left: 5px;\">•</span>\n              <b class=\"race-rank\">{{whiteprcnt}}</b>\n            </span>\n          </div>\n        {{/whiteprcnt}}\n        {{^whiteprcnt}}\n          <i>No data available</i>\n        {{/whiteprcnt}}\n      </div>\n   </div>\n</div>",
          layer: schoolLayer,
          offset_top: -50
        });
        vis.container.append(tooltip.render().el);
        vent.on("tooltip:rendered", function(data) {
          var hhRank, raceRank, rank;
          rank = data["rank_perce"];
          hhRank = data["hh_median"];
          raceRank = data["whiteprcnt"];
          if (!rank) {
            return;
          }
          rank = (parseFloat(rank) * 100).toFixed(0);
          hhRank = (hhRank - 40673) / (250000 - 40673);
          hhRank = (parseFloat(hhRank) * 100).toFixed(0);
          raceRank = (parseFloat(raceRank) * 100).toFixed(0);
          $(".school-rank").text("" + rank + "%").parent().css("left", "" + rank + "%");
          $(".hh-rank").text("" + hhRank + "%").parent().css("left", "" + hhRank + "%");
          return $(".race-rank").text("" + raceRank + "%").parent().css("left", "" + raceRank + "%");
        });
        return $("#layer_selector a").on("click", function(e) {
          var $a, activeLink, activeSublayer, borders, color, css, layerName, table;
          $a = $(e.target);
          layerName = $a.data("sublayer");
          if ($a.hasClass("active")) {
            return true;
          }
          activeLink = $a.parent().find(".active");
          activeLink.removeClass("active");
          $a.toggleClass("active");
          activeSublayer = $a.data("sublayer");
          if (activeSublayer === "race") {
            table = "whiteprcnt";
            color = "#b5c0a6";
            borders = [0.1, 0.25, 0.50, 0.75, 1];
          } else {
            table = "hh_median";
            color = "#beb4aa";
            borders = [40125, 57344, 76061, 99075, 250000];
          }
          css = "#schoolrank2012_racepoverty_income_rparegion{\n\n  polygon-fill: " + color + ";\n\n  [ " + table + " <= " + borders[0] + "] {\n     polygon-opacity: 0.2;\n  }\n  [ " + table + " > " + borders[0] + "][ " + table + " <= " + borders[1] + "] {\n     polygon-opacity: 0.4;\n  }\n  [ " + table + " > " + borders[1] + "][ " + table + " <= " + borders[2] + "] {\n     polygon-opacity: 0.6;\n  }\n  [ " + table + " > " + borders[2] + "][ " + table + " <= " + borders[3] + "] {\n     polygon-opacity: 0.8;\n  }\n  [ " + table + " > " + borders[3] + "][ " + table + " <= " + borders[4] + "] {\n     polygon-opacity: 1;\n  }\n}";
          raceLayer.setCartoCSS(css);
          $(".race-legend").toggle();
          return $(".hh-legend").toggle();
        });
      });
    };

    Workspace.prototype.vulnerable = function() {
      return cartodb.createVis('vulnerable', 'http://rpa.cartodb.com/api/v2/viz/533c5970-9f4f-11e3-ad24-0ed66c7bc7f3/viz.json', {
        cartodb_logo: false,
        scrollwheel: false,
        center_lat: 40.7,
        center_lon: -73.9,
        zoom: 11,
        searchControl: true,
        layer_selector: false,
        legends: true,
        zoomControl: true
      }).done(function(vis, layers) {
        var dbs, floodZoneLayer, layer, map, red;
        map = vis.getNativeMap();
        layer = layers[1];
        floodZoneLayer = layer.getSubLayer(0);
        layer.setInteraction(true);
        red = "#ba0000";
        dbs = {
          power_plants: {
            flood_column: "flood",
            type: "Power plant",
            name_column: "plant_name",
            loss_column: "total_cap",
            affected_type: "plants",
            localities: true,
            tables: ["rpa_powerplants_eia_latlong_withlocalities_201"]
          },
          hospitals: {
            flood_column: "flood",
            type: "Hospital",
            name_column: "name",
            loss_column: "total_beds",
            affected_type: "beds",
            localities: true,
            tables: ["rpa_nj_hsip_hospitals_compressed_withlocalitie", "ny_rpa_hospitalsnamesbeds_withlocalities", "rpa_ct_hospitals_names_beds_withlocalities"]
          },
          nursing_homes: {
            flood_column: "flood",
            type: "Nursing home",
            name_column: "name",
            loss_column: "beds",
            affected_type: "beds",
            localities: true,
            tables: ["rpa_ct_nursinghomes_namesaddressesbeds_withloc", "rpa_nj_hsip_nursinghomes_compressed_withlocali", "ny_rpa_nursinghomesnamesbedsflood_withlocaliti"]
          },
          public_housing: {
            flood_column: "flood",
            type: "Public housing",
            name_column: "project_na",
            loss_column: "total_unit",
            affected_type: "units",
            localities: true,
            tables: ["publichousing_rparegion_1"]
          },
          train_stations: {
            flood_column: "flood",
            type: "Train station",
            name_column: "station_na",
            affected_type: "stations",
            loss_column: false,
            localities: false,
            tables: ["rpa_trainstations"]
          },
          rail_lines: {
            flood_column: "flood",
            type: "Rail line",
            name_column: "line_name",
            affected_type: "units",
            loss_column: false,
            localities: false,
            tables: ["rpa_raillines_flood"]
          },
          subway_stations: {
            flood_column: "flood",
            type: "Subway station",
            name_column: "station_na",
            loss_column: false,
            affected_type: "stations",
            localities: false,
            tables: ["rpa_subwaystations"]
          },
          subway_routes: {
            flood_column: "am",
            type: "Subway route",
            name_column: "route_name",
            loss_column: false,
            affected_type: "routes",
            localities: false,
            tables: ["rpa_subwayroutes_flood"]
          },
          subway_yards: {
            flood_column: "flood",
            type: "Subway yard",
            name_column: "yard_name",
            loss_column: false,
            affected_type: "yards",
            localities: false,
            tables: ["nyct_subway_yards"]
          },
          transit_tunnels: {
            flood_column: "flood",
            type: "Transit tunnel",
            name_column: "name",
            loss_column: false,
            affected_type: "tunnels",
            localities: false,
            tables: ["nyc_transit_tunnels2014"]
          },
          airports: {
            flood_column: "flood",
            type: "Airport",
            name_column: "name",
            loss_column: false,
            affected_type: "airports",
            localities: false,
            tables: ["rpa_majorregionalairports_042014"]
          },
          ports: {
            flood_column: "flood",
            type: "Port",
            name_column: "name",
            loss_column: false,
            affected_type: "ports",
            localities: false,
            tables: ["rpa_ports_042014"]
          },
          elem_schools: {
            flood_column: "flood",
            type: "Elementary school",
            name_column: "schnam",
            loss_column: false,
            affected_type: "schools",
            localities: false,
            tables: ["elem_schools"]
          }
        };
        _.each(dbs, function(value, k) {
          var css, interactivity, sql, sublayer;
          sql = _.map(value["tables"], function(table) {
            var ret;
            ret = "" + table + ".cartodb_id," + table + "." + value['flood_column'] + ", " + table + ".the_geom, " + table + ".the_geom_webmercator, " + table + "." + value['name_column'];
            if (value["localities"]) {
              ret = ret + (", " + table + ".localname");
            }
            if (value["loss_column"]) {
              ret = ret + (", " + table + "." + value["loss_column"]);
            }
            return "SELECT " + ret + " FROM " + table;
          });
          sql = sql.join(" UNION ALL ");
          css = _.map(value["tables"], function(table) {
            return "#" + table + " {\n  marker-fill: " + red + ";\n  marker-line-width:0;\n\n  ::line {\n    line-width: 1;\n    line-color: " + red + ";\n  }\n  [" + value['flood_column'] + " < 1]{\n    marker-fill: #575757;\n  }\n  [zoom <= 13] {\n    marker-width: 5;\n  }\n  [zoom > 13] {\n    marker-width: 15;\n  }\n}";
          });
          css = css.join(" ");
          if (sql && css) {
            interactivity = ["cartodb_id", value['name_column']];
            if (value["loss_column"]) {
              interactivity.push(value['loss_column']);
            }
            if (value['localities']) {
              interactivity.push("localname");
            }
            sublayer = layer.createSubLayer({
              sql: sql,
              cartocss: css,
              interactivity: interactivity
            });
            return value["layer"] = sublayer;
          }
        });
        _.each(dbs, function(value, k) {
          return vis.addOverlay({
            layer: value["layer"],
            type: 'tooltip',
            offset_top: -30,
            template: "<div class=\"cartodb-popup\">\n  <div class=\"cartodb-popup-content-wrapper\">\n    <div class=\"cartodb-popup-content\">\n      <div class=\"title\">\n        <b>{{ " + value['name_column'] + " }}</b>\n        {{#localname}}\n          <p>{{localname}}</p>\n        {{/localname}}\n      </div>\n      <div>\n        " + value['type'] + "\n      </div>\n\n      {{#" + value['loss_column'] + " }}\n        <p>Affected " + value['affected_type'] + ": {{ " + value['loss_column'] + " }}</p>\n      {{/" + value['loss_column'] + " }}\n    </div>\n  </div>\n</div>"
          });
        });
        $("#vulnerable").after("<div id=\"layer_selector\" class=\"cartodb-infobox\">\n  <ul>\n    <li data-sublayer=\"nursing_homes\">\n      <h3>11,114</h3>\n      <p>(8% in the floodplain)</p>\n      <p class='show'>Nursing home beds</p>\n    </li>\n    <li data-sublayer=\"hospitals\">\n      <h3>9,214</h3>\n      <p>(11% in the floodplain)</p>\n      <p class='show'>Hospital beds</p>\n    </li>\n    <li data-sublayer=\"public_housing\">\n      <h3>47,382</h3>\n      <p>(14% in the floodplain)</p>\n      <p class='show'>Public housing units</p>\n    </li>\n    <li data-sublayer=\"power_plants\">\n      <h3>59%</h3>\n      <p>(19,186 kW)</p>\n      <p class='show'>Power-generation capacity</p>\n    </li>\n    <li data-sublayer=[\"rail_lines\",\"train_stations\",\"subway_stations\",\"subway_routes\"]>\n      <h3>115</h3>\n      <p>(13% in the floodplain)</p>\n      <p class='show'>Subway and rail stations</p>\n    </li>\n    <li data-sublayer=\"subway_yards\">\n      <h3>7</h3>\n      <p>(33% in the floodplain)</p>\n      <p class='show'>Subway yards</p>\n    </li>\n    <li data-sublayer=\"transit_tunnels\">\n      <h3>All</h3>\n      <p>(12 total)</p>\n      <p class='show'>Train and vehicle tunnels</p>\n    </li>\n    <li data-sublayer=\"airports\">\n      <h3>4</h3>\n      <p class='show'>Airports</p>\n    </li>\n    <li data-sublayer=\"ports\">\n      <h3>All</h3>\n      <p>(6 total)</p>\n      <p class='show'>Shipping ports</p>\n    </li>\n    <li data-sublayer=\"elem_schools\">\n      <h3>177</h3>\n      <p>(6% in the floodplain)</p>\n      <p class='show'>Public elementary schools</p>\n    </li>\n  </ul>\n</div>");
        $("#layer_selector li").on("click", function(e) {
          var $li, activeLi, activeSublayer, dbs_and_flood_zone, layerName;
          $li = $(e.target).closest("li");
          layerName = $li.data("sublayer");
          if ($li.hasClass("active")) {
            return true;
          }
          if ($li.hasClass("disabled")) {
            return true;
          }
          activeLi = $li.parents("ul").find(".active");
          activeLi.removeClass("active");
          $li.toggleClass("active");
          activeSublayer = $li.data("sublayer");
          dbs_and_flood_zone = _.extend(dbs, {
            flood_zone: []
          });
          return _.each(dbs_and_flood_zone, function(value, k) {
            if (activeSublayer === "All") {
              return value["layer"].show();
            } else {
              if (k === "flood_zone") {

              } else {
                if (k === activeSublayer || _.contains(activeSublayer, k)) {
                  return value["layer"].show();
                } else {
                  return value["layer"].hide();
                }
              }
            }
          });
        });
        return $("#layer_selector li:eq(0)").click();
      });
    };

    Workspace.prototype.discretionary = function() {
      return cartodb.createVis('discretionary', 'http://rpa.cartodb.com/api/v2/viz/62e94d78-9f1e-11e3-b420-0ed66c7bc7f3/viz.json', {
        legends: true,
        searchControl: true,
        cartodb_logo: false,
        scrollwheel: false,
        center_lat: 40.7,
        center_lon: -73.9,
        zoom: 10,
        infowindow: true,
        layer_selector: false
      }).done(function(vis, layers) {
        var censusLayer, colors, countyLayer, dataLayers, infoTmpl, localColors, map, rd, tooltipTmpl;
        map = vis.getNativeMap();
        dataLayers = layers[1];
        dataLayers.setInteraction(true);
        countyLayer = dataLayers.getSubLayer(0);
        censusLayer = dataLayers.getSubLayer(1);
        censusLayer.hide();
        map.on('zoomend', function(a, b, c) {
          var zoomLevel;
          zoomLevel = map.getZoom();
          if (zoomLevel > 10) {
            censusLayer.show();
            return countyLayer.hide();
          } else {
            censusLayer.hide();
            return countyLayer.show();
          }
        });
        colors = {
          housing: "#7d2b0f",
          taxes: "#ecad12",
          transport: "#f13319",
          disp_inc: "#41b3d4"
        };
        infoTmpl = "<div class=\"cartodb-popup\">\n  <a href=\"#close\" class=\"cartodb-popup-close-button close\">x</a>\n   <div class=\"cartodb-popup-content-wrapper\">\n      <div class=\"title\">\n        <b>{{content.data.county}}{{content.data.localname}}</b>\n        {{# content.data.namelsad10}}\n        <p>{{content.data.namelsad10}}</p>\n        {{/ content.data.namelsad10}}\n      </div>\n      <table style=\"margin-bottom:10px\">\n        <tr>\n          <td>\n            <b>Housing costs:</b>\n            <h3 class=\"currency\" style=\"margin: 0 10px 0 0;color:" + colors['housing'] + "\">{{content.data.housingcos}}{{content.data.avg_hous}}</h3>\n          </td>\n          <td>\n            <b>Transportation:</b>\n            <h3 class=\"currency\" style=\"margin: 0 10px 0 0;color:" + colors['transport'] + "\">{{content.data.avg_transc}}{{content.data.avg_trans}}</h3>\n          </td>\n        </tr>\n        <tr>\n          <td>\n            <b>Income taxes:</b>\n            <h3 class=\"currency\" style=\"margin: 0 10px 0 0;color:" + colors['taxes'] + "\">{{content.data.avg_ttl}}</h3>\n          </td>\n          <td>\n            <b>Left-over Income:</b>\n            <h3 class=\"currency\" style=\"margin: 0 10px 0 0;color:" + colors['disp_inc'] + "\">{{content.data.disp_inc}}</h3>\n          </td>\n        </tr>\n      </table>\n\n      <div>\n        Median income: <b class=\"currency\">{{content.data.mhi}}{{content.data.avg_mhi}}</b>\n      </div>\n      <div class=\"barCharts\" style=\"position:relative;top:-3px\"></div>\n      <div class=\"regional-mhi\" style=\"position:relative;top:-60px;border-top:solid 1px #ccc;padding-top:5px\">\n        RPA regional median income: <b>$72,140</b>\n      </div>\n   </div>\n </div>";
        censusLayer.infowindow.set('template', infoTmpl);
        countyLayer.infowindow.set('template', infoTmpl);
        rd = {
          housing: 21460,
          taxes: 10344,
          transport: 10519,
          disp_inc: 29817
        };
        localColors = [colors.housing, colors.taxes, colors.transport, colors.disp_inc];
        vent.on("infowindow:rendered", function(obj, $el) {
          var data, regionData;
          if (obj["null"] === "Loading content...") {
            return;
          }
          data = (function() {
            var d;
            d = obj.content.data;
            return [d.avg_hous || d.housingcos, d.avg_ttl, d.avg_trans || d.avg_transc, d.disp_inc];
          })();
          regionData = [rd.housing, rd.taxes, rd.transport, rd.disp_inc];
          return makeStackedChart([data, regionData], $el.find(".barCharts").get(0), false, localColors);
        });
        countyLayer = countyLayer.setInteractivity("cartodb_id, county, disp_inc, avg_trans, avg_hous, avg_ttl, avg_mhi");
        censusLayer = censusLayer.setInteractivity("cartodb_id, namelsad10, disp_inc, localname, avg_transc, housingcos, avg_ttl, mhi");
        tooltipTmpl = "<div class=\"cartodb-popup\">\n    <div class=\"title\">\n      <b>{{county}}{{localname}}</b>\n    </div>\n    <div>\n      Median Income:\n      <b class=\"currency\">{{avg_mhi}}{{mhi}}</b>\n    </div>\n    <div>\n      Left-over Income:\n      <b class=\"currency\">{{disp_inc}}</b>\n    </div>\n    <div>\n      Fixed Income:\n      <b class=\"fixed-income currency\"></b>\n    </div>\n</div>";
        _.each([countyLayer, censusLayer], function(item) {
          var tooltip;
          tooltip = new cdb.geo.ui.Tooltip({
            template: tooltipTmpl,
            layer: item,
            offset_top: -30
          });
          return vis.container.append(tooltip.render().el);
        });
        return vent.on("tooltip:rendered", function(d, $el) {
          var fixed;
          $(".cartodb-tooltip").hide();
          $el.show();
          fixed = d.avg_trans || d.avg_transc + d.avg_hous || d.housingcos + d.avg_ttl;
          $(".fixed-income").text(fixed);
          return formatMoney();
        });
      });
    };

    return Workspace;

  })(Backbone.Router);

  $(function() {
    var chapter, fci, lastChapter, lci, liIndex, nextChapter, sch, wrapMaps, _ref;
    window.router = new Workspace();
    Backbone.history.start({
      pushState: true,
      root: root
    });
    fci = 1;
    lci = 6;
    lastChapter = function(cc) {
      if (cc > fci) {
        return cc - 1;
      } else {
        return lci;
      }
    };
    nextChapter = function(cc) {
      if (cc < lci) {
        return cc + 1;
      } else {
        return fci;
      }
    };
    sch = function(anchor, chapter) {
      return anchor.attr("href", "" + root + "c/" + chapter + ".html");
    };
    chapter = parseInt((_ref = location.pathname.match(/c\/(.+)\.html/)) != null ? _ref[1] : void 0);
    if (chapter) {
      liIndex = chapter - 1;
      $(".ch-nav li:eq(" + liIndex + ")").addClass("active");
      $(".hero-nav a, .bottom-nav a").each(function() {
        var $a;
        $a = $(this);
        if ($a.hasClass("prev")) {
          sch($a, lastChapter(chapter));
          if (chapter === fci) {
            return $a.remove();
          }
        } else {
          sch($a, nextChapter(chapter));
          if (chapter === lci) {
            return $a.remove();
          }
        }
      });
    }
    $(".bottom-nav li").each(function(i) {});
    $(".ch-nav li").each(function(i) {
      var $a;
      $a = $(this).find("a");
      return sch($a, i + 1);
    });
    if (mapId) {
      router[mapId]();
    }
    wrapMaps = function() {
      return $("iframe.wrap-map").each(function() {
        var $map, left, width;
        $map = $(this);
        width = $(window).innerWidth();
        left = $map.parent(".item").offset()["left"] + 20;
        $map.css({
          width: width + "px",
          left: -1 * left,
          position: "relative",
          overflow: "hidden"
        });
        return $map.attr("scrolling", "no");
      });
    };
    wrapMaps();
    return $(window).on("resize", function() {
      return wrapMaps();
    });
  });

}).call(this);
