import { signIn, useSession } from 'next-auth/react';
import style from './style.module.scss'

interface SubscribeButtonProps {
   priceId: string;
}

export function SubscribeButton({ priceId }: SubscribeButtonProps) {
   const { data: session } = useSession()

   function handleSubscribe() {
      // Verificar se o usuário está logado
      if (!session) {
         signIn('github')
         return
      }


   }

   return (
      <button type="button" className={style.subscribeButton}>
         Subscribe Now
      </button>
   )
}