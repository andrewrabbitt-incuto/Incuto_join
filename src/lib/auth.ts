import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      tenantId: string
      tenantSlug: string
      tenantName: string
    }
  }
  interface User {
    id: string
    role: string
    tenantId: string
    tenantSlug: string
    tenantName: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    tenantId: string
    tenantSlug: string
    tenantName: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        tenantSlug: { label: 'Tenant', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.tenantSlug) return null

        // Find tenant
        const tenant = await prisma.tenant.findUnique({
          where: { slug: credentials.tenantSlug },
        })
        if (!tenant) return null

        // Find user
        const user = await prisma.user.findUnique({
          where: { tenantId_email: { tenantId: tenant.id, email: credentials.email } },
        })
        if (!user) return null

        // DEMO MODE: skip password check
        const isDemoMode = process.env.DEMO_MODE === 'true'
        if (!isDemoMode && credentials.password) {
          if (!user.password) return null
          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          tenantName: tenant.name,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.tenantId = user.tenantId
        token.tenantSlug = user.tenantSlug
        token.tenantName = user.tenantName
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.tenantId = token.tenantId
        session.user.tenantSlug = token.tenantSlug
        session.user.tenantName = token.tenantName
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}
