//create map portion
function createMap(){
    //create tmap
    
	var map = L.map('mapid', {
        center: [17.317758864832186, 5.65041787039295],
        zoom: 2
    });
	
	//add controls layers
	//ability to toggle on/off Esri and Stamen base layers (nice options, both are low-profile to preserve view of geoJSON)
	var controlLayers = L.control.layers( null, null, {
		position: "topright",
		collapsed: false
		}).addTo(map);
	
	//variables for both Esri and Stamen's tile layer sources
	var ESRI = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    }).addTo(map);
	controlLayers.addBaseLayer(ESRI, 'Esri World Gray Canvas');	
	
	var Stamen_TonerLite = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
		attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		subdomains: 'abcd',
		minZoom: 0,
		maxZoom: 20,
		ext: 'png'
	});
	controlLayers.addBaseLayer(Stamen_TonerLite, 'Stamen TonerLite');
		
	//adds the fifth operator, using the Leaflet Control Geocoder using OSM/Nominatim.
	L.Control.geocoder().addTo(map);

    //call getData function
    getData(map);
};

//calculates the radius of each proportional symbol based on attribute value
function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = .00000160;
    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);

    return radius;
};

//popup constructor function
function Popup(properties, attribute, layer, radius){
    this.properties = properties;
    this.attribute = attribute;
    this.layer = layer;
    this.year = attribute.split("_")[1];
    this.population = this.properties[attribute];
    this.content = "<p><b>Country:</b> " + this.properties.Country + "</p><p><b>Population in " + this.year + ":</b> " + this.population + " people</p>";

    this.bindToLayer = function(){
        this.layer.bindPopup(this.content, {
            offset: new L.Point(0,-radius)
        });
    };
};

//converts default markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //Assign the current attribute based on the first index of the attributes array
    var attribute = attributes[0];

    //create marker options
    var options = {
        fillColor: "#91cf60",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //Example 1.3 line 1...in pointToLayer()
    //create new popup
    var popup = new Popup(feature.properties, attribute, layer, options.radius);

    //add popup to circle marker
    popup.bindToLayer();

    //event listeners to open popup on hover and fill panel on click
    layer.on({
        mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        }//,
    //  click: function(){
    //      $("#panel").html(panelContent);
    //  }
    });

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

//build an attributes array from the data
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;
    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("Pop") > -1){
            attributes.push(attribute);
        };
    };

    return attributes;
};

//add circle markers for point features to the map
function createPropSymbols(data, map, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

//resize proportional symbols based upon "new" attribute values
function updatePropSymbols(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;

            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            //Example 1.3 line 6...in UpdatePropSymbols()
            var popup = new Popup(props, attribute, layer, radius);

            //add popup to circle marker
            popup.bindToLayer();
        };
    });

    updateLegend(map, attribute);
};

function createLegend(map, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            //add temporal legend div to container
            $(container).append('<div id="temporal-legend">')

            //Example 3.5 line 15...Step 1: start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="190px" height="80px">';

            // //array of circle names to base loop on
            // var circles = ["max", "mean", "min"];

            //object to base loop on...replaces Example 3.10 line 1
            var circles = {
                max: 15,
                mean: 30,
				halfmean: 45,
				quartermean: 60
            };

            // //Step 2: loop to add each circle and text to svg string
            // for (var i=0; i<circles.length; i++){
            //     //circle string
            //     svg += '<circle class="legend-circle" id="' + circles[i] + 
            //     '" fill="#91cf60" fill-opacity="0.8" stroke="#000000" cx="30"/>';

            //     //text string
            //     svg += '<text id="' + circles[i] + '-text" x="65" y="60"></text>';
            // };

            //loop to add each circle and text to svg string
            for (var circle in circles){
                //circle string
                svg += '<circle class="legend-circle" id="' + circle + '" fill="#91cf60" fill-opacity="0.8" stroke="#000000" cx="45"/>';

                //text string
                svg += '<text id="' + circle + '-text" x="85" y="' + circles[circle] + '"></text>';
            };

            //close svg string
            svg += "</svg>";
            console.log(svg);

            //add attribute legend svg to container
            $(container).append(svg);

            return container;
        }
    });

    map.addControl(new LegendControl());

    updateLegend(map, attributes[0]);
};

