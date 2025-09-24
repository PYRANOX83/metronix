import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

console.log('=== AUTH OPTIONS INITIALIZING ===')
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set')
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)

export const authOptions: NextAuthOptions = {
  // Temporarily disable Prisma adapter due to network issues
  // adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('=== AUTHORIZE FUNCTION CALLED ===')
        console.log('=== THIS IS A TEST TO SEE IF AUTHORIZE IS CALLED ===')
        console.log('Credentials received:', credentials)
        try {
          
          if (!credentials?.email || !credentials?.password) {
            console.log('Missing credentials')
            return null
          }

          console.log('Attempting to find user with email:', credentials.email)
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          console.log('User lookup result:', user)

          if (!user) {
            console.log('User not found')
            return null
          }

          if (!user.password) {
            console.log('User has no password')
            return null
          }

          console.log('User found, checking password...')
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          console.log('Password validation result:', isPasswordValid)

          if (!isPasswordValid) {
            console.log('Password invalid')
            return null
          }

          console.log('Authentication successful for user:', user.id)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('Error in authorize function:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.role = user.role
        }
        return token
      } catch (error) {
        console.error('JWT callback error:', error)
        return token
      }
    },
    async session({ session, token }) {
      try {
        if (token && session.user) {
          session.user.id = token.sub || ''
          session.user.role = token.role as string || 'CITIZEN'
        }
        return session
      } catch (error) {
        console.error('Session callback error:', error)
        return session
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
}