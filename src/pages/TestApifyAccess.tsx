import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export default function TestApifyAccess() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testApifyAccess = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-apify-access', {
        body: {}
      });
      
      if (error) {
        setResult({ error: error.message });
      } else {
        setResult(data);
      }
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Apify API Key Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testApifyAccess} disabled={loading}>
            {loading ? 'Testing...' : 'Test Apify Access'}
          </Button>
          
          {result && (
            <div className="bg-muted p-4 rounded-lg overflow-auto">
              <pre className="text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}