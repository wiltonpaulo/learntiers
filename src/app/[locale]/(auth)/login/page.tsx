import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { loginAction } from '@/lib/actions/auth'

interface LoginPageProps {
  searchParams: Promise<{ error?: string; message?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const locale = await getLocale()
  const { error, message } = await searchParams

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">LearnTiers</CardTitle>
          <CardDescription>Sign in to your account to continue learning.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {decodeURIComponent(error)}
            </p>
          )}
          {message && (
            <p className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">
              {decodeURIComponent(message)}
            </p>
          )}

          <form action={loginAction} className="space-y-4">
            {/* Pass locale to the action */}
            <input type="hidden" name="locale" value={locale} />

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <Button className="w-full" type="submit">
              Log in
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href={`/${locale}/register`}
              className="underline underline-offset-4 hover:text-primary"
            >
              Create account
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
