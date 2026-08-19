import type { CatechesisDoc } from "../data/defaultContent";

export function fileKind(fileName: string, href: string) {
  const source = `${fileName} ${href}`.toLowerCase();
  if (source.includes(".pdf") || source.includes("application/pdf")) return "PDF";
  if (source.includes(".doc")) return "DOC";
  if (source.includes(".ppt")) return "PPT";
  if (source.includes("data:")) return "ARCHIVO";
  return "DOC";
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
          <span className="catechesis__kind">
            {fileKind(doc.fileName, doc.href)}
          </span>
          <h3>{doc.title}</h3>
          {doc.description ? <p>{doc.description}</p> : null}
          {doc.href ? (
            <a
              className="catechesis__link"
              href={doc.href}
              download={doc.fileName || undefined}
              target={doc.href.startsWith("data:") ? undefined : "_blank"}
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
