/**
 * Test Eclipse Type Detection
 * Quick verification that we can correctly identify eclipse types
 */

const fs = require('fs');

// Load the eclipse data
const eclipseData = JSON.parse(fs.readFileSync('eclipse-data-1960-2100.json', 'utf8'));

// Helper function to extract eclipse type from NASA description
const extractEclipseType = (description, eclipseCategory) => {
  if (eclipseCategory === 'solar') {
    if (description.includes('   T   ')) return 'Total Solar Eclipse';
    if (description.includes('   A   ')) return 'Annular Solar Eclipse';
    if (description.includes('   P   ')) return 'Partial Solar Eclipse';
    if (description.includes('   H   ')) return 'Hybrid Solar Eclipse';
    return 'Solar Eclipse';
  } else if (eclipseCategory === 'lunar') {
    if (description.includes('   T-  ') || description.includes('   T+  ')) return 'Total Lunar Eclipse';
    if (description.includes('   P   ')) return 'Partial Lunar Eclipse';
    if (description.includes('   N   ')) return 'Penumbral Lunar Eclipse';
    return 'Lunar Eclipse';
  }
  return `${eclipseCategory.charAt(0).toUpperCase()}${eclipseCategory.slice(1)} Eclipse`;
};

console.log('🔍 ECLIPSE TYPE ANALYSIS\n');

// Analyze solar eclipses
const solarTypes = {};
eclipseData.solarEclipses.forEach(eclipse => {
  const type = extractEclipseType(eclipse.description, 'solar');
  solarTypes[type] = (solarTypes[type] || 0) + 1;
});

console.log('☀️ SOLAR ECLIPSE BREAKDOWN:');
Object.entries(solarTypes).forEach(([type, count]) => {
  console.log(`   ${type}: ${count}`);
});

// Analyze lunar eclipses
const lunarTypes = {};
eclipseData.lunarEclipses.forEach(eclipse => {
  const type = extractEclipseType(eclipse.description, 'lunar');
  lunarTypes[type] = (lunarTypes[type] || 0) + 1;
});

console.log('\n🌙 LUNAR ECLIPSE BREAKDOWN:');
Object.entries(lunarTypes).forEach(([type, count]) => {
  console.log(`   ${type}: ${count}`);
});

// Show some examples
console.log('\n📋 SAMPLE ECLIPSE DATA:');
console.log('\nSolar Eclipse Examples:');
eclipseData.solarEclipses.slice(0, 3).forEach((eclipse, i) => {
  const type = extractEclipseType(eclipse.description, 'solar');
  console.log(`${i+1}. ${eclipse.date}: ${type}`);
  console.log(`   Raw: ${eclipse.description.substring(0, 100)}...`);
});

console.log('\nLunar Eclipse Examples:');
eclipseData.lunarEclipses.slice(0, 3).forEach((eclipse, i) => {
  const type = extractEclipseType(eclipse.description, 'lunar');
  console.log(`${i+1}. ${eclipse.date}: ${type}`);
  console.log(`   Raw: ${eclipse.description.substring(0, 100)}...`);
});

console.log('\n✅ Eclipse type detection test complete!');
console.log(`Total Solar Eclipses: ${eclipseData.solarEclipses.length}`);
console.log(`Total Lunar Eclipses: ${eclipseData.lunarEclipses.length}`);
console.log(`Total All Eclipses: ${eclipseData.solarEclipses.length + eclipseData.lunarEclipses.length}`);
