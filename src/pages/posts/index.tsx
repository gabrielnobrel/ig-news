import { GetStaticProps } from 'next'
import Head from 'next/head'
import styles from './styles.module.scss'
import * as Prismic from "@prismicio/client";
import { getPrismicClient } from '@/services/prismic';
import { RichText } from 'prismic-dom';
import Link from 'next/link';

type Post = {
   slug: string,
   title: string,
   excerpt: string,
   updatedAt: string
}

interface PostsProps {
   posts: Post[]
}

export default function Posts({ posts }: PostsProps) {
   return (
      <>
         <Head>
            <title>Posts | ig.news</title>
         </Head>

         <main className={styles.container}>
            <div className={styles.posts}>
               {posts.map(post => (
                  <Link legacyBehavior href={`/posts/${post.slug}`}>
                     <a key={post.slug}>
                        <time>
                           {post.updatedAt}
                        </time>
                        <strong>{post.title}</strong>
                        <p>{post.excerpt}</p>
                     </a>
                  </Link>
               ))}
            </div>
         </main>
      </>
   )
}

export const getStaticProps: GetStaticProps = async () => {
   const prismic = getPrismicClient();

   const response = await prismic.getAllByType('post', {
      fetch: "[post.data.title, post.data.description]",
      pageSize: 100,
      predicates: [Prismic.filter.at("document.type", "post")],
   })

   console.log(JSON.stringify(response, null, 2))

   // Formatação de dados
   const posts = response.map((post) => {
      return {
         // Formatação dos dados 
         slug: post.uid,
         title: RichText.asText(post.data.title), // Pegar o título do psot
         excerpt: post.data.content.find((content: { type: string; }) => content.type === 'paragraph')?.text ?? '', // pegar somente o parágrafo 
         updatedAt: new Date(post.last_publication_date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
         })
      }
   })
   return {
      props: { posts }
   }
}