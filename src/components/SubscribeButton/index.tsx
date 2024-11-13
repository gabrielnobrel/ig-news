import { signIn, useSession } from 'next-auth/react';
import style from './style.module.scss'
import { api } from '../../services/api';
import { getStripeJs } from '@/services/stripe-js';
import { useRouter } from 'next/router';

interface SubscribeButtonProps {
   priceId: string;
}

export function SubscribeButton({ priceId }: SubscribeButtonProps) {
   const { data: session } = useSession()
   const router = useRouter()

   async function handleSubscribe() {
      // Verificar se o usuário está logado
      if (!session) {
         signIn('github')
         return
      }

      // Caso tiver o activeSubscription ele redicionará o usuário para posts
      if (session.activeSubscription) {
         router.push('/posts')
         return
      }

      // Chamada para api
      try {
         const response = await api.post('/subscribe') // enviar o subscribe

         const { sessionId } = response.data

         const stripe = await getStripeJs()

         // Redirecionando o cliente para o checkout
         await stripe?.redirectToCheckout({ sessionId })
      } catch (err) {
         alert((err as Error).message)
      }
   }

   return (
      <button type="button" className={style.subscribeButton} onClick={handleSubscribe}>
         Subscribe Now
      </button>
   )
}