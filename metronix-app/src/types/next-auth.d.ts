import type {} from "next-auth"

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
    }
  }

  interface User {
    id: string
    role: string
  }
}

// Extend the JWT types
declare module "next-auth/jwt" {
  interface JWT {
    role: string
  }
}