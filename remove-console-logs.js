const fs = require('fs');
const path = require('path');

// Files to process - expanded list
const filesToProcess = [
  'components/places-autocomplete.tsx',
  'components/booking-form.tsx',
  'components/booking/journey-section.tsx',
  'components/booking/vehicle-config-section.tsx',
  'components/booking/customer-info-section.tsx',
  'app/[lang]/services/[service]/page.tsx',
  'app/[lang]/booking/page.tsx',
  'app/[lang]/contact/page.tsx',
  'app/api/create-checkout-session/route.ts',
  'app/[lang]/onlocation/components/booking-form.tsx',
  'app/api/distance/route.ts',
  'app/api/places/route.ts',
  'app/api/stripe-webhook/route.ts',
  'test-locality-mapping.ts',
  'test-pricing-complete.ts',
  'test-pricing-output.ts',
  'generate-pricing-report.ts'
];

function removeConsoleLogsFromFile(filePath) {
  try {
    console.log(`Processing ${filePath}...`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ File not found: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let originalLength = content.length;
    
    // Remove console.log statements (including multi-line ones)
    // This regex matches:
    // - console.log(...) on single line
    // - console.log(...) spanning multiple lines
    // - handles nested parentheses and brackets
    content = content.replace(/console\.log\s*\([^)]*(?:\([^)]*\)[^)]*)*\);?\s*\n?/g, '');
    
    // More comprehensive regex for multi-line console.log statements
    content = content.replace(/console\.log\s*\([\s\S]*?\);?\s*\n?/g, '');
    
    // Also remove standalone console.log lines that might have been missed
    content = content.replace(/^\s*console\.log\([\s\S]*?\);\s*$/gm, '');
    
    // Remove console.error, console.warn, etc.
    content = content.replace(/console\.(error|warn|info|debug)\s*\([^)]*(?:\([^)]*\)[^)]*)*\);?\s*\n?/g, '');
    
    // Clean up any double empty lines that might have been created
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (content.length !== originalLength) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated ${filePath} (removed ${originalLength - content.length} characters)`);
    } else {
      console.log(`⚪ No changes needed in ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Process all files
filesToProcess.forEach(removeConsoleLogsFromFile);

console.log('🏁 Console.log removal completed!'); 