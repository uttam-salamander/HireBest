'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState<'candidate' | 'recruiter'>('candidate')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          user_type: userType,
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (authData.user) {
      // Create profile in appropriate table
      if (userType === 'candidate') {
        const { error: profileError } = await supabase.from('candidates').insert({
          id: authData.user.id,
          name,
          email,
        })

        if (profileError) {
          console.error('Error creating candidate profile:', profileError)
        }
      } else {
        const { error: profileError } = await supabase.from('recruiters').insert({
          id: authData.user.id,
          name,
          email,
        })

        if (profileError) {
          console.error('Error creating recruiter profile:', profileError)
        }
      }

      router.push('/assessments')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <span className="font-display text-xl font-bold text-primary-foreground">H</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              HireBest
            </h1>
          </div>
          <p className="text-muted-foreground">
            Create your account
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border p-8 shadow-sm">
          <form onSubmit={handleSignup} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                I am a:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType('candidate')}
                  className={`py-3 px-4 rounded-md border-2 font-medium transition-colors ${
                    userType === 'candidate'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-muted-foreground'
                  }`}
                >
                  Candidate
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('recruiter')}
                  className={`py-3 px-4 rounded-md border-2 font-medium transition-colors ${
                    userType === 'recruiter'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-muted-foreground'
                  }`}
                >
                  Recruiter
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-md border border-border bg-card text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-md border border-border bg-card text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 rounded-md border border-border bg-card text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="••••••••"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 6 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
