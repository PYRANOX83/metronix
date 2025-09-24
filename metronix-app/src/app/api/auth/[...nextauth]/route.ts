import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextRequest } from "next/server"

console.log('=== NEXTAUTH ROUTE HANDLER DEBUG ===')
console.log('authOptions object:', authOptions)
console.log('authOptions.callbacks:', authOptions.callbacks)
console.log('authOptions.providers:', authOptions.providers)
console.log('authOptions.secret:', authOptions.secret)

// Create a wrapper function to log incoming requests
async function handler(req: NextRequest, context: any) {
  console.log('=== INCOMING NEXTAUTH REQUEST ===')
  console.log('URL:', req.url)
  console.log('Method:', req.method)
  console.log('Headers:', Object.fromEntries(req.headers.entries()))
  
  // Add CSRF debugging
  const cookies = req.headers.get('cookie')
  console.log('Cookies:', cookies)
  
  if (req.method === 'POST') {
    try {
      const body = await req.text()
      console.log('Request body:', body)
      
      // Parse the body to check CSRF token
      const params = new URLSearchParams(body)
      const csrfToken = params.get('csrfToken')
      console.log('CSRF Token from body:', csrfToken)
      
      // Recreate the request with the body
      const newReq = new Request(req.url, {
        method: req.method,
        headers: req.headers,
        body: body
      })
      return await NextAuth(newReq, res, authOptions)
    } catch (error) {
      console.error('Error reading request body:', error)
    }
  }
  
  // Call the original NextAuth handler
  return NextAuth(authOptions)(req, context)
}

export { handler as GET, handler as POST }