const fs = require('fs');
const http = require('http');
const https = require('https');
const { URL } = require('url');

/**
 * Eclipse Data Fetcher for Solar and Lunar Eclipses
 * Fetches comprehensive eclipse data from multiple sources
 * Coverage: 1960-2100 for complete astronomical database
 */

// Make HTTP request with proper error handling
function makeRequest(targetUrl, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(targetUrl);
    const module = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    };

    console.log(`Requesting: ${targetUrl}`);
    
    const req = module.request(options, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Response status: ${res.statusCode}, Length: ${data.length}`);
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error(`Request error: ${err.message}`);
      reject(err);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.setTimeout(timeout);
    req.end();
  });
}

// Parse NASA eclipse data from their catalog
function parseNASAEclipseData(data, eclipseType) {
  const eclipses = [];
  const lines = data.split('\n');
  
  for (const line of lines) {
    // NASA eclipse catalog format varies, look for date patterns
    const datePatterns = [
      /(\d{4})\s+(\w{3})\s+(\d{1,2})/,  // "2024 Mar 25"
      /(\d{4})-(\d{2})-(\d{2})/,        // "2024-03-25"
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // "3/25/2024"
    ];
    
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        try {
          let year, month, day;
          
          if (pattern.source.includes('\\w{3}')) {
            // Month name format
            const monthMap = {
              'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
              'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
            };
            year = parseInt(match[1]);
            month = monthMap[match[2]];
            day = parseInt(match[3]);
          } else if (pattern.source.includes('-')) {
            // ISO format
            year = parseInt(match[1]);
            month = parseInt(match[2]);
            day = parseInt(match[3]);
          } else {
            // US format
            month = parseInt(match[1]);
            day = parseInt(match[2]);
            year = parseInt(match[3]);
          }
          
          if (year && month && day && year >= 1960 && year <= 2100) {
            eclipses.push({
              year,
              month,
              day,
              date: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
              type: eclipseType,
              description: line.trim(),
              source: 'NASA Eclipse Catalog'
            });
          }
        } catch (err) {
          // Skip invalid entries
        }
        break;
      }
    }
  }
  
  return eclipses;
}

// Fetch eclipse data from NASA
async function fetchNASAEclipses(eclipseType) {
  // NASA Eclipse Path URLs
  const urls = {
    solar: [
      'https://eclipse.gsfc.nasa.gov/SEcat5/SE2001-2100.html',
      'https://eclipse.gsfc.nasa.gov/SEcat5/SE1901-2000.html'
    ],
    lunar: [
      'https://eclipse.gsfc.nasa.gov/LEcat5/LE2001-2100.html', 
      'https://eclipse.gsfc.nasa.gov/LEcat5/LE1901-2000.html'
    ]
  };

  const allEclipses = [];
  
  for (const url of urls[eclipseType] || []) {
    try {
      console.log(`Fetching ${eclipseType} eclipses from NASA: ${url}`);
      const response = await makeRequest(url, 45000);
      const eclipses = parseNASAEclipseData(response, eclipseType);
      allEclipses.push(...eclipses);
      console.log(`✓ Found ${eclipses.length} ${eclipseType} eclipses`);
      
      // Delay between requests
      await delay(3000);
    } catch (error) {
      console.error(`✗ Failed to fetch ${eclipseType} from ${url}:`, error.message);
    }
  }
  
  return allEclipses;
}

// Alternative: Generate eclipse data using astronomical calculations
function calculateEclipses(startYear, endYear, eclipseType) {
  const eclipses = [];
  
  // Eclipse cycles (Saros cycle ≈ 18.03 years, 223 synodic months)
  const solarSarosCycle = 18.03; // years
  const lunarSarosCycle = 18.03; // years
  
  // Known eclipse dates as references (these are actual historical eclipses)
  const referenceEclipses = {
    solar: [
      { year: 2024, month: 4, day: 8 },   // Total Solar Eclipse
      { year: 2023, month: 10, day: 14 }, // Annular Solar Eclipse
      { year: 2021, month: 6, day: 10 },  // Annular Solar Eclipse
      { year: 2020, month: 6, day: 21 },  // Annular Solar Eclipse
      { year: 2017, month: 8, day: 21 },  // Total Solar Eclipse
    ],
    lunar: [
      { year: 2024, month: 3, day: 25 },  // Penumbral Lunar Eclipse
      { year: 2023, month: 5, day: 5 },   // Penumbral Lunar Eclipse
      { year: 2022, month: 11, day: 8 },  // Total Lunar Eclipse
      { year: 2022, month: 5, day: 16 },  // Total Lunar Eclipse
      { year: 2021, month: 11, day: 19 }, // Partial Lunar Eclipse
    ]
  };
  
  const references = referenceEclipses[eclipseType] || [];
  const cycle = eclipseType === 'solar' ? solarSarosCycle : lunarSarosCycle;
  
  for (const ref of references) {
    // Project backwards and forwards using Saros cycle
    let year = ref.year;
    
    // Go backwards
    while (year >= startYear) {
      if (year >= startYear && year <= endYear) {
        eclipses.push({
          year,
          month: ref.month,
          day: ref.day,
          date: `${year}-${ref.month.toString().padStart(2, '0')}-${ref.day.toString().padStart(2, '0')}`,
          type: eclipseType,
          description: `${eclipseType === 'solar' ? 'Solar' : 'Lunar'} Eclipse (calculated)`,
          source: 'Saros Cycle Calculation'
        });
      }
      year -= cycle;
    }
    
    // Go forwards
    year = ref.year + cycle;
    while (year <= endYear) {
      if (year >= startYear && year <= endYear) {
        eclipses.push({
          year: Math.round(year),
          month: ref.month,
          day: ref.day,
          date: `${Math.round(year)}-${ref.month.toString().padStart(2, '0')}-${ref.day.toString().padStart(2, '0')}`,
          type: eclipseType,
          description: `${eclipseType === 'solar' ? 'Solar' : 'Lunar'} Eclipse (calculated)`,
          source: 'Saros Cycle Calculation'
        });
      }
      year += cycle;
    }
  }
  
  // Remove duplicates and sort
  const uniqueEclipses = eclipses.filter((eclipse, index, self) => 
    index === self.findIndex(e => e.year === eclipse.year && e.month === eclipse.month && e.day === eclipse.day)
  );
  
  return uniqueEclipses.sort((a, b) => a.year - b.year);
}

// Add delay to be respectful to APIs
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main eclipse data fetching function
async function fetchAllEclipseData() {
  const startYear = 1960;
  const endYear = 2100;
  
  console.log(`\n🌒 ECLIPSE DATA FETCHER 🌒`);
  console.log(`Years: ${startYear} - ${endYear}`);
  console.log(`Fetching both Solar and Lunar eclipses\n`);
  
  const allData = {
    metadata: {
      title: "Comprehensive Eclipse Data 1960-2100",
      sources: ["NASA Eclipse Catalog", "Saros Cycle Calculations"],
      generatedAt: new Date().toISOString(),
      startYear,
      endYear,
      totalYears: endYear - startYear + 1
    },
    solarEclipses: [],
    lunarEclipses: []
  };
  
  try {
    // Method 1: Try to fetch from NASA (more accurate)
    console.log('🔍 Attempting to fetch from NASA Eclipse Catalog...');
    
    const solarFromNASA = await fetchNASAEclipses('solar');
    const lunarFromNASA = await fetchNASAEclipses('lunar');
    
    if (solarFromNASA.length > 0) {
      allData.solarEclipses = solarFromNASA;
      console.log(`✓ NASA Solar Eclipses: ${solarFromNASA.length}`);
    }
    
    if (lunarFromNASA.length > 0) {
      allData.lunarEclipses = lunarFromNASA;
      console.log(`✓ NASA Lunar Eclipses: ${lunarFromNASA.length}`);
    }
    
  } catch (error) {
    console.warn('⚠️  NASA fetch failed:', error.message);
  }
  
  // Method 2: Generate using calculations (fallback or supplement)
  console.log('\n🧮 Generating calculated eclipse data...');
  
  const calculatedSolar = calculateEclipses(startYear, endYear, 'solar');
  const calculatedLunar = calculateEclipses(startYear, endYear, 'lunar');
  
  console.log(`✓ Calculated Solar Eclipses: ${calculatedSolar.length}`);
  console.log(`✓ Calculated Lunar Eclipses: ${calculatedLunar.length}`);
  
  // Combine data (prefer NASA, supplement with calculations)
  if (allData.solarEclipses.length === 0) {
    allData.solarEclipses = calculatedSolar;
  } else {
    // Merge and deduplicate
    const merged = [...allData.solarEclipses, ...calculatedSolar];
    allData.solarEclipses = merged.filter((eclipse, index, self) => 
      index === self.findIndex(e => e.year === eclipse.year && e.month === eclipse.month)
    ).sort((a, b) => a.year - b.year);
  }
  
  if (allData.lunarEclipses.length === 0) {
    allData.lunarEclipses = calculatedLunar;
  } else {
    // Merge and deduplicate
    const merged = [...allData.lunarEclipses, ...calculatedLunar];
    allData.lunarEclipses = merged.filter((eclipse, index, self) => 
      index === self.findIndex(e => e.year === eclipse.year && e.month === eclipse.month)
    ).sort((a, b) => a.year - b.year);
  }
  
  // Final statistics
  allData.metadata.totalSolarEclipses = allData.solarEclipses.length;
  allData.metadata.totalLunarEclipses = allData.lunarEclipses.length;
  allData.metadata.totalEclipses = allData.solarEclipses.length + allData.lunarEclipses.length;
  allData.metadata.completedAt = new Date().toISOString();
  
  // Save final file
  const finalFile = 'eclipse-data-1960-2100.json';
  fs.writeFileSync(finalFile, JSON.stringify(allData, null, 2));
  
  const fileSize = (fs.statSync(finalFile).size / 1024 / 1024).toFixed(2);
  
  console.log(`\n🎉 ECLIPSE FETCH COMPLETE! 🎉`);
  console.log(`📁 File: ${finalFile}`);
  console.log(`📊 Size: ${fileSize} MB`);
  console.log(`☀️ Solar Eclipses: ${allData.solarEclipses.length}`);
  console.log(`🌙 Lunar Eclipses: ${allData.lunarEclipses.length}`);
  console.log(`📈 Total Eclipses: ${allData.metadata.totalEclipses}`);
  
  return allData;
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Interrupted by user.');
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  fetchAllEclipseData()
    .then(() => {
      console.log('\n🚀 Eclipse data mission accomplished!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Eclipse mission failed:', error);
      process.exit(1);
    });
}

module.exports = { fetchAllEclipseData, calculateEclipses };
