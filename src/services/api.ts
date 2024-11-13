//Esse serviço serve para conectar o backend com o frontend
import axios from 'axios'

export const api = axios.create({
   baseURL: '/api'
})
