var margin = {top: 40, right: 231, bottom: 40, left: 60},
	width = 900 - margin.left - margin.right,
	height = 500 - margin.top - margin.bottom;

var xscale = d3.scale.ordinal()
	.rangeRoundBands([0, width], .1);

var yscale = d3.scale.linear()
	.rangeRound([height, 0]);

var colors = d3.scale.ordinal()
	.range(["#63c172", "#ee9952"]);

var xaxis = d3.svg.axis()
	.scale(xscale)
	.orient("bottom");

var yaxis = d3.svg.axis()
	.scale(yscale)
	.orient("left")
	.tickFormat(d3.format(".2s"));

var svg = d3.select("#fdrgraph").append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.append("text")
  .attr("x", (width / 2))
  .attr("y", 0 - (margin.top / 2))
  .attr("text-anchor", "middle")
	.attr("font-family", "sans-serif")
	.attr("font-size", "24px")
  .text("Injury Count by Team: ");

$(function() {
  $(document).ready(function() {
    $.get('/api', {years: [2009, 2010, 2011, 2012, 2013, 2014]}, function(res) {
      loadGraph(res);
    });
  });
});

$(function() {
  $('#updateYear').click(function() {
		var years = [];
		$(':checkbox:checked').each(function(i) {
      years[i] = $(this).val();
		});
		console.log(years)
    $.get('/api', {years: years}, function(res) {
      loadGraph(res)
      updateGraph();
    });
  });
});

// Transform data

var parsedata = [];

function loadGraph(data) {
  //Create an object for each team;
  svg.selectAll(".category").remove();
  svg.selectAll(".x.axis").remove();
  svg.selectAll(".y.axis").remove();
  parsedata = d3.nest()
    .key(function(d) { return d.team; })
    .key(function(d) { return d.status; })
    .key(function(d) {return d.played; })
    .rollup(function(d) {return d.length;})
    .entries(data);

  var injuryList = [];
  parsedata.forEach(function(d) {
    d.team = d.key;
    d.values.forEach(function(g) {
      var injury = g.key
      if (injuryList.indexOf(injury) == -1) { injuryList.push(injury); }
      var obj = {}
      g.values.forEach(function(x) {
        var status = x.key
        obj[status] = x.values
      })
      d[injury] = obj;
    })
  })

  var index = injuryList.indexOf("null");
  if (index > -1) { injuryList.splice(index, 1); }
  var categories = data.map(function(d) { return d.team; });
  // map column headers to colors

  colors.domain(['Played', 'Did Not Play']);
  parsedata.forEach(function(dd) {
    for (var pd in dd) {
      if (dd.hasOwnProperty(pd) > -1) {
        if (injuryList.indexOf(pd) > -1) {
          var y0 = 0;
        // colors.domain() is an array of the column headers (text)
        // dd[pd].responses will be an array of objects with the column header
          dd[pd].responses = colors.domain().map(function(response) {
            var responseobj = {response: response, y0: y0, yp0: y0};
						var responseVal = +dd[pd][response]
						if (!responseVal) { responseVal = 0;}
            y0 += responseVal;
            responseobj.y1 = y0;
            responseobj.yp1 = y0;
            return responseobj;
          });
          // y0 is now the sum of all the values in the row for this category
          // convert the range values to percentages
          dd[pd].responses.forEach(function(d) {
            d.yp0 /= y0;
            d.yp1 /= y0;
          });
          // save the total
          dd[pd].totalresponses = dd[pd].responses[dd[pd].responses.length - 1].y1;
          dd[pd].percentsort = dd[pd].responses[dd[pd].responses.length - 1].yp0;
      }
    }
    };
  });

	var inj = getInjury();
  xscale.domain(parsedata.map(function(d) { return d.team; }));
  yscale.domain([0, d3.max(parsedata, function(d) { return d[inj].totalresponses; })]);
  // add the x axis and rotate its labels
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xaxis)
    .selectAll("text")
    .attr("y", 5)
    .attr("x", 7)
    .attr("dy", ".35em")
    .attr("transform", "rotate(65)")
    .style("text-anchor", "start");

    // add the y axis
  svg.append("g")
    .attr("class", "y axis")
    .call(yaxis);

    // create svg groups ("g") and place them
  var category = svg.selectAll(".category")
    .data(parsedata)
    .enter().append("g")
    .attr("class", "category")
    .attr("transform", function(d) { return "translate(" + xscale(d.team) + ",0)"; });

      // draw the rects within the groups
  category.selectAll("rect")
    .data(function(d) { return d[inj].responses; })
    .enter().append("rect")
    .attr("width", xscale.rangeBand())
    .attr("y", function(d) { return yscale(d.y1); })
    .attr("height", function(d) { return yscale(d.y0) - yscale(d.y1); })
    .style("fill", function(d) { return colors(d.response); });

  // position the legend elements
  var legend = svg.selectAll(".legend")
    .data(colors.domain())
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", function(d, i) { return "translate(20," + ((height - 18) - (i * 20)) + ")"; });

  legend.append("rect")
    .attr("x", width - 18)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", colors);

  legend.append("text")
    .attr("x", width + 10)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "start")
    .text(function(d) { return d; });
}

    // animation
  d3.selectAll("input").on("change", handleFormClick);

  function handleFormClick() {
    if (this.value === "bypercent") {
      transitionPercent();
    } else if (this.value === "bycount") {
      transitionCount();
    } else if (this.value === "probable") {
      transitionInjury("P");
    } else if (this.value === "questionable") {
      transitionInjury("Q");
    } else if (this.value === "doubtful") {
			transitionInjury("D");
		}

  }

