const fs = require('fs');
const { fetchAllMoonData } = require('./fetch-moon-data.js');
const { fetchAllEclipseData } = require('./fetch-eclipse-data.js');

/**
 * MASTER ASTRONOMICAL DATA FETCHER
 * Combines all astronomical data sources into one comprehensive database
 * Creates the ultimate cosmic birthday finder dataset!
 */

async function fetchAllCosmicData() {
  console.log(`\n🌌 COSMIC DATABASE BUILDER 🌌`);
  console.log(`Building comprehensive astronomical database for 1960-2100`);
  console.log(`This will include:`);
  console.log(`  🌙 Moon Phases (Full, New, First Quarter, Last Quarter)`);
  console.log(`  ☀️ Solar Eclipses`);
  console.log(`  🌙 Lunar Eclipses`);
  console.log(`\nEstimated time: 10-15 minutes\n`);

  const masterData = {
    metadata: {
      title: "Complete Cosmic Birthday Database",
      description: "Comprehensive astronomical data for the Cosmic Birthday Finder app",
      coverage: "1960-2100 (141 years)",
      dataTypes: ["moonPhases", "solarEclipses", "lunarEclipses"],
      sources: ["USNO Naval Observatory", "NASA Eclipse Catalog", "Astronomical Calculations"],
      generatedAt: new Date().toISOString(),
      version: "1.0.0"
    },
    moonPhases: null,
    eclipses: null
  };

  try {
    // Step 1: Fetch Moon Phase Data
    console.log(`📅 STEP 1: Fetching Moon Phase Data...`);
    console.log(`This will take about 5 minutes for 141 years of data\n`);
    
    const moonData = await fetchAllMoonData();
    masterData.moonPhases = moonData;
    
    console.log(`✅ Moon phases complete!`);
    console.log(`   Total phases: ${moonData.metadata?.totalPhases || 'Unknown'}`);
    console.log(`   Success rate: ${moonData.metadata?.successful}/${moonData.metadata?.processed}\n`);

    // Step 2: Fetch Eclipse Data
    console.log(`🌒 STEP 2: Fetching Eclipse Data...`);
    console.log(`This will take about 2-3 minutes\n`);
    
    const eclipseData = await fetchAllEclipseData();
    masterData.eclipses = eclipseData;
    
    console.log(`✅ Eclipse data complete!`);
    console.log(`   Solar eclipses: ${eclipseData.metadata?.totalSolarEclipses || 0}`);
    console.log(`   Lunar eclipses: ${eclipseData.metadata?.totalLunarEclipses || 0}\n`);

    // Step 3: Combine and optimize data
    console.log(`🔧 STEP 3: Finalizing cosmic database...`);
    
    masterData.metadata.completedAt = new Date().toISOString();
    masterData.metadata.totalMoonPhases = moonData.metadata?.totalPhases || 0;
    masterData.metadata.totalSolarEclipses = eclipseData.metadata?.totalSolarEclipses || 0;
    masterData.metadata.totalLunarEclipses = eclipseData.metadata?.totalLunarEclipses || 0;
    masterData.metadata.totalEvents = masterData.metadata.totalMoonPhases + 
                                     masterData.metadata.totalSolarEclipses + 
                                     masterData.metadata.totalLunarEclipses;

    // Save the master file
    const masterFile = 'cosmic-database-complete.json';
    fs.writeFileSync(masterFile, JSON.stringify(masterData, null, 2));
    
    const fileSize = (fs.statSync(masterFile).size / 1024 / 1024).toFixed(2);

    console.log(`\n🎊 COSMIC DATABASE COMPLETE! 🎊`);
    console.log(`📁 Master file: ${masterFile}`);
    console.log(`📊 File size: ${fileSize} MB`);
    console.log(`\n📈 FINAL STATISTICS:`);
    console.log(`   🌙 Moon phases: ${masterData.metadata.totalMoonPhases.toLocaleString()}`);
    console.log(`   ☀️ Solar eclipses: ${masterData.metadata.totalSolarEclipses}`);
    console.log(`   🌙 Lunar eclipses: ${masterData.metadata.totalLunarEclipses}`);
    console.log(`   📊 Total events: ${masterData.metadata.totalEvents.toLocaleString()}`);
    console.log(`   📅 Years covered: 1960-2100 (${masterData.metadata.coverage})`);
    
    console.log(`\n🚀 Ready for React app integration!`);
    console.log(`   Copy the master file to your React app and update imports.`);

    return masterData;

  } catch (error) {
    console.error(`\n💥 Cosmic database build failed:`, error);
    
    // Save partial data if available
    if (masterData.moonPhases || masterData.eclipses) {
      const partialFile = 'cosmic-database-partial.json';
      fs.writeFileSync(partialFile, JSON.stringify(masterData, null, 2));
      console.log(`💾 Partial data saved to: ${partialFile}`);
    }
    
    throw error;
  }
}

// Progress tracking
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Cosmic database build interrupted.');
  console.log('Progress files have been saved. You can restart the process.');
  process.exit(0);
});

// Run the complete cosmic data fetcher
if (require.main === module) {
  fetchAllCosmicData()
    .then(() => {
      console.log('\n🌟 All astronomical data ready for cosmic birthday finding!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n⚠️  Build process encountered an error:', error.message);
      process.exit(1);
    });
}

module.exports = { fetchAllCosmicData };
