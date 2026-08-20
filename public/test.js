console.log("Test script loading");

window.onload = function() {
  console.log("Window loaded");
  
  const appContainer = document.getElementById('app-container');
  if (appContainer) {
    console.log("Found app container");
    appContainer.innerHTML = "<h1>Test script works!</h1>";
  } else {
    console.error("App container not found");
  }
};

// Also try with an alternative approach
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM content loaded");
});