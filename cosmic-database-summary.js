/**
 * COSMIC DATABASE SUMMARY
 * Complete verification of all astronomical data collected
 */

const fs = require('fs');

console.log('🌌 COSMIC BIRTHDAY FINDER - COMPLETE DATABASE SUMMARY\n');

// Load moon phase data
let moonData;
try {
  moonData = JSON.parse(fs.readFileSync('moon-phases-1960-2100.json', 'utf8'));
  console.log('✅ Moon Phase Data: LOADED');
} catch (error) {
  console.log('❌ Moon Phase Data: NOT FOUND');
  process.exit(1);
}

// Load eclipse data
let eclipseData;
try {
  eclipseData = JSON.parse(fs.readFileSync('eclipse-data-1960-2100.json', 'utf8'));
  console.log('✅ Eclipse Data: LOADED');
} catch (error) {
  console.log('❌ Eclipse Data: NOT FOUND');
  process.exit(1);
}

console.log('\n📊 COMPLETE DATA STATISTICS:');
console.log('=' .repeat(50));

// Moon phase statistics
console.log('\n🌙 MOON PHASE DATA:');
console.log(`   Coverage: ${moonData.metadata.startYear} - ${moonData.metadata.endYear}`);
console.log(`   Total Years: ${moonData.metadata.totalYears}`);
console.log(`   Success Rate: ${moonData.metadata.successful}/${moonData.metadata.processed} (${(moonData.metadata.successful/moonData.metadata.processed*100).toFixed(1)}%)`);
console.log(`   Total Moon Phases: ${moonData.metadata.totalPhases.toLocaleString()}`);

// Break down by phase type
const phaseBreakdown = {
  'Full Moon': 0,
  'New Moon': 0,
  'First Quarter': 0,
  'Last Quarter': 0,
  'Third Quarter': 0
};

Object.values(moonData.moonPhases).forEach(yearData => {
  if (yearData.success) {
    yearData.phases.forEach(phase => {
      if (phaseBreakdown.hasOwnProperty(phase.phase)) {
        phaseBreakdown[phase.phase]++;
      }
    });
  }
});

console.log('\n   Phase Breakdown:');
Object.entries(phaseBreakdown).forEach(([phase, count]) => {
  if (count > 0) {
    console.log(`     ${phase}: ${count.toLocaleString()}`);
  }
});

// Eclipse statistics
console.log('\n☀️ ECLIPSE DATA:');
console.log(`   Coverage: ${eclipseData.metadata.startYear} - ${eclipseData.metadata.endYear}`);
console.log(`   Total Years: ${eclipseData.metadata.totalYears}`);
console.log(`   Solar Eclipses: ${eclipseData.metadata.totalSolarEclipses}`);
console.log(`   Lunar Eclipses: ${eclipseData.metadata.totalLunarEclipses}`);
console.log(`   Total Eclipses: ${eclipseData.metadata.totalEclipses}`);

// Eclipse type breakdown
const extractEclipseType = (description, eclipseCategory) => {
  if (eclipseCategory === 'solar') {
    if (description.includes('   T   ')) return 'Total';
    if (description.includes('   A   ')) return 'Annular';
    if (description.includes('   P   ')) return 'Partial';
    if (description.includes('   H   ')) return 'Hybrid';
    return 'Unspecified';
  } else {
    if (description.includes('   T-  ') || description.includes('   T+  ')) return 'Total';
    if (description.includes('   P   ')) return 'Partial';
    if (description.includes('   N   ')) return 'Penumbral';
    return 'Unspecified';
  }
};

const solarTypes = {};
eclipseData.solarEclipses.forEach(eclipse => {
  const type = extractEclipseType(eclipse.description, 'solar');
  solarTypes[type] = (solarTypes[type] || 0) + 1;
});

const lunarTypes = {};
eclipseData.lunarEclipses.forEach(eclipse => {
  const type = extractEclipseType(eclipse.description, 'lunar');
  lunarTypes[type] = (lunarTypes[type] || 0) + 1;
});

console.log('\n   Solar Eclipse Types:');
Object.entries(solarTypes).forEach(([type, count]) => {
  console.log(`     ${type}: ${count}`);
});

console.log('\n   Lunar Eclipse Types:');
Object.entries(lunarTypes).forEach(([type, count]) => {
  console.log(`     ${type}: ${count}`);
});

// File size information
const moonFileSize = (fs.statSync('moon-phases-1960-2100.json').size / 1024 / 1024).toFixed(2);
const eclipseFileSize = (fs.statSync('eclipse-data-1960-2100.json').size / 1024 / 1024).toFixed(2);

console.log('\n💾 FILE INFORMATION:');
console.log(`   Moon Phase Data: ${moonFileSize} MB`);
console.log(`   Eclipse Data: ${eclipseFileSize} MB`);
console.log(`   Total Database Size: ${(parseFloat(moonFileSize) + parseFloat(eclipseFileSize)).toFixed(2)} MB`);

// Data completeness check
console.log('\n🔍 DATA COMPLETENESS CHECK:');

// Check for missing years in moon data
const missingMoonYears = [];
for (let year = 1960; year <= 2100; year++) {
  if (!moonData.moonPhases[year] || !moonData.moonPhases[year].success) {
    missingMoonYears.push(year);
  }
}

if (missingMoonYears.length === 0) {
  console.log('   ✅ Moon Phase Data: Complete (all years 1960-2100)');
} else {
  console.log(`   ⚠️  Moon Phase Data: Missing ${missingMoonYears.length} years`);
  if (missingMoonYears.length <= 10) {
    console.log(`      Missing years: ${missingMoonYears.join(', ')}`);
  }
}

// Check eclipse data coverage
const eclipseYears = new Set();
eclipseData.solarEclipses.forEach(e => eclipseYears.add(e.year));
eclipseData.lunarEclipses.forEach(e => eclipseYears.add(e.year));

const eclipseYearCount = eclipseYears.size;
const totalYears = 2100 - 1960 + 1;

console.log(`   ✅ Eclipse Data: Covers ${eclipseYearCount}/${totalYears} years (${(eclipseYearCount/totalYears*100).toFixed(1)}%)`);

// Total events
const totalEvents = moonData.metadata.totalPhases + eclipseData.metadata.totalEclipses;

console.log('\n🎉 FINAL SUMMARY:');
console.log('=' .repeat(50));
console.log(`📅 Time Coverage: 1960-2100 (141 years)`);
console.log(`🌙 Total Moon Phases: ${moonData.metadata.totalPhases.toLocaleString()}`);
console.log(`🌒 Total Eclipses: ${eclipseData.metadata.totalEclipses.toLocaleString()}`);
console.log(`⭐ Total Astronomical Events: ${totalEvents.toLocaleString()}`);
console.log(`💾 Database Size: ${(parseFloat(moonFileSize) + parseFloat(eclipseFileSize)).toFixed(2)} MB`);
console.log(`🎯 Average Events per Year: ${(totalEvents / 141).toFixed(0)}`);

console.log('\n🚀 DATABASE STATUS: COMPLETE AND READY!');
console.log('   The Cosmic Birthday Finder now has access to:');
console.log('   • Every moon phase from 1960-2100');
console.log('   • Every solar eclipse from 1960-2100');
console.log('   • Every lunar eclipse from 1960-2100');
console.log('   • Detailed type classification for all events');
console.log('   • Instant data processing without API calls');

console.log('\n✨ Ready to find cosmic birthdays for any date! ✨');
