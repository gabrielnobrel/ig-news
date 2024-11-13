import { query as q } from 'faunadb';
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { fauna } from '../../../services/fauna';

if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
   throw new Error("Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET environment variables.");
}

export const authOptions = {
   providers: [
      GithubProvider({
         clientId: process.env.GITHUB_CLIENT_ID,
         clientSecret: process.env.GITHUB_CLIENT_SECRET,
      }),
   ],

   callbacks: {
      async session({ session }) {
         try {
            const userActiveSubscription = await fauna.query(
               q.Get(
                  q.Intersection([
                     q.Match(
                        q.Index('subscription_by_user_ref'),
                        q.Select(
                           'ref',
                           q.Get(
                              q.Match(
                                 q.Index('user_by_email'),
                                 q.Casefold(session.user.email)
                              )
                           )
                        )
                     ),
                     q.Match(
                        q.Index('subscription_by_status'),
                        "active"
                     )
                  ])
               )
            );
            return {
               ...session,
               activeSubscription: userActiveSubscription
            };
         } catch (error) {
            console.error("Error fetching active subscription:", error);
            return {
               ...session,
               activeSubscription: null
            };
         }
      },

      async signIn({ user }) {
         const { email } = user;

         if (!email) {
            console.error("User email is missing.");
            return false;
         }

         try {
            await fauna.query(
               q.If(
                  q.Not(
                     q.Exists(
                        q.Match(
                           q.Index('user_by_email'),
                           q.Casefold(email)
                        )
                     )
                  ),
                  q.Create(
                     q.Collection('users'),
                     { data: { email } }
                  ),
                  q.Get(
                     q.Match(
                        q.Index('user_by_email'),
                        q.Casefold(email)
                     )
                  )
               )
            );
            return true;
         } catch (error) {
            console.error("Error signing in user:", error);
            return false;
         }
      }
   }
};

export default NextAuth(authOptions);
