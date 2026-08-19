import { type MouseEventHandler, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

export function resolveHref(href: string, pathname: string) {
  if (href.startsWith("#") && pathname !== "/") {
    return `/${href}`;
  }
  return href;
}

export function SiteLink({
  href,
  className,
  onClick,
  children,
}: {
  href: string;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  children: ReactNode;
}) {
  const { pathname } = useLocation();
  const to = resolveHref(href, pathname);

  if (to.startsWith("/") && !to.startsWith("//")) {
    return (
      <Link to={to} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <a href={to} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
