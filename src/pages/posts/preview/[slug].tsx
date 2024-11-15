import { GetStaticProps } from "next"
import Head from 'next/head'
import { RichText } from "prismic-dom"
import Link from "next/link"

import { getPrismicClient } from "@/services/prismic"

import styles from '../post.module.scss'
import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { useRouter } from "next/router"

interface PostPreviewProps {
   post: {
      slug: string,
      title: string,
      content: string,
      updatedAt: string
   }
}

export default function PostPreview({ post }: PostPreviewProps) {
   const { data: session } = useSession()
   const router = useRouter()

   useEffect(() => {
      if (session?.activeSubscription) {
         router.push(`/posts/${post.slug}`)
      }
   }, [session])

   return (
      <>
         <Head>
            <title>{post.title} | ig.news </title>
         </Head>

         <main className={styles.container}>
            <article className={styles.post}>
               <h1>{post.title}</h1>
               <time>{post.updatedAt}</time>
               <div className={`${styles.postContent} ${styles.previewContent}`} dangerouslySetInnerHTML={{ __html: post.content }} />

               <div className={styles.continueReading}>
                  Wanna continue reading? 🤗
                  <Link legacyBehavior href="/">
                     <a href="">Subscribe now 🤗</a>
                  </Link>
               </div>
            </article>
         </main>
      </>
   )
}

export const getStaticPaths = () => {
   return {
      paths: [],
      fallback: 'blocking'
   }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
   // Pegar o slug do post
   const { slug } = params

   // Realiza um requisição para o prismic
   const prismic = getPrismicClient()

   const response = await prismic.getByUID('post', String(slug))

   //Formatação dos dados
   const post = {
      slug,
      title: RichText.asText(response.data.title),
      content: RichText.asHtml(response.data.content.splice(0, 3)), //transformar para html
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
      },
      redirect: 60 * 30 // 30 minutes
   }
}