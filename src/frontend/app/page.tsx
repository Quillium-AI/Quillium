import React, { useState } from 'react';
import Link from 'next/link';

// Simplified icons as components
const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" />
    <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const BookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 19.5C4 20.163 4.26339 20.7989 4.73223 21.2678C5.20107 21.7366 5.83696 22 6.5 22H20" stroke="currentColor" strokeWidth="2" />
    <path d="M6.5 2H20V22" stroke="currentColor" strokeWidth="2" />
    <path d="M6.5 17H20" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" />
    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
    <path d="M12 2V4" stroke="currentColor" strokeWidth="2" />
    <path d="M12 20V22" stroke="currentColor" strokeWidth="2" />
    <path d="M4.22 4.22L5.64 5.64" stroke="currentColor" strokeWidth="2" />
    <path d="M18.36 18.36L19.78 19.78" stroke="currentColor" strokeWidth="2" />
    <path d="M2 12H4" stroke="currentColor" strokeWidth="2" />
    <path d="M20 12H22" stroke="currentColor" strokeWidth="2" />
    <path d="M4.22 19.78L5.64 18.36" stroke="currentColor" strokeWidth="2" />
    <path d="M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 12.79C20.8427 14.4922 20.2039 16.1144 19.1582 17.4668C18.1126 18.8192 16.7035 19.8458 15.0957 20.4265C13.4879 21.0073 11.7478 21.1181 10.0794 20.7461C8.41102 20.3741 6.8802 19.5345 5.67423 18.3285C4.46826 17.1226 3.62864 15.5917 3.25668 13.9233C2.88472 12.2549 2.99552 10.5148 3.57625 8.90704C4.15698 7.29926 5.18362 5.8901 6.53604 4.84451C7.88845 3.79892 9.51068 3.16008 11.213 3C10.2135 4.34827 9.73454 6.00945 9.85843 7.68141C9.98231 9.35338 10.7009 10.9251 11.8922 12.1164C13.0834 13.3076 14.6551 14.0262 16.3271 14.1501C17.9991 14.274 19.6602 13.795 21.009 12.7955" stroke="currentColor" strokeWidth="2" />
  </svg>
);

// Small quick actions, placeholder since didn't know what to fit in empty space
const quickActions = [
  { 
    id: 'weather',
    icon: '⛅',
    title: '6°C',
    subtitle: 'Zurich' 
  },
  { 
    id: 'sunny',
    icon: '☀️',
    title: 'Sunny',
    subtitle: 'Hi 8° Lo 1°' 
  },
  { 
    id: 'teams',
    icon: '👥',
    title: 'Sports',
    subtitle: 'Choose your teams' 
  }
];

// Footer quick links, adjustable to our github users or social media accounts
const footerLinks = [
  'Pro', 'Company', 'API', 'Blog', 'Careers', 'Business', 'Finance'
];

const HomePage = () => {
  const [query, setQuery] = useState('');
  const [deepResearch, setDeepResearch] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Toggle dark mode - intentionally missing implementation
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  }

  // Form handler with a really simple implementation
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Searching for:', query, 'Deep research:', deepResearch);
    // No actual search thing implemented, will be added with the logic
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
      {/* Sidebar */}
      <div className={`w-64 border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex flex-col`}>
        {/* Logo */}
        <div className="p-4 flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-purple-600 flex items-center justify-center text-white font-bold">Q</div>
          <span className="text-2xl font-semibold text-purple-700">quillium</span>
        </div>
        
        {/* Search input */}
        <div className="px-4 py-2">
          <div className="relative">
            <input 
              type="text" 
              placeholder="New..." 
              className={`w-full pl-8 pr-4 py-2 rounded-md ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} focus:ring-2 focus:ring-purple-500`}
            />
            <div className="absolute left-2 top-3 text-gray-400">
              <SearchIcon />
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2 flex items-center">
            <span className="mr-1">Ctrl</span>
            <span className={`px-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded`}>P</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="mt-6 flex-1">
          <Link href="/" className={`flex items-center px-4 py-3 ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-purple-50'} hover:text-purple-700`}>
            <div className="mr-3">
              <HomeIcon />
            </div>
            <span>Home</span>
          </Link>
          
          <Link href="/library" className={`flex items-center px-4 py-3 ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-purple-50'} hover:text-purple-700`}>
            <div className="mr-3">
              <BookIcon />
            </div>
            <span>Library</span>
          </Link>
        </nav>
        
        {/* Pro upgrade */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} p-3 rounded-lg`}>
            <div className="text-sm font-medium">Try Pro</div>
            <div className="text-xs text-gray-500 mt-1">
              Upgrade to more powerful AI models, increased limits, and more advanced responses.
            </div>
            <button className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md text-sm">
              Learn more
            </button>
          </div>
        </div>
        
        {/* User */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center`}>
          <div className={`h-8 w-8 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} flex items-center justify-center`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" />
              <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <span className="ml-2 text-sm font-medium">..wird denne de user</span>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        {/* Theme toggle buttonfor darkmode*/}
        <button 
          onClick={toggleDarkMode}
          className={`absolute top-4 right-4 p-2 rounded-full ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          {darkMode ? <SunIcon /> : <MoonIcon />}
        </button>
        
        <div className="w-full max-w-2xl">
          <h1 className={`text-4xl font-bold text-center mb-12 ${darkMode ? 'text-purple-400' : 'text-purple-800'}`}>
            What do you wanna know?
          </h1>
          
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <input 
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask your question..."
                className={`w-full p-4 pl-5 pr-16 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'} focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm`}
              />
              <button 
                type="submit"
                className="absolute right-3 top-3 p-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
              >
                <SearchIcon />
              </button>
            </div>
            
            <div className="flex items-center mt-3 gap-3">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setDeepResearch(!deepResearch)}
                  className={`px-3 py-1.5 rounded-lg flex items-center ${
                    deepResearch 
                      ? `${darkMode ? 'bg-purple-900 text-purple-200 border-purple-700' : 'bg-purple-100 text-purple-800 border-purple-300'} border` 
                      : `${darkMode ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-700 border-gray-300'} border`
                  }`}
                >
                  {deepResearch && <span className="mr-2 text-xs">✓</span>}
                  <span>Deep Research</span>
                </button>
              </div>
              
              <div className="flex ml-auto space-x-3">
                <button type="button" className={`p-2 rounded-full text-gray-500 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 8V16" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 12H16" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </button>
                <button type="button" className={`p-2 rounded-full text-gray-500 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 8V16" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 12H16" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </button>
              </div>
            </div>
          </form>
          
          {/* Quick action cards */}
          <div className="grid grid-cols-3 gap-4 mt-12">
            {quickActions.map(action => (
              <div 
                key={action.id} 
                className={`p-4 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} hover:shadow-md transition-shadow cursor-pointer`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xl ${
                    action.id === 'weather' ? 'bg-blue-100 text-blue-500' : 
                    action.id === 'sunny' ? 'bg-yellow-100 text-yellow-500' : 
                    'bg-green-100 text-green-500'
                  }`}>
                    {action.icon}
                  </div>
                  <div className="text-sm font-medium">{action.title}</div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{action.subtitle}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="absolute bottom-4 flex gap-4 text-sm text-gray-500">
          {footerLinks.map(link => (
            <Link key={link} href={`/${link.toLowerCase()}`} className="hover:text-purple-600">
              {link}
            </Link>
          ))}
          <div className="flex items-center">
            <span>English - US</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1">
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;