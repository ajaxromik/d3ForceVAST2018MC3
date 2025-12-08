// Global data variable
let data = null;

// File input handler
document.getElementById('jsonFiles').addEventListener('change', function(e) {
  const files = e.target.files;
  const fileStatus = document.getElementById('fileStatus');
  
  if (files.length === 0) {
    fileStatus.textContent = 'No files selected.';
    return;
  }
  
  // TODO handle multiple files instead of only taking one
  const file = files[0];
  
  fileStatus.textContent = `Loading ${file.name}...`;
  
  const reader = new FileReader();
  
  reader.onload = function(event) {
    try {
      data = JSON.parse(event.target.result);
      fileStatus.textContent = `${file.name} loaded`;
      fileStatus.style.color = 'green';
      
      // Clear with new files selected
      d3.select("#shapes").selectAll("*").remove();
      
      // Build the project with the loaded data
      buildProject();
      
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
