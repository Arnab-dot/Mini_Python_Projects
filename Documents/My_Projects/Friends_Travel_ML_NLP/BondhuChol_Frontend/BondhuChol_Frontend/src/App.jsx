import React, { useState, useEffect } from 'react';

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [token, setToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPreferenceForm, setShowPreferenceForm] = useState(false);

  // Register form state
  const [registerData, setRegisterData] = useState({
    username: '',
    password: ''
  });
  const [registerMessage, setRegisterMessage] = useState('');

  // Login form state
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [loginMessage, setLoginMessage] = useState('');

  // Create Group form state
  const [groupData, setGroupData] = useState({
    create_spid: ''
  });
  const [groupMessage, setGroupMessage] = useState('');

  // Join Group form state with MULTIPLE destinations
  const [joinData, setJoinData] = useState({
    create_spid: '',
    name: '',
    state: '',
    city: '',
    destinations: [{ type: '', description: '' }]
  });

  useEffect(() => {
    const storedToken = localStorage.getItem("access");
    if (storedToken) {
      setToken(storedToken);
      setIsLoggedIn(true);
    }
  }, []);

  const [joinMessage, setJoinMessage] = useState('');

  // Decision form state
  const [decisionSpid, setDecisionSpid] = useState('');
  const [decisionResult, setDecisionResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_BASE = 'http://localhost:8000/api';

  // Add destination field
  const addDestination = () => {
    setJoinData({
      ...joinData,
      destinations: [...joinData.destinations, { type: '', description: '' }]
    });
  };

  // Remove destination field
  const removeDestination = (index) => {
    const newDestinations = joinData.destinations.filter((_, i) => i !== index);
    setJoinData({
      ...joinData,
      destinations: newDestinations.length > 0 ? newDestinations : [{ type: '', description: '' }]
    });
  };

  // Update destination field
  const updateDestination = (index, field, value) => {
    const newDestinations = [...joinData.destinations];
    newDestinations[index][field] = value;
    setJoinData({
      ...joinData,
      destinations: newDestinations
    });
  };

  // Helper function for authenticated requests
  const makeAuthenticatedRequest = async (url, options = {}) => {
    let currentToken = token || localStorage.getItem("access");
    
    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (response.status === 401) {
      const refresh = localStorage.getItem("refresh");
      
      if (!refresh) {
        localStorage.clear();
        setToken(null);
        setIsLoggedIn(false);
        alert('Session expired. Please login again.');
        setCurrentPage('login');
        return null;
      }

      const refreshResponse = await fetch(`${API_BASE}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh })
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        localStorage.setItem("access", data.access);
        setToken(data.access);
        currentToken = data.access;

        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json',
          }
        });
      } else {
        localStorage.clear();
        setToken(null);
        setIsLoggedIn(false);
        alert('Session expired. Please login again.');
        setCurrentPage('login');
        return null;
      }
    }

    return response;
  };

  // Register Handler
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterMessage('');
    try {
      const response = await fetch(`${API_BASE}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });

      const data = await response.json();

      if (response.ok) {
        setRegisterMessage('Success: ' + data.message + ' - Please login now.');
        setRegisterData({ username: '', password: '' });
        setTimeout(() => setCurrentPage('login'), 2000);
      } else {
        setRegisterMessage('Error: ' + JSON.stringify(data));
      }
    } catch (error) {
      setRegisterMessage('Error: ' + error.message);
    }
  };

  // Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginMessage('');
    try {
      const response = await fetch(`${API_BASE}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        setToken(data.access);
        setIsLoggedIn(true);
        setLoginMessage('Login successful!');
        setLoginData({ username: '', password: '' });
        setTimeout(() => setCurrentPage('home'), 1000);
      } else {
        setLoginMessage('Error: ' + JSON.stringify(data));
      }
    } catch (error) {
      setLoginMessage('Error: ' + error.message);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setIsLoggedIn(false);
    setCurrentPage('home');
  };

  // Create Group Handler
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setGroupMessage('');
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE}/group/create/`, {
        method: 'POST',
        body: JSON.stringify(groupData)
      });

      if (!response) return;

      const data = await response.json();

      if (response.ok) {
        setGroupMessage(`Group created! SPID: ${data.sp_id}`);
        setGroupData({ create_spid: '' });
      } else {
        setGroupMessage('Error: ' + JSON.stringify(data));
      }
    } catch (error) {
      setGroupMessage('Error: ' + error.message);
    }
  };

  // Join Group Handler
  const handleJoinGroup = async (e) => {
    e.preventDefault();
    setJoinMessage('');
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE}/group/join/`, {
        method: 'POST',
        body: JSON.stringify(joinData)
      });

      if (!response) return;

      const data = await response.json();

      if (response.ok) {
        setJoinMessage('Success: ' + data.message);
        setJoinData({
          create_spid: '',
          name: '',
          state: '',
          city: '',
          destinations: [{ type: '', description: '' }]
        });
        setShowPreferenceForm(false);
      } else {
        setJoinMessage('Error: ' + JSON.stringify(data));
      }
    } catch (error) {
      setJoinMessage('Error: ' + error.message);
    }
  };

  // Get Decision Handler
  const handleGetDecision = async (e) => {
    e.preventDefault();
    setLoading(true);
    setDecisionResult(null);
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE}/group/${decisionSpid}/recommendation/`);

      if (!response) {
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setDecisionResult(data);
      } else {
        setDecisionResult({ error: JSON.stringify(data) });
      }
    } catch (error) {
      setDecisionResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-gray-900">BondhuChol</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8 items-center">
              <button onClick={() => setCurrentPage('home')} className="text-gray-700 hover:text-blue-600">Home</button>
              {!isLoggedIn ? (
                <>
                  <button onClick={() => setCurrentPage('register')} className="text-gray-700 hover:text-blue-600">Register</button>
                  <button onClick={() => setCurrentPage('login')} className="text-gray-700 hover:text-blue-600">Login</button>
                </>
              ) : (
                <>
                  <button onClick={() => setCurrentPage('create')} className="text-gray-700 hover:text-blue-600">Create Group</button>
                  <button onClick={() => setCurrentPage('join')} className="text-gray-700 hover:text-blue-600">Join Group</button>
                  <button onClick={() => setCurrentPage('decision')} className="text-gray-700 hover:text-blue-600">Get Decision</button>
                  <button onClick={handleLogout} className="text-red-600 hover:text-red-700">Logout</button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden">
              {isMenuOpen ? 'X' : 'Menu'}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button onClick={() => { setCurrentPage('home'); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50">Home</button>
              {!isLoggedIn ? (
                <>
                  <button onClick={() => { setCurrentPage('register'); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50">Register</button>
                  <button onClick={() => { setCurrentPage('login'); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50">Login</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setCurrentPage('create'); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50">Create Group</button>
                  <button onClick={() => { setCurrentPage('join'); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50">Join Group</button>
                  <button onClick={() => { setCurrentPage('decision'); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50">Get Decision</button>
                  <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50">Logout</button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="pt-16">
        {/* Home Page */}
        {currentPage === 'home' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Plan Your Perfect Group Trip with AI
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                We've all been there—sitting with friends, excited to plan a trip, only to end up stuck in endless debates because everyone wants something different. One person dreams of mountains, another insists on beaches, and someone else wants a city escape. Instead of excitement, confusion takes over and the plan often fades away. But travel should never feel like a compromise—it should feel like a celebration. That's why we've created a space where every preference finds its place and every voice feels heard, so you and your friends can finally agree on a destination that excites everyone. No fights, no stress—just pure joy, shared adventures, and memories that will stay with you forever.
              </p>
              <button
                onClick={() => setCurrentPage(isLoggedIn ? 'create' : 'register')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
              >
                {isLoggedIn ? 'Create a Group' : 'Get Started'}
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
                <h3 className="text-xl font-semibold mb-2">Create Groups</h3>
                <p className="text-gray-600">Easily create travel groups and invite your friends to join.</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
                <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
                <p className="text-gray-600">Advanced NLP algorithms analyze preferences to find the perfect match.</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
                <h3 className="text-xl font-semibold mb-2">Smart Decisions</h3>
                <p className="text-gray-600">Data-driven recommendations based on sentiment analysis.</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
                <h3 className="text-xl font-semibold mb-2">Discover Together</h3>
                <p className="text-gray-600">Find destinations everyone will love.</p>
              </div>
            </div>
          </div>
        )}

        {/* Register Page */}
        {currentPage === 'register' && (
          <div className="max-w-md mx-auto px-4 py-12">
            <div className="bg-white p-8 rounded-xl shadow-md">
              <h2 className="text-3xl font-bold mb-6 text-center">Register</h2>
              <form onSubmit={handleRegister} className="space-y-4">
                <input
                  type="text"
                  placeholder="Username"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={registerData.username}
                  onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Register
                </button>
              </form>
              {registerMessage && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm">
                  {registerMessage}
                </div>
              )}
              <p className="mt-4 text-center text-gray-600">
                Already have an account? <button onClick={() => setCurrentPage('login')} className="text-blue-600 hover:underline">Login here</button>
              </p>
            </div>
          </div>
        )}

        {/* Login Page */}
        {currentPage === 'login' && (
          <div className="max-w-md mx-auto px-4 py-12">
            <div className="bg-white p-8 rounded-xl shadow-md">
              <h2 className="text-3xl font-bold mb-6 text-center">Login</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="text"
                  placeholder="Username"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={loginData.username}
                  onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Login
                </button>
              </form>
              {loginMessage && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm">
                  {loginMessage}
                </div>
              )}
              <p className="mt-4 text-center text-gray-600">
                Don't have an account? <button onClick={() => setCurrentPage('register')} className="text-blue-600 hover:underline">Register here</button>
              </p>
            </div>
          </div>
        )}

        {/* Create Group Page */}
        {currentPage === 'create' && (
          <div className="max-w-md mx-auto px-4 py-12">
            <div className="bg-white p-8 rounded-xl shadow-md">
              <h2 className="text-3xl font-bold mb-6 text-center">Create Group</h2>
              <p className="text-gray-600 mb-6 text-center">Start a new travel planning group</p>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <input
                  type="text"
                  placeholder="Unique Group ID (SPID)"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={groupData.create_spid}
                  onChange={(e) => setGroupData({...groupData, create_spid: e.target.value})}
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Create Group
                </button>
              </form>
              {groupMessage && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm">
                  {groupMessage}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Join Group Page - WITH CUSTOM TEXT INPUT FOR DESTINATIONS */}
        {currentPage === 'join' && (
          <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="bg-white p-8 rounded-xl shadow-md">
              <h2 className="text-3xl font-bold mb-6 text-center">Join Group</h2>
              <p className="text-gray-600 mb-6 text-center">Join an existing travel group and share your destination preferences</p>
              <form onSubmit={handleJoinGroup} className="space-y-4">
                <input
                  type="text"
                  placeholder="Group ID (SPID)"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={joinData.create_spid}
                  onChange={(e) => setJoinData({...joinData, create_spid: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={joinData.name}
                  onChange={(e) => setJoinData({...joinData, name: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="State"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={joinData.state}
                  onChange={(e) => setJoinData({...joinData, state: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="City"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={joinData.city}
                  onChange={(e) => setJoinData({...joinData, city: e.target.value})}
                  required
                />

                {/* Multiple Destinations Section with Custom Text Input */}
                <div className="border-2 border-blue-200 rounded-lg p-4">
                  <button
                    type="button"
                    onClick={() => setShowPreferenceForm(!showPreferenceForm)}
                    className="w-full flex items-center justify-between bg-blue-50 hover:bg-blue-100 p-4 rounded-lg transition"
                  >
                    <span className="font-semibold text-blue-900">Your Destination Preferences</span>
                    <span>{showPreferenceForm ? 'Hide' : 'Show'}</span>
                  </button>

                  {showPreferenceForm && (
                    <div className="mt-4 space-y-4">
                      {joinData.destinations.map((dest, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                          <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-semibold text-gray-700">
                              Destination {index + 1}
                            </label>
                            {joinData.destinations.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeDestination(index)}
                                className="text-red-600 hover:text-red-800 text-sm font-semibold"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          
                          <input
                            type="text"
                            placeholder="Enter destination name (e.g., Paris, Goa Beach, Tokyo, Himalayas)"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
                            value={dest.type}
                            onChange={(e) => updateDestination(index, 'type', e.target.value)}
                            required
                          />
                          
                          <textarea
                            placeholder="Describe why this destination appeals to you... What excites you about it?"
                            rows="3"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={dest.description}
                            onChange={(e) => updateDestination(index, 'description', e.target.value)}
                            required
                          />
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addDestination}
                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-semibold"
                      >
                        + Add Another Destination
                      </button>
                      
                      <p className="text-sm text-gray-500 mt-2">
                        Add as many destinations as you like! You can enter any destination name - cities, countries, specific places, or types of locations.
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold text-lg"
                >
                  Join Group
                </button>
              </form>
              {joinMessage && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm">
                  {joinMessage}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Decision Page */}
        {currentPage === 'decision' && (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="bg-white p-8 rounded-xl shadow-md">
              <h2 className="text-3xl font-bold mb-6 text-center">Get AI Recommendation</h2>
              <p className="text-gray-600 mb-6 text-center">AI-powered travel destination recommendation</p>
              <form onSubmit={handleGetDecision} className="space-y-4 max-w-md mx-auto">
                <input
                  type="text"
                  placeholder="Group ID (SPID)"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={decisionSpid}
                  onChange={(e) => setDecisionSpid(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-400"
                >
                  {loading ? 'Analyzing...' : 'Get Recommendation'}
                </button>
              </form>

              {decisionResult && (
                <div className="mt-8">
                  {decisionResult.error ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                      Error: {decisionResult.error}
                    </div>
                  ) : (
                    <div>
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6">
                        <h3 className="text-2xl font-bold mb-2">Group Recommendation</h3>
                        <p className="text-3xl font-bold text-blue-600 mb-2">
                          {decisionResult.group_favorite || 'No clear favorite'}
                        </p>
                        <p className="text-gray-600">
                          Group Confidence: {((decisionResult.group_confidence || 0) * 100).toFixed(1)}%
                        </p>
                      </div>

                      {decisionResult.user_predictions && decisionResult.user_predictions.length > 0 && (
                        <div>
                          <h4 className="text-xl font-semibold mb-4">Individual Confidence Scores</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            {decisionResult.user_predictions.map((user, idx) => (
                              <div key={idx} className="bg-white border-2 border-gray-200 rounded-lg p-5 hover:shadow-lg transition">
                                <h5 className="font-bold text-lg mb-3 text-blue-900">
                                  {user.username || `User ${idx + 1}`}
                                </h5>
                                
                                <div className="space-y-3">
                                  <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-sm font-semibold text-gray-700 mb-1">Destinations:</p>
                                    <p className="text-gray-600">{user.destinations ? user.destinations.join(', ') : 'N/A'}</p>
                                  </div>
                                  
                                  <div className="flex justify-between items-center bg-blue-50 p-3 rounded">
                                    <span className="font-semibold text-gray-700">Sentiment Score</span>
                                    <span className="text-lg font-bold text-blue-600">
                                      {user.sentiment_score ? user.sentiment_score.toFixed(2) : '0.00'}
                                    </span>
                                  </div>
                                  
                                  <div className="flex justify-between items-center bg-purple-50 p-3 rounded">
                                    <span className="font-semibold text-gray-700">Confidence Score</span>
                                    <span className="text-lg font-bold text-purple-600">
                                      {user.confidence ? (user.confidence * 100).toFixed(1) + '%' : '0.0%'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
