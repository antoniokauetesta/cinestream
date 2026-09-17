import "dotenv/config";
import express from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "./lib/prisma.ts";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

const filmeComCategorias = {
  categorias: {
    include: { categoria: true }
  }
};

const textoObrigatorio = (valor) => typeof valor === "string" && valor.trim().length > 0;
const duracaoValida = (valor) => Number.isInteger(valor) && valor > 0;
const validarFilme = (body) => textoObrigatorio(body.titulo) && duracaoValida(body.duracao)
  ? null
  : "titulo deve ser um texto preenchido e duracao deve ser um inteiro maior que zero";
const validarCategoria = (body) => textoObrigatorio(body.nome) ? null : "nome deve ser um texto preenchido";
const idInteiro = (valor) => Number.isInteger(Number(valor));

app.get("/health", (_request, response) => response.json({ status: "ok" }));

app.post("/filmes", async (request, response) => {
  const erro = validarFilme(request.body);
  return erro
    ? response.status(400).json({ erro })
    : response.status(201).json(await prisma.filme.create({
      data: { titulo: request.body.titulo.trim(), duracao: request.body.duracao },
      include: filmeComCategorias
    }));
});

app.get("/filmes", async (_request, response) => response.json(await prisma.filme.findMany({
  include: filmeComCategorias,
  orderBy: { id: "asc" }
})));

app.post("/categorias", async (request, response) => {
  const erro = validarCategoria(request.body);
  return erro
    ? response.status(400).json({ erro })
    : response.status(201).json(await prisma.categoria.create({
      data: { nome: request.body.nome.trim() },
      include: { filmes: { include: { filme: true } } }
    }));
});

app.get("/categorias", async (_request, response) => response.json(await prisma.categoria.findMany({
  include: { filmes: { include: { filme: true } } },
  orderBy: { id: "asc" }
})));

app.post("/filmes/vincular", async (request, response) => {
  const filmeId = Number(request.body.filmeId);
  const categoriaId = Number(request.body.categoriaId);
  const idsValidos = Number.isInteger(filmeId) && Number.isInteger(categoriaId);

  return !idsValidos
    ? response.status(400).json({ erro: "filmeId e categoriaId devem ser inteiros" })
    : response.status(201).json(await prisma.filmeCategoria.create({
      data: { filmeId, categoriaId },
      include: { filme: true, categoria: true }
    }));
});

app.get("/filmes/:id/categorias", async (request, response) => {
  const filmeId = Number(request.params.id);
  const filme = idInteiro(filmeId)
    ? await prisma.filme.findUnique({ where: { id: filmeId }, include: filmeComCategorias })
    : null;

  return !idInteiro(filmeId)
    ? response.status(400).json({ erro: "id deve ser um inteiro" })
    : filme
      ? response.json(filme.categorias.map(({ categoria }) => categoria))
      : response.status(404).json({ erro: "Filme não encontrado" });
});

app.put("/filmes", async (request, response) => {
  const id = Number(request.body.id);
  const erro = validarFilme(request.body);
  const valido = idInteiro(id) && !erro;

  return !valido
    ? response.status(400).json({ erro: !idInteiro(id) ? "id deve ser um inteiro" : erro })
    : response.json(await prisma.filme.update({
      where: { id },
      data: { titulo: request.body.titulo.trim(), duracao: request.body.duracao },
      include: filmeComCategorias
    }));
});

app.delete("/filmes/:id/categorias/:categoriaId", async (request, response) => {
  const filmeId = Number(request.params.id);
  const categoriaId = Number(request.params.categoriaId);
  const idsValidos = Number.isInteger(filmeId) && Number.isInteger(categoriaId);

  return !idsValidos
    ? response.status(400).json({ erro: "ids devem ser inteiros" })
    : response.status(204).send(await prisma.filmeCategoria.delete({
      where: { filmeId_categoriaId: { filmeId, categoriaId } }
    }).then(() => undefined));
});

app.delete("/filmes/:id", async (request, response) => {
  const id = Number(request.params.id);

  return !idInteiro(id)
    ? response.status(400).json({ erro: "id deve ser um inteiro" })
    : response.status(204).send(await prisma.filme.delete({ where: { id } }).then(() => undefined));
});

app.use((error, _request, response, _next) => {
  const conhecido = error instanceof Prisma.PrismaClientKnownRequestError;
  const statusPorCodigo = { P2002: 409, P2003: 404, P2025: 404 };
  const status = conhecido ? statusPorCodigo[error.code] || 500 : 500;
  const mensagem = status === 409
    ? "Registro duplicado"
    : status === 404
      ? error.code === "P2003" ? "Filme ou categoria não encontrado" : "Registro não encontrado"
      : "Erro interno do servidor";

  return response.status(status).json({ erro: mensagem });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
