import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function TestApifyAccess() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testInProgress, setTestInProgress] = useState(false);

  const testApifyAccess = async () => {
    setLoading(true);
    setTestInProgress(true);
    try {
      console.log('🔍 Starting Apify API key test...');
      const { data, error } = await supabase.functions.invoke('test-apify-access', {
        body: {}
      });
      
      if (error) {
        console.error('❌ Test failed:', error);
        setResult({ error: error.message, timestamp: new Date().toISOString() });
      } else {
        console.log('✅ Test completed:', data);
        setResult(data);
      }
    } catch (err) {
      console.error('❌ Test exception:', err);
      setResult({ error: err.message, timestamp: new Date().toISOString() });
    } finally {
      setLoading(false);
      setTestInProgress(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean, label: string) => {
    return (
      <Badge variant={success ? "default" : "destructive"} className="flex items-center gap-1">
        {getStatusIcon(success)}
        {label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Diagnostics</h1>
          <p className="text-muted-foreground">Test Apify API integration and system health</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Apify API Key Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button onClick={testApifyAccess} disabled={loading} className="flex items-center gap-2">
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {loading ? 'Running Diagnostics...' : 'Run Full Diagnostic'}
            </Button>
            
            {testInProgress && (
              <Badge variant="outline" className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Testing in progress...
              </Badge>
            )}
          </div>
          
          {result && (
            <div className="space-y-4">
              <Separator />
              
              {/* Status Overview */}
              {result.diagnostics && (
                <div className="space-y-3">
                  <h3 className="font-semibold">System Status Overview</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {getStatusBadge(result.diagnostics.apifyKeyExists, 'API Key Found')}
                    {result.diagnostics.environment && getStatusBadge(result.diagnostics.environment.supabaseUrl, 'Supabase URL')}
                    {result.diagnostics.environment && getStatusBadge(result.diagnostics.environment.supabaseServiceKey, 'Service Key')}
                    {result.apifyTestResult && getStatusBadge(result.apifyTestResult.success, 'API Connection')}
                  </div>
                </div>
              )}

              {/* Key Information */}
              {result.diagnostics && (
                <div className="space-y-3">
                  <h3 className="font-semibold">API Key Information</h3>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Key Status:</span> {result.diagnostics.apifyKeyExists ? 'Found' : 'Not Found'}
                      </div>
                      <div>
                        <span className="font-medium">Key Length:</span> {result.diagnostics.apifyKeyLength || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Key Preview:</span> {result.diagnostics.apifyKeyPrefix || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Test Time:</span> {new Date(result.diagnostics.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* API Test Results */}
              {result.apifyTestResult && (
                <div className="space-y-3">
                  <h3 className="font-semibold">API Connection Test</h3>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Status:</span> {result.apifyTestResult.success ? 'Success' : 'Failed'}
                      </div>
                      {result.apifyTestResult.status && (
                        <div>
                          <span className="font-medium">HTTP Status:</span> {result.apifyTestResult.status}
                        </div>
                      )}
                      {result.apifyTestResult.error && (
                        <div className="col-span-2">
                          <span className="font-medium">Error:</span> {result.apifyTestResult.error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Environment Debug Info */}
              {result.diagnostics?.allEnvKeys && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Environment Variables</h3>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm mb-2">Available API-related environment variables:</p>
                    <div className="flex flex-wrap gap-1">
                      {result.diagnostics.allEnvKeys.map((key: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {result.error && (
                <Alert>
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Test Failed:</strong> {result.error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Message */}
              {result.success && result.message && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Test Successful:</strong> {result.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Raw Data (Collapsible) */}
              <details className="space-y-2">
                <summary className="cursor-pointer font-medium">Show Raw Test Data</summary>
                <div className="bg-muted p-4 rounded-lg overflow-auto">
                  <pre className="text-xs">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}