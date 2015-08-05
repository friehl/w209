var widtha = 1200,
            heighta = 600;

        var curr_year_val = "All"
        var curr_team_val = "All"
        var transform_count = 0
        var myCostLabel = 0
        var myCostLabel2 = 0
        var masterdata = 0
        var elem = 0
        var gradient = 0
        var maxCost = 0
        var currentdata = 0
        var currSum = 0

        var svga = d3.select("#maindiv")
            .append("svg")
            .attr("width", widtha)
            .attr("height", heighta)

        function formatDollarAmount(inputAmt){
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

        d3.select("#yearcombo").on("change", changeyear)
        function changeyear() {
            curr_year_val = d3.select(this).property('value')
            drawData()

        }

        d3.select("#teamcombo").on("change", changeteam)
        function changeteam() {
            curr_team_val = d3.select(this).property('value')
            drawData()

        }

        // Draw initial diagram
        displayData()
        //displayLineChart()

        displayOtherElements()

        function displayOtherElements(){

            var scrimmageLine = svga.append("svg:line")
                .attr("x1", 150)
                .attr("y1", 320)
                .attr("x2", 800)
                .attr("y2", 320 )
                .style("stroke", "rgb(6,120,155)")
                .style("stroke-width", 8);

            var defenseLabel = svga.append("text")
                .attr("dx", 20)
                .attr("dy", 175)
                .text("Defense")
                .attr("font-family", "sans-serif")
                .attr("font-size", "24px")
                .attr("text-anchor", "left")

            var offenseLabel = svga.append("text")
                .attr("dx", 20)
                .attr("dy", 425)
                .text("Offense")
                .attr("font-family", "sans-serif")
                .attr("font-size", "24px")
                .attr("text-anchor", "left")

            var titleText = svga.append("svg:text")
                .attr("dx", 450)
                .attr("dy", 30)
                .text("Football Injury Cost")
                .attr("font-family", "sans-serif")
                .attr("font-size", "24px")
                .attr("text-anchor", "middle");

            var titleText = svga.append("svg:text")
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
                elem = svga.selectAll("g")
                    .data(json.nodes)

                drawData()
            })
        }

        function displayLineChart() {

            var margin = {top: 30, right: 20, bottom: 30, left: 50},
            width_linechart = 400 - margin.left - margin.right,
            height_linechart = 200 - margin.top - margin.bottom;

            // Set the ranges
            var x_line = d3.scale.linear().range([width_linechart, 0]);
            var y_line = d3.scale.linear().range([height_linechart, 0]);

            // Define the axes
            var xAxis = d3.svga.axis().scale(x_line)
                .orient("bottom").ticks(5);

            var yAxis = d3.svga.axis().scale(y_line)
                .orient("left").ticks(5);

            // Define the line
            var valueline = d3.svga.line()
                .x(function(d) { return x_line(d.year); })
                .y(function(d) { return y_line(d.weekcost_raw); });



            // Get the data
            d3.json("https://gist.githubusercontent.com/bjmcminn/0e743f6995f5193159b6/raw/06d692c763c60561262bd107cdfabcfe7cee50e3/year_data.json", function(json) {

                filteredYearData = json.nodes
                    .filter(function(d) { return d.team == curr_team_val})

                svga.selectAll("path.costline").remove()
                svga.selectAll("g.xaxisa").remove()
                svga.selectAll("g.yaxisa").remove()

                // Scale the range of the data
                x_line.domain(d3.extent(filteredYearData, function(d) { return d.year; }));
                y_line.domain([0, d3.max(filteredYearData, function(d) { return d.weekcost_raw; })]);

                // Add the valueline path.
                svga.append("path")
                    .attr("class", "costline")
                    .attr("d", valueline(filteredYearData));

                // Add the X Axis
                svga.append("g")
                    .attr("class", "xaxisa")
                    .attr("transform", "translate(0," + height_linechart + ")")
                    .call(xAxis);

                // Add the Y Axis
                svga.append("g")
                    .attr("class", "yaxisa")

                    .call(yAxis);

            });


        }

        function drawData(){

            var transform_duration = 250
            transform_count=transform_count+1

            svga.selectAll("text.costlabels").remove()
            svga.selectAll("g.displayblocks").remove()
            svga.selectAll("circle.displaycircles").remove()
            svga.selectAll("text.sumTextLabel").remove()
            svga.selectAll("text.sumTextValue").remove()

            if (transform_count > 1){
                svga.selectAll("linearGradient.circlegradients").remove()
            }

            // Calculate the Total Cost Amount to display at the top
            filtereddata = currentdata.nodes
                .filter(function(d) { return d.team == curr_team_val && d.year == curr_year_val})
            currSum = d3.sum(filtereddata, function(d) { return +d.weekcost_raw; });

            currSum = formatDollarAmount(currSum)

            // Log the sum value
            console.log(currSum)

            // Display the total cost value
            var sumTextLabel = svga.append("svg:text")
                .attr("class","sumTextLabel")
                .attr("dx", 450)
                .attr("dy", 100)
                .text("Total Cost:")
                .attr("font-family", "sans-serif")
                .attr("font-size", "16px")
                .attr("text-anchor", "middle");

            var sumTextValue = svga.append("svg:text")
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
            gradient = svga
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
