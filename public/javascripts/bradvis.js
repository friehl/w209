var curr_year_val = "All"
        var curr_team_val = "All"
        var transform_count, myCostLabel, myCostLabel2, masterdata, currYearData, barChartElem,
            elem, gradient, maxCost, currentData, currSum, lineChartElem, currTeamData = 0

        // Set parameters for position circles
        var widtha = 800,
            heighta = 500;

        // Set parameters for line chart
        var linechart_margin = {top: 30, right: 20, bottom: 50, left: 55},
        width_linechart = 450 - linechart_margin.left - linechart_margin.right,
        height_linechart = 200 - linechart_margin.top - linechart_margin.bottom;

        // Set parameters for bar chart
        var barchart_margin = {top: 30, right: 20, bottom: 50, left: 55},
        width_barchart = 450 - barchart_margin.left - barchart_margin.right,
        height_barchart = 200 - barchart_margin.top - barchart_margin.bottom;

        // Set the ranges
        var x_line = d3.scale.linear().range([0,width_linechart]);
        var y_line = d3.scale.linear().range([height_linechart, 0]);

        // Set the bar scale
        var x_bar_scale = d3.scale.ordinal().rangeRoundBands([0, width_barchart], .1);
        var y_bar_scale = d3.scale.linear().rangeRound([height_barchart, 0]);


        var svg_position = d3.select("#maindiv")
            .append("svg")
            .attr("id", "position_circles") // just for clarity sake; not needed
            .attr("width", widtha)
            .attr("height", heighta)

        var svg_linechart = d3.select("#maindiv")
            .append("svg")
            .attr("id", "linechart") // just for clarity sake; not needed
            .attr("width", width_linechart+linechart_margin.left+linechart_margin.right)
            .attr("height", height_linechart+linechart_margin.top+linechart_margin.bottom)
            .append("g")
            .attr("transform", "translate(" + linechart_margin.left + "," + linechart_margin.top + ")");

        var svg_barchart = d3.select("#maindiv")
            .append("svg")
            .attr("id", "barchart") // just for clarity sake; not needed
            .attr("width", width_barchart+barchart_margin.left+barchart_margin.right)
            .attr("height", height_barchart+barchart_margin.top+barchart_margin.bottom)
            .append("g")
            .attr("transform", "translate(" + barchart_margin.left + "," + barchart_margin.top + ")");


        // Define the axes for line chart
        var xAxis = d3.svg.axis()
            .scale(x_line)
            .tickFormat(d3.format("d"))
            .orient("bottom")
            .ticks(5);

        var yAxis = d3.svg.axis()
            .scale(y_line)
            .tickFormat(function (d) {
                var prefix = d3.formatPrefix(d);
                return "$" + prefix.scale(d) + prefix.symbol;
            })
            .orient("left")
            .ticks(5);

        // Define the axes for the bar chart
        var x_bar_axis = d3.svg.axis().scale(x_bar_scale)
            .orient("bottom");
        var y_bar_axis = d3.svg.axis().scale(y_bar_scale)
            .tickFormat(function (d) {
                var prefix = d3.formatPrefix(d);
                return "$" + prefix.scale(d) + prefix.symbol;
            })
        .orient("left")
        .ticks(4);

        // Define the line
        var valueline = d3.svg.line()
            .x(function(d) { return x_line(d.year); })
            .y(function(d) { return y_line(d.weekcost_raw); });

        function formatDollarAmount(inputAmt){
            // Function takes a dollar amount and returns it as $###.#[B...M...K]
            if (inputAmt > 1000000000) {
                    newvalue = "$" + Math.round(inputAmt/1000000000 * 100) / 100 + "B"
                }
                else if (inputAmt > 1000000) {
                    newvalue = "$" + Math.round(inputAmt/1000000 * 10) / 10 + "M"
                }
                else if (inputAmt > 1000) {
                    newvalue = "$" + Math.round(inputAmt/1000)  + "K"
                }
                else {
                    newvalue = "$" + inputAmt
                }
                return newvalue;
        }

        // Whenever the combo box values change, update the graphic
        d3.select("#yearcombo").on("change", changeyear)
        function changeyear() {
            curr_year_val = d3.select(this).property('value')
            drawData()
            drawLineChart()
            drawBarChart()
        }

        d3.select("#teamcombo").on("change", changeteam)
        function changeteam() {
            curr_team_val = d3.select(this).property('value')
            drawData()
            drawLineChart()
            drawBarChart()
        }

        // Draw initial diagram
        displayData()
        displayOtherElements()

        // Draw line chart
        displayLineChart()

        // Draw bar chart()
        displayBarChart()

        function displayOtherElements(){
            // Place the other diagram elements for the position diagram
            var scrimmageLine = svg_position.append("svg:line")
                .attr("x1", 150)
                .attr("y1", 260)
                .attr("x2", 800)
                .attr("y2", 260 )
                .style("stroke", "rgb(6,120,155)")
                .style("stroke-width", 8);

            var defenseLabel = svg_position.append("text")
                .attr("dx", 20)
                .attr("dy", 175)
                .text("Defense")
                .attr("font-family", "sans-serif")
                .attr("font-size", "24px")
                .attr("text-anchor", "left")

            var offenseLabel = svg_position.append("text")
                .attr("dx", 20)
                .attr("dy", 360)
                .text("Offense")
                .attr("font-family", "sans-serif")
                .attr("font-size", "24px")
                .attr("text-anchor", "left")

            var titleText = svg_position.append("svg:text")
                .attr("dx", 450)
                .attr("dy", 30)
                .text("Football Injury Cost")
                .attr("font-family", "sans-serif")
                .attr("font-size", "30px")
                .attr("text-anchor", "middle");

            var titleText = svg_position.append("svg:text")
                .attr("dx", 450)
                .attr("dy", 50)
                .text("2009-2014")
                .attr("font-family", "sans-serif")
                .attr("font-size", "16px")
                .attr("text-anchor", "middle");

        }

        function displayData(){
            // load position and cost data
            d3.json("https://gist.githubusercontent.com/bjmcminn/11a239830ab6d898d2cc/raw/3f81d6665a945e51fb2e59abdce77ab68c292e30/pos_circles.json", function(json) {

                /* Define the data for the position circles */
                currentdata = json
                elem = svg_position.selectAll("g")
                    .data(json.nodes)

                drawData()
            })
        }

        function displayLineChart() {
            // Get the data
            d3.json("https://gist.githubusercontent.com/bjmcminn/0e743f6995f5193159b6/raw/35549e14048420b1b3ebd1677694876b608d7984/year_data.json", function(json) {

                currYearData = json
                lineChartElem = svg_linechart.selectAll("g")
                    .data(json.nodes)
                    .enter()

                drawLineChart()
            });

        }

        function displayBarChart() {
            // Get the data
            d3.json("https://gist.githubusercontent.com/bjmcminn/0e743f6995f5193159b6/raw/35549e14048420b1b3ebd1677694876b608d7984/year_data.json", function(json) {

                currTeamData = json
                barChartElem = svg_barchart.selectAll("g")
                    .data(json.nodes)
                    .enter()

                drawBarChart()
            });

        }

        function drawLineChart(){
            // Draw the line chart showing the sum of cost by year

            var transform_duration = 300
            var totcost_label = ""

            // Filter to the current view (for team)
            filteredYearData = currYearData.nodes
                .filter(function(d) { return d.team == curr_team_val && d.year!= "All"})

            // Debug
            // console.log(filteredYearData)

            svg_linechart.selectAll("path.costline").remove()
            svg_linechart.selectAll("g.xaxis").remove()
            svg_linechart.selectAll("g.yaxis").remove()
            svg_linechart.selectAll("rect.vertline").remove()

            // Scale the range of the data
            x_line.domain(d3.extent(filteredYearData, function(d) { return d.year; }));
            y_line.domain([0, d3.max(filteredYearData, function(d) { return +d.weekcost_raw; })]);

            // Add the valueline path
            svg_linechart.append("path")
                .transition().duration(transform_duration*1.5/2)
                .style("opacity", 0)
                .transition().duration(transform_duration*1.5/2)
                .style("opacity", 1)
                .attr("class", "costline")
                .attr("d", valueline(filteredYearData));

            // Add the X Axis
            svg_linechart.append("g")
                .attr("class", "xaxis")
                .attr("transform", "translate(0," + height_linechart + ")")
                .call(xAxis)
                .append("text")
                .attr("transform", "rotate(0)")
                .attr("y", 45)
                .attr("x", width_linechart/2)
                .attr("dy", "-1em")
                .attr("font-size", "14px")
                .style("text-anchor", "middle")
                .text("Year");

            if (curr_team_val == "All"){
                totcost_label = "All Teams"
            }
            else{
                totcost_label = curr_team_val
            }

            // Add the Y Axis
            svg_linechart.append("g")
                .attr("class", "yaxis")
                .call(yAxis)
                .append("text")
                .attr("transform", "rotate(0)")
                .attr("y", 6)
                .attr("x", 0)
                .attr("dy", "-1em")
                .attr("font-size", "14px")
                .style("text-anchor", "left")
                .text("Total Cost: " + totcost_label);

            // Set color of vertical year indicator
            var vertLineColor = "#b22222"
            if (curr_year_val == "All"){
                vertLineColor = "steelblue"
            }
            else {
                vertLineColor = "#b22222"
            }


            svg_linechart.append("rect")
                .transition().duration(transform_duration*1.5/2)
                .style("opacity", 0)
                .transition().duration(transform_duration*1.5/2)
                .style("opacity", 1)
                .attr('class','vertline')
                .attr('height', height_linechart)
                .attr("x", (width_linechart / 5)*(curr_year_val-2009))
                .attr('width', 4)
                .attr("fill",vertLineColor)
                .attr('opacity',1);

        }

        function drawBarChart(){
            // Draw the bar chart showing the sum of cost by team

            var transform_duration = 300
            var totcost_label = ""

            svg_barchart.selectAll("g.x_axis").remove()
            svg_barchart.selectAll("g.y_axis").remove()
            svg_barchart.selectAll("rect.bars").remove()

            filteredTeamData = currTeamData.nodes
                .filter(function(d) { return d.year == curr_year_val && d.team != "All"})

            // Debug
            // console.log(filteredTeamData)

            filteredTeamData.sort(function (a, b) {return +b.weekcost_raw - +a.weekcost_raw;});

            x_bar_scale.domain(filteredTeamData.map(function(d) { return d.team; }));
            // x_bar_scale.domain(filteredTeamData.sort(function (d) { return d3.ascending(+d.weekcost_raw);}).map(function(d) { return d.team; })).copy();
            y_bar_scale.domain([0, d3.max(filteredTeamData, function(d) { return +d.weekcost_raw; })]);

            svg_barchart.append("g")
                .attr("class", "x_axis")
                .attr("transform", "translate(0," + height_barchart + ")")
                .call(x_bar_axis)
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.4em")
                .attr("dy", "-.20em")
                .attr("font-size", "10px")
                .attr("transform", "rotate(-65)" );

            svg_barchart.append("text")
                .attr("class", "xlabel")
                .style("text-anchor", "middle")
                .attr("font-size", "14px")
                .attr("x", width_barchart / 2)
                .attr("y", height_barchart + barchart_margin.bottom-5)
                .text("Team");

            if (curr_year_val == "All"){
                totcost_label = "All Years"
            }
            else{
                totcost_label = curr_year_val
            }

            svg_barchart.append("g")
                .attr("class", "y_axis")
                .call(y_bar_axis)
                .append("text")
                .attr("transform", "rotate(0)")
                .attr("y", 6)
                .attr("x", 0)
                .attr("dy", "-1em")
                .attr("font-size", "14px")
                .style("text-anchor", "left")
                .text("Total Cost: " + totcost_label);

            svg_barchart.selectAll("bar")
                .data(filteredTeamData)
                .enter().append("rect")
                .attr("class", "bars")
                .attr("x", function(d) { return x_bar_scale(d.team); })
                .attr("width", x_bar_scale.rangeBand())
                .attr("y", function(d) { return y_bar_scale(+d.weekcost_raw); })
                .attr("fill","steelblue")
                .attr("height", function(d) { return height_barchart - y_bar_scale(+d.weekcost_raw); });

            svg_barchart.selectAll("rect")
                .filter(function(d) { return d.team === curr_team_val; })
                .classed("currentTeam", true)
                .attr("fill", "#b22222")
                .transition().duration(transform_duration)
                .style("opacity", 0)
                .transition().duration(transform_duration)
                .style("opacity", 1);


        }

        function drawData(){

            var transform_duration = 300
            transform_count=transform_count+1

            svg_position.selectAll("text.costlabels").remove()
            svg_position.selectAll("g.displayblocks").remove()
            svg_position.selectAll("circle.displaycircles").remove()
            svg_position.selectAll("text.sumTextLabel").remove()
            svg_position.selectAll("text.sumTextValue").remove()

            if (transform_count > 1){
                svg_position.selectAll("linearGradient.circlegradients").remove()
            }

            // Calculate the Total Cost Amount to display at the top
            filtereddata = currentdata.nodes
                .filter(function(d) { return d.team == curr_team_val && d.year == curr_year_val})
            currSum = d3.sum(filtereddata, function(d) { return +d.weekcost_raw; });

            currSum = formatDollarAmount(currSum)

            // Log the sum value
            console.log(currSum)

            // Display the total cost value
            var sumTextLabel = svg_position.append("svg:text")
                .attr("class","sumTextLabel")
                .attr("dx", 450)
                .attr("dy", 80)
                .text("Total Cost:")
                .attr("font-family", "sans-serif")
                .attr("font-size", "16px")
                .attr("text-anchor", "middle");

            var sumTextValue = svg_position.append("svg:text")
                .attr("class","sumTextValue")
                .attr("dx", 450)
                .attr("dy", 100)
                .text(currSum)
                .attr("font-family", "sans-serif")
                .attr("font-size", "18px")
                .attr("font-weight", "bold")
                .attr("fill","#b22222")
                .attr("text-anchor", "middle");

            // Create the container blocks for the position circles and filter
            elemEnter = elem.enter()
                .append("g")
                .attr("class","displayblocks")
                .attr("transform", function(d){return "translate("+d.x+","+d.y+")"})
                .filter(function(d) { return d.team == curr_team_val && d.year == curr_year_val})

            // Generate the gradients to fill the position circles with team colors
            gradient = svg_position
                .selectAll("linearGradient").data(currentdata.nodes).enter()
                .append("linearGradient")
                .attr("class","circlegradients")
                .attr("y1", "1")
                .attr("y2", "0")
                .attr("x1", "0")
                .attr("x2", "0")
                .attr("gradientUnits", "objectBoundingBox")
                .attr('id', function(d){return "gradient-"+d.id})

            gradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-opacity", "1")
                .attr("stop-color", function(d) { return d.color1 })
            gradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-opacity", "1")
                .attr("stop-color", function(d) { return d.color2 })


            /* Create the circle for each block */
            var circle = elemEnter.append("circle")
                .attr("class","displaycircles")
                .transition().duration(transform_duration/2)
                .style("opacity", 0)
                .transition().duration(transform_duration/2)
                .style("opacity", 1)
                .attr("r", function(d){return d.r} )
                .attr("stroke","black")
                .attr("fill", function(d){return "url(#gradient-"+ d.id +")"});

            /* Create the position text for each block */
            elemEnter.append("text")
                .attr("dx", function(d){return 0})
                .attr("dy", function(d){return 5})
                .text(function(d){return d.label})
                .attr("font-family", "sans-serif")
                .attr("font-size", "14px")
                .attr("text-anchor", "middle")
                .attr("fill", "white")

            /* Create the cost labels to place under the position circles */
            myCostLabel = elemEnter.append("text")
            myCostLabel.transition()
                .transition().duration(transform_duration*1.5/2)
                .style("opacity", 0)
                .transition().duration(transform_duration*1.5/2)
                .style("opacity", 1)
                .attr("class","costlabels")
                .attr("dx", function(d){return 0})
                .attr("dy", function(d){return 35})
                .text(function(d){return d.weekcost})
                .attr("font-family", "sans-serif")
                .attr("font-size", "14px")
                .attr("text-anchor", "middle")
                .attr("fill", function(d){return d.textcolor})

        }
