window.onload = setMap();

//set up choropleth map
function setMap(){
	
	//map frame dimensions
    var width = 960,
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
        var allCountries = topojson.feature(world, world.objects.AllCountries),
			africanCountries = topojson.feature(africa, africa.objects.AfricanCountries).features;
			
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
			
		var wCountries = map.append("path")
            .datum(allCountries)
            .attr("class", "wCountries")
            .attr("d", path);
			
		//add African countries to map
        var countries = map.selectAll(".countries")
            .data(africanCountries)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "countries " + d.properties.COUNTRY.replace(/ /g,'-');
            })
            .attr("d", path);
		console.log(africanCountries);

    };
};
