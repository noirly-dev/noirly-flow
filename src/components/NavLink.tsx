"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ComponentProps } from "react";
import { useUIStore } from "@/src/stores/ui-store";

type Props = ComponentProps<typeof Link>;

export function useOptimisticPath(): string {
  const pathname = usePathname();
  const pendingHref = useUIStore((state) => state.pendingHref);

  useEffect(() => {
    if (!pendingHref) return;
    if (
      pathname === pendingHref ||
      pathname.startsWith(`${pendingHref}/`) ||
      pendingHref.startsWith(`${pathname}/`)
    ) {
      useUIStore.getState().setPendingHref(null);
    }
  }, [pathname, pendingHref]);

  return pendingHref ?? pathname;
}

export function NavLink({
  href,
  onClick,
  className,
  children,
  ...rest
}: Props) {
  const pathname = usePathname();
  const url = typeof href === "string" ? href : (href.pathname ?? "");

  return (
    <Link
      href={href}
      prefetch
      onClick={(event) => {
        const nextPath = url.split("?")[0] ?? "";
        if (nextPath && pathname === nextPath) {
          event.preventDefault();
          onClick?.(event);
          return;
        }
        if (nextPath) {
          useUIStore.getState().setPendingHref(nextPath);
        }
        onClick?.(event);
      }}
      className={className}
      {...rest}
    >
      {children}
    </Link>
  );
}
