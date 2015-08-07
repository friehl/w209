// Initialize parameters
        var curr_year_val = "All"
        var curr_team_val = "All"
        var transform_count, myCostLabel, myCostLabel2, masterdata, currYearData,
            elem, gradient, maxCost, currentData, currSum, lineChartElem = 0

        // Set size for position circles
        var widtha = 800,
            heighta = 600;

        // Set parameters for line chart
        var linechart_margin = {top: 30, right: 20, bottom: 50, left: 60},
        width_linechart = 500 - linechart_margin.left - linechart_margin.right,
        height_linechart = 200 - linechart_margin.top - linechart_margin.bottom;

        // Set the ranges
        var x_line = d3.scale.linear().range([0,width_linechart]);
        var y_line = d3.scale.linear().range([height_linechart, 0]);

        var svg_position = d3.select("#maindiv")
            .append("svg")
            .attr("id", "position_circles") // just for clarity sake; not needed
            .attr("width", widtha)
            .attr("height", heighta)

        var svg_linechart = d3.select("#otherElements")
            .append("svg")
            .attr("id", "linechart") // just for clarity sake; not needed
            .attr("width", width_linechart+linechart_margin.left+linechart_margin.right)
            .attr("height", height_linechart+linechart_margin.top+linechart_margin.bottom)
            .append("g")
            .attr("transform", "translate(" + linechart_margin.left + "," + linechart_margin.top + ")");


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
        }

        d3.select("#teamcombo").on("change", changeteam)
        function changeteam() {
            curr_team_val = d3.select(this).property('value')
            drawData()
            drawLineChart()
        }

        // Draw initial diagram
        displayData()
        displayOtherElements()

        // Draw line chart
        displayLineChart()

        function displayOtherElements(){
            // Place the other diagram elements for the position diagram
            var scrimmageLine = svg_position.append("svg:line")
                .attr("x1", 150)
                .attr("y1", 320)
                .attr("x2", 800)
                .attr("y2", 320 )
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
                .attr("dy", 425)
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
            d3.json("https://gist.githubusercontent.com/bjmcminn/11a239830ab6d898d2cc/raw/75065a1c3158472a0c17c8249c55d2bde71b9301/pos_circles.json", function(json) {

                /* Define the data for the position circles */
                currentdata = json
                elem = svg_position.selectAll("g")
                    .data(json.nodes)

                drawData()
            })
        }

        function displayLineChart() {
            // Get the data
            d3.json("https://gist.githubusercontent.com/bjmcminn/0e743f6995f5193159b6/raw/06d692c763c60561262bd107cdfabcfe7cee50e3/year_data.json", function(json) {

                currYearData = json
                lineChartElem = svg_linechart.selectAll("g")
                    .data(json.nodes)
                    .enter()

                drawLineChart()
            });

        }

        function drawLineChart(){
            // Draw the line chart showing the sum of cost by year

            var transform_duration = 300

            // Filter to the current view (for team)
            filteredYearData = currYearData.nodes
                .filter(function(d) { return d.team == curr_team_val})

            // Debug
            console.log(filteredYearData)

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
                .style("text-anchor", "middle")
                .text("Total Cost");

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
                .attr('width', 2)
                .attr("fill",vertLineColor)
                .attr('opacity',1);

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
                .attr("dy", 100)
                .text("Total Cost:")
                .attr("font-family", "sans-serif")
                .attr("font-size", "16px")
                .attr("text-anchor", "middle");

            var sumTextValue = svg_position.append("svg:text")
                .attr("class","sumTextValue")
                .attr("dx", 450)
                .attr("dy", 120)
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
