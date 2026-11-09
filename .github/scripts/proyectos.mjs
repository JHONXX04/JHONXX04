import { readFile, writeFile } from "node:fs/promises";

const USUARIO = "JHONXX04";
const INICIO = "<!-- PROYECTOS:INICIO -->";
const FIN = "<!-- PROYECTOS:FIN -->";
const MAX_PROYECTOS = 6;

const respuesta = await fetch(
  `https://api.github.com/users/${USUARIO}/repos?per_page=100&sort=updated`,
  {
    headers: {
      Authorization: `Bearer ${process.env.GH_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": USUARIO,
    },
  }
);

if (!respuesta.ok) {
  throw new Error(`La API de GitHub respondió ${respuesta.status}`);
}

const repos = (await respuesta.json())
  .filter((repo) => !repo.fork && !repo.archived && repo.name !== USUARIO)
  .sort((a, b) => b.stargazers_count - a.stargazers_count);

function fila(repo) {
  const descripcion = (repo.description ?? "Sin descripción").replace(/\|/g, "\\|");
  const lenguaje = repo.language ? `\`${repo.language}\`` : "—";
  return `| [**${repo.name}**](${repo.html_url}) | ${descripcion} | ${lenguaje} | ⭐ ${repo.stargazers_count} |`;
}

let contenido;

if (repos.length === 0) {
  contenido =
    "> Aún no hay proyectos públicos. En cuanto publiques el primero, aparecerá aquí automáticamente.";
} else {
  contenido = [
    "| Proyecto | Descripción | Lenguaje | Estrellas |",
    "| :--- | :--- | :---: | :---: |",
    ...repos.slice(0, MAX_PROYECTOS).map(fila),
  ].join("\n");
}

const readme = await readFile("README.md", "utf8");
const patron = new RegExp(`${INICIO}[\\s\\S]*?${FIN}`);

if (!patron.test(readme)) {
  throw new Error("No se encontraron los marcadores PROYECTOS:INICIO / PROYECTOS:FIN en README.md");
}

const actualizado = readme.replace(patron, `${INICIO}\n${contenido}\n${FIN}`);

await writeFile("README.md", actualizado, "utf8");
console.log(`Proyectos publicados: ${repos.length}`);