//calculate the max, mean, halfmean, quartermean and min values for a given attribute. Fractional means will make for consistently concentric circles while using slider
function getCircleValues(map, attribute){
    //start with min at highest possible and max at lowest possible number
    	
	var min = 1660506849,
        max = 3237;
	    
	
	map.eachLayer(function(layer){
        //get the attribute value
        if (layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);

            //test for min
            if (attributeValue < min){
                min = attributeValue;
            };

            //test for max
            if (attributeValue > max){
                max = attributeValue;
            };
        };
    });

    //set mean
    var mean = (max + min) / 2;
	
	//set halfmean
	var halfmean = (mean) / 2;
	
	//set quartermean
	var quartermean = (mean) / 4;

    //return values as an object
    return {
        max: Math.round(max),
        mean: Math.round(mean),
        halfmean: Math.round(halfmean),
		quartermean: Math.round(quartermean)
    };
};

//update the legend with new attribute
function updateLegend(map, attribute){
    //create content for legend
    var year = attribute.split("_")[1];
    var content = "Population in " + year;

    //replace legend content
    $('#temporal-legend').html(content);

    //get the max, mean, and min values as an object
    var circleValues = getCircleValues(map, attribute);

    for (var key in circleValues){
        //get the radius
        var radius = calcPropRadius(circleValues[key]);

        //Step 3: assign the cy and r attributes
        $('#'+key).attr({
            cy: 59 - radius,
            r: radius
        });

        //Step 4: add legend text
        $('#'+key+'-text').text(Math.round(circleValues[key]*100)/100 + "");
    };
};

//create new Leaflet control
function createSequenceControls(map, attributes){
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function (map) {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            //create range input element (slider)
            $(container).append('<input class="range-slider" type="range">');

            //add skip buttons
            $(container).append('<button class="skip" id="reverse" title="Reverse">Reverse</button>');
            $(container).append('<button class="skip" id="forward" title="Forward">Skip</button>');

            //disable any mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });

    map.addControl(new SequenceControl());

	//set slider attributes
	$('.range-slider').attr({
		max: 8,
		min: 0,
		value: 0,
		step: 1
	});

	//replace button content with images

	$('#reverse').html('<img src="img/Button_L.png">');
	$('#forward').html('<img src="img/Button_R.png">');

	//click listener for buttons
	$('.skip').click(function(){

		//get the old index value
		var index = $('.range-slider').val();

		//increment or decriment depending on button clicked
		if ($(this).attr('id') == 'forward'){
			index++;
			//if past the last attribute, wrap around to first attribute
			index = index > 8 ? 0 : index;
		} else if ($(this).attr('id') == 'reverse'){
			index--;
			//if past the first attribute, wrap around to last attribute
			index = index < 0 ? 8 : index;
		};

		//update slider
		$('.range-slider').val(index);

		//pass new attribute to update symbols
		updatePropSymbols(map, attributes[index]);
	});

	//input listener for slider
	$('.range-slider').on('input', function(){
		//get the new index value
		var index = $(this).val();

		//pass new attribute to update symbols
		updatePropSymbols(map, attributes[index]);
	});
};

//import GeoJSON from using ajax
function getData(map){
    //load the data
    $.ajax("data/allcountries_2020_2060.geojson", {
        dataType: "json",
        success: function(response){
            //create an attributes array
            var attributes = processData(response);

            createPropSymbols(response, map, attributes);
            createSequenceControls(map, attributes);
            createLegend(map, attributes);

        }
    });
};

$(document).ready(createMap);