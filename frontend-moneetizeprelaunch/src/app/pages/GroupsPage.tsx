import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Plus, 
  Users, 
  Trash2, 
  UserPlus, 
  Globe, 
  Lock,
  Check,
  X,
  Search,
  Calendar,
  TrendingUp
} from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description: string;
  icon: string;
  memberCount: number;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  category: string;
}

export function GroupsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'my-groups' | 'discover'>('my-groups');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [networkGroups, setNetworkGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Create group form state
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    icon: '💼',
    isPublic: true,
    category: 'general'
  });

  const availableIcons = ['💼', '🚀', '💡', '📈', '🎯', '🌟', '🔥', '💰', '🎨', '📚', '⚡', '🌍'];
  const categories = ['general', 'investing', 'technology', 'finance', 'education', 'lifestyle'];

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = () => {
    // Load user's groups from localStorage
    const savedMyGroups = JSON.parse(localStorage.getItem('myGroups') || '[]');
    setMyGroups(savedMyGroups);

    // Load network groups from localStorage (simulated)
    const savedNetworkGroups = JSON.parse(localStorage.getItem('networkGroups') || '[]');
    
    // If no network groups exist, create some default ones
    if (savedNetworkGroups.length === 0) {
      const defaultGroups: Group[] = [
        {
          id: 'net-1',
          name: 'Investment Beginners',
          description: 'Learn the basics of investing together',
          icon: '📈',
          memberCount: 1247,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'investing'
        },
        {
          id: 'net-2',
          name: 'Tech Enthusiasts',
          description: 'Discuss the latest in technology and innovation',
          icon: '🚀',
          memberCount: 892,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'technology'
        },
        {
          id: 'net-3',
          name: 'Financial Freedom',
          description: 'Strategies for achieving financial independence',
          icon: '💰',
          memberCount: 2103,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'finance'
        },
        {
          id: 'net-4',
          name: 'Side Hustle Ideas',
          description: 'Share and discover side income opportunities',
          icon: '💡',
          memberCount: 1567,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'lifestyle'
        },
        {
          id: 'net-5',
          name: 'Crypto Corner',
          description: 'Cryptocurrency discussions and insights',
          icon: '⚡',
          memberCount: 3421,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'investing'
        },
        {
          id: 'net-6',
          name: 'Personal Growth',
          description: 'Self-improvement and development journey',
          icon: '🌟',
          memberCount: 978,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'education'
        }
      ];
      localStorage.setItem('networkGroups', JSON.stringify(defaultGroups));
      setNetworkGroups(defaultGroups);
    } else {
      setNetworkGroups(savedNetworkGroups);
    }
  };

  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) {
      alert('Please enter a group name');
      return;
    }

    const userName = localStorage.getItem('userName') || 'User';
    const group: Group = {
      id: 'user-' + Date.now(),
      name: newGroup.name,
      description: newGroup.description,
      icon: newGroup.icon,
      memberCount: 1,
      isPublic: newGroup.isPublic,
      createdBy: userName,
      createdAt: new Date().toISOString(),
      category: newGroup.category
    };

    // Add to my groups
    const updatedMyGroups = [...myGroups, group];
    setMyGroups(updatedMyGroups);
    localStorage.setItem('myGroups', JSON.stringify(updatedMyGroups));

    // If public, also add to network groups
    if (newGroup.isPublic) {
      const updatedNetworkGroups = [...networkGroups, group];
      setNetworkGroups(updatedNetworkGroups);
      localStorage.setItem('networkGroups', JSON.stringify(updatedNetworkGroups));
    }

    // Reset form
    setNewGroup({
      name: '',
      description: '',
      icon: '💼',
      isPublic: true,
      category: 'general'
    });
    setShowCreateModal(false);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (!confirm('Are you sure you want to leave this group?')) {
      return;
    }

    // Remove from my groups
    const updatedMyGroups = myGroups.filter(g => g.id !== groupId);
    setMyGroups(updatedMyGroups);
    localStorage.setItem('myGroups', JSON.stringify(updatedMyGroups));

    // If it was user-created and public, also remove from network
    const group = myGroups.find(g => g.id === groupId);
    if (group && group.createdBy !== 'system') {
      const updatedNetworkGroups = networkGroups.filter(g => g.id !== groupId);
      setNetworkGroups(updatedNetworkGroups);
      localStorage.setItem('networkGroups', JSON.stringify(updatedNetworkGroups));
    }
  };

  const handleJoinGroup = (group: Group) => {
    // Check if already joined
    if (myGroups.some(g => g.id === group.id)) {
      alert('You are already a member of this group');
      return;
    }

    // Add to my groups
    const updatedMyGroups = [...myGroups, group];
    setMyGroups(updatedMyGroups);
    localStorage.setItem('myGroups', JSON.stringify(updatedMyGroups));

    // Update member count in network groups
    const updatedNetworkGroups = networkGroups.map(g => 
      g.id === group.id ? { ...g, memberCount: g.memberCount + 1 } : g
    );
    setNetworkGroups(updatedNetworkGroups);
    localStorage.setItem('networkGroups', JSON.stringify(updatedNetworkGroups));
  };

  const filteredNetworkGroups = networkGroups.filter(group => 
    !myGroups.some(mg => mg.id === group.id) &&
    (searchQuery === '' || 
     group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
     group.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="absolute inset-0 w-full h-full overflow-y-auto bg-gradient-to-b from-[#0a0e1a] via-[#0f1623] to-[#0a0e1a]">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-11 flex items-center justify-between px-4 sm:px-6 text-white text-sm z-50">
        <span className="font-semibold">9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 bg-white/80 rounded-sm" />
          <div className="w-4 h-3 bg-white/80 rounded-sm" />
          <div className="w-6 h-3 bg-white/80 rounded-sm" />
        </div>
      </div>

      {/* Back Button */}
      <div className="absolute top-14 sm:top-16 left-4 sm:left-6 z-40">
        <button
          onClick={() => navigate('/profile-feeds')}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Create Group Button */}
      <div className="absolute top-14 sm:top-16 right-4 sm:right-6 z-40">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-purple-600 backdrop-blur-sm flex items-center justify-center text-white hover:bg-purple-700 transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="pt-28 sm:pt-32 pb-20 sm:pb-24 px-4 sm:px-6 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-violet-600 rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-white text-2xl sm:text-3xl font-bold mb-2">Groups</h1>
          <p className="text-gray-400 text-sm">Connect with like-minded people</p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6 bg-white/5 backdrop-blur-sm rounded-full p-1"
        >
          <button
            onClick={() => setActiveTab('my-groups')}
            className={`flex-1 py-3 rounded-full font-medium transition-all ${
              activeTab === 'my-groups'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            My Groups ({myGroups.length})
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex-1 py-3 rounded-full font-medium transition-all ${
              activeTab === 'discover'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Discover
          </button>
        </motion.div>

        {/* Search Bar (only for discover tab) */}
        {activeTab === 'discover' && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 backdrop-blur-sm text-white placeholder-gray-500 pl-12 pr-4 py-3.5 rounded-xl border border-white/10 focus:border-purple-500 focus:outline-none transition-colors"
              />
            </div>
          </motion.div>
        )}

        {/* My Groups Tab */}
        {activeTab === 'my-groups' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {myGroups.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">You haven't joined any groups yet</p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="bg-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-700 transition-colors"
                >
                  Discover Groups
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myGroups.map((group, idx) => (
                  <motion.div
                    key={group.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                        {group.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-white font-semibold text-base">{group.name}</h3>
                          <button
                            onClick={() => handleDeleteGroup(group.id)}
                            className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{group.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {group.memberCount.toLocaleString()} members
                          </div>
                          <div className="flex items-center gap-1">
                            {group.isPublic ? (
                              <>
                                <Globe className="w-3.5 h-3.5" />
                                Public
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                Private
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-1 capitalize">
                            <TrendingUp className="w-3.5 h-3.5" />
                            {group.category}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Discover Tab */}
        {activeTab === 'discover' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {filteredNetworkGroups.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  {searchQuery ? 'No groups found matching your search' : 'No available groups to join'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNetworkGroups.map((group, idx) => (
                  <motion.div
                    key={group.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                        {group.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-white font-semibold text-base">{group.name}</h3>
                          <button
                            onClick={() => handleJoinGroup(group)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 flex-shrink-0"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Join
                          </button>
                        </div>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{group.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {group.memberCount.toLocaleString()} members
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(group.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </div>
                          <div className="flex items-center gap-1 capitalize">
                            <TrendingUp className="w-3.5 h-3.5" />
                            {group.category}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-[#1a1d2e] to-[#0f1623] rounded-2xl p-6 w-full max-w-md border border-white/10 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-xl font-bold">Create New Group</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Icon Selector */}
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Group Icon</label>
                  <div className="grid grid-cols-6 gap-2">
                    {availableIcons.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewGroup({ ...newGroup, icon })}
                        className={`w-full aspect-square rounded-lg flex items-center justify-center text-2xl transition-all ${
                          newGroup.icon === icon
                            ? 'bg-purple-600 scale-110'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Group Name */}
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Group Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Stock Market Enthusiasts"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    className="w-full bg-white/5 text-white placeholder-gray-500 px-4 py-3 rounded-xl border border-white/10 focus:border-purple-500 focus:outline-none transition-colors"
                    maxLength={50}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Description</label>
                  <textarea
                    placeholder="What is your group about?"
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    className="w-full bg-white/5 text-white placeholder-gray-500 px-4 py-3 rounded-xl border border-white/10 focus:border-purple-500 focus:outline-none transition-colors resize-none"
                    rows={3}
                    maxLength={200}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewGroup({ ...newGroup, category: cat })}
                        className={`px-4 py-2.5 rounded-lg capitalize text-sm font-medium transition-all ${
                          newGroup.category === cat
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Privacy */}
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Privacy</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewGroup({ ...newGroup, isPublic: true })}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        newGroup.isPublic
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                      Public
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewGroup({ ...newGroup, isPublic: false })}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        !newGroup.isPublic
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      Private
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-white/5 text-white py-3 rounded-full font-semibold hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateGroup}
                    disabled={!newGroup.name.trim()}
                    className="flex-1 bg-purple-600 text-white py-3 rounded-full font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Create Group
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}