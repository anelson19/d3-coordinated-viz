(function(){
//variables for data join
    var attrArray = ["Improved Urban Sanitation Facilities", "Improved Urban Water Source", "Population Density", "Urban Population", "GDP Growth"];
	var expressed = attrArray[0]; //initial attribute
	
	var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
		
	//create a scale to size bars proportionally to frame and for axis
    var yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([0, 220]);
		
	var colorClasses = [
        "#99d8c9",
        "#66c2a4",
        "#41ae76",
        "#238b45",
        "#005824"
    ];

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
        .defer(d3.json, "data/AfricanCountries_(2).topojson") //load choropleth spatial data
        .await(callback);
		
	function callback(error, csvData, world, africa){
		
		//place graticule on the map
        //setGraticule(map, path);
		
        var allCountries = topojson.feature(world, world.objects.AllCountries),
			africanCountries = topojson.feature(africa, africa.objects.AfricanCountries).features;
			
		/*var wCountries = map.append("path")
            .datum(allCountries)
            .attr("class", "wCountries")
            .attr("d", path);*/
		
		//join csv data to GeoJSON enumeration units
        africanCountries = joinData(africanCountries, csvData);
		
		//create the color scale
        var colorScale = makeColorScale(csvData);
		
		//add enumeration units to the map
        setEnumerationUnits(africanCountries, map, path, colorScale);
		
		//add coordinated visualization to the map
        setChart(csvData, colorScale);
		
		//add dropdown menu to the map
		createDropdown(csvData);

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
        var csvKey = csvCountry.COUNTRY; //the CSV primary key

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
    var countries = map.selectAll(".countries")
        .data(africanCountries)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "countries " + d.properties.COUNTRY.replace(/ /g, '-');
        })
        .attr("d", path)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale);
        })
		.on("mouseover", function(d){
            highlight(d.properties);
        })
		.on("mouseout", function(d){
            dehighlight(d.properties);
        })
		.on("mousemove", moveLabel);
		console.log(countries);
	var desc = countries.append("desc")
        .text('{"stroke": "white", "stroke-width": "0.5px"}');
		
		/*.on("mouseover", function(d){
            highlight(d.properties);
        })
         .on("mouseout", function(d){
            dehighlight(d.properties);
        })
         .on("mousemove", moveLabel)
            var countriesColor = countries.append("desc")
            .text(function(d) {
                return choropleth(d.properties, colorScale);
            });*/
		
};

//function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#99d8c9",
        "#66c2a4",
        "#41ae76",
        "#238b45",
        "#005824"
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
        return "#8e8e8e";
    };
};

//function to create coordinated bar chart
function setChart(csvData, colorScale){
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
		
	var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.COUNTRY.replace(/ /g, '-');
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
		.on("mouseover", highlight)
		.on("mouseout", dehighlight)
		.on("mousemove", moveLabel)
		
	var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');

    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 30)
        .attr("class", "chartTitle")
        .text(expressed + " in each country");

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
		
	//set bar positions, heights, and colors
    updateChart(bars, csvData.length, colorScale);
};

//function to create a dropdown menu for attribute selection
function createDropdown(csvData){
   //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};

//dropdown change listener handler
function changeAttribute(attribute, csvData){
//change the expressed attribute
    expressed = attribute;

    //recreate the color scale
    var colorScale = makeColorScale(csvData);

    //recolor enumeration units
    var countries = d3.selectAll(".countries")
        .transition()
        .duration(800)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });

    //re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
        //re-sort bars
        .sort(function(a, b){
			if (isNaN(a[expressed])){a[expressed] = 0}
			if (isNaN(b[expressed])){b[expressed] = 0}
            return b[expressed] - a[expressed];
        })
        .transition() //add animation
        .delay(function(d, i){
            return i * 20
        })
        .duration(500);

    updateChart(bars, csvData.length, colorScale);
};

//function to position, size, and color bars in chart
function updateChart(bars, n, colorScale){
    //position bars
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
		
        //size/resize bars
        .attr("height", function(d, i){
			var de = parseFloat(d[expressed]);
			if (isNaN(de)){de = 0}
            return 463 - yScale(parseFloat(de));
        })
        .attr("y", function(d, i){
			var de = parseFloat(d[expressed]);
			if (isNaN(de)){de = 0}
            return yScale(parseFloat(de)) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
		
	//at the bottom of updateChart()...add text to chart title
    var chartTitle = d3.select(".chartTitle")
        .text(expressed + " in each country");
};

//function to highlight enumeration units and bars
function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.COUNTRY.replace(/ /g, '-'))
        .style("stroke", "lime")
        .style("stroke-width", "3");
		console.log(props.COUNTRY);
	setLabel(props);
};

//function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.COUNTRY.replace(/ /g, '-'))
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width") 
        });
		
    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
		
    };
	d3.select(".infolabel")
        .remove();
};

//function to highlight enumeration units and bars
/*function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.COUNTRY)
        .style(
            "fill", "#FFC42A"
        );
        setLabel(props);
};

function dehighlight(props) {
     var selection = d3.selectAll("."+props.COUNTRY);

    var fillColor = selection.select("desc").text();
    selection.style("fill", fillColor); 
    d3.select(".infolabel")
        .remove(); 
};*/

function setLabel(props){
    //label content
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed + "</b>";
		
	if (Boolean(props[expressed]) == true) {
        if (expressed == "Improved Urban Sanitation Facilities") {
            labelAttribute = "<h1>" + props[expressed]+"%</h1>" + "of urban population with access"
        } else if (expressed == "Improved Urban Water Source") {
            labelAttribute = "<h1>" + props[expressed]+"%</h1>" + "of urban population with access"
        } else if (expressed == "Population Density") {
            labelAttribute = "<h1>" + props[expressed]+"</h1>" + "people per sq. km"
        } else if (expressed == "Urban Population") {
            labelAttribute = "<h1>" + props[expressed]+"%</h1>" + "of total"
        } else if (expressed == "GDP Growth") {
            labelAttribute = "<h1>" + props[expressed]+"%</h1>" + "growth"
        };
    } else { //if no data associated with selection, display "No data"
        labelAttribute = "<h1>No Data</h1>";
    };
		

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.COUNTRY + "_label")
        .html(labelAttribute);

    var countryName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.COUNTRY);
};

//function to move info label with mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};

})(); //last line of main.js
