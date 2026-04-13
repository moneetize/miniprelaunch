import { useState } from 'react';
import { useNavigate } from 'react-router';
import { projectId, publicAnonKey } from '/utils/supabase/info';

export function DebugAuth() {
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [showUsers, setShowUsers] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnection = async () => {
    setTestResults([]);
    setIsLoading(true);
    addResult('Starting connection tests...');

    // Test 1: Check credentials
    addResult(`Project ID: ${projectId}`);
    addResult(`Has Anon Key: ${!!publicAnonKey}`);
    addResult(`Anon Key length: ${publicAnonKey?.length || 0}`);

    // Test 2: Test health endpoint
    try {
      const healthUrl = `https://${projectId}.supabase.co/functions/v1/make-server-7a79873f/health`;
      addResult(`Testing health endpoint: ${healthUrl}`);
      
      const healthResponse = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      addResult(`Health check status: ${healthResponse.status}`);
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        addResult(`Health check response: ${JSON.stringify(healthData)}`);
      } else {
        const errorText = await healthResponse.text();
        addResult(`Health check error: ${errorText}`);
      }
    } catch (error) {
      addResult(`Health check failed: ${error instanceof Error ? error.message : String(error)}`);
      addResult(`Error type: ${error instanceof TypeError ? 'TypeError' : typeof error}`);
    }

    // Test 3: Test signup endpoint with invalid data to see if it responds
    try {
      const signupUrl = `https://${projectId}.supabase.co/functions/v1/make-server-7a79873f/auth/signup`;
      addResult(`Testing signup endpoint: ${signupUrl}`);
      
      const signupResponse = await fetch(signupUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: '',
          password: '',
        }),
      });
      
      addResult(`Signup endpoint status: ${signupResponse.status}`);
      
      const signupData = await signupResponse.json();
      addResult(`Signup endpoint response: ${JSON.stringify(signupData)}`);
    } catch (error) {
      addResult(`Signup endpoint test failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    setIsLoading(false);
    addResult('Tests completed!');
  };

  const testLogin = async () => {
    const email = (document.getElementById('test-email') as HTMLInputElement)?.value;
    const password = (document.getElementById('test-password') as HTMLInputElement)?.value;

    if (!email || !password) {
      addResult('Please enter email and password');
      return;
    }

    setIsLoading(true);
    addResult(`Testing login with email: ${email}`);

    try {
      const loginUrl = `https://${projectId}.supabase.co/functions/v1/make-server-7a79873f/auth/login`;
      addResult(`Login URL: ${loginUrl}`);

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      addResult(`Login response status: ${response.status}`);
      
      const result = await response.json();
      addResult(`Login response: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      addResult(`Login failed: ${error instanceof Error ? error.message : String(error)}`);
      addResult(`Error stack: ${error instanceof Error ? error.stack : 'N/A'}`);
    }

    setIsLoading(false);
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    addResult('Fetching users...');

    try {
      const usersUrl = `https://${projectId}.supabase.co/functions/v1/make-server-7a79873f/admin/users`;
      addResult(`Users URL: ${usersUrl}`);

      const response = await fetch(usersUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      addResult(`Users response status: ${response.status}`);
      
      const result = await response.json();
      addResult(`Users response: ${JSON.stringify(result, null, 2)}`);
      
      if (result.success && result.data) {
        setUsers(result.data.users || []);
        addResult(`Found ${result.data.total || 0} users`);
      } else {
        setUsers([]);
      }
      setShowUsers(true);
    } catch (error) {
      addResult(`Users fetch failed: ${error instanceof Error ? error.message : String(error)}`);
      addResult(`Error stack: ${error instanceof Error ? error.stack : 'N/A'}`);
    }

    setIsLoading(false);
  };

  const deleteAllUsers = async () => {
    if (!confirm('⚠️ WARNING: This will delete ALL users from the database. This action cannot be undone. Are you sure?')) {
      return;
    }

    setIsLoading(true);
    addResult('Deleting all users...');

    try {
      const deleteUrl = `https://${projectId}.supabase.co/functions/v1/make-server-7a79873f/admin/users`;
      addResult(`Delete URL: ${deleteUrl}`);

      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      addResult(`Delete response status: ${response.status}`);
      
      const result = await response.json();
      addResult(`Delete response: ${JSON.stringify(result, null, 2)}`);
      
      if (result.success) {
        addResult(`✅ ${result.data.message}`);
        setUsers([]);
        setShowUsers(false);
      } else {
        addResult(`❌ Failed to delete users: ${result.error}`);
      }
    } catch (error) {
      addResult(`Delete failed: ${error instanceof Error ? error.message : String(error)}`);
      addResult(`Error stack: ${error instanceof Error ? error.stack : 'N/A'}`);
    }

    setIsLoading(false);
  };

  const deleteUser = async (userId: string) => {
    if (!confirm(`Are you sure you want to delete user ${userId}?`)) {
      return;
    }

    setIsLoading(true);
    addResult(`Deleting user ${userId}...`);

    try {
      const deleteUrl = `https://${projectId}.supabase.co/functions/v1/make-server-7a79873f/admin/users/${userId}`;
      addResult(`Delete URL: ${deleteUrl}`);

      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      addResult(`Delete response status: ${response.status}`);
      
      const result = await response.json();
      addResult(`Delete response: ${JSON.stringify(result, null, 2)}`);
      
      if (result.success) {
        addResult(`✅ User deleted successfully`);
        // Refresh users list
        fetchUsers();
      } else {
        addResult(`❌ Failed to delete user: ${result.error}`);
      }
    } catch (error) {
      addResult(`Delete failed: ${error instanceof Error ? error.message : String(error)}`);
      addResult(`Error stack: ${error instanceof Error ? error.stack : 'N/A'}`);
    }

    setIsLoading(false);
  };

  const deleteUserByEmail = async () => {
    const email = (document.getElementById('delete-email') as HTMLInputElement)?.value;

    if (!email) {
      addResult('Please enter an email address');
      return;
    }

    if (!confirm(`⚠️ Are you sure you want to delete the user with email: ${email}?`)) {
      return;
    }

    setIsLoading(true);
    addResult(`Deleting user with email: ${email}...`);

    try {
      const deleteUrl = `https://${projectId}.supabase.co/functions/v1/make-server-7a79873f/admin/delete-by-email`;
      addResult(`Delete by email URL: ${deleteUrl}`);

      const response = await fetch(deleteUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      addResult(`Delete response status: ${response.status}`);
      
      const result = await response.json();
      addResult(`Delete response: ${JSON.stringify(result, null, 2)}`);
      
      if (result.success) {
        addResult(`✅ ${result.data.message}`);
        addResult(`   Email: ${result.data.email}`);
        addResult(`   User ID: ${result.data.userId}`);
        
        // Clear the input
        const input = document.getElementById('delete-email') as HTMLInputElement;
        if (input) input.value = '';
        
        // Refresh users list if shown
        if (showUsers) {
          fetchUsers();
        }
      } else {
        addResult(`❌ Failed to delete user: ${result.error}`);
      }
    } catch (error) {
      addResult(`Delete failed: ${error instanceof Error ? error.message : String(error)}`);
      addResult(`Error stack: ${error instanceof Error ? error.stack : 'N/A'}`);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Authentication Debug Page</h1>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600"
          >
            Back
          </button>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Tests</h2>
          <button
            onClick={testConnection}
            disabled={isLoading}
            className="bg-blue-600 px-6 py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Testing...' : 'Run Connection Tests'}
          </button>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Login</h2>
          <div className="space-y-4">
            <input
              id="test-email"
              type="email"
              placeholder="Email"
              className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
            <input
              id="test-password"
              type="password"
              placeholder="Password"
              className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={testLogin}
              disabled={isLoading}
              className="bg-green-600 px-6 py-3 rounded font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Testing...' : 'Test Login'}
            </button>
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Fetch Users</h2>
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="bg-purple-600 px-6 py-3 rounded font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Fetching...' : 'Fetch Users'}
          </button>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Delete All Users</h2>
          <button
            onClick={deleteAllUsers}
            disabled={isLoading}
            className="bg-red-600 px-6 py-3 rounded font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Deleting...' : 'Delete All Users'}
          </button>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Delete User by Email</h2>
          <div className="space-y-4">
            <input
              id="delete-email"
              type="email"
              placeholder="Email"
              className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={deleteUserByEmail}
              disabled={isLoading}
              className="bg-red-600 px-6 py-3 rounded font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Deleting...' : 'Delete User'}
            </button>
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="bg-black p-4 rounded font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No tests run yet. Click "Run Connection Tests" to start.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-green-400">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        {showUsers && (
          <div className="bg-gray-900 p-6 rounded-lg mt-6">
            <h2 className="text-xl font-semibold mb-4">Users ({users.length})</h2>
            {users.length === 0 ? (
              <div className="bg-black p-4 rounded text-center">
                <p className="text-gray-500">No users found in the database.</p>
                <p className="text-sm text-gray-600 mt-2">The database has been cleaned successfully! ✅</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user, index) => (
                  <div key={index} className="bg-black p-4 rounded flex items-start justify-between">
                    <div className="flex-1 font-mono text-sm">
                      <div className="text-white font-semibold mb-1">{user.email}</div>
                      <div className="text-gray-400">ID: {user.id}</div>
                      {user.name && <div className="text-gray-400">Name: {user.name}</div>}
                      <div className="text-gray-500 text-xs mt-1">
                        Created: {new Date(user.created_at).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteUser(user.id)}
                      disabled={isLoading}
                      className="ml-4 bg-red-600 px-3 py-1 rounded text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 bg-yellow-900/20 border border-yellow-600/30 p-4 rounded-lg">
          <h3 className="text-yellow-400 font-semibold mb-2">⚠️ Common Issues:</h3>
          <ul className="text-sm space-y-1 text-gray-300">
            <li>• Edge Function not deployed or not started</li>
            <li>• CORS configuration issues</li>
            <li>• Invalid project ID or anon key</li>
            <li>• Network connectivity problems</li>
            <li>• Supabase project paused or inactive</li>
          </ul>
        </div>

        <div className="mt-4 bg-blue-900/20 border border-blue-600/30 p-4 rounded-lg">
          <h3 className="text-blue-400 font-semibold mb-2">ℹ️ Quick Links:</h3>
          <ul className="text-sm space-y-1">
            <li>
              <a 
                href={`https://supabase.com/dashboard/project/${projectId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                Open Supabase Dashboard
              </a>
            </li>
            <li>
              <a 
                href={`https://supabase.com/dashboard/project/${projectId}/functions`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                View Edge Functions
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}