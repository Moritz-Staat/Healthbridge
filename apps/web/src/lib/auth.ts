import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const res = await fetch(`${process.env.API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        })
        if (!res.ok) return null
        const { token, user } = await res.json()
        return { ...user, accessToken: token }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.accessToken = (user as any).accessToken
        token.userId = user.id
      }
      return token
    },
    session({ session, token }) {
      session.user.role = token.role as string
      session.user.accessToken = token.accessToken as string
      session.user.userId = token.userId as string
      return session
    },
  },
  pages: { signIn: '/login' },
})

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      accessToken: string
      userId: string
    }
  }
}
