const fs = require('fs');
const http = require('http');
const https = require('https');
const { URL } = require('url');

/**
 * Comprehensive astronomical data fetcher
 * Fetches all data from 1960-2100 and stores in JSON
 */

// CORS Proxy function
function makeProxyRequest(targetUrl, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(targetUrl);
    const module = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = module.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Fetch moon phases for a year
async function fetchMoonPhasesForYear(year) {
  const url = `https://aa.usno.navy.mil/api/moon/phases/year?year=${year}`;
  console.log(`Fetching moon phases for ${year}...`);
  
  try {
    const response = await makeProxyRequest(url, 30000);
    const data = JSON.parse(response);
    return {
      year,
      data: data.phasedata || []
    };
  } catch (error) {
    console.error(`Failed to fetch moon phases for ${year}:`, error.message);
    return { year, data: [], error: error.message };
  }
}

// Fetch eclipses for a year
async function fetchEclipsesForYear(year) {
  const solarUrl = `https://api.imcce.fr/webservices/miriade/ephemeris_solar_eclipse.php?year=${year}`;
  const lunarUrl = `https://api.imcce.fr/webservices/miriade/ephemeris_lunar_eclipse.php?year=${year}`;
  
  console.log(`Fetching eclipses for ${year}...`);
  
  try {
    const [solarResponse, lunarResponse] = await Promise.all([
      makeProxyRequest(solarUrl, 30000).catch(err => null),
      makeProxyRequest(lunarUrl, 30000).catch(err => null)
    ]);
    
    return {
      year,
      solar: solarResponse ? parseEclipseData(solarResponse) : [],
      lunar: lunarResponse ? parseEclipseData(lunarResponse) : [],
    };
  } catch (error) {
    console.error(`Failed to fetch eclipses for ${year}:`, error.message);
    return { year, solar: [], lunar: [], error: error.message };
  }
}

// Parse eclipse data from API response
function parseEclipseData(response) {
  try {
    // Basic parsing - adjust based on actual API response format
    const lines = response.split('\n');
    const eclipses = [];
    
    for (const line of lines) {
      if (line.includes('eclipse') || line.match(/\d{4}-\d{2}-\d{2}/)) {
        const dateMatch = line.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          eclipses.push({
            date: dateMatch[1],
            type: line.toLowerCase().includes('solar') ? 'solar' : 'lunar',
            description: line.trim()
          });
        }
      }
    }
    
    return eclipses;
  } catch (error) {
    console.error('Error parsing eclipse data:', error);
    return [];
  }
}

// Add delay between requests to avoid rate limiting
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function to fetch all data
async function fetchAllAstronomicalData() {
  const startYear = 1960;
  const endYear = 2100;
  const totalYears = endYear - startYear + 1;
  
  console.log(`Starting comprehensive astronomical data fetch...`);
  console.log(`Years: ${startYear} - ${endYear} (${totalYears} years)`);
  console.log(`This will take approximately ${Math.ceil(totalYears * 2 / 60)} minutes`);
  
  const allData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      startYear,
      endYear,
      totalYears,
      dataTypes: ['moonPhases', 'solarEclipses', 'lunarEclipses']
    },
    moonPhases: {},
    eclipses: {}
  };
  
  let successCount = 0;
  let errorCount = 0;
  
  // Process years in batches to avoid overwhelming the APIs
  const batchSize = 5;
  for (let i = startYear; i <= endYear; i += batchSize) {
    const batchEnd = Math.min(i + batchSize - 1, endYear);
    const batchYears = [];
    
    for (let year = i; year <= batchEnd; year++) {
      batchYears.push(year);
    }
    
    console.log(`\nProcessing batch: ${i} - ${batchEnd}`);
    
    // Fetch moon phases for this batch
    const moonPromises = batchYears.map(year => 
      fetchMoonPhasesForYear(year).then(result => {
        if (result.error) {
          errorCount++;
        } else {
          successCount++;
        }
        return result;
      })
    );
    
    // Fetch eclipses for this batch
    const eclipsePromises = batchYears.map(year => 
      fetchEclipsesForYear(year).then(result => {
        if (result.error) {
          errorCount++;
        } else {
          successCount++;
        }
        return result;
      })
    );
    
    try {
      const [moonResults, eclipseResults] = await Promise.all([
        Promise.all(moonPromises),
        Promise.all(eclipsePromises)
      ]);
      
      // Store results
      moonResults.forEach(result => {
        allData.moonPhases[result.year] = result;
      });
      
      eclipseResults.forEach(result => {
        allData.eclipses[result.year] = result;
      });
      
      console.log(`Batch complete. Success: ${successCount}, Errors: ${errorCount}`);
      
      // Save progress every batch
      const progressFile = 'astronomical-data-progress.json';
      fs.writeFileSync(progressFile, JSON.stringify(allData, null, 2));
      console.log(`Progress saved to ${progressFile}`);
      
    } catch (batchError) {
      console.error(`Batch error for years ${i}-${batchEnd}:`, batchError);
    }
    
    // Delay between batches to be respectful to APIs
    if (batchEnd < endYear) {
      console.log('Waiting 5 seconds before next batch...');
      await delay(5000);
    }
  }
  
  // Final statistics
  allData.metadata.successCount = successCount;
  allData.metadata.errorCount = errorCount;
  allData.metadata.completedAt = new Date().toISOString();
  
  // Save final data
  const finalFile = 'astronomical-data-complete.json';
  fs.writeFileSync(finalFile, JSON.stringify(allData, null, 2));
  
  console.log(`\n=== FETCH COMPLETE ===`);
  console.log(`Total years processed: ${totalYears}`);
  console.log(`Successful requests: ${successCount}`);
  console.log(`Failed requests: ${errorCount}`);
  console.log(`Final data saved to: ${finalFile}`);
  console.log(`File size: ${(fs.statSync(finalFile).size / 1024 / 1024).toFixed(2)} MB`);
  
  return allData;
}

// Error handling and graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nReceived SIGINT. Saving current progress...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the fetcher
if (require.main === module) {
  fetchAllAstronomicalData()
    .then(() => {
      console.log('\nAll astronomical data fetched successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nFatal error:', error);
      process.exit(1);
    });
}

module.exports = { fetchAllAstronomicalData, fetchMoonPhasesForYear, fetchEclipsesForYear };
