import { query as q } from 'faunadb'

import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"

import { fauna } from '../../../services/fauna'

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
   ],
   callbacks: {
      async signIn({ user, account, profile }) {
         const { email } = user
         try {
            await fauna.query(
               // Verificar se o usuário existe
               q.If(
                  q.Not(
                     q.Exists(
                        //O Match é como se fosse where
                        q.Match(
                           q.Index('user_by_email'),
                           q.Casefold(user.email) //colocar tudo minúsculo, para quando o ususário escrever de qualquer jeito
                        )
                     )
                  ),
                  //caso ele não exista será criado
                  q.Create(
                     q.Collection('users'),
                     {
                        data: {
                           email
                        }
                     }
                  ),
                  //caso contrário ele vai pegar esse usuário
                  q.Get(
                     q.Match(
                        q.Index('user_by_email'),
                        q.Casefold(user.email)
                     )
                  )
               )
            )
            return true
         } catch {
            return false
         }
         return true
      }
   }
}

export default NextAuth(authOptions)