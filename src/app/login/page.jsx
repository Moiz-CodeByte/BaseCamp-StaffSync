'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      await login(data.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* SVG Illustration Side */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="w-full max-w-lg">
            <Image
              src="/login.svg"
              alt="Login Illustration"
              width={700}
              height={420}
              priority
              className="w-full h-auto"
            />
            {/* <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
             
              <circle cx="250" cy="250" r="200" fill="#E0E7FF" className="dark:opacity-20"/>
              
              
              <rect x="120" y="180" width="260" height="180" rx="10" fill="#4F46E5"/>
              <rect x="130" y="190" width="240" height="130" rx="5" fill="#EEF2FF"/>
              
              
              <rect x="145" y="205" width="70" height="40" rx="3" fill="#818CF8" opacity="0.6"/>
              <rect x="225" y="205" width="70" height="40" rx="3" fill="#A5B4FC" opacity="0.6"/>
              <rect x="305" y="205" width="50" height="40" rx="3" fill="#C7D2FE" opacity="0.6"/>
              
              <rect x="145" y="255" width="210" height="8" rx="2" fill="#E0E7FF"/>
              <rect x="145" y="270" width="180" height="8" rx="2" fill="#E0E7FF"/>
              <rect x="145" y="285" width="150" height="8" rx="2" fill="#E0E7FF"/>
              
              
              <circle cx="100" cy="320" r="30" fill="#FCD34D"/>
              <ellipse cx="100" cy="380" rx="45" ry="55" fill="#4F46E5"/>
              <circle cx="90" cy="315" r="4" fill="#1F2937"/>
              <circle cx="110" cy="315" r="4" fill="#1F2937"/>
              <path d="M 90 330 Q 100 335 110 330" stroke="#1F2937" strokeWidth="2" fill="none"/>
              
              
              <g opacity="0.8">
                <circle cx="420" cy="150" r="25" fill="#10B981"/>
                <path d="M 410 150 L 417 157 L 430 142" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
              </g>
              
              <g opacity="0.8">
                <circle cx="80" cy="120" r="20" fill="#F59E0B"/>
                <rect x="72" y="112" width="16" height="16" rx="2" fill="white"/>
                <rect x="76" y="116" width="8" height="8" fill="#F59E0B"/>
              </g>
              
              <g opacity="0.8">
                <circle cx="420" cy="350" r="22" fill="#8B5CF6"/>
                <circle cx="420" cy="345" r="6" fill="white"/>
                <path d="M 420 351 L 420 363" stroke="white" strokeWidth="2"/>
                <path d="M 420 363 L 415 370" stroke="white" strokeWidth="2"/>
                <path d="M 420 363 L 425 370" stroke="white" strokeWidth="2"/>
              </g>
              
              
              <circle cx="450" cy="250" r="5" fill="#4F46E5" opacity="0.3"/>
              <circle cx="50" cy="250" r="5" fill="#4F46E5" opacity="0.3"/>
              <circle cx="250" cy="80" r="5" fill="#4F46E5" opacity="0.3"/>
              <circle cx="250" cy="420" r="5" fill="#4F46E5" opacity="0.3"/>
            </svg> */}
          
            <div className="text-center mt-8 space-y-2">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">BaseCamp StaffSync</h2>
              <p className="text-muted-foreground">Streamline your HR operations effortlessly</p>
            </div>
          </div>
        </div>

        {/* Login Form Side */}
        <div className="w-full max-w-md mx-auto">
          <div className="rounded-2xl border bg-card shadow-2xl p-8 space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
              <p className="text-sm text-muted-foreground">Sign in to access your dashboard</p>
            </div>
            
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="h-11"
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="h-11"
                  required 
                />
              </div>
              
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{String(error)}</p>
                </div>
              )}
              
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-11 bg-primary text-primary-foreground font-medium text-base hover:bg-primary/90"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            
            <div className="text-center pt-4 border-t">
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
