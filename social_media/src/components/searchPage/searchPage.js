import React, { useState, useEffect } from 'react';
import { FaSearch, FaUser, FaTimes, FaArrowLeft, FaEnvelope, FaPhone, FaCalendar, FaMapMarkerAlt, FaLink, FaHeart, FaComment, FaShare } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApolloClient, useMutation } from '@apollo/client';
import { GET_USER_INFO, FOLLOW_UNFOLLOW } from '../../graphql/mutations';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const navigate = useNavigate();
  const token = sessionStorage.getItem('user');
  const apolloClient = useApolloClient();

  // Authentication check
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [navigate, token]);

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save recent searches to localStorage whenever it changes
  useEffect(() => {
    if (recentSearches.length > 0) {
      localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    }
  }, [recentSearches]);

  const handleSearch = async (query = searchQuery) => {
    console.log("hiii");
    
    if (!query.trim()) {
      setSearchResults([]);
      setShowSuggestions(true);
      return;
    }

    setIsLoading(true);
    setShowSuggestions(false);

    const graphqlQuery = `
      query searchUsers($username: String!) {
        searchUsers(username: $username) {
          id
          name
          username
          email
          phone
          profileImage
          bio
          createTime
          
        }
      }
    `;

    try {
      const response = await axios.post(
        'http://localhost:5000/graphql',
        { query: graphqlQuery, variables: { username: query } },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );

      const { data, errors } = response.data;

      if (errors && errors.length > 0) {
        console.error('Search error:', errors[0].message);
        setSearchResults([]);
      } else if (data?.searchUsers) {
        console.log('Search results received:', data.searchUsers);
        
        // Validate and clean user data
        const validUsers = data.searchUsers.filter(user => {
          if (!user || !user.id || !user.name) {
            console.warn('Invalid user data:', user);
            return false;
          }
          return true;
        }).map(user => ({
          ...user,
          // Ensure all required fields have default values
          name: user.name || 'Unknown User',
          username: user.username || '',
          email: user.email || '',
          phone: user.phone || '',
          profileImage: user.profileImage || '',
          bio: user.bio || '',
          createTime: user.createTime || new Date().toISOString(),
          followers: user.followers || [],
          following: user.following || [],
          posts: user.posts || []
        }));
        
        console.log('Validated users:', validUsers);
        setSearchResults(validUsers);
        // Print each user's name and id for debugging
        validUsers.forEach(user => {
          console.log(`User: ${user.name}, ID: ${user.id}`);
        });
        
        // Add to recent searches if not already present
        validUsers.forEach(user => {
          if (!recentSearches.find(item => item.id === user.id)) {
            setRecentSearches(prev => [user, ...prev.slice(0, 4)]);
          }
        });
      } else {
        console.log('No search results found');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (!value.trim()) {
      setSearchResults([]);
      setShowSuggestions(true);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSuggestions(true);
    setSelectedUser(null);
    setShowUserDetails(false);
  };

  const removeRecentSearch = (id) => {
    setRecentSearches(prev => prev.filter(item => item.id !== id));
  };

  const handleRecentSearchClick = (user) => {
    setSearchQuery(user.name);
    handleSearch(user.name);
  };

  const fetchUserDetails = async (userId) => {
    try {
      const { data } = await apolloClient.query({
        query: GET_USER_INFO,
        variables: { id: userId },
        fetchPolicy: 'network-only',
      });
      return data?.getUserInformation || null;
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      return null;
    }
  };

  const handleUserClick = (user) => {
    console.log('Clicked user object:', user);
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Search Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          
          {/* Responsive Search Input with Back Button */}
          <div className="relative max-w-2xl mx-auto flex items-center gap-4">
            
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-purple-600 transition-colors"
            >
              <FaArrowLeft className="mr-2" />
              <span className="font-medium">Back</span>
            </button>
            
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search for users by name or username..."
                value={searchQuery}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="w-full h-12 px-12 pr-24 rounded-full border-2 border-gray-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 text-gray-700 placeholder-gray-400 text-center"
                autoFocus
              />
              
              {/* Search Icon */}
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 mt-2">
                <FaSearch className="text-lg" />
              </div>
              
              {/* Search Button - Inside the input */}
              <button
                onClick={() => handleSearch()}
                disabled={isLoading || !searchQuery.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-600 text-white px-4 py-1.5 rounded-full hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-sm mb-1 mt-4"
              >
                {isLoading ? '...' : 'Search'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results and Suggestions */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="mt-2 text-gray-600">Searching for users...</p>
          </div>
        )}

        {/* Search Results */}
        {!isLoading && searchResults.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Search Results ({searchResults.length})
            </h2>
            {searchResults.map((user) => (
              <UserCard key={user.id} user={user} onClick={() => handleUserClick(user)} />
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && searchQuery && searchResults.length === 0 && (
          <div className="text-center py-12">
            <FaUser className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No users found</h3>
            <p className="text-gray-500">Try searching with a different name or username</p>
          </div>
        )}

        {/* Recent Searches */}
        {!isLoading && showSuggestions && recentSearches.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Recent Searches</h2>
              <button
                onClick={() => {
                  setRecentSearches([]);
                  localStorage.removeItem('recentSearches');
                }}
                className="text-sm text-gray-500 hover:text-red-500"
              >
                Clear All
              </button>
            </div>
            {recentSearches.map((user) => (
              <RecentSearchCard
                key={user.id}
                user={user}
                onClick={() => handleRecentSearchClick(user)}
                onRemove={() => removeRecentSearch(user.id)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !searchQuery && recentSearches.length === 0 && (
          <div className="text-center py-12">
            <FaSearch className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Search for Users</h3>
            <p className="text-gray-500">Enter a name or username to find users</p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <UserDetailsModal user={selectedUser} onClose={() => setShowUserDetails(false)} />
      )}

      {/* Fallback Modal for debugging */}
      {showUserDetails && !selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Debug Info</h2>
            <p className="text-gray-600 mb-4">Modal is showing but no user data is available.</p>
            <p className="text-sm text-gray-500 mb-4">showUserDetails: {showUserDetails.toString()}</p>
            <p className="text-sm text-gray-500 mb-4">selectedUser: {selectedUser ? 'Available' : 'Not available'}</p>
            <button
              onClick={() => setShowUserDetails(false)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced User Card Component
const UserCard = ({ user, onClick }) => {
  const handleClick = () => {
    console.log('UserCard clicked:', user); // Debug log
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-center space-x-4">
        {/* Profile Image */}
        <div className="flex-shrink-0">
          <img
            src={user.profileImage || 'https://via.placeholder.com/60x60?text=User'}
            alt={user.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
          />
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{user.name}</h3>
            {user.username && (
              <span className="text-sm text-gray-500">@{user.username}</span>
            )}
          </div>
          
          {user.bio && (
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">{user.bio}</p>
          )}

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {user.followers && (
              <span>{user.followers.length} followers</span>
            )}
            {user.following && (
              <span>{user.following.length} following</span>
            )}
            {user.posts && (
              <span>{user.posts.length} posts</span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex-shrink-0">
          <button 
            onClick={(e) => {
              e.stopPropagation(); // Prevent double click
              handleClick();
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
};

// Recent Search Card Component
const RecentSearchCard = ({ user, onClick, onRemove }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3" onClick={onClick}>
          <img
            src={user.profileImage || 'https://via.placeholder.com/40x40?text=User'}
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h4 className="font-medium text-gray-900">{user.name}</h4>
            {user.username && (
              <p className="text-sm text-gray-500">@{user.username}</p>
            )}
          </div>
        </div>
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

// User Details Modal Component
const UserDetailsModal = ({ user, onClose }) => {
  console.log('UserDetailsModal rendered with user:', user); // Debug log
  const [activeTab, setActiveTab] = useState(0); // 0: Posts, 1: Shorts, 2: Tags
  const [isFollowing, setIsFollowing] = useState(false);
  const [followUnfollow, { loading: followLoading }] = useMutation(FOLLOW_UNFOLLOW);


  
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // const handleFollowClick = async () => {
  //   try {
  //     const { data } = await followUnfollow({
  //       variables: { id: user.id },
  //       update: (cache, { data }) => {
  //         if (data?.followAndUnfollow) {
  //           // Update the user data in cache
  //           cache.writeQuery({
  //             query: GET_USER_INFO,
  //             variables: { id: user.id },
  //             data: {
  //               getUserInformation: {
  //                 ...user,
  //                 followers: data.followAndUnfollow.followers,
  //                 following: data.followAndUnfollow.following,
  //                 __typename: 'User'
  //               }
  //             }
  //           });
  //         }
  //       }
  //     });

  const handleFollowClick = async () => {
    try {
      const { data } = await followUnfollow({
        variables: { id: user.id },
        update: (cache, { data }) => {
          if (data?.followAndUnfollow) {
            cache.writeQuery({
              query: GET_USER_INFO,
              variables: { id: user.id },
              data: {
                getUserInformation: {
                  ...data.followAndUnfollow,
                  __typename: 'User'
                }
              }
            });
          }
        }
      });
    
      // ✅ This line must have semicolon at the end
      user.following = data.followAndUnfollow.following;
    
    } catch (error) {
      console.error('Follow/Unfollow error:', error);
      alert('Failed to follow/unfollow user: ' + error.message);
    }
    
  };


  // Sample shorts data (you can replace with actual data from backend)
  const shortsVideos = [
    "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1611162617474-5b5e00f447af?auto=format&fit=crop&w=800&q=80",
  ];

  // Sample tagged posts data (you can replace with actual data from backend)
  const taggedPosts = user.posts?.slice(0, 6) || [];

  if (!user) {
    console.log('No user data provided to modal');
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">User Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Profile Header */}
          <div className="flex items-center space-x-6 mb-6">
            <img
              src={user.profileImage || 'https://via.placeholder.com/100x100?text=User'}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
            />
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{user.name || 'Unknown User'}</h3>
              {user.username && (
                <p className="text-lg text-gray-600 mb-2">@{user.username}</p>
              )}
              {user.bio && (
                <p className="text-gray-700 mb-3">{user.bio}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{user.followers?.length || 0} followers</span>
                <span>{user.following?.length || 0} following</span>
                <span>{user.posts?.length || 0} posts</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-6">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab(0)}
                className={`flex flex-col items-center space-y-2 ${
                  activeTab === 0 ? 'text-purple-600' : 'text-gray-400'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="3" y="3" width="6" height="6" rx="2"/>
                    <rect x="15" y="3" width="6" height="6" rx="2"/>
                    <rect x="15" y="15" width="6" height="6" rx="2"/>
                    <rect x="3" y="15" width="6" height="6" rx="2"/>
                  </svg>
                </div>
                <span className="text-sm font-medium">Posts</span>
              </button>

              <button
                onClick={() => setActiveTab(1)}
                className={`flex flex-col items-center space-y-2 ${
                  activeTab === 1 ? 'text-purple-600' : 'text-gray-400'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fillOpacity="0.2"/>
                    <polygon points="10,8 16,12 10,16"/>
                  </svg>
                </div>
                <span className="text-sm font-medium">Shorts</span>
              </button>

              <button
                onClick={() => setActiveTab(2)}
                className={`flex flex-col items-center space-y-2 ${
                  activeTab === 2 ? 'text-purple-600' : 'text-gray-400'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 4a2 2 0 0 0-2 2v14l7-5 7 5V6a2 2 0 0 0-2-2H7z"/>
                  </svg>
                </div>
                <span className="text-sm font-medium">Tagged</span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Posts ({user.posts?.length || 0})</h4>
              {user.posts && user.posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.posts.slice(0, 6).map((post) => (
                    <div key={post.id} className="bg-gray-50 rounded-lg p-4">
                      {post.imageUrl && ( 
                        <img
                          src={post.imageUrl}
                          alt={post.caption || 'Post image'}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      )}
                      {post.caption && (
                        <p className="text-sm text-gray-700 line-clamp-2">{post.caption}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(post.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No posts yet</p>
              )}
            </div>
          )}

          {activeTab === 1 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Shorts ({shortsVideos.length})</h4>
              <div className="grid grid-cols-3 gap-2">
                {shortsVideos.map((video, idx) => (
                  <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-purple-50 cursor-pointer relative group">
                    <img 
                      src={video} 
                      alt="shorts video" 
                      className="w-full h-full object-cover object-center cursor-pointer" 
                      style={{maxWidth:'100%',maxHeight:'100%', minHeight: '60px'}} 
                    />
                    {/* Play Icon and Duration */}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      <span className="text-white text-xs font-medium">
                        {Math.floor(Math.random() * 2 + 1)}:{Math.floor(Math.random() * 59).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Tagged Posts ({taggedPosts.length})</h4>
              {taggedPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {taggedPosts.map((post) => (
                    <div key={post.id} className="bg-gray-50 rounded-lg p-4">
                      {post.imageUrl && (
                        <img
                          src={post.imageUrl}
                          alt={post.caption || 'Tagged post image'}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      )}
                      {post.caption && (
                        <p className="text-sm text-gray-700 line-clamp-2">{post.caption}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(post.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No tagged posts yet</p>
              )}
            </div>
          )}

          {/* Followers/Following Preview */}
          {(user.followers?.length > 0 || user.following?.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {user.followers?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Recent Followers</h4>
                  <div className="space-y-2">
                    {user.followers.slice(0, 3).map((follower) => (
                      <div key={follower.id} className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                        <span className="text-sm text-gray-700">{follower.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {user.following?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Following</h4>
                  <div className="space-y-2">
                    {user.following.slice(0, 3).map((following) => (
                      <div key={following.id} className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                        <span className="text-sm text-gray-700">{following.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
          <button 
            onClick={handleFollowClick}
            disabled={followLoading}
            className={`px-6 py-2 rounded-lg transition-colors font-medium ${
              isFollowing 
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                : 'bg-purple-600 text-white hover:bg-purple-700'
            } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {followLoading ? '...' : (isFollowing ? 'Following' : 'Follow')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
