import { Client } from 'faunadb'

//Para ter acesso ao BD
export const fauna = new Client({
   secret: process.env.FAUNADB_KEY!
})