const fs = require('fs');
const http = require('http');
const https = require('https');
const { URL } = require('url');

/**
 * Simple and focused astronomical data fetcher
 * Focus on moon phases from USNO API (most reliable)
 * 1960-2100 = 141 years of data
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
        console.log(`Response status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
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

// Fetch moon phases for a specific year
async function fetchMoonPhasesYear(year) {
  const url = `https://aa.usno.navy.mil/api/moon/phases/year?year=${year}`;
  
  try {
    const response = await makeRequest(url);
    const data = JSON.parse(response);
    
    if (data && data.phasedata) {
      console.log(`✓ Year ${year}: ${data.phasedata.length} moon phases`);
      return {
        year,
        success: true,
        phases: data.phasedata,
        count: data.phasedata.length
      };
    } else {
      console.log(`✗ Year ${year}: No phase data`);
      return {
        year,
        success: false,
        error: 'No phase data in response',
        phases: []
      };
    }
  } catch (error) {
    console.log(`✗ Year ${year}: ${error.message}`);
    return {
      year,
      success: false,
      error: error.message,
      phases: []
    };
  }
}

// Add delay to be respectful to the API
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main data fetching function
async function fetchAllMoonData() {
  const startYear = 1960;
  const endYear = 2100;
  const years = [];
  
  for (let year = startYear; year <= endYear; year++) {
    years.push(year);
  }
  
  console.log(`\n🌙 MOON PHASE DATA FETCHER 🌙`);
  console.log(`Years: ${startYear} - ${endYear}`);
  console.log(`Total years: ${years.length}`);
  console.log(`Estimated time: ${Math.ceil(years.length * 2 / 60)} minutes\n`);
  
  const allData = {
    metadata: {
      title: "Comprehensive Moon Phase Data 1960-2100",
      source: "USNO Naval Observatory API",
      generatedAt: new Date().toISOString(),
      startYear,
      endYear,
      totalYears: years.length
    },
    moonPhases: {}
  };
  
  let processed = 0;
  let successful = 0;
  let failed = 0;
  
  // Process years sequentially to avoid overwhelming the API
  for (const year of years) {
    try {
      const result = await fetchMoonPhasesYear(year);
      allData.moonPhases[year] = result;
      
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
      
      processed++;
      
      // Progress update
      if (processed % 10 === 0) {
        const progress = (processed / years.length * 100).toFixed(1);
        console.log(`\n📊 Progress: ${processed}/${years.length} (${progress}%)`);
        console.log(`✓ Successful: ${successful} | ✗ Failed: ${failed}`);
        
        // Save intermediate progress
        const progressFile = `moon-data-progress-${processed}.json`;
        fs.writeFileSync(progressFile, JSON.stringify(allData, null, 2));
        console.log(`💾 Progress saved to ${progressFile}`);
      }
      
      // Small delay between requests (2 seconds)
      await delay(2000);
      
    } catch (error) {
      console.error(`💥 Fatal error processing year ${year}:`, error);
      failed++;
    }
  }
  
  // Final statistics
  allData.metadata.processed = processed;
  allData.metadata.successful = successful;
  allData.metadata.failed = failed;
  allData.metadata.completedAt = new Date().toISOString();
  
  // Calculate total phases
  let totalPhases = 0;
  Object.values(allData.moonPhases).forEach(yearData => {
    if (yearData.success) {
      totalPhases += yearData.count;
    }
  });
  allData.metadata.totalPhases = totalPhases;
  
  // Save final file
  const finalFile = 'moon-phases-1960-2100.json';
  fs.writeFileSync(finalFile, JSON.stringify(allData, null, 2));
  
  const fileSize = (fs.statSync(finalFile).size / 1024 / 1024).toFixed(2);
  
  console.log(`\n🎉 FETCH COMPLETE! 🎉`);
  console.log(`📁 File: ${finalFile}`);
  console.log(`📊 Size: ${fileSize} MB`);
  console.log(`🌙 Total moon phases: ${totalPhases}`);
  console.log(`✓ Successful years: ${successful}`);
  console.log(`✗ Failed years: ${failed}`);
  console.log(`📈 Success rate: ${(successful / years.length * 100).toFixed(1)}%`);
  
  return allData;
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Interrupted by user. Progress has been saved.');
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  fetchAllMoonData()
    .then(() => {
      console.log('\n🚀 Mission accomplished! Moon data ready for cosmic birthday finder.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Mission failed:', error);
      process.exit(1);
    });
}

module.exports = { fetchAllMoonData, fetchMoonPhasesYear };