d3.selectAll("input").on("click", sortFun);

function transitionInjury(inj) {
  var category = svg.selectAll('.category')
  var legend = svg.selectAll(".legend")

  svg.selectAll("rect").remove();
  if (document.getElementById("percent").checked) {
    yscale.domain([0,1])
    yaxis.tickFormat(d3.format(".0%"));
    svg.selectAll(".y.axis").call(yaxis)
    category.selectAll("rect")
      .data(function(d) { return d[inj].responses; })
      .enter().append("rect")
      .transition().duration(1000).ease("linear")
      .attr("width", xscale.rangeBand())
      .attr("y", function(d) { return yscale(d.yp1); })
      .attr("height", function(d) { return yscale(d.yp0) - yscale(d.yp1); })
      .style("fill", function(d) { return colors(d.response); })

  } else {
    yscale.domain([0, d3.max(parsedata, function(d) { return d[inj].totalresponses; })])
    yaxis.tickFormat(d3.format(".2s"));
    svg.selectAll(".y.axis").call(yaxis);
    category.selectAll("rect")
      .data(function(d) { return d[inj].responses; })
      .enter().append("rect")
      .transition().duration(1000).ease("linear")
      .attr("width", xscale.rangeBand())
      .attr("y", function(d) { return yscale(d.y1); })
      .attr("height", function(d) { return yscale(d.y0) - yscale(d.y1); })
      .style("fill", function(d) { return colors(d.response); })
  }
  legend.append("rect")
    .attr("x", width - 18)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", colors);

  legend.append("text")
    .attr("x", width + 10)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "start")
    .text(function(d) { return d; });
}

function transitionPercent() {
  // reset the yscale domain to default
  yscale.domain([0, 1]);

  // create the transition
  var trans = svg.transition().duration(250);

  // transition the bars
  var categories = trans.selectAll(".category");
  categories.selectAll("rect")
    .attr("y", function(d) { return yscale(d.yp1); })
    .attr("height", function(d) { return yscale(d.yp0) - yscale(d.yp1); });

  // change the y-axis
  // set the y axis tick format
  yaxis.tickFormat(d3.format(".0%"));
  svg.selectAll(".y.axis").call(yaxis);
}

// transition to 'count' presentation
function transitionCount() {
  // set the yscale domain
  if (document.getElementById("questionable").checked) {
    yscale.domain([0, d3.max(parsedata, function(d) { return d.Q.totalresponses; })]);
  } else if (document.getElementById("probable").checked) {
    yscale.domain([0, d3.max(parsedata, function(d) { return d.P.totalresponses; })]);
  } else {
		yscale.domain([0, d3.max(parsedata, function(d) { return d.D.totalresponses; })]);
	}

  // create the transition
  var transone = svg.transition()
    .duration(250);

  // transition the bars (step one)
  var categoriesone = transone.selectAll(".category");
  categoriesone.selectAll("rect")
    .attr("y", function(d) { return this.getBBox().y + this.getBBox().height - (yscale(d.y0) - yscale(d.y1)) })
    .attr("height", function(d) { return yscale(d.y0) - yscale(d.y1); });

  // transition the bars (step two)
  var transtwo = transone.transition()
    .delay(350)
    .duration(350)
    .ease("bounce");
  var categoriestwo = transtwo.selectAll(".category");
  categoriestwo.selectAll("rect")
    .attr("y", function(d) { return yscale(d.y1); });

  // change the y-axis
  // set the y axis tick format
  yaxis.tickFormat(d3.format(".2s"));
  svg.selectAll(".y.axis").call(yaxis);
}

function getInjury() {
  if (document.getElementById("questionable").checked) {
    return "Q";
  } else if (document.getElementById("doubtful").checked) {
		return "D";
	}
  else { return "P"; }
};

function getSort() {
  if (document.getElementById("percent").checked) {
    return "percentsort"
  } else { return "totalresponses"}
};

function sortFun() {
  var category = svg.selectAll('.category');
  if (this.value == 'Sort') {
    var inj = getInjury();
    var sortType = getSort();

    parsedata.sort(function(a, b) {
      return b[inj][sortType] - a[inj][sortType];
    });

    xscale.domain(parsedata.map(function(d) { return d.team; }));
    svg.selectAll("g .x.axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xaxis)
      .selectAll("text")
      .attr("y", 5)
      .attr("x", 7)
      .attr("dy", ".35em")
      .attr("transform", "rotate(65)")
      .style("text-anchor", "start");
      category.transition()
      .duration(750)
      .attr("transform", function(d) { return "translate(" + xscale(d.team) + ",0)"; });
  };
}


// START HERE
// UPDATE GRAPH DOES NOT WORK CORRECTLY

function updateGraph() {
  if (document.getElementById("questionable").checked) {
    yscale.domain([0, d3.max(parsedata, function(d) { return d.Q.totalresponses; })]);
  } else {
    yscale.domain([0, d3.max(parsedata, function(d) { return d.P.totalresponses; })]);
  }

  var category = svg.selectAll(".category")
    .data(parsedata)
    .enter().append("g")
    .attr("class", "category")
    .attr("transform", function(d) { return "translate(" + xscale(d.team) + ",0)"; });

      // draw the rects within the groups
  category.selectAll("rect")
    .data(function(d) { return d.Q.responses; })
    .enter().append("rect")
    .attr("width", xscale.rangeBand())
    .attr("y", function(d) { return yscale(d.yp1); })
    .attr("height", function(d) { return yscale(d.yp0) - yscale(d.yp1); })
    .style("fill", function(d) { return colors(d.response); });

  // position the legend elements
  var legend = svg.selectAll(".legend")
    .data(colors.domain())
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", function(d, i) { return "translate(20," + ((height - 18) - (i * 20)) + ")"; });

  legend.append("rect")
    .attr("x", width - 18)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", colors);

  legend.append("text")
    .attr("x", width + 10)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "start")
    .text(function(d) { return d; });

  var inj = getInjury();
  if (document.getElementById("percent").checked) {
    transitionPercent(inj);
  } else {transitionCount(inj);}

}
