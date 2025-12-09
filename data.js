// effectively globals
let data = null;
let fullData = null; // store the original/unfiltered data
let timeExtent = null; // store min/max time range

/**
 * Input handler for json and CSV
 */
document.getElementById('uploadFiles').addEventListener('change', function(e) {
  const files = e.target.files;
  const fileStatus = document.getElementById('fileStatus');

  if (files.length === 0) {
    fileStatus.textContent = 'No files selected.';
    return;
  }
  
  // TODO handle multiple files instead of only taking one
  const file = files[0];
  const fileExtension = file.name.split('.').pop().toLowerCase();
  
  fileStatus.textContent = `Loading ${file.name}...`;
  
  const reader = new FileReader();
  
  reader.onload = function(event) {
    try {
      if (fileExtension === 'json') {
        data = JSON.parse(event.target.result);
        fileStatus.textContent = `${file.name} loaded`;
        fileStatus.style.color = 'green';
        
        d3.select("#shapes").selectAll("*").remove();
        d3.select("#timeSlider").selectAll("*").remove();
        
        buildProject();
      } else if (fileExtension === 'csv') {
        const csvText = event.target.result;
        const parsedData = d3.csvParse(csvText);
        
        data = convertCSVToNodeLink(parsedData);
        fullData = JSON.parse(JSON.stringify(data));
        
        fileStatus.textContent = `Loaded ${file.name} successfully! (${parsedData.length} rows)`;
        fileStatus.style.color = 'green';
        
        d3.select("#shapes").selectAll("*").remove();
        d3.select("#timeSlider").selectAll("*").remove();

        if (parsedData.length > 0 && parsedData[0].seconds_time) {
          buildTimeSlider(parsedData);
        }
        
        buildProject();
        
      } else {
        fileStatus.textContent = `Unsupported file type: ${fileExtension}`;
        fileStatus.style.color = 'red';
      }
    } catch (error) {
      fileStatus.textContent = `Error parsing ${file.name}: ${error.message}`;
      fileStatus.style.color = 'red';
      console.error('Error parsing JSON:', error);
    }
  };
  
  reader.onerror = function() {
    fileStatus.textContent = `Error reading ${file.name}`;
    fileStatus.style.color = 'red';
  };
  
  reader.readAsText(file);
});

function convertCSVToNodeLink(csvData) {
  const suspiciousNames = [
    "Alex Hall",
    "Lizbeth Jindra",
    "Patrick Lane",
    "Richard Fox",
    "Sara Ballard",
    "May Burton",
    "Glen Grant",
    "Dylan Ballard",
    "Meryl Pastuch",
    "Melita Scarpaci",
    "Augusta Sharp",
    "Kerstin Belveal",
    "Rosalia Larroque",
    "Lindsy Henion",
    "Julie Tierno",
    "Jose Ringwald",
    "Ramiro Gault",
    "Tobi Gatlin",
    "Refugio Orrantia",
    "Jenice Savaria"
  ];
  const nodesMap = new Map();
  const linksMap = new Map();
  
  csvData.forEach(row => {
    const sourceId = +row.Source; // Convert to number
    const targetId = +row.Destination;
    const sourceName = row.Sent.trim();
    const targetName = row.Received.trim();
    const secondsTime = +row.seconds_time;
    
    if (!nodesMap.has(sourceId)) {
      nodesMap.set(sourceId, {
        id: sourceId,
        name: sourceName,
        group: (suspiciousNames.includes(sourceName) ? "Suspicious" : "Normal"),
        radius: 1
      });
    } else {
      nodesMap.get(sourceId).radius++;
    }
    
    if (!nodesMap.has(targetId)) {
      nodesMap.set(targetId, {
        id: targetId,
        name: targetName,
        group: (suspiciousNames.includes(targetName) ? "Suspicious" : "Normal"),
        radius: 1
      });
    } else {
      nodesMap.get(targetId).radius++;
    }
    
    let linkName = sourceName + targetName;
    if(sourceId > targetId)
      linkName = targetName + sourceName;
    
    if (!linksMap.has(linkName)) {
      linksMap.set(linkName, {
        source: sourceId,
        target: targetId,
        value: 1,
        timestamps: [secondsTime]
      });
    } else {
      linksMap.get(linkName).value++;
      linksMap.get(linkName).timestamps.push(secondsTime);
    }
  });
  
  return {
    nodes: Array.from(nodesMap.values()),
    links: Array.from(linksMap.values())
  };
}

