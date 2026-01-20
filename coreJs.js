
function buildProject() {
  if (!data) {
    console.error('No data loaded yet!');
    return;
  }
  
  const width = 928;
  const height = 680;

  const color = d3.scaleOrdinal(d3.schemeCategory10);

  const links = data.links.map(d => ({...d}));
  const nodes = data.nodes.map(d => ({...d}));

  const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id))
      .force("charge", d3.forceManyBody())
      .force("x", d3.forceX())
      .force("y", d3.forceY());

  const svg = d3.select("#shapes")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto;");

  const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .join("line")
      .attr("stroke-width", d => 1 + 5*d.value/d3.max(links, e => e.value));

    // tests on nodes; TODO: Remove when finished
    // links.forEach((v, k, m) => {
    //   console.log(`${(v.value ?? 0)} `);
    // });
    // console.log(d3.max(links, e => e.value));

  const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
      .attr("r", d => (8*(d.radius ?? 0)/d3.max(nodes, e => e.radius)) + 4) // scales radius size [4,12]
      .attr("fill", d => color(d.group));

  node.append("title")
      .text(d => (d.name ?? d.id) + ` (${d.radius} interactions, ${d.group})`);

  node.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
  
  simulation.on("tick", () => {
    link.attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node.attr("cx", d => d.x)
        .attr("cy", d => d.y);
  });

  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  return svg.node();
}
