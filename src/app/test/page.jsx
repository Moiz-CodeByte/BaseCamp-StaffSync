'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function TestPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Deprecated</h1>
      <p className="text-sm text-muted-foreground">This page has been deprecated. Please use the role-based dashboards from the navbar.</p>
    </div>
  );
}