function secondsToDate(seconds) {
  const baseDate = new Date(2015, 4, 11, 14, 0, 0);
  return new Date(baseDate.getTime() + seconds * 1000);
}

function buildTimeSlider(csvData) {
  // build time range from data
  const times = csvData.map(d => +d.seconds_time);
  const minTime = d3.min(times);
  const maxTime = d3.max(times);
  
  timeExtent = [minTime, maxTime];
  
  const minDate = secondsToDate(minTime);
  const maxDate = secondsToDate(maxTime);
  
  const margin = {top: 20, right: 50, bottom: 40, left: 50};
  const width = 800 - margin.left - margin.right;
  const height = 80 - margin.top - margin.bottom;
  
  const svg = d3.select("#timeSlider")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  // Create time scale
  const xScale = d3.scaleTime()
    .domain([minDate, maxDate])
    .range([0, width]);
  
  const xAxis = d3.axisBottom(xScale)
    .ticks(8);
  
  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis);
  
  svg.append("line")
    .attr("class", "track")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", height / 2)
    .attr("y2", height / 2)
    .style("stroke", "#ccc")
    .style("stroke-width", 8)
    .style("stroke-linecap", "round");
  
  const selectionTrack = svg.append("line")
    .attr("class", "track-selection")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", height / 2)
    .attr("y2", height / 2)
    .style("stroke", "#000")
    .style("stroke-width", 8)
    .style("stroke-linecap", "round");
  
  let startHandle = svg.append("circle")
    .attr("class", "handle start")
    .attr("cx", 0)
    .attr("cy", height / 2)
    .attr("r", 10)
    .style("fill", "#000")
    .style("cursor", "ew-resize")
    .call(d3.drag()
      .on("drag", function(event) {
        console.log(5);
        const newX = Math.max(0, Math.min(+endHandle.attr("cx"), event.x));
        d3.select(this).attr("cx", newX);
        updateSelection();
      })
    );
  
  let endHandle = svg.append("circle")
    .attr("class", "handle end")
    .attr("cx", width)
    .attr("cy", height / 2)
    .attr("r", 10)
    .style("fill", "#000")
    .style("cursor", "ew-resize")
    .call(d3.drag()
      .on("drag", function(event) {
        const newX = Math.max(+startHandle.attr("cx"), Math.min(width, event.x));
        d3.select(this).attr("cx", newX);
        updateSelection();
      })
    );
  
  function updateSelection() {
    const startX = +startHandle.attr("cx");
    const endX = +endHandle.attr("cx");
    
    selectionTrack.attr("x1", startX)
                  .attr("x2", endX);
    
    // convert x coords to seconds
    const startDate = xScale.invert(startX);
    const endDate = xScale.invert(endX);

    const baseDate = new Date(2015, 4, 11, 14, 0, 0);
    const startSeconds = (startDate - baseDate) / 1000;
    const endSeconds = (endDate - baseDate) / 1000;
    
    filterDataByTimeRange(startSeconds, endSeconds);
  }
}

function filterDataByTimeRange(startSeconds, endSeconds) {
  if (!fullData) return;
  
  const filteredLinks = fullData.links.filter(link => {
    return link.timestamps.some(t => t >= startSeconds && t <= endSeconds);
  }).map(link => {
    const validTimestamps = link.timestamps.filter(t => t >= startSeconds && t <= endSeconds);
    return {
      ...link,
      value: validTimestamps.length
    };
  });
  
  const activeNodeIds = new Set();
  filteredLinks.forEach(link => {
    activeNodeIds.add(link.source);
    activeNodeIds.add(link.target);
  });
  
  // Filter nodes to only include those with links
  const filteredNodes = fullData.nodes.filter(node => activeNodeIds.has(node.id));
  
  data = {
    nodes: filteredNodes,
    links: filteredLinks
  };
  
  d3.select("#shapes").selectAll("*").remove();
  buildProject();
}
