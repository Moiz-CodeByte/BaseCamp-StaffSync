'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function TestPage() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const callApi = async () => {
    setError(null);
    try {
      const { data } = await api.get('/api/test');
      setResult(data);
    } catch (err) {
      setError(err?.response?.data || { message: err.message });
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Backend Test</h1>
      <Button onClick={callApi}>Call /api/test</Button>
      {result && <pre className="bg-gray-100 p-3 rounded">{JSON.stringify(result, null, 2)}</pre>}
      {error && <pre className="bg-red-100 p-3 rounded">{JSON.stringify(error, null, 2)}</pre>}
    </div>
  );
}
