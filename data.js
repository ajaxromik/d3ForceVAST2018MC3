// Global data variable
let data = null;

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
        
        buildProject();
      } else if (fileExtension === 'csv') {
        const csvText = event.target.result;
        const parsedData = d3.csvParse(csvText);
        
        data = convertCSVToNodeLink(parsedData);
        
        fileStatus.textContent = `Loaded ${file.name} successfully! (${parsedData.length} rows)`;
        fileStatus.style.color = 'green';
        
        d3.select("#shapes").selectAll("*").remove();
        
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
  const nodesMap = new Map();
  const linksMap = new Map();
  
  // Process each row
  csvData.forEach(row => {
    const sourceId = +row.Source; // Convert to number
    const targetId = +row.Destination; // Convert to number
    const sourceName = row.Sent.trim();
    const targetName = row.Received.trim();
    
    // Add source node if not exists
    if (!nodesMap.has(sourceId)) {
      nodesMap.set(sourceId, {
        id: sourceId,
        name: sourceName,
        group: "Suspicious",
        radius: 1
      });
    }
    
    // Add target node if not exists
    if (!nodesMap.has(targetId)) {
      nodesMap.set(targetId, {
        id: targetId,
        name: targetName,
        group: "Suspicious",
        radius: 1
      });
    }
    
    // Create link key (using sorted IDs to treat bidirectional links as same)
    let linkName = sourceName + targetName;
    if(sourceId > targetId)
      linkName = targetName + sourceName;
    
    // Add or increment link
    if (linksMap.has(linkName)) {
      linksMap.get(linkName).value++;
    } else {
      linksMap.set(linkName, {
        source: sourceId,
        target: targetId,
        value: 1
      });
    }
  });
  
  // Convert maps to arrays
  return {
    nodes: Array.from(nodesMap.values()),
    links: Array.from(linksMap.values())
  };
}
