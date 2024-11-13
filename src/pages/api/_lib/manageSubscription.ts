import { query as q } from "faunadb";
import { fauna } from "@/services/fauna";
import { stripe } from "@/services/stripe";

export async function saveSubscription(
   subscriptionId: string,
   customerId: string,
   createAction = false
) {
   // Buscar o usuário no banco do faunaDB com o ID do customerId
   // Salvar os dados da subscription do usuário no FaunaDB

   const userRef = await fauna.query(
      q.Select(
         "ref",
         q.Get(
            q.Match(
               q.Index('user_by_stripe_customer_id'),
               customerId
            )
         )
      )
   )

   // Pegar a subscription do stripe
   const subscription = await stripe.subscriptions.retrieve(subscriptionId)

   // Pegar dados específicos do subscription
   const subscriptionData = {
      id: subscription.id,
      userId: userRef,
      status: subscription.status,
      price_id: subscription.items.data[0].price.id, //pegando a primeira posição
   }

   // Repassar para o banco de dados
   if (createAction) {
      await fauna.query(
         q.Create(
            q.Collection('subscriptions'),
            { data: subscriptionData }
         )
      )
   } else {
      // Substituir os dados
      await fauna.query(
         q.Replace(
            q.Select(
               "ref",
               q.Get(
                  q.Match(
                     q.Index('subscription_by_id'),
                     subscriptionId
                  )
               )
            ),
            { data: subscriptionData }
         )
      )
   }
}