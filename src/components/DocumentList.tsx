import { useState } from "react";
import type { CatechesisDoc } from "../data/defaultContent";

export function fileKind(fileName: string, href: string) {
  const source = `${fileName} ${href}`.toLowerCase();
  if (source.includes(".pdf") || source.includes("application/pdf")) return "PDF";
  if (source.includes(".doc")) return "DOC";
  if (source.includes(".ppt")) return "PPT";
  if (source.includes("data:")) return "ARCHIVO";
  return "DOC";
}

export function coverForDoc(doc: CatechesisDoc) {
  if (doc.coverUrl) return doc.coverUrl;
  const source = `${doc.fileName} ${doc.href}`;
  if (!/\.pdf($|\?)/i.test(source)) return "";
  const file = doc.href.split("?")[0].split("/").pop() || "";
  if (!file.toLowerCase().endsWith(".pdf")) return "";
  return `/docs/covers/${file.replace(/\.pdf$/i, "")}.webp`;
}

function DocCover({ doc }: { doc: CatechesisDoc }) {
  const [failed, setFailed] = useState(false);
  const cover = coverForDoc(doc);
  const kind = fileKind(doc.fileName, doc.href);

  if (!cover || failed) {
    return (
      <div className="catechesis__cover catechesis__cover--empty" aria-hidden="true">
        <span>{kind}</span>
      </div>
    );
  }

  return (
    <img
      className="catechesis__cover"
      src={cover}
      alt={`Portada de ${doc.title}`}
      width={240}
      height={320}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export function DocumentList({
  docs,
  emptyTitle,
  emptyText,
}: {
  docs: CatechesisDoc[];
  emptyTitle: string;
  emptyText: string;
}) {
  if (!docs.length) {
    return (
      <div className="catechesis__empty">
        <span>Materiales</span>
        <h3>{emptyTitle}</h3>
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="catechesis__grid">
      {docs.map((doc, index) => (
        <article
          key={doc.id}
          className={`catechesis__card reveal reveal-delay-${(index % 4) + 1}`}
        >
          {doc.href ? (
            <a
              className="catechesis__cover-link"
              href={doc.href}
              target="_blank"
              rel="noreferrer"
            >
              <DocCover doc={doc} />
            </a>
          ) : (
            <DocCover doc={doc} />
          )}
          <span className="catechesis__kind">
            {fileKind(doc.fileName, doc.href)}
          </span>
          <h3>{doc.title}</h3>
          {doc.description ? <p>{doc.description}</p> : null}
          {doc.href ? (
            <a
              className="catechesis__link"
              href={doc.href}
              download={
                /\.pdf($|\?)/i.test(doc.fileName || doc.href)
                  ? undefined
                  : doc.fileName || undefined
              }
              target="_blank"
              rel="noreferrer"
            >
              Abrir documento
              <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <span className="catechesis__soon">Próximamente</span>
          )}
        </article>
      ))}
    </div>
  );
}
