# Railway

Este diretório descreve o projeto no Railway: a aplicação, o Postgres, o Redis e um volume para as imagens enviadas.

A imagem de produção é o `Dockerfile` da raiz. O Railway detecta esse arquivo e não usa um comando de build separado. Antes de cada deploy, o serviço `app` roda as migrações do Prisma dentro da rede privada.

## Subir

Instale o [Railway CLI](https://docs.railway.com/cli) 5.42.1 ou mais novo. Na raiz do repositório:

```bash
npm install
railway login
railway link
railway config plan
railway config apply
railway up --service app
railway domain --service app
```

`railway link` liga esta pasta a um projeto. Se ainda não existir, o CLI pede para criar um. `railway config plan` só mostra o que seria criado. `railway config apply` cria a aplicação, o Postgres, o Redis e o volume depois da confirmação. `railway up` envia o código e faz o deploy do serviço `app`. `railway domain` gera o endereço público `*.up.railway.app`.

`DATABASE_URL` e `REDIS_URL` vêm do Postgres e do Redis do próprio projeto. Não copie as URLs do `.env` local para o Railway.
