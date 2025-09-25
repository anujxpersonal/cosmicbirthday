# 🌟 Cosmic Birthday Finder

A beautiful React application that discovers celestial events matching your birthday! Find years when your special day aligns with full moons, new moons, and solar or lunar eclipses.

![Cosmic Birthday Finder](https://img.shields.io/badge/React-19.1.1-61DAFB?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.13-38B2AC?style=for-the-badge&logo=tailwind-css)
![Lucide React](https://img.shields.io/badge/Lucide_React-0.542.0-F56565?style=for-the-badge)

## ✨ Features

- 🌙 **Moon Phase Detection** - Find Full Moon and New Moon birthdays
- 🌘 **Eclipse Events** - Discover Solar and Lunar eclipse birthdays  
- 🎨 **Cosmic UI** - Beautiful space-themed design with animated starfield
- 📱 **Mobile Responsive** - Optimized for all device sizes
- 🔍 **Real API Data** - Live data from USNO Navy and OPALE IMCCE
- ⚡ **Performance Optimized** - Rate limiting and efficient data processing
- 🛡️ **Error Handling** - Comprehensive error messages and fallbacks

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone or download this project**
```bash
cd cosmic-birthday-finder
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the CORS proxy** (Required for API access)
```bash
# In a new terminal window
node cors-proxy.js
```
The proxy will start on `http://localhost:8080`

4. **Start the React development server**
```bash
# In another terminal window
npm start
```
The app will open at `http://localhost:3000`

## 🌐 API Information

This app fetches real astronomical data from:

- **USNO Navy API** - Moon phases data
- **OPALE IMCCE API** - Solar and lunar eclipse data

### CORS Proxy Setup

Due to browser CORS restrictions, you need to run the included CORS proxy:

```bash
node cors-proxy.js
```

**Alternative CORS proxy options:**
```bash
# Option 1: Use cors-anywhere (install globally)
npm install -g cors-anywhere
cors-anywhere

# Option 2: Use the included custom proxy (recommended)
node cors-proxy.js
```

## 🎯 How It Works

1. **Enter your birth date** using the date picker
2. **Click "Find Cosmic Events"** to search for celestial alignments
3. **View results** in three categories:
   - 🌕 **Full Moon Birthdays** - Years when your birthday falls on a full moon
   - 🌑 **New Moon Birthdays** - Years when your birthday falls on a new moon  
   - 🌒 **Eclipse Birthdays** - Years when solar or lunar eclipses occur on your birthday

## 🛠️ Technical Details

### Architecture
- **Frontend**: React 19 with modern hooks
- **Styling**: Tailwind CSS with custom cosmic theme
- **Icons**: Lucide React icon library
- **APIs**: USNO Navy (moon phases) + OPALE IMCCE (eclipses)

### Key Features
- Rate limiting (500ms delay between API calls)
- Date parsing for multiple API formats
- Duplicate removal and chronological sorting
- Mobile-responsive glass-morphism design
- Animated starfield background
- Comprehensive error handling

### Performance Optimizations
- Limited search range (birth year + 50 years max)
- Parallel API requests where possible
- Efficient data processing algorithms
- Lazy loading and optimized rendering

## 📁 Project Structure

```
cosmic-birthday-finder/
├── public/
│   ├── index.html          # Updated with cosmic theme
│   └── ...
├── src/
│   ├── App.js              # Main application component
│   ├── index.js            # React entry point  
│   ├── index.css           # Tailwind CSS imports
│   └── ...
├── cors-proxy.js           # Custom CORS proxy server
├── tailwind.config.js      # Tailwind configuration
├── postcss.config.js       # PostCSS configuration
└── package.json            # Dependencies and scripts
```

## 🎨 Customization

### Color Themes
Edit the gradient colors in `src/App.js`:
```javascript
const colorClasses = {
  purple: 'from-purple-400 to-pink-400 border-purple-500/20',
  blue: 'from-blue-400 to-cyan-400 border-blue-500/20',
  orange: 'from-orange-400 to-red-400 border-orange-500/20',
  yellow: 'from-yellow-400 to-orange-400 border-yellow-500/20'
};
```

### Search Range
Modify the search range in the `findCosmicEvents` function:
```javascript
// Current: birth year + 50 years
const endYear = Math.min(birthYear + 50, 2100);

// Extended range (may increase load times):
const endYear = Math.min(birthYear + 100, 2100);
```

## 🐛 Troubleshooting

### CORS Proxy Issues
- Ensure the proxy is running on port 8080
- Check that no other applications are using port 8080
- Try restarting the proxy server

### API Rate Limiting
- The app includes 500ms delays between requests
- If you encounter rate limiting, try reducing the search range

### Build Issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Ensure you're using a compatible Node.js version (v14+)

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

## 🌟 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- **USNO Navy** for moon phase data
- **OPALE IMCCE** for eclipse data  
- **Lucide** for beautiful icons
- **Tailwind CSS** for styling framework

---

**Made with ❤️ and ✨ cosmic energy**

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
