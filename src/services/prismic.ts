import * as Prismic from '@prismicio/client';

const repository = 'ig-news-pro'

export function getPrismicClient(req?: unknown) {
   const prismic = Prismic.createClient(process.env.PRISMIC_ENDPOINT!, {
      accessToken: process.env.PRISMIC_ACCESS_TOKEN,
   });

   return prismic;
}
