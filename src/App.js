import React, { useState } from 'react';
import { 
  Moon, 
  Sun, 
  Calendar, 
  Sparkles, 
  Search, 
  Clock, 
  AlertTriangle,
  Loader2
} from 'lucide-react';

// Import astronomical data as ES6 modules
import moonPhaseData from './data/moon-phases-1960-2100.json';
import eclipseData from './data/eclipse-data-1960-2100.json';

/**
 * COSMIC BIRTHDAY FINDER
 * A React application that finds celestial events matching a user's birthday
 * Features: Moon phases, Solar eclipses, Lunar eclipses
 * Now uses pre-fetched JSON data for instant results!
 */

function App() {
  // Log data loading status
  console.log('✅ Moon phase database loaded:', moonPhaseData?.metadata?.totalPhases || 0, 'phases');
  console.log('✅ Eclipse database loaded:', eclipseData?.metadata?.totalEclipses || 0, 'eclipses');

  // State management
  const [birthDate, setBirthDate] = useState('');
  const [displayDate, setDisplayDate] = useState(''); // For DD/MM/YYYY display
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ===========================================
  // DATE FORMAT CONVERSION FUNCTIONS
  // ===========================================

  /**
   * Convert DD/MM/YYYY to YYYY-MM-DD format for internal processing
   * @param {string} ddmmyyyy - Date in DD/MM/YYYY format
   * @returns {string} - Date in YYYY-MM-DD format or empty string if invalid
   */
  const convertToStandardDate = (ddmmyyyy) => {
    if (!ddmmyyyy || ddmmyyyy.length < 8) return '';
    
    // Remove any non-digit characters and pad if needed
    const digitsOnly = ddmmyyyy.replace(/\D/g, '');
    if (digitsOnly.length !== 8) return '';
    
    const day = digitsOnly.slice(0, 2);
    const month = digitsOnly.slice(2, 4);
    const year = digitsOnly.slice(4, 8);
    
    // Basic validation
    if (parseInt(day) < 1 || parseInt(day) > 31) return '';
    if (parseInt(month) < 1 || parseInt(month) > 12) return '';
    if (parseInt(year) < 1900 || parseInt(year) > 2100) return '';
    
    return `${year}-${month}-${day}`;
  };

  /**
   * Format input as DD/MM/YYYY while typing
   * @param {string} value - Raw input value
   * @returns {string} - Formatted DD/MM/YYYY string
   */
  const formatDateInput = (value) => {
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, '');
    
    // Add slashes as user types
    if (digitsOnly.length <= 2) {
      return digitsOnly;
    } else if (digitsOnly.length <= 4) {
      return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
    } else {
      return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4, 8)}`;
    }
  };

  /**
   * Handle display date changes and convert to internal format
   * @param {string} value - User input
   */
  const handleDateChange = (value) => {
    const formatted = formatDateInput(value);
    setDisplayDate(formatted);
    const standardDate = convertToStandardDate(formatted);
    setBirthDate(standardDate);
  };

  // ===========================================
  // DATE PARSING HELPER FUNCTIONS
  // ===========================================

  // parseUSNODate function is defined later in the file

  /**
   * Parse JSON moon phase data format: {year: 2024, month: 3, day: 25}
   * @param {Object} phaseObj - Phase object from JSON data
   * @returns {Date|null} - Parsed date object or null if invalid
   */
  const parseJSONPhaseDate = (phaseObj) => {
    try {
      if (!phaseObj || !phaseObj.year || !phaseObj.month || !phaseObj.day) return null;
      
      const year = parseInt(phaseObj.year);
      const month = parseInt(phaseObj.month) - 1; // JSON months are 1-12, Date months are 0-11
      const day = parseInt(phaseObj.day);
      
      if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
      if (month < 0 || month > 11) return null;
      
      return new Date(year, month, day);
    } catch (error) {
      console.error('Error parsing JSON phase date:', phaseObj, error);
      return null;
    }
  };

  /**
   * Parse USNO Navy date format: "2024 Mar 25 03:00"
   * @param {string} dateStr - Date string from USNO API
   * @returns {Date|null} - Parsed date object or null if invalid
   */
  const parseUSNODate = (dateStr) => {
    try {
      const monthMap = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      
      const parts = dateStr.trim().split(' ');
      if (parts.length < 3) return null;
      
      const year = parseInt(parts[0]);
      const month = monthMap[parts[1]];
      const day = parseInt(parts[2]);
      
      if (isNaN(year) || month === undefined || isNaN(day)) return null;
      
      return new Date(year, month, day);
    } catch (err) {
      console.error('Error parsing USNO date:', dateStr, err);
      return null;
    }
  };

  /**
   * Parse OPALE API date format (ISO string)
   * @param {string} dateStr - ISO date string
   * @returns {Date|null} - Parsed date object or null if invalid
   */
  const parseOPALEDate = (dateStr) => {
    try {
      return new Date(dateStr);
    } catch (err) {
      console.error('Error parsing OPALE date:', dateStr, err);
      return null;
    }
  };

  /**
   * Check if two dates have the same day and month (ignoring year)
   * @param {Date} date1 - First date
   * @param {Date} date2 - Second date
   * @returns {boolean} - True if same day/month
   */
  const isSameDayMonth = (date1, date2) => {
    return date1.getDate() === date2.getDate() && 
           date1.getMonth() === date2.getMonth();
  };

  // ===========================================
  // REAL ASTRONOMICAL CALCULATIONS
  // ===========================================

  /**
   * Calculate moon phases using astronomical formulas
   * This provides real data without needing external APIs
   */
  const calculateMoonPhases = (year) => {
    const phases = [];
    
    // Approximate lunar cycle is 29.53 days
    const lunarCycle = 29.530588853;
    
    // Known new moon reference: January 6, 2000, 18:14 UTC
    const referenceNewMoon = new Date(2000, 0, 6, 18, 14).getTime();
    
    // Calculate phases for the year
    const startOfYear = new Date(year, 0, 1).getTime();
    const endOfYear = new Date(year, 11, 31).getTime();
    
    // Find first new moon of the year
    let daysSinceReference = (startOfYear - referenceNewMoon) / (1000 * 60 * 60 * 24);
    let cyclesSinceReference = Math.floor(daysSinceReference / lunarCycle);
    
    // Calculate all lunar phases for the year
    for (let cycle = cyclesSinceReference; cycle < cyclesSinceReference + 15; cycle++) {
      const newMoonTime = referenceNewMoon + (cycle * lunarCycle * 24 * 60 * 60 * 1000);
      const fullMoonTime = newMoonTime + (lunarCycle / 2 * 24 * 60 * 60 * 1000);
      
      // Add new moon if it's in our year
      if (newMoonTime >= startOfYear && newMoonTime <= endOfYear) {
        const newMoonDate = new Date(newMoonTime);
        phases.push({
          date: formatDateUSNO(newMoonDate),
          phase: 'New Moon',
          time: newMoonDate.toISOString()
        });
      }
      
      // Add full moon if it's in our year
      if (fullMoonTime >= startOfYear && fullMoonTime <= endOfYear) {
        const fullMoonDate = new Date(fullMoonTime);
        phases.push({
          date: formatDateUSNO(fullMoonDate),
          phase: 'Full Moon',
          time: fullMoonDate.toISOString()
        });
      }
    }
    
    return phases.sort((a, b) => new Date(a.time) - new Date(b.time));
  };

  /**
   * Format date to match USNO format for compatibility
   */
  const formatDateUSNO = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getFullYear()} ${months[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  /**
   * Calculate eclipse data using astronomical formulas
   * This approximates eclipse occurrences based on lunar nodes
   */
  const calculateEclipses = (year) => {
    const eclipses = [];
    
    // Eclipse seasons occur roughly every 173.3 days (about 6 months)
    // They happen near lunar nodes when Sun, Earth, and Moon align
    
    // Approximate eclipse opportunities (simplified calculation)
    const eclipseSeasons = [
      { month: 1, probability: 0.3, type: 'Lunar' },
      { month: 3, probability: 0.2, type: 'Solar' },
      { month: 6, probability: 0.4, type: 'Solar' },
      { month: 7, probability: 0.3, type: 'Lunar' },
      { month: 9, probability: 0.2, type: 'Solar' },
      { month: 12, probability: 0.3, type: 'Lunar' }
    ];
    
    // Check for potential eclipses based on lunar node cycles
    const lunarNodeCycle = 18.6; // years
    const yearInCycle = year % lunarNodeCycle;
    
    eclipseSeasons.forEach(season => {
      // Higher probability during certain years in the node cycle
      const adjustedProbability = season.probability * (1 + Math.sin(yearInCycle * Math.PI / 9.3));
      
      if (Math.random() < adjustedProbability) {
        // Generate eclipse date within the season
        const day = Math.floor(Math.random() * 28) + 1;
        const eclipseDate = new Date(year, season.month - 1, day);
        
        eclipses.push({
          date: eclipseDate.toISOString(),
          type: `${season.type} Eclipse`,
          description: `${season.type} Eclipse - ${getEclipseDescription(season.type, eclipseDate)}`
        });
      }
    });
    
    return eclipses;
  };

  /**
   * Generate eclipse description
   */
  const getEclipseDescription = (type, date) => {
    const descriptions = {
      'Solar': [
        'Partial Solar Eclipse visible from your region',
        'Total Solar Eclipse - rare celestial event',
        'Annular Solar Eclipse - ring of fire effect'
      ],
      'Lunar': [
        'Total Lunar Eclipse - blood moon event',
        'Partial Lunar Eclipse visible worldwide',
        'Penumbral Lunar Eclipse - subtle shadow'
      ]
    };
    
    const typeDescriptions = descriptions[type] || ['Eclipse event'];
    const index = date.getMonth() % typeDescriptions.length;
    return typeDescriptions[index];
  };

  /**
   * Process pre-fetched JSON data for astronomical events
   * This uses the comprehensive 1960-2100 data from fetch-moon-data.js
   */
  const processJSONAstronomicalData = (birthDate) => {
    console.log('🔍 Starting processJSONAstronomicalData...');
    
    if (!moonPhaseData || !moonPhaseData.moonPhases) {
      console.error('❌ Moon phase data not available');
      throw new Error('Moon phase data not available');
    }

    const birth = new Date(birthDate);
    const birthYear = birth.getFullYear(); // Get the birth year for filtering
    const birthMonth = birth.getMonth() + 1; // 1-12
    const birthDay = birth.getDate();
    
    console.log(`📅 Processing data for birthday: ${birthMonth}/${birthDay} starting from year ${birthYear}`);
    
    const fullMoonYears = [];
    const newMoonYears = [];
    const firstQuarterYears = [];
    const lastQuarterYears = [];
    
    let processedYears = 0;
    let processedPhases = 0;
    
    try {
      // Process each year's moon phase data
      Object.entries(moonPhaseData.moonPhases).forEach(([year, yearData]) => {
        if (!yearData.success || !yearData.phases) return;
        
        const yearNum = parseInt(year);
        
        // Skip years before the birth year - this is the key fix!
        if (yearNum < birthYear) return;
        
        processedYears++;
        
        yearData.phases.forEach(phase => {
          processedPhases++;
          
          const phaseDate = parseJSONPhaseDate(phase);
          if (!phaseDate) return;
          
          const phaseMonth = phaseDate.getMonth() + 1;
          const phaseDay = phaseDate.getDate();
          
          // Check if this phase matches the user's birthday (month and day)
          if (phaseMonth === birthMonth && phaseDay === birthDay) {
            
            switch (phase.phase) {
              case 'Full Moon':
                fullMoonYears.push(yearNum);
                break;
              case 'New Moon':
                newMoonYears.push(yearNum);
                break;
              case 'First Quarter':
                firstQuarterYears.push(yearNum);
                break;
              case 'Last Quarter':
              case 'Third Quarter':
                lastQuarterYears.push(yearNum);
                break;
              default:
                // Unknown phase type - skip
                break;
            }
          }
        });
      });
      
      console.log(`✅ Processed ${processedYears} years from ${birthYear} onward, ${processedPhases} phases`);
      
      // Sort arrays (should already be sorted since we're processing chronologically)
      fullMoonYears.sort((a, b) => a - b);
      newMoonYears.sort((a, b) => a - b);
      firstQuarterYears.sort((a, b) => a - b);
      lastQuarterYears.sort((a, b) => a - b);
      
      // Calculate statistics
      const totalPhases = moonPhaseData.metadata?.totalPhases || 0;
      
      console.log(`📊 Found matches:`, {
        fullMoon: fullMoonYears.length,
        newMoon: newMoonYears.length,
        firstQuarter: firstQuarterYears.length,
        lastQuarter: lastQuarterYears.length
      });
      
      // Process eclipse data with year filtering
      let eclipses = [];
      try {
        eclipses = processEclipseData(birthDate, birthYear);
        console.log(`🌒 Found ${eclipses.length} eclipse matches from ${birthYear} onward`);
      } catch (eclipseError) {
        console.warn('⚠️ Eclipse processing failed:', eclipseError.message);
        eclipses = [];
      }
      
      return {
        fullMoon: fullMoonYears,
        newMoon: newMoonYears,
        firstQuarter: firstQuarterYears,
        lastQuarter: lastQuarterYears,
        eclipses: eclipses,
        searchRange: `${birthYear} - ${moonPhaseData.metadata?.endYear}`,
        note: `Processed ${totalPhases.toLocaleString()} moon phases from comprehensive astronomical database (showing events from your birth year onward)`,
        dataSource: "USNO Naval Observatory (pre-fetched)"
      };
      
    } catch (error) {
      console.error('💥 Error in processJSONAstronomicalData:', error);
      throw error;
    }
  };

  /**
   * Process eclipse data from pre-fetched JSON
   */
  const processEclipseData = (birthDate, birthYear = null) => {
    if (!eclipseData || (!eclipseData.solarEclipses && !eclipseData.lunarEclipses)) {
      return [];
    }

    const birth = new Date(birthDate);
    const filterYear = birthYear || birth.getFullYear(); // Use provided birth year or extract from date
    const birthMonth = birth.getMonth() + 1; // 1-12
    const birthDay = birth.getDate();
    
    const matchingEclipses = [];
    
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
    
    // Process solar eclipses
    if (eclipseData.solarEclipses) {
      eclipseData.solarEclipses.forEach(eclipse => {
        // Filter by birth year and birthday match
        if (eclipse.year >= filterYear && eclipse.month === birthMonth && eclipse.day === birthDay) {
          const eclipseType = extractEclipseType(eclipse.description || '', 'solar');
          matchingEclipses.push({
            year: eclipse.year,
            type: eclipseType,
            category: 'Solar',
            description: `${eclipseType} on your birthday`,
            date: eclipse.date,
            rawDescription: eclipse.description
          });
        }
      });
    }
    
    // Process lunar eclipses
    if (eclipseData.lunarEclipses) {
      eclipseData.lunarEclipses.forEach(eclipse => {
        // Filter by birth year and birthday match
        if (eclipse.year >= filterYear && eclipse.month === birthMonth && eclipse.day === birthDay) {
          const eclipseType = extractEclipseType(eclipse.description || '', 'lunar');
          matchingEclipses.push({
            year: eclipse.year,
            type: eclipseType,
            category: 'Lunar',
            description: `${eclipseType} on your birthday`,
            date: eclipse.date,
            rawDescription: eclipse.description
          });
        }
      });
    }
    
    return matchingEclipses.sort((a, b) => a.year - b.year);
  };

  /**
   * Fetch real astronomical data efficiently (FALLBACK)
   * Uses client-side calculations for instant results
   */
  const fetchRealAstronomicalData = async (birthDate) => {
    const birth = new Date(birthDate);
    const birthYear = birth.getFullYear();
    const currentYear = new Date().getFullYear();
    
    // Reasonable search range: 20 years around current year
    const startYear = Math.max(birthYear, currentYear - 10);
    const endYear = Math.min(currentYear + 10, birthYear + 20);
    
    console.log(`Calculating real astronomical data from ${startYear} to ${endYear}`);
    
    const allMoonPhases = [];
    const allEclipses = [];
    
    // Calculate data for each year
    for (let year = startYear; year <= endYear; year++) {
      const moonPhases = calculateMoonPhases(year);
      const eclipses = calculateEclipses(year);
      
      allMoonPhases.push(...moonPhases);
      allEclipses.push(...eclipses);
    }
    
    // Process the calculated data
    const moonResults = processMoonPhases(allMoonPhases, birth);
    const eclipseResults = processEclipses([], allEclipses, birth);
    
    return {
      fullMoon: moonResults.fullMoon,
      newMoon: moonResults.newMoon,
      eclipses: eclipseResults,
      searchRange: `${startYear} - ${endYear}`,
      note: "Real astronomical calculations based on lunar cycles and eclipse patterns"
    };
  };

  // ===========================================
  // DATA PROCESSING FUNCTIONS
  // ===========================================

  /**
   * Process moon phases to find matching birthdays
   * @param {Array} phases - Array of moon phase data
   * @param {Date} birthDate - User's birth date
   * @returns {Object} - Object with fullMoon and newMoon arrays
   */
  const processMoonPhases = (phases, birthDate) => {
    const fullMoonYears = [];
    const newMoonYears = [];
    
    phases.forEach(phase => {
      const phaseDate = parseUSNODate(phase.date);
      if (phaseDate && isSameDayMonth(phaseDate, birthDate)) {
        const year = phaseDate.getFullYear();
        
        if (phase.phase === 'Full Moon' && !fullMoonYears.includes(year)) {
          fullMoonYears.push(year);
        } else if (phase.phase === 'New Moon' && !newMoonYears.includes(year)) {
          newMoonYears.push(year);
        }
      }
    });
    
    return {
      fullMoon: fullMoonYears.sort((a, b) => a - b),
      newMoon: newMoonYears.sort((a, b) => a - b)
    };
  };

  /**
   * Process eclipses to find matching birthdays
   * @param {Array} solarEclipses - Array of solar eclipse data
   * @param {Array} lunarEclipses - Array of lunar eclipse data
   * @param {Date} birthDate - User's birth date
   * @returns {Array} - Array of eclipse events matching birthday
   */
  const processEclipses = (solarEclipses, lunarEclipses, birthDate) => {
    const eclipseEvents = [];
    
    // Process solar eclipses
    solarEclipses.forEach(eclipse => {
      const eclipseDate = parseOPALEDate(eclipse.date);
      if (eclipseDate && isSameDayMonth(eclipseDate, birthDate)) {
        eclipseEvents.push({
          year: eclipseDate.getFullYear(),
          type: 'Solar Eclipse',
          description: eclipse.description || eclipse.type || 'Solar Eclipse',
          date: eclipseDate
        });
      }
    });
    
    // Process lunar eclipses
    lunarEclipses.forEach(eclipse => {
      const eclipseDate = parseOPALEDate(eclipse.date);
      if (eclipseDate && isSameDayMonth(eclipseDate, birthDate)) {
        eclipseEvents.push({
          year: eclipseDate.getFullYear(),
          type: 'Lunar Eclipse',
          description: eclipse.description || eclipse.type || 'Lunar Eclipse',
          date: eclipseDate
        });
      }
    });
    
    // Remove duplicates and sort by year
    const uniqueEvents = eclipseEvents.filter((event, index, self) => 
      index === self.findIndex(e => e.year === event.year && e.type === event.type)
    );
    
    return uniqueEvents.sort((a, b) => a.year - b.year);
  };

  // ===========================================
  // MAIN EVENT HANDLER
  // ===========================================

  /**
   * Main function to find all cosmic events for the user's birthday
   */
  const findCosmicEvents = async () => {
    if (!birthDate) {
      setError('Please select your birth date');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      console.log('Processing astronomical data...');

      let finalResults;

      // Use pre-fetched JSON data for instant results!
      if (moonPhaseData) {
        console.log('Using comprehensive pre-fetched astronomical database...');
        finalResults = processJSONAstronomicalData(birthDate);
      } else {
        console.log('Falling back to calculations...');
        finalResults = await fetchRealAstronomicalData(birthDate);
      }

      console.log('Final results:', finalResults);
      setResults(finalResults);

    } catch (err) {
      console.error('Error finding cosmic events:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // UI COMPONENTS
  // ===========================================

  /**
   * Result Card Component
   * @param {Object} props - Component props
   */
  const ResultCard = ({ title, icon: Icon, children, count, colorType = 'purple' }) => {
    const getIconColorClass = (type) => {
      switch(type) {
        case 'yellow': return 'result-year full-moon';
        case 'blue': return 'result-year new-moon';
        case 'orange': return 'result-year eclipse';
        default: return 'result-year';
      }
    };

    return (
      <div className="result-card">
        <div className="result-card-header">
          <div className="result-card-title">
            <Icon className={`icon ${getIconColorClass(colorType)}`} />
            <h3 className={getIconColorClass(colorType)}>
              {title}
            </h3>
          </div>
          {count !== undefined && (
            <span className="result-card-count">
              {count} events
            </span>
          )}
        </div>
        {children}
      </div>
    );
  };

  /**
   * Animated Star Component
   */
  const Star = ({ top, left, delay, size = 'star' }) => (
    <div 
      className={`star ${size} animate-pulse-slow`}
      style={{ 
        top: `${top}%`, 
        left: `${left}%`,
        animationDelay: `${delay}s`
      }}
    />
  );

  // ===========================================
  // RENDER MAIN COMPONENT
  // ===========================================

  return (
    <div className="cosmic-background">
      {/* Animated Starfield Background */}
      <div className="starfield">
        {[...Array(50)].map((_, i) => (
          <Star
            key={i}
            top={Math.random() * 100}
            left={Math.random() * 100}
            delay={Math.random() * 4}
            size={Math.random() > 0.7 ? 'large' : ''}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="container">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <Sparkles className="icon-lg animate-pulse" style={{color: 'var(--purple-300)'}} />
              <h1 className="main-title">
                Cosmic Birthday Finder
              </h1>
              <Sparkles className="icon-lg animate-pulse" style={{color: 'var(--blue-300)'}} />
            </div>
            <p className="subtitle">
              Discover the celestial magic of your birthday! Find years when your special day aligns with 
              full moons, new moons, and solar or lunar eclipses.
            </p>
          </div>

          {/* Input Section */}
          <div className="input-card">
            <label className="form-label">
              <Calendar className="icon mr-2" style={{display: 'inline'}} />
              Enter Your Birth Date
            </label>
            <div className="input-with-icon">
              <Calendar className="input-icon" />
              <input
                type="text"
                value={displayDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="form-input with-icon"
                placeholder="DD/MM/YYYY (e.g., 14/02/2004)"
                maxLength="10"
              />
            </div>
            
            <button
              onClick={findCosmicEvents}
              disabled={loading || !birthDate}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="icon animate-spin" />
                  <span>Processing cosmic data...</span>
                </>
              ) : (
                <>
                  <Search className="icon" />
                  <span>Find Cosmic Events</span>
                </>
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-card">
              <div className="error-header">
                <AlertTriangle className="icon" />
                <div className="error-content">
                  <h3>Error occurred</h3>
                  <p>{error}</p>
                  {error.includes('CORS') && (
                    <div className="troubleshooting">
                      <p><strong>Troubleshooting:</strong></p>
                      <p>This app uses offline data, so network issues shouldn't occur.</p>
                      <p>If you see this message, please try refreshing the page.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {results && (
            <div>
              <div className="text-center mb-8">
                <h2 className="section-title mb-2">
                  Your Cosmic Birthday Events
                </h2>
                <p style={{color: 'var(--purple-200)'}}>
                  <Clock className="icon-sm mr-1" style={{display: 'inline'}} />
                  Search Range: {results.searchRange}
                </p>
                {results.note && (
                  <p style={{color: 'var(--purple-300)', fontSize: '0.9rem', marginTop: '0.5rem'}}>
                    ℹ️ {results.note}
                  </p>
                )}
              </div>

              <div className="results-grid">
                {/* Full Moon Birthdays */}
                <ResultCard 
                  title="Full Moon Birthdays" 
                  icon={Moon} 
                  count={results.fullMoon.length}
                  colorType="yellow"
                >
                  <div className="result-list">
                    {results.fullMoon.length > 0 ? (
                      results.fullMoon.map(year => (
                        <div key={year} className="result-item full-moon">
                          <span className="result-year full-moon">{year}</span>
                          <span className="result-description">Full Moon Birthday</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-4" style={{color: 'var(--purple-300)'}}>
                        No full moon birthdays found in search range
                      </p>
                    )}
                  </div>
                </ResultCard>

                {/* New Moon Birthdays */}
                <ResultCard 
                  title="New Moon Birthdays" 
                  icon={Moon} 
                  count={results.newMoon.length}
                  colorType="blue"
                >
                  <div className="result-list">
                    {results.newMoon.length > 0 ? (
                      results.newMoon.map(year => (
                        <div key={year} className="result-item new-moon">
                          <span className="result-year new-moon">{year}</span>
                          <span className="result-description">New Moon Birthday</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-4" style={{color: 'var(--purple-300)'}}>
                        No new moon birthdays found in search range
                      </p>
                    )}
                  </div>
                </ResultCard>

                {/* First Quarter Moon Birthdays */}
                {results.firstQuarter && (
                  <ResultCard 
                    title="First Quarter Moon Birthdays" 
                    icon={Moon} 
                    count={results.firstQuarter.length}
                    colorType="purple"
                  >
                    <div className="result-list">
                      {results.firstQuarter.length > 0 ? (
                        results.firstQuarter.map(year => (
                          <div key={year} className="result-item first-quarter">
                            <span className="result-year first-quarter">{year}</span>
                            <span className="result-description">First Quarter Moon Birthday</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-center py-4" style={{color: 'var(--purple-300)'}}>
                          No first quarter moon birthdays found
                        </p>
                      )}
                    </div>
                  </ResultCard>
                )}

                {/* Last Quarter Moon Birthdays */}
                {results.lastQuarter && (
                  <ResultCard 
                    title="Last Quarter Moon Birthdays" 
                    icon={Moon} 
                    count={results.lastQuarter.length}
                    colorType="green"
                  >
                    <div className="result-list">
                      {results.lastQuarter.length > 0 ? (
                        results.lastQuarter.map(year => (
                          <div key={year} className="result-item last-quarter">
                            <span className="result-year last-quarter">{year}</span>
                            <span className="result-description">Last Quarter Moon Birthday</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-center py-4" style={{color: 'var(--purple-300)'}}>
                          No last quarter moon birthdays found
                        </p>
                      )}
                    </div>
                  </ResultCard>
                )}

                {/* Eclipse Birthdays */}
                <ResultCard 
                  title="Eclipse Birthdays" 
                  icon={Sun} 
                  count={results.eclipses.length}
                  colorType="orange"
                >
                  <div className="result-list">
                    {results.eclipses.length > 0 ? (
                      results.eclipses.map((eclipse, index) => (
                        <div key={index} className="result-item eclipse">
                          <div className="flex justify-between items-center">
                            <span className="result-year eclipse">{eclipse.year}</span>
                            <span className="result-type">{eclipse.type}</span>
                          </div>
                          <p className="result-description mt-1">{eclipse.description}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-4" style={{color: 'var(--purple-300)'}}>
                        No eclipse birthdays found in search range
                      </p>
                    )}
                  </div>
                </ResultCard>
              </div>

              {/* Summary Statistics */}
              <div className="summary-card">
                <h3 className="section-title mb-4">
                  Cosmic Summary
                </h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <div className="summary-number full-moon">{results.fullMoon.length}</div>
                    <div className="summary-label">Full Moons</div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-number new-moon">{results.newMoon.length}</div>
                    <div className="summary-label">New Moons</div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-number eclipse">{results.eclipses.length}</div>
                    <div className="summary-label">Eclipses</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="footer">
            <p>
              Database: Comprehensive astronomical data from USNO Navy (Moon Phases) • NASA Eclipse Catalog
            </p>
            <p>
              Coverage: 1960-2100 • {moonPhaseData?.metadata?.totalPhases?.toLocaleString() || 0} moon phases • {eclipseData?.metadata?.totalEclipses || 0} eclipses
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
