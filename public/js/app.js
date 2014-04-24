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
      "maps/carbon.html": "carbon",
      "maps/governance.html": "governance"
    };

    Workspace.prototype.governance = function() {
      var clickerState, max, moveLayerTracker, moveSlide, slideshow;
      moveLayerTracker = function(state) {
        $("#layer_tracker li").removeClass("active");
        return $("#layer_tracker li").slice(0, state).map(function(l) {
          return $(this).addClass("active");
        });
      };
      moveSlide = function(state) {
        var i;
        $(".slides img").removeClass("active");
        i = state - 1;
        console.log(i);
        return $(".slides img:eq(" + i + ")").addClass("active");
      };
      slideshow = void 0;
      max = 9;
      clickerState = 1;
      return $("#clicker").on("click", function(e) {
        var $a;
        $a = $(e.target).closest("a");
        if ($a.hasClass("prev")) {
          clickerState = (clickerState === 1 ? max - 1 : clickerState - 1);
        } else if ($a.hasClass("next")) {
          clickerState = (clickerState === max - 1 ? 1 : clickerState + 1);
        }
        moveLayerTracker(clickerState);
        return moveSlide(clickerState);
      });
    };

    Workspace.prototype._governance = function() {
      var id, url;
      id = "governance";
      url = "http://rpa.cartodb.com/api/v2/viz/6f7a3bee-c3ed-11e3-ad6c-0edbca4b5057/viz.json";
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
        var clickerState, layer, region, sublayers, tables;
        layer = layers[1];
        region = layer.getSubLayer(0);
        tables = {
          region: {
            c: "#ff0000",
            n: "rpa_region_u83_line"
          },
          states: {
            c: {
              ct: "#000000",
              ny: "#ff0000",
              nj: "#ffff00"
            },
            n: "states"
          },
          counties: {
            c: "#ffffff",
            n: "counties"
          },
          municipalities: {
            c: "#ffffff",
            n: ["nj_towns", "ct_towns", "ny_towns"]
          },
          school_districts: {
            c: "#ffffff",
            n: "school_districts2014"
          },
          fire_districts: {
            c: "#ffffff",
            n: "rpa_spcialdistricts_v2_fire"
          },
          sewer_districts: {
            c: "#ffffff",
            n: "rpa_spcialdistricts_v2_sewer"
          },
          housing_authorities: {
            c: "#ffffff",
            n: "rpa_housing_authorities"
          },
          bids: {
            c: "#ffffff",
            n: "rpa_bid"
          }
        };
        _.each(tables, function(table, k) {
          var css, hex, q, sql, t;
          sql = void 0;
          css = void 0;
          t = table.n;
          if (_.isArray(t)) {
            q = _.map(t, function(n) {
              return "SELECT " + n + ".cartodb_id, " + n + ".the_geom, " + n + ".the_geom_webmercator FROM " + n;
            });
            sql = q.join(" UNION ALL ");
          } else {
            sql = "SELECT * FROM " + t;
          }
          if (_.isObject(table.c)) {
            css = "#" + t + " [name=\"New York\"] {\n  polygon-fill: " + table.c.ny + ";\n}\n#" + t + " [name=\"New Jersey\"] {\n  polygon-fill: " + table.c.nj + ";\n}\n#" + t + " [name=\"Connecticut\"] {\n  polygon-fill: " + table.c.ct + ";\n}";
          } else {
            hex = table.c;
            if (table.n === "rpa_region_u83_line") {
              css = "#" + t + " {\n  line-color: " + hex + ";\n}";
            } else {
              css = "#" + t + " {\n  marker-fill: " + hex + ";\n  marker-line-color: " + hex + ";\n  marker-line-width: 1;\n}";
            }
          }
          return table.sublayer = layer.createSubLayer({
            sql: sql,
            cartocss: css
          });
        });
        sublayers = _.map(_.toArray(tables), function(t) {
          return t.sublayer;
        });
        clickerState = 1;
        sublayers.slice(clickerState).map(function(l) {
          return l.hide();
        });
        return $("#clicker").on("click", function(e) {
          var a;
          a = e.target;
          clickerState = a.classList.contains("prev") ? clickerState === 1 ? sublayers.length - 1 : clickerState - 1 : clickerState === sublayers.length - 1 ? 1 : clickerState + 1;
          sublayers.slice(clickerState).map(function(l) {
            return l.hide();
          });
          sublayers.slice(0, clickerState).map(function(l) {
            return l.show();
          });
          $("#layer_tracker li").removeClass("active");
          return $("#layer_tracker li").slice(0, clickerState).map(function(l) {
            return $(this).addClass("active");
          });
        });
      });
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
              template: "<h3 class=\"title-case\">\n  Avg. household carbon emissions (MTCO2E)\n</h3>\n{{#county_n}}\n  <b>County: <span>{{county_n}}</span></b>\n{{/county_n}}\n{{#zip}}\n  <b>Zip code: <span>{{zip}}</span></b>\n{{/zip}}\n<div class=\"progressive\">\n\n</div>\n<div class=\"tooltip-legend clearfix\">\n  <div class=\"food\">Food</div>\n  <div class=\"goods\">Goods</div>\n  <div class=\"services\">Services</div>\n  <div class=\"transport\">Transport</div>\n  <div class=\"housing\">Housing</div>\n</div>"
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
          template: "<div class=\"cartodb-popup\">\n   <div class=\"cartodb-popup-content-wrapper\">\n      <div class=\"cartodb-popup-content\">\n        <p><b>{{namelsad10}}</b></p>\n        <p>{{localname}}</p>\n        <p class=\"property-tax\">Property tax: <b class=\"tax-rate\">{{retaxrate}}</b></p>\n      </div>\n   </div>\n</div>",
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
        legends: false,
        cartodb_logo: false,
        scrollwheel: false,
        center_lat: 40.7,
        center_lon: -73.9,
        zoom: 10
      }).done(function(vis, layers) {
        var color1, color2, color3, color4, color5, infowindow, layer, map, score_to_color, station_layers, tooltip, walkabilityLayer;
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
        walkabilityLayer = walkabilityLayer.setInteractivity("cartodb_id, namelsad10, locality, walk_score, walk_sco_1");
        tooltip = new cdb.geo.ui.Tooltip({
          template: "<div class=\"cartodb-popup\">\n   <div class=\"cartodb-popup-content-wrapper\">\n      <div class=\"cartodb-popup-content\">\n        <div class='title'>\n          <b>{{locality}}</b>\n          <p>{{namelsad10}}</p>\n        </div>\n        <div class=\"clearfix\">\n          <div class=\"progress walk_score pull-left\" style=\"margin-bottom:5px;width:100%\"><div class=\"progress-bar\" style=\"width:{{walk_score}}%\"></div></div>\n          <div class=\"pull-left\">Walk Score®: <b class=\"walkability-score\">{{walk_score}}</b></div>\n        </div>\n      </div>\n   </div>\n</div>",
          layer: walkabilityLayer,
          offset_top: -50
        });
        vis.container.append(tooltip.render().el);
        infowindow = "<div class=\"cartodb-popup\">\n  <a href=\"#close\" class=\"cartodb-popup-close-button close\">x</a>\n  <div class=\"cartodb-popup-content-wrapper\">\n    <div class=\"cartodb-popup-content\">\n      <div class='title'>\n        <b>{{content.data.locality}}</b>\n        <p>{{content.data.namelsad10}}</p>\n      </div>\n      <div class=\"clearfix\" style=\"margin-bottom:5px\">\n        <div class=\"progress walk_score pull-left\" style=\"width:100%\"><div class=\"progress-bar\" style=\"width:{{content.data.walk_score}}%\"></div></div>\n        <div class=\"pull-left\">Walk Score®: <b class=\"walkability-score\">{{content.data.walk_score}}</b></div>\n      </div>\n\n      <div style=\"color:#ccc;font-size:0.9em;border-top:solid 1px #ccc;padding-top:3px;margin-top:10px;margin-bottom:10px\">Other scores</div>\n\n      <div class=\"clearfix\" style=\"margin-bottom:5px\">\n        <div class=\"progress pull-left\" style=\"width:100%\"><div class=\"progress-bar\" style=\"width:{{content.data.dining_and}}%\"></div></div>\n        <div class=\"pull-left\">Dining and restaurant: <b class=\"walkability-score\">{{content.data.dining_and}}</b></div>\n      </div>\n\n\n      <div class=\"clearfix\" style=\"margin-bottom:5px\">\n        <div class=\"progress pull-left\" style=\"width:100%\"><div class=\"progress-bar\" style=\"width:{{content.data.shopping_s}}%\"></div></div>\n        <div class=\"pull-left\">Shopping: <b class=\"walkability-score\">{{content.data.shopping_s}}</b></div>\n      </div>\n\n      <div class=\"clearfix\" style=\"margin-bottom:5px\">\n        <div class=\"progress pull-left\" style=\"width:100%\"><div class=\"progress-bar\" style=\"width:{{content.data.culture_sc}}%\"></div></div>\n        <div class=\"pull-left\">Culture: <b class=\"walkability-score\">{{content.data.culture_sc}}</b></div>\n      </div>\n\n    </div>\n  </div>\n  <div class=\"cartodb-popup-tip-container\"></div>\n</div>";
        walkabilityLayer.infowindow.set('template', infowindow);
        score_to_color = {
          "Very Car Dependent": "#fae2ab",
          "Somewhat Car Dependent": "#ffbb67",
          "Somewhat Walkable": "#a6a9de",
          "Very Walkable": "#8e6eb1",
          "Walker's Paradise": "#753384"
        };
        vent.on("infowindow:rendered", function(obj, $el) {
          var color, data;
          if (obj["null"] === "Loading content...") {
            return;
          }
          data = obj.content.data;
          color = score_to_color[data["walk_sco_1"]];
          $el.find(".progress .progress-bar").css("background-color", "#8e8e8e");
          $el.find(".progress.walk_score .progress-bar").css("background-color", color);
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
          color = score_to_color[data["walk_sco_1"]];
          return $el.find(".progress.walk_score .progress-bar").css("background-color", color);
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
          template: "<div class=\"cartodb-popup\">\n   <div class=\"cartodb-popup-content-wrapper\">\n      <div class=\"cartodb-popup-content\">\n        <div class=\"title\">\n          <b>{{schnam}}</b>\n          <p>{{localname}} ({{namelsad10}})</p>\n        </div>\n        <div class=\"clearfix rank-container \">\n          {{#rank_perce}}\n            <div class=\"progress\" style=\"height:5px;-webkit-border-radius:0;position:relative;overflow: visible;width:95%\">\n              <div class=\"progress-bar low\" style=\"width:25%;background-color:#dc0000;\"></div>\n              <div class=\"progress-bar average\" style=\"width:50%;background-color:#70706e;\"></div>\n              <div class=\"progress-bar high\" style=\"width:25%;background-color:#0c7caa;\"></div>\n              <span class=\"dot\">•</span>\n            </div>\n          {{/rank_perce}}\n          <b>School rank</b>:<b class=\"school-rank\">{{rank_perce}}</b>\n        </div>\n\n        {{#hh_median}}\n          <div class=\"clearfix rank-container\">\n            <div class=\"progress\" style=\"height:5px;-webkit-border-radius:0;position:relative;overflow: visible;width:95%\">\n              <div class=\"progress-bar low\" style=\"width:20%;background-color:#f2f0ee;\"></div>\n              <div class=\"progress-bar average\" style=\"width:20%;background-color:#e5e1dd;\"></div>\n              <div class=\"progress-bar high\" style=\"width:20%;background-color:#d7d2cc;\"></div>\n              <div class=\"progress-bar progress-bar-warning\" style=\"width:20%;background-color:#cbc4bd;\"></div>\n              <div class=\"progress-bar progress-bar-warning\" style=\"width:20%;background-color:#beb4aa;\"></div>\n              <span class=\"dot\">•</span>\n            </div>\n            <b>Median household income</b>: <b class=\"hh-rank currency\">{{hh_median}}</b>\n          </div>\n        {{/hh_median}}\n        {{^hh_median}}\n          <i>No data available</i>\n        {{/hh_median}}\n\n\n\n\n\n        {{#whiteprcnt}}\n          <div class=\"clearfix rank-container\">\n            <div class=\"progress\" style=\"height:5px;-webkit-border-radius:0;position:relative;overflow: visible;width:95%\">\n              <div class=\"progress-bar low\" style=\"width:20%;background-color:#f5f5f5;\"></div>\n              <div class=\"progress-bar average\" style=\"width:20%;background-color:#e8e8e4;\"></div>\n              <div class=\"progress-bar high\" style=\"width:20%;background-color:#daded5;\"></div>\n              <div class=\"progress-bar progress-bar-warning\" style=\"width:20%;background-color:#cdd3c3;\"></div>\n              <div class=\"progress-bar progress-bar-warning\" style=\"width:20%;background-color:#b5c0a6;\"></div>\n              <span class=\"dot\">•</span>\n            </div>\n            <b>Percentage of white population</b>: <b class=\"race-rank\">{{whiteprcnt}}</b>\n          </div>\n        {{/whiteprcnt}}\n        {{^whiteprcnt}}\n          <i>No data available</i>\n        {{/whiteprcnt}}\n      </div>\n   </div>\n</div>",
          layer: schoolLayer,
          offset_top: -50
        });
        vis.container.append(tooltip.render().el);
        vent.on("tooltip:rendered", function(data) {
          var hhRank, raceRank, rank;
          rank = data["rank_perce"];
          if (rank === 0) {
            $(".school-rank").html(" <i> No data available</i>");
          } else {
            rank = (parseFloat(rank) * 100).toFixed(0);
            $(".school-rank").text("" + rank + "%").parent().find(".dot").css("left", "" + rank + "%");
          }
          hhRank = data["hh_median"];
          hhRank = hhRank / 250000;
          hhRank = (parseFloat(hhRank) * 100).toFixed(0);
          $(".hh-rank").parent().find(".dot").css("left", "" + hhRank + "%");
          raceRank = data["whiteprcnt"];
          raceRank = (parseFloat(raceRank) * 100).toFixed(0);
          $(".race-rank").text("" + raceRank + "%").parent().find(".dot").css("left", "" + raceRank + "%");
          return formatMoney();
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
        var affected, dbs, floodZoneLayer, layer, map;
        map = vis.getNativeMap();
        layer = layers[1];
        floodZoneLayer = layer.getSubLayer(0);
        layer.setInteraction(true);
        affected = "#fc4f4b";
        dbs = {
          power_plants: {
            flood_column: "flood",
            type: "Power plant",
            name_column: "plant_name",
            loss_column: "total_cap",
            affected_type: "Capacity (MWh)",
            localities: true,
            tables: ["rpa_powerplants_eia_latlong_withlocalities_201"]
          },
          hospitals: {
            flood_column: "flood",
            type: "Hospital",
            name_column: "name",
            loss_column: "total_beds",
            affected_type: "Number of beds",
            localities: true,
            tables: ["rpa_nj_hsip_hospitals_compressed_withlocalitie", "ny_rpa_hospitalsnamesbeds_withlocalities", "rpa_ct_hospitals_names_beds_withlocalities"]
          },
          nursing_homes: {
            flood_column: "flood",
            type: "Nursing home",
            name_column: "name",
            loss_column: "beds",
            affected_type: "Number of beds",
            localities: true,
            tables: ["rpa_ct_nursinghomes_namesaddressesbeds_withloc", "rpa_nj_hsip_nursinghomes_compressed_withlocali", "ny_rpa_nursinghomesnamesbedsflood_withlocaliti"]
          },
          public_housing: {
            flood_column: "flood",
            type: "Public housing",
            name_column: "project_na",
            loss_column: "total_unit",
            affected_type: "Affected units",
            localities: true,
            tables: ["publichousing_rparegion_1"]
          },
          train_stations: {
            flood_column: "flood",
            type: "Train station",
            name_column: "station_na",
            affected_type: "Affected stations",
            loss_column: false,
            localities: false,
            tables: ["rpa_trainstations"]
          },
          rail_lines: {
            flood_column: "flood",
            type: "Rail line",
            name_column: "line_name",
            affected_type: "Affected units",
            loss_column: false,
            localities: false,
            tables: ["rpa_raillines_flood"],
            no_tooltip: true
          },
          subway_stations: {
            flood_column: "flood",
            type: "Subway station",
            name_column: "station_na",
            loss_column: false,
            affected_type: "Affected stations",
            localities: false,
            tables: ["rpa_subwaystations"]
          },
          subway_routes: {
            flood_column: "am",
            type: "Subway route",
            name_column: "route_name",
            loss_column: false,
            affected_type: "Affected routes",
            localities: false,
            tables: ["rpa_subwayroutes_flood"],
            no_tooltip: true
          },
          subway_yards: {
            flood_column: "flood",
            type: null,
            name_column: "yard_name",
            loss_column: false,
            affected_type: "Affected yards",
            localities: false,
            tables: ["nyct_subway_yards"]
          },
          transit_tunnels: {
            flood_column: "flood",
            type: null,
            name_column: "name",
            loss_column: "carries",
            affected_type: "Services",
            localities: false,
            tables: ["nyc_transit_tunnels2014", "nyc_train_crossings_for_map"]
          },
          airports: {
            flood_column: "flood",
            type: null,
            name_column: "name",
            loss_column: false,
            affected_type: "Affected airports",
            localities: false,
            tables: ["rpa_majorregionalairports_042014"]
          },
          ports: {
            flood_column: "flood",
            type: null,
            name_column: "name",
            loss_column: false,
            affected_type: "Affected ports",
            localities: false,
            tables: ["rpa_ports_042014"]
          },
          elem_schools: {
            flood_column: "flood",
            type: "Elementary school",
            name_column: "schnam",
            loss_column: false,
            affected_type: "Affected schools",
            localities: false,
            tables: ["elem_schools"]
          }
        };
        _.each(dbs, function(value, k) {
          var css, interactivity, notAffected, sql, sublayer;
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
          notAffected = "#adadad";
          css = _.map(value["tables"], function(table) {
            return "#" + table + " {\n\n  marker-line-width:1;\n  marker-line-color:white;\n\n\n  ::line {\n    line-width: 1;\n    line-color: " + affected + ";\n  }\n  marker-fill: " + notAffected + ";\n  [" + value['flood_column'] + " < 1]{\n    marker-fill: " + notAffected + ";\n    marker-width: 10px;\n  }\n  [" + value['flood_column'] + " = 1]{\n    marker-fill: " + affected + ";\n    marker-width: 15px;\n  }\n}";
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
            if (value['flood_column']) {
              interactivity.push(value["flood_column"]);
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
          if (value.no_tooltip) {
            return;
          }
          return vis.addOverlay({
            layer: value["layer"],
            type: 'tooltip',
            offset_top: -30,
            template: "<div class=\"cartodb-popup\">\n  <div class=\"cartodb-popup-content-wrapper\">\n    <div class=\"cartodb-popup-content\">\n      <div class=\"title\">\n        <b>{{ " + value['name_column'] + " }}</b>\n        {{#localname}}\n          <p>{{localname}}</p>\n        {{/localname}}\n      </div>\n\n      {{#" + value['type'] + "}}\n        <div>\n          " + value['type'] + "\n        </div>\n      {{/" + value['type'] + "}}\n\n      {{#" + value['loss_column'] + "}}\n        <p class=\"{{#" + value['flood_column'] + "}}affected{{/" + value['flood_column'] + "}}\">" + value['affected_type'] + ": {{ " + value['loss_column'] + " }}</p>\n      {{/" + value['loss_column'] + "}}\n    </div>\n  </div>\n</div>"
          });
        });
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
      var startZoom;
      startZoom = 10;
      return cartodb.createVis('discretionary', 'http://rpa.cartodb.com/api/v2/viz/62e94d78-9f1e-11e3-b420-0ed66c7bc7f3/viz.json', {
        legends: true,
        searchControl: true,
        cartodb_logo: false,
        scrollwheel: false,
        center_lat: 40.7,
        center_lon: -73.9,
        zoom: startZoom,
        infowindow: true,
        layer_selector: false
      }).done(function(vis, layers) {
        var censusLayer, colors, countyLayer, dataLayers, infoTmpl, localColors, map, rd, tooltipTmpl, tooltips;
        map = vis.getNativeMap();
        dataLayers = layers[1];
        dataLayers.setInteraction(true);
        countyLayer = dataLayers.getSubLayer(0);
        censusLayer = dataLayers.getSubLayer(1);
        countyLayer.hide();
        map.on('zoomend', function(a, b, c) {
          var zoomLevel;
          zoomLevel = map.getZoom();
          if (zoomLevel >= startZoom) {
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
        infoTmpl = "<div class=\"cartodb-popup\">\n  <a href=\"#close\" class=\"cartodb-popup-close-button close\">x</a>\n   <div class=\"cartodb-popup-content-wrapper\">\n      <div class=\"title\">\n        <b>{{content.data.county}}{{content.data.localname}}</b>\n        {{# content.data.namelsad10}}\n        <p>{{content.data.namelsad10}}</p>\n        {{/ content.data.namelsad10}}\n      </div>\n      <table style=\"margin-bottom:10px\">\n        <tr>\n          <td>\n            <b>Housing costs</b>\n            <h5 class=\"currency\" style=\"margin: 0 10px 0 0;color:" + colors['housing'] + "\">{{content.data.housingcos}}{{content.data.avg_hous}}</h5>\n          </td>\n          <td>\n            <b>Transportation costs</b>\n            <h5 class=\"currency\" style=\"margin: 0 10px 0 0;color:" + colors['transport'] + "\">{{content.data.avg_transc}}{{content.data.avg_trans}}</h5>\n          </td>\n          <td>\n            <b>Taxes</b>\n            <h5 class=\"currency\" style=\"margin: 0 10px 0 0;color:" + colors['taxes'] + "\">{{content.data.avg_ttl}}</h5>\n          </td>\n        </tr>\n        <tr>\n          <td colspan=\"3\" style=\"font-size:1.4em;padding-top:5px\">\n            <b>Left-over income</b>\n            <span class=\"currency\" style=\"color:" + colors['disp_inc'] + "\">{{content.data.disp_inc}}</span>\n          </td>\n        </tr>\n      </table>\n\n      <div>\n        Median income: <b class=\"currency\">{{content.data.mhi}}{{content.data.avg_mhi}}</b>\n      </div>\n      <div class=\"barCharts\" style=\"position:relative;top:-3px\"></div>\n      <div class=\"regional-mhi\" style=\"position:relative;top:-48px;border-top:solid 1px #ccc;padding-top:5px\">\n        RPA regional median income: <b>$72,140</b>\n      </div>\n   </div>\n   <div class=\"cartodb-popup-tip-container\"></div>\n </div>";
        censusLayer.infowindow.set('template', infoTmpl);
        countyLayer.infowindow.set('template', infoTmpl);
        rd = {
          housing: 21460,
          taxes: 10344,
          transport: 10519,
          disp_inc: 29817
        };
        localColors = [colors.housing, colors.taxes, colors.transport, colors.disp_inc];
        countyLayer = countyLayer.setInteractivity("cartodb_id, county, disp_inc, avg_trans, avg_hous, avg_ttl, avg_mhi");
        censusLayer = censusLayer.setInteractivity("cartodb_id, namelsad10, disp_inc, localname, avg_transc, housingcos, avg_ttl, mhi");
        tooltipTmpl = "<div class=\"cartodb-popup\">\n  <div class=\"title\">\n    <b>{{county}}{{localname}}</b>\n  </div>\n  <table style=\"width:70%\">\n    <tr>\n      <td>\n        Median income:\n      </td>\n      <td>\n        <span class=\"currency\">{{avg_mhi}}{{mhi}}</span>\n      </td>\n    </tr>\n    <tr>\n      <td>\n        Fixed expenses:\n      </td>\n      <td>\n        <span class=\"fixed-income currency\"></span>\n      </td>\n    <tr style=\"font-weight:bold;border-top:solid 1px black\">\n      <td>\n        = Income left over:\n      </td>\n      <td>\n        <b class=\"currency\">{{disp_inc}}</b>\n      </td>\n    </tr>\n  </table>\n</div>";
        tooltips = [];
        _.each([countyLayer, censusLayer], function(item) {
          var tooltip;
          tooltip = new cdb.geo.ui.Tooltip({
            template: tooltipTmpl,
            layer: item,
            offset_top: -30
          });
          tooltips.push(tooltip);
          return vis.container.append(tooltip.render().el);
        });
        vent.on("tooltip:rendered", function(d, $el) {
          var fixed;
          $(".cartodb-tooltip").hide();
          $el.show();
          fixed = d.avg_trans || d.avg_transc + d.avg_hous || d.housingcos + d.avg_ttl;
          $(".fixed-income").text(fixed);
          return formatMoney();
        });
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
          makeStackedChart([data, regionData], $el.find(".barCharts").get(0), false, localColors);
          formatMoney();
          return _.each(tooltips, function(tooltip) {
            tooltip.disable();
            return tooltip.hide();
          });
        });
        return vent.on("infowindow:closed", function() {
          return _.each(tooltips, function(tooltip) {
            return tooltip.enable();
          });
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
      $(".hero-nav a, .bottom-nav a.prev, .bottom-nav a.next").each(function() {
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
    $(".ch-nav li").each(function(i) {
      var $a;
      $a = $(this).find("a");
      return sch($a, i + 1);
    });
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
