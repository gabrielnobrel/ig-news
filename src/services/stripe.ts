import Stripe from 'stripe'
import { version } from "../../package.json"

export const stripe = new Stripe(
   process.env.STRIPE_API_KEY!,
   {
      apiVersion: '2024-04-10',
      appInfo: {
         name: 'Ignews',
         version
      }
   }
)