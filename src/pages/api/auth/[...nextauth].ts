import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"

if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
   throw new Error("Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET environment variables.");
}

export const authOptions = {
   // Configure one or more authentication providers
   providers: [
      GithubProvider({
         clientId: process.env.GITHUB_CLIENT_ID,
         clientSecret: process.env.GITHUB_CLIENT_SECRET,
      }),
   ]
}

export default NextAuth(authOptions)