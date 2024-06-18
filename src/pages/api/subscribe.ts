import { stripe } from "@/services/stripe";
import { getSession } from "next-auth/react";
import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
   // Verificar se a requisição é post
   if (req.method === 'POST') {
      //pegar informações do usuário
      const session = await getSession({ req })

      // cria a conta a partir das informações
      const stripeCustomer = await stripe.customers.create({
         email: session?.user?.email
      })

      //criar customer (sessão) no stripe
      const stripeCheckoutSession = await stripe.checkout.sessions.create({
         customer: stripeCustomer.id, //quem está comprando
         payment_method_types: ['card'], //método de pagamento
         billing_address_collection: 'required', //preenchimento de endereço pelo cliente
         line_items: [{
            price: 'price_1PKUZYCloHzuXZAxdOnmcwHb', quantity: 1 //preço e quantidade
         }],
         mode: 'subscription', //pagamento recorrente
         allow_promotion_codes: true, //utilizar cupons de código
         success_url: process.env.STRIPE_SUCESS_URL,
         cancel_url: process.env.STRIPE_CANCEL_URL
      })

      return res.status(200).json({ sessionId: stripeCheckoutSession.id })
   } else {
      //caso o método requisitado não for o post ele irá retornar a seguinte mensagem
      res.setHeader('Allow', 'POST')
      res.status(405).end('Mathod not allowed')
   }
}