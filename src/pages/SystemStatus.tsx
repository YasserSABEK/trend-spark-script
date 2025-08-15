import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Activity, Database, Key, Zap } from 'lucide-react';

interface EdgeFunctionTest {
  name: string;
  endpoint: string;
  description: string;
  status: 'pending' | 'testing' | 'success' | 'error';
  error?: string;
  responseTime?: number;
  lastTested?: string;
}

interface SystemHealth {
  apiKey: boolean;
  database: boolean;
  auth: boolean;
  credits: boolean;
}

export default function SystemStatus() {
  const [edgeFunctions, setEdgeFunctions] = useState<EdgeFunctionTest[]>([
    {
      name: 'Apify API Test',
      endpoint: 'test-apify-access',
      description: 'Test Apify API key accessibility and connection',
      status: 'pending'
    },
    {
      name: 'Instagram Creator Search',
      endpoint: 'search-instagram-creators',
      description: 'Search for Instagram creators with trending content',
      status: 'pending'
    },
    {
      name: 'TikTok Creator Search',
      endpoint: 'search-tiktok-creators',
      description: 'Search for TikTok creators with viral content',
      status: 'pending'
    },
    {
      name: 'Instagram Scraping',
      endpoint: 'scrape-instagram',
      description: 'Scrape Instagram user profiles and content',
      status: 'pending'
    }
  ]);

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    apiKey: false,
    database: false,
    auth: false,
    credits: false
  });

  const [overallProgress, setOverallProgress] = useState(0);
  const [testing, setTesting] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'testing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      testing: 'secondary',
      pending: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const testFunction = async (func: EdgeFunctionTest): Promise<EdgeFunctionTest> => {
    const startTime = Date.now();
    try {
      let testBody = {};
      
      // Customize test body based on function
      switch (func.endpoint) {
        case 'search-instagram-creators':
          testBody = { query: 'test', getUserResults: false };
          break;
        case 'search-tiktok-creators':
          testBody = { query: 'test', getUserResults: false };
          break;
        case 'scrape-instagram':
          testBody = { username: 'test' };
          break;
      }

      const { data, error } = await supabase.functions.invoke(func.endpoint, {
        body: testBody
      });
      
      const responseTime = Date.now() - startTime;
      
      if (error) {
        return {
          ...func,
          status: 'error',
          error: error.message,
          responseTime,
          lastTested: new Date().toLocaleTimeString()
        };
      }
      
      // Check for specific error codes that indicate system issues vs normal errors
      const isSystemError = data?.code === 'MISSING_API_KEY' || data?.code === 'INSUFFICIENT_CREDITS';
      
      return {
        ...func,
        status: isSystemError ? 'error' : 'success',
        error: isSystemError ? data.error : undefined,
        responseTime,
        lastTested: new Date().toLocaleTimeString()
      };
    } catch (err) {
      return {
        ...func,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
        responseTime: Date.now() - startTime,
        lastTested: new Date().toLocaleTimeString()
      };
    }
  };

  const runSystemTests = async () => {
    setTesting(true);
    setOverallProgress(0);
    
    // Reset all functions to testing state
    setEdgeFunctions(prev => prev.map(func => ({ ...func, status: 'testing' as const })));
    
    const totalTests = edgeFunctions.length;
    let completedTests = 0;
    
    // Test functions sequentially to avoid rate limits
    for (let i = 0; i < edgeFunctions.length; i++) {
      const func = edgeFunctions[i];
      const result = await testFunction(func);
      
      setEdgeFunctions(prev => prev.map((f, index) => 
        index === i ? result : f
      ));
      
      completedTests++;
      setOverallProgress((completedTests / totalTests) * 100);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Run system health check
    await checkSystemHealth();
    
    setTesting(false);
  };

  const checkSystemHealth = async () => {
    try {
      // Test API key
      const { data: apifyTest } = await supabase.functions.invoke('test-apify-access', { body: {} });
      const apiKeyOk = apifyTest?.diagnostics?.apifyKeyExists || false;
      
      // Test database (simple query)
      const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
      const databaseOk = !dbError;
      
      // Test auth
      const { data: authData, error: authError } = await supabase.auth.getUser();
      const authOk = !authError && !!authData?.user;
      
      // Test credits (if authenticated)
      let creditsOk = false;
      if (authOk && authData?.user) {
        const { error: creditError } = await supabase.rpc('get_user_credits', {
          user_id_param: authData.user.id
        });
        creditsOk = !creditError;
      }
      
      setSystemHealth({
        apiKey: apiKeyOk,
        database: databaseOk,
        auth: authOk,
        credits: creditsOk
      });
    } catch (error) {
      console.error('System health check failed:', error);
    }
  };

  useEffect(() => {
    checkSystemHealth();
  }, []);

  const getHealthScore = () => {
    const values = Object.values(systemHealth);
    const healthy = values.filter(Boolean).length;
    return (healthy / values.length) * 100;
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Status</h1>
          <p className="text-muted-foreground">Monitor and test system health and edge function performance</p>
        </div>
        <Button onClick={runSystemTests} disabled={testing} className="flex items-center gap-2">
          {testing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Activity className="h-4 w-4" />
          )}
          {testing ? 'Running Tests...' : 'Run Full Test Suite'}
        </Button>
      </div>

      {testing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Testing Progress</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="functions">Edge Functions</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(getHealthScore())}%</div>
                <p className="text-xs text-muted-foreground">Overall system status</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Key</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {systemHealth.apiKey ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-sm font-medium">
                    {systemHealth.apiKey ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {systemHealth.database ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-sm font-medium">
                    {systemHealth.database ? 'Online' : 'Offline'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Functions</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {edgeFunctions.filter(f => f.status === 'success').length}/{edgeFunctions.length}
                </div>
                <p className="text-xs text-muted-foreground">Functions operational</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {edgeFunctions.slice(0, 3).map((func, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(func.status)}
                      <div>
                        <div className="font-medium">{func.name}</div>
                        <div className="text-sm text-muted-foreground">{func.description}</div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      {getStatusBadge(func.status)}
                      {func.responseTime && (
                        <div className="text-xs text-muted-foreground">{func.responseTime}ms</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="functions" className="space-y-4">
          <div className="grid gap-4">
            {edgeFunctions.map((func, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(func.status)}
                      {func.name}
                    </CardTitle>
                    {getStatusBadge(func.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{func.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Endpoint:</span> {func.endpoint}
                    </div>
                    {func.responseTime && (
                      <div>
                        <span className="font-medium">Response Time:</span> {func.responseTime}ms
                      </div>
                    )}
                    {func.lastTested && (
                      <div>
                        <span className="font-medium">Last Tested:</span> {func.lastTested}
                      </div>
                    )}
                  </div>
                  
                  {func.error && (
                    <Alert>
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Error:</strong> {func.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Key Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Apify API Key</p>
                    <p className="text-sm text-muted-foreground">Required for scraping operations</p>
                  </div>
                  {systemHealth.apiKey ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      Missing
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Supabase Connection</p>
                    <p className="text-sm text-muted-foreground">Database connectivity and queries</p>
                  </div>
                  {systemHealth.database ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Online
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      Offline
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}