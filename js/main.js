(function(){
//variables for data join
    var attrArray = ["ImpUrbSanPct", "ImpWatSrcPct", "PopDen", "UrbPopPct", "GDPGroPct"];
	var expressed = attrArray[0]; //initial attribute

window.onload = setMap();

//set up choropleth map
function setMap(){
	
	//map frame dimensions
    var width = window.innerWidth * 0.5,
        height = 800;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
    var projection = d3.geoAzimuthalEqualArea()
		.center([17, 2])
        .scale(600)
		.translate([width / 2, height / 2])
		.precision(0.1);
		
	var path = d3.geoPath()
        .projection(projection);
	
    //use d3.queue to parallelize asynchronous data loading
    d3.queue()
        .defer(d3.csv, "data/d3_lab2data.csv") //load attributes from csv
		.defer(d3.json, "data/AllCountries.topojson") //load background spatial data
        .defer(d3.json, "data/African_Countries.topojson") //load choropleth spatial data
        .await(callback);
		
	function callback(error, csvData, world, africa){
		
		//place graticule on the map
        setGraticule(map, path);
		
        var allCountries = topojson.feature(world, world.objects.AllCountries),
			africanCountries = topojson.feature(africa, africa.objects.AfricanCountries).features;
			
		//variables for data join
    /*var attrArray = ["ImpUrbSanPct", "ImpWatSrcPct", "PopDen", "UrbPopPct", "GDPGroPct"];

    //loop through csv to assign each set of csv attribute values to geojson region
    for (var i=0; i<csvData.length; i++){
        var csvCountry = csvData[i]; //the current region
        var csvKey = csvCountry.Country; //the CSV primary key

        //loop through geojson regions to find correct region
        for (var a=0; a<africanCountries.length; a++){

            var geojsonProps = africanCountries[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.COUNTRY; //the geojson primary key

            //where primary keys match, transfer csv data to geojson properties object
            if (geojsonKey == csvKey){

                //assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvCountry[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
            };
        };
    };*/
			
			
		/*var graticule = d3.geoGraticule()
            .step([10, 10]); //place graticule lines every 5 degrees of longitude and latitude
			
		//create graticule background
        var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule
			
		//create graticule lines
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines*/
			
		var wCountries = map.append("path")
            .datum(allCountries)
            .attr("class", "wCountries")
            .attr("d", path);
			
		//add African countries to map
        /*var countries = map.selectAll(".countries")
            .data(africanCountries)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "countries " + d.properties.COUNTRY.replace(/ /g,'-');
            })
            .attr("d", path);
		console.log(africanCountries);*/
		
		//join csv data to GeoJSON enumeration units
        africanCountries = joinData(africanCountries, csvData);
		
		//create the color scale
        var colorScale = makeColorScale(csvData);
		
		//add enumeration units to the map
        setEnumerationUnits(africanCountries, map, path, colorScale);
		
		//add coordinated visualization to the map
        setChart(csvData, colorScale);

		};
	};

function setGraticule(map, path){
    //...GRATICULE BLOCKS FROM MODULE 8
		var graticule = d3.geoGraticule()
            .step([10, 10]); //place graticule lines every 5 degrees of longitude and latitude
			
		//create graticule background
        var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule
			
		//create graticule lines
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines
};

function joinData(africanCountries, csvData){
    //...DATA JOIN LOOPS FROM EXAMPLE 1.1

    //loop through csv to assign each set of csv attribute values to geojson region
    for (var i=0; i<csvData.length; i++){
        var csvCountry = csvData[i]; //the current region
        var csvKey = csvCountry.Country; //the CSV primary key

        //loop through geojson regions to find correct region
        for (var a=0; a<africanCountries.length; a++){

            var geojsonProps = africanCountries[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.COUNTRY; //the geojson primary key

            //where primary keys match, transfer csv data to geojson properties object
            if (geojsonKey == csvKey){

                //assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvCountry[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
            };
        };
    };

    return africanCountries;
};

function setEnumerationUnits(africanCountries, map, path, colorScale){
    //...REGIONS BLOCK FROM MODULE 8
	//add African countries to map
        var countries = map.selectAll(".countries")
            .data(africanCountries)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "countries " + d.properties.COUNTRY.replace(/ /g,'-');
            })
            .attr("d", path);
			/*.style("fill", function(d){
            return choropleth(d.properties, colorScale);
        });*/
		console.log(africanCountries);
};

//function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#D4B9DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043"
    ];

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;
};

//function to test for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};

//function to create coordinated bar chart
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473;
		leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");
		
	//create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
		
	//create a scale to size bars proportionally to frame
    var yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([0, 100]);
		
	//set bars for each province
    var bars = chart.selectAll(".bars")
        .data(csvData)
        .enter()
        .append("rect")
		.sort(function(a, b){
            return a[expressed]-b[expressed]
        })
        .attr("class", function(d){
            return "bars " + d.Country;
        })
        .attr("width", chartWidth / csvData.length - 1)
        .attr("x", function(d, i){
            return i * (chartWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d){
            return yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d){
            return chartHeight - yScale(parseFloat(d[expressed])) + topBottomPadding;
        });
		/*.style("fill", function(d){
            return choropleth(d, colorScale);
        });*/
		
		
	var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Number of Variable " + expressed[3] + " in each region");
		
	//create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
};

})(); //last line of main.js
