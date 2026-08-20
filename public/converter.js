// Wait for DOM to be fully loaded
window.addEventListener('load', function() {
  // Get app container once
  const appContainer = document.getElementById('app-container');
  if (!appContainer) {
    console.error("App container not found!");
    return;
  }
  
  // Get current time in Lithuania (UTC+2 or UTC+3 depending on DST)
  function getLithuaniaTime() {
    const now = new Date();
    const lithuaniaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Vilnius' }));
    return lithuaniaTime;
  }
  
  // Generate greeting based on time of day
  function getGreeting() {
    const time = getLithuaniaTime();
    const hour = time.getHours();
    
    // Fun emojis array
    const funEmojis = ["😊", "🎉", "✨", "🌟", "💖", "🌈", "🦄", "🌸", "🌺", "🌻", "🌞", "🌝", "🦋", "🐞", "🍀"];
    const randomEmoji = funEmojis[Math.floor(Math.random() * funEmojis.length)];
    
    // Random name selection
    const names = ["LT Advert!", "LT Advert!"];
    const randomName = names[Math.floor(Math.random() * names.length)];
    
    if (hour >= 5 && hour < 12) {
      return '<span class="greeting-text">Laba ryta, ' + randomName + '</span> <span class="emoji">' + randomEmoji + '</span>';
    } else if (hour >= 12 && hour < 18) {
      return '<span class="greeting-text">Laba diena, ' + randomName + '</span> <span class="emoji">' + randomEmoji + '</span>';
    } else {
      return '<span class="greeting-text">Laba vakara, ' + randomName + '</span> <span class="emoji">' + randomEmoji + '</span>';
    }
  }
  
  // Initialize the UI first with a simple message
  appContainer.innerHTML = `
    <div class="container">
      <div class="header">
        <h1>${getGreeting()}</h1>
        <p>Loading video converter...</p>
      </div>
    </div>
  `;
  
  // Add the CSS
  addStyles();
  
  // Load FFmpeg library
  const ffmpegScript = document.createElement('script');
  ffmpegScript.src = 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js';
  
  ffmpegScript.onload = function() {
    // Initialize the full converter UI after FFmpeg is loaded
    initializeConverter();
  };
  
  ffmpegScript.onerror = function() {
    appContainer.innerHTML = `
      <div class="container">
        <div class="header">
          <h1>${getGreeting()}</h1>
          <p>Failed to load FFmpeg library. Please refresh the page or try again later.</p>
        </div>
      </div>
    `;
  };
  
  document.body.appendChild(ffmpegScript);
  
  function addStyles() {
    // Add your CSS styles here
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --primary-color: #4361ee;
        --success-color: #4cc9f0;
        --warning-color: #f72585;
        --light-color: #f8f9fa;
        --dark-color: #212529;
        --border-radius: 12px;
        --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        --transition: all 0.3s ease;
      }
      
      body {
        font-family: 'Manrope', sans-serif;
        max-width: 900px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f5f5f5;
        color: var(--dark-color);
        line-height: 1.6;
      }
      
      .container {
        background-color: white;
        border-radius: var(--border-radius);
        padding: 30px;
        box-shadow: var(--box-shadow);
      }
      
      .header {
        text-align: center;
        margin-bottom: 30px;
      }
      
      h1, h3 {
        color: var(--dark-color);
        text-align: center;
        margin-top: 0;
      }
      
      h1 {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 10px;
      }
      
      .greeting-text {
        background: linear-gradient(45deg, var(--primary-color), var(--success-color));
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
      
      .emoji {
        color: initial;
      }
    `;
    document.head.appendChild(style);
  }
  
  function initializeConverter() {
    // Here you'll build the full UI and all the functionality
    // This will run after FFmpeg is loaded
    appContainer.innerHTML = `
      <div class="container">
        <div class="header">
          <h1>${getGreeting()}</h1>
          <p>FFmpeg loaded successfully! Building converter interface...</p>
        </div>
      </div>
    `;
    
    // Continue building your UI and functionality here...
    // This is where you'll add the rest of your converter code
  }
});