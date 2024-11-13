import { NextApiRequest, NextApiResponse } from "next";
import { query as q } from "faunadb";
import { getSession } from "next-auth/react";
import { fauna } from "@/services/fauna";
import { stripe } from "@/services/stripe";

type User = {
   ref: {
      id: string;
   }
   data: {
      stripe_customer_id: string
   }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
   // Verificar se a requisição é post
   if (req.method === 'POST') {
      //pegar informações do usuário
      const session = await getSession({ req })

      // Verificar se o usuário está logado
      if (!session || !session.user || !session.user.email) {
         return res.status(401).json({ error: "User not authenticated" });
      }

      // Pegando o email do usuário do fauna que seja o mesmo que ele fez login
      const user = await fauna.query<User>(
         q.Get(
            q.Match(
               q.Index('user_by_email'),
               q.Casefold(session?.user?.email)
            )
         )
      )

      let customerId = user.data.stripe_customer_id

      // Verifica se o usário contém o customer id no banco fauna, caso contrário será inserido a informação no BD
      if (!customerId) {
         // Criar conta no Stripe com as informações do usuário
         const stripeCustomer = await stripe.customers.create({
            email: session.user.email,
         });

         // Enviando para o fauna a informação que está sendo pego do stripe
         await fauna.query(
            q.Update(
               q.Ref(q.Collection('users'), user.ref.id),
               {
                  data: {
                     stripe_customer_id: stripeCustomer.id
                  }
               }
            )
         )
         customerId = stripeCustomer.id
      }

      // Criar uma sessão de checkout no Stripe
      const stripeCheckoutSession = await stripe.checkout.sessions.create({
         customer: customerId,
         payment_method_types: ['card'],
         billing_address_collection: 'required',
         line_items: [
            {
               price: 'price_1PKUZYCloHzuXZAxdOnmcwHb',
               quantity: 1
            }
         ],
         mode: 'subscription',
         allow_promotion_codes: true,
         success_url: process.env.STRIPE_SUCCESS_URL!,
         cancel_url: process.env.STRIPE_CANCEL_URL!
      });

      return res.status(200).json({ sessionId: stripeCheckoutSession.id });
   } else {
      // Caso o método não seja 'POST', retornar erro 405
      res.setHeader('Allow', 'POST');
      res.status(405).end('Method not allowed');
   }
}