# CineStream API

API REST em Node.js, Express e Prisma ORM para gerenciar filmes, categorias e a relação muitos-para-muitos entre eles.

## Requisitos

- Node.js 20+
- PostgreSQL

## Configuração

1. Instale as dependências:

	```bash
	npm install
	```

2. Copie `.env.example` para `.env` e ajuste `DATABASE_URL` para o seu PostgreSQL.

3. Crie a estrutura do banco e gere o cliente:

	```bash
	npx prisma migrate dev --name init
	npx prisma generate
	```

4. Inicie a API:

	```bash
	npm run dev
	```

Por padrão, a API fica disponível em `http://localhost:3000`.

## Rotas

| Método | Rota | Corpo esperado |
| --- | --- | --- |
| POST | `/filmes` | `{ "titulo": "Duna", "duracao": 166 }` |
| GET | `/filmes` | - |
| POST | `/categorias` | `{ "nome": "Sci-Fi" }` |
| GET | `/categorias` | - |
| POST | `/filmes/vincular` | `{ "filmeId": 1, "categoriaId": 1 }` |
| GET | `/filmes/:id/categorias` | - |
| PUT | `/filmes` | `{ "id": 1, "titulo": "Duna: Parte Dois", "duracao": 166 }` |
| DELETE | `/filmes/:id/categorias/:categoriaId` | - |
| DELETE | `/filmes/:id` | - |

O endpoint `GET /health` pode ser usado para verificar se o servidor está carregado.