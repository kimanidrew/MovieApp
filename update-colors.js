const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.match(/\.(tsx|ts|css|jsx|js)$/)) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('C:/Users/MRT/Desktop/MovieFlix/src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Progress Bar Special Handling in PlayerControls and similar
  // Replace the first #e50914 with #3b82f6 and the second with #ec4899 in the volume/progress gradients
  content = content.replace(/linear-gradient\(to right,\s*#e50914\s+0%,\s*#e50914/g, "linear-gradient(to right, #3b82f6 0%, #ec4899");
  
  // If there are other gradient references covering #e50914 ...
  content = content.replace(/linear-gradient\([^,]+,\s*#e50914,\s*#ff4c4c,\s*#ffb400\)/g, "linear-gradient(to right, #3b82f6, #ec4899)");

  // 2. Exact background color replacements string templates or CSS
  content = content.replace(/background(-color)?:\s*(['"`]?)#e50914\2/g, "background: $2linear-gradient(to right, #3b82f6, #ec4899)$2");

  // 3. Fallback for all other #e50914 to Vivid Purple (where gradient is invalid, e.g. borders, fill, colors)
  content = content.replace(/#e50914/gi, "#ec4899");

  // 4. Hover states that were lighter red
  content = content.replace(/#ff1e27/gi, "#d946ef"); // brighter vivid purple/pink
  
  // 5. rgba format of the netflix red
  content = content.replace(/rgba\(\s*229\s*,\s*9\s*,\s*20\s*,/g, "rgba(236, 72, 153,");

  // 6. Fix global backgrounds to exactly #141414
  // First in globals.css root variable
  content = content.replace(/--background:\s*#0f172a/g, "--background: #141414");
  
  // In Trailer section there's background: #0a0a0a and #111111 and #161616
  // We'll replace them if they refer to main backgrounds
  content = content.replace(/background:\s*#0a0a0a/g, "background: #141414");
  content = content.replace(/background:\s*#111111/g, "background: #141414");
  content = content.replace(/background:\s*#161616/g, "background: #141414");
  content = content.replace(/rgba\(10,\s*10,\s*10,/g, "rgba(20, 20, 20,");

  // Save if changed
  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
