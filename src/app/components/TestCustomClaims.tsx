'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface TestResult {
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: any;
}

interface JWTPayload {
  user_role?: string;
  iss?: string;
  aud?: string;
  sub?: string;
  role?: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

export const TestCustomClaims = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user?.email || session?.user?.id || null);
    };
    getCurrentUser();
  }, [supabase.auth]);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const decodeJWT = (token: string): JWTPayload | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      addResult({
        status: 'error',
        message: 'Failed to decode JWT token',
        data: error
      });
      return null;
    }
  };

  const testDatabaseRole = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_role');
      
      if (error) {
        addResult({
          status: 'error',
          message: `Database role check failed: ${error.message}`,
          data: error
        });
        return;
      }

      addResult({
        status: 'success',
        message: `Database role: ${data || 'No role found'}`,
        data: { database_role: data }
      });
    } catch (error) {
      addResult({
        status: 'error',
        message: 'Failed to call get_user_role function',
        data: error
      });
    }
  };

  const testJWTClaims = async () => {
    try {
      addResult({
        status: 'warning',
        message: 'Refreshing session to trigger custom claims hook...'
      });

      const { error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        addResult({
          status: 'error',
          message: `Session refresh failed: ${refreshError.message}`,
          data: refreshError
        });
        return;
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        addResult({
          status: 'error',
          message: `Failed to get session: ${sessionError.message}`,
          data: sessionError
        });
        return;
      }

      if (!session?.access_token) {
        addResult({
          status: 'error',
          message: 'No access token found in session'
        });
        return;
      }

      const payload = decodeJWT(session.access_token);
      
      if (!payload) return;

      if (payload.user_role) {
        addResult({
          status: 'success',
          message: `✅ Custom claims working! User role: ${payload.user_role}`,
          data: { 
            user_role: payload.user_role,
            token_issued_at: new Date((payload.iat || 0) * 1000).toLocaleString(),
            token_expires_at: new Date((payload.exp || 0) * 1000).toLocaleString()
          }
        });
      } else {
        addResult({
          status: 'warning',
          message: 'Custom claims not found in JWT',
          data: { 
            available_claims: Object.keys(payload),
            full_payload: payload
          }
        });
      }

    } catch (error) {
      addResult({
        status: 'error',
        message: 'JWT claims test failed',
        data: error
      });
    }
  };

  const runFullTest = async () => {
    setLoading(true);
    clearResults();
    
    addResult({
      status: 'warning',
      message: `Starting full test for user: ${currentUser || 'Unknown'}`
    });

    await testDatabaseRole();
    await testJWTClaims();
    
    setLoading(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return '📋';
    }
  };

// Add this function to your TestCustomClaims component
const checkUserInDatabase = async () => {
  try {
    // Check if user exists in user_roles table
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', '67b176eb-cde9-42c2-a093-87a3d2f531df'); // Your participant user ID
    
    if (rolesError) {
      addResult({
        status: 'error',
        message: `Failed to check user_roles: ${rolesError.message}`,
        data: rolesError
      });
      return;
    }

    addResult({
      status: 'success',
      message: `User roles data: ${JSON.stringify(userRoles)}`,
      data: { user_roles: userRoles }
    });

    // Also check if the RPC function works for this specific user
    const { data: rpcResult, error: rpcError } = await supabase.rpc('get_user_role');
    
    addResult({
      status: rpcResult ? 'success' : 'warning',
      message: `RPC result: ${rpcResult || 'null'}`,
      data: { rpc_result: rpcResult, rpc_error: rpcError }
    });

  } catch (error) {
    addResult({
      status: 'error',
      message: 'Database check failed',
      data: error
    });
  }
};



  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '600px' }}>
      <h3>Supabase Custom Claims Test</h3>
      
      {currentUser && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#e3f2fd', 
          border: '1px solid #bbdefb', 
          borderRadius: '4px',
          marginBottom: '15px',
          fontSize: '14px'
        }}>
          <strong>Current User:</strong> {currentUser}
        </div>
      )}


<button 
  onClick={checkUserInDatabase}
  style={{ 
    width: '100%',
    padding: '8px',
    backgroundColor: '#ff9800',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '5px'
  }}
>
  Check User in Database
</button>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runFullTest}
          disabled={loading}
          style={{ 
            width: '100%',
            padding: '10px',
            backgroundColor: loading ? '#ccc' : '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '10px'
          }}
        >
          {loading ? 'Running Tests...' : 'Run Full Test'}
        </button>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button 
            onClick={testDatabaseRole}
            disabled={loading}
            style={{ 
              flex: 1,
              padding: '8px',
              backgroundColor: loading ? '#ccc' : '#388e3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            Test Database Role
          </button>
          
          <button 
            onClick={testJWTClaims}
            disabled={loading}
            style={{ 
              flex: 1,
              padding: '8px',
              backgroundColor: loading ? '#ccc' : '#7b1fa2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            Test JWT Claims
          </button>
        </div>

        <button 
          onClick={clearResults}
          style={{ 
            width: '100%',
            padding: '6px',
            backgroundColor: '#757575',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Clear Results
        </button>
      </div>

      {results.length > 0 && (
        <div>
          <h4>Test Results:</h4>
          {results.map((result, index) => (
            <div 
              key={index}
              style={{ 
                padding: '12px',
                marginBottom: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 
                  result.status === 'success' ? '#e8f5e8' :
                  result.status === 'error' ? '#ffeaea' :
                  result.status === 'warning' ? '#fff3cd' : '#f8f9fa'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>{getStatusIcon(result.status)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                    {result.message}
                  </div>
                  {result.data && (
                    <details>
                      <summary style={{ cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                        View Details
                      </summary>
                      <pre style={{ 
                        marginTop: '8px',
                        fontSize: '12px',
                        backgroundColor: 'white',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};