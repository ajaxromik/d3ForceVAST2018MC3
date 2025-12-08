
function buildProject() {
  if (!data) {
    console.error('No data loaded yet!');
    return;
  }
  
  // Specify the dimensions of the chart.
  const width = 928;
  const height = 680;

  // Specify the color scale.
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // The force simulation mutates links and nodes, so create a copy
  // so that re-evaluating this cell produces the same result.
  const links = data.links.map(d => ({...d}));
  const nodes = data.nodes.map(d => ({...d}));

  // Create a simulation with several forces.
  const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id))
      .force("charge", d3.forceManyBody())
      .force("x", d3.forceX())
      .force("y", d3.forceY());

  // Create the SVG container.
  const svg = d3.select("#shapes")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto;");

  // Add a line for each link, and a circle for each node.
  const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .join("line")
      .attr("stroke-width", d => Math.sqrt(d.value));

  const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
      .attr("r", 5)
      .attr("fill", d => color(d.group));

  node.append("title")
      .text(d => d.id);

  // Add a drag behavior.
  node.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
  
  // Set the position attributes of links and nodes each time the simulation ticks.
  simulation.on("tick", () => {
    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
  });

  // Reheat the simulation when drag starts, and fix the subject position.
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  // Update the subject (dragged node) position during drag.
  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  // Restore the target alpha so the simulation cools after dragging ends.
  // Unfix the subject position now that it’s no longer being dragged.
  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  // When this cell is re-run, stop the previous simulation. (This doesn’t
  // really matter since the target alpha is zero and the simulation will
  // stop naturally, but it’s a good practice.)
  // invalidation.then(() => simulation.stop());

  return svg.node();
}

// var chart = buildProject();


/*
const shapes = d3.select("#shapes");
        
        var margin = {top: 50, right: 50, bottom: 50, left: 50},
            width = 600 - margin.left - margin.right,
            height = 600 - margin.top - margin.bottom;

        const graph = (
            shapes.attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("class", "graph")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ") scale(5)  ")
        );

        var posX = [];
        var posY = [];
        var size = [];
        for (var i = 0; i < 50; i++) {
            let xRand = Math.random();
            posX.push(Math.round(xRand * 100)); // tested: reaches 0-100 inclusive
            posY.push(Math.round(Math.random() * 100));
            size.push(Math.round(5 + xRand * 45));
        }
        console.log(`axis domains are as follows\nx: (${d3.min(posX)}, ${d3.max(posX)}) y: (${d3.min(posY)}, ${d3.max(posY)})`);

        var x = d3.scale.linear()
            .domain([d3.min(posX),d3.max(posX)])
            .range([0, width]);

        var y = d3.scale.linear()
            .domain([d3.min(posY),d3.max(posY)])
            .range([height, 0]);    

        var xAxis = d3.svg.axis()
            .ticks(10)
            .scale(x);

        var yAxis = d3.svg.axis()
            .scale(y)
            .ticks(10)
            .orient("left");

        for (var i = 0; i < 50; i++) {
            graph.append("path")
                  .attr("d", d3.svg.symbol().type(i < 25 ? "circle" : "triangle-up").size(size[i]))
                  .attr("fill", "none")
                  .attr("stroke", (size[i] > d3.mean(size) ? "blue" : "green"))
                  .attr("transform", "translate("+posX[i]+","+posY[i]+")");
        }

        shapes.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(" + margin.left + "," + (height + margin.top) + ")")
            .call(xAxis);

        shapes.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(yAxis);
*/

// data = FileAttachment("graph.json").json();