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

/**
 * COSMIC BIRTHDAY FINDER
 * A React application that finds celestial events matching a user's birthday
 * Features: Moon phases, Solar eclipses, Lunar eclipses
 * APIs: USNO Navy (moon phases), OPALE IMCCE (eclipses)
 */

function App() {
  // State management
  const [birthDate, setBirthDate] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ===========================================
  // DATE PARSING HELPER FUNCTIONS
  // ===========================================

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
  // API FUNCTIONS WITH CORS PROXY
  // ===========================================

  /**
   * Fetch moon phases for a specific date range
   * @param {number} year - Year to fetch phases for
   * @returns {Promise<Array>} - Array of moon phase objects
   */
  const fetchMoonPhases = async (year) => {
    try {
      const startDate = `${year}-01-01`;
      const corsProxyUrl = `http://localhost:8080/https://aa.usno.navy.mil/api/moon/phases/date?date=${startDate}&nump=1000`;
      
      console.log(`Fetching moon phases for ${year}...`);
      const response = await fetch(corsProxyUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Moon phases data for ${year}:`, data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data.phasedata || [];
    } catch (err) {
      console.error(`Error fetching moon phases for ${year}:`, err);
      throw err;
    }
  };

  /**
   * Fetch solar eclipses for a specific year
   * @param {number} year - Year to fetch eclipses for
   * @returns {Promise<Array>} - Array of solar eclipse objects
   */
  const fetchSolarEclipses = async (year) => {
    try {
      const corsProxyUrl = `http://localhost:8080/https://opale.imcce.fr/api/v1/phenomena/eclipses/10/${year}`;
      
      console.log(`Fetching solar eclipses for ${year}...`);
      const response = await fetch(corsProxyUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Solar eclipses data for ${year}:`, data);
      
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error(`Error fetching solar eclipses for ${year}:`, err);
      throw err;
    }
  };

  /**
   * Fetch lunar eclipses for a specific year
   * @param {number} year - Year to fetch eclipses for
   * @returns {Promise<Array>} - Array of lunar eclipse objects
   */
  const fetchLunarEclipses = async (year) => {
    try {
      const corsProxyUrl = `http://localhost:8080/https://opale.imcce.fr/api/v1/phenomena/eclipses/301/${year}`;
      
      console.log(`Fetching lunar eclipses for ${year}...`);
      const response = await fetch(corsProxyUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Lunar eclipses data for ${year}:`, data);
      
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error(`Error fetching lunar eclipses for ${year}:`, err);
      throw err;
    }
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
      const birth = new Date(birthDate);
      const birthYear = birth.getFullYear();
      
      // Limit search range to prevent excessive API calls (birth year to birth year + 50)
      const endYear = Math.min(birthYear + 50, 2100);
      const yearRange = Math.max(1, endYear - birthYear);
      
      console.log(`Searching cosmic events from ${birthYear} to ${endYear} (${yearRange} years)`);

      // Initialize result arrays
      let allMoonPhases = [];
      let allSolarEclipses = [];
      let allLunarEclipses = [];

      // Fetch data for each year with rate limiting
      for (let year = birthYear; year <= endYear; year++) {
        try {
          console.log(`Processing year ${year}...`);
          
          // Fetch all data for this year with parallel requests
          const [moonPhases, solarEclipses, lunarEclipses] = await Promise.all([
            fetchMoonPhases(year),
            fetchSolarEclipses(year),
            fetchLunarEclipses(year)
          ]);
          
          allMoonPhases.push(...moonPhases);
          allSolarEclipses.push(...solarEclipses);
          allLunarEclipses.push(...lunarEclipses);
          
          // Rate limiting: 500ms delay between years
          if (year < endYear) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
        } catch (yearError) {
          console.warn(`Failed to fetch data for year ${year}:`, yearError);
          // Continue with next year instead of failing completely
        }
      }

      // Process all collected data
      const moonResults = processMoonPhases(allMoonPhases, birth);
      const eclipseResults = processEclipses(allSolarEclipses, allLunarEclipses, birth);

      const finalResults = {
        fullMoon: moonResults.fullMoon,
        newMoon: moonResults.newMoon,
        eclipses: eclipseResults,
        searchRange: `${birthYear} - ${endYear}`
      };

      console.log('Final results:', finalResults);
      setResults(finalResults);

    } catch (err) {
      console.error('Error finding cosmic events:', err);
      
      if (err.message.includes('fetch')) {
        setError('CORS Proxy Error: Please ensure the CORS proxy is running on localhost:8080. You can start it with: node cors-proxy.js');
      } else {
        setError(`Error: ${err.message}`);
      }
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
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="form-input"
              max="2024-12-31"
            />
            <button
              onClick={findCosmicEvents}
              disabled={loading || !birthDate}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="icon animate-spin" />
                  <span>Fetching from APIs...</span>
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
                      <p>1. Start the CORS proxy: <code>node cors-proxy.js</code></p>
                      <p>2. Proxy should run on port 8080</p>
                      <p>3. Make sure both the proxy and React app are running</p>
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
              Data sources: USNO Navy (Moon Phases) • OPALE IMCCE (Eclipses)
            </p>
            <p>
              Requires CORS proxy on localhost:8080 for API access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
