import { GetServerSideProps } from "next"
import { getSession } from "next-auth/react"
import Head from 'next/head'
import { RichText } from "prismic-dom"

import { getPrismicClient } from "@/services/prismic"

import styles from './post.module.scss'

interface PostProps {
   post: {
      slug: string,
      title: string,
      content: string,
      updatedAt: string
   }
}

export default function Post({ post }: PostProps) {
   return (
      <>
         <Head>
            <title>{post.title} | ig.news </title>
         </Head>

         <main className={styles.container}>
            <article className={styles.post}>
               <h1>{post.title}</h1>
               <time>{post.updatedAt}</time>
               <div className={styles.postContent} dangerouslySetInnerHTML={{ __html: post.content }} />
            </article>
         </main>
      </>
   )
}

export const getServerSideProps: GetServerSideProps = async ({ req, params }) => {
   // Verificar se o usuário está logado, antes de renderizar a página
   const session = await getSession({ req })

   // Pegar o slug do post
   const { slug } = params

   // Realiza um requisição para o prismic
   const prismic = getPrismicClient(req)

   const response = await prismic.getByUID('post', String(slug))

   //retornar para a home, caso não seja inscrito, ou seja, se não tiver o status de active
   if (!session?.activeSubscription) {
      return {
         redirect: {
            destination: '/',
            permanent: false
         }
      }
   }

   //Formatação dos dados
   const post = {
      slug,
      title: RichText.asText(response.data.title),
      content: RichText.asHtml(response.data.content), //transformar para html
      //Formatação da data
      updatedAt: new Date(response.last_publication_date).toLocaleDateString('pt-BR', {
         day: '2-digit',
         month: 'long',
         year: 'numeric'
      })
   }

   return {
      props: {
         post
      }
   }
}