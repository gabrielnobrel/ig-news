import { stripe } from "@/services/stripe";
import { NextApiRequest, NextApiResponse } from "next";
import { Readable } from "stream";
import Stripe from "stripe";
import { saveSubscription } from "./_lib/manageSubscription";

// Essa função existe por padrão
async function buffer(readable: Readable) {
   const chuncks = [];

   for await (const chunck of readable) {
      chuncks.push(
         typeof chunck === "string" ? Buffer.from(chunck) : chunck
      )
   }

   return Buffer.concat(chuncks)
}

export const config = {
   api: {
      bodyParser: false
   }
}

const relevantEvents = new Set([
   'checkout.session.completed',
   'customer.subscription.updated',
   'customer.subscription.deleted'
])

export default async (req: NextApiRequest, res: NextApiResponse) => {
   if (req.method === 'POST') {
      const buf = await buffer(req)
      const secret = req.headers['stripe-signature'] // Pega os headers da aplicação na seção indicada

      // Verificando a coerência dos dados recebidos com o webhook
      let event: Stripe.Event // eventos que vem do webhook

      try {
         event = stripe.webhooks.constructEvent(buf, secret, process.env.STRIPE_WEBHOOK_SECRET!)
      } catch (err) {
         return res.status(400).send(`Webhook error: ${err.message}`)
      }

      const { type } = event

      if (relevantEvents.has(type)) {
         try {
            switch (type) {
               case 'customer.subscription.updated':
               case 'customer.subscription.deleted':
                  const subscription = event.data.object as Stripe.Subscription //do tipo subscription

                  await saveSubscription(
                     subscription.id,
                     subscription.customer.toString(),
                     false
                  )
                  break;

               case 'checkout.session.completed':
                  const checkoutSession = event.data.object as Stripe.Checkout.Session

                  //Enviando informações para a função saveSubscription
                  await saveSubscription(
                     checkoutSession.subscription.toString(),
                     checkoutSession.customer.toString(),
                     true
                  )
                  break;
               default:
                  throw new Error('Unhandled event.')
            }
         } catch (err) {
            return res.json({ error: 'Webhook handler failed' })
         }
      }

      res.json({ received: true })
   } else {
      // Caso o método não seja 'POST', retornar erro 405
      res.setHeader('Allow', 'POST');
      res.status(405).end('Method not allowed');
   }
}