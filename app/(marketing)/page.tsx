import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { DotMatrixNumeral } from "@/src/components/DotMatrix";
import { NoirlyLoginButton } from "@/src/features/auth/NoirlyLoginButton";
import { ensureFlowAccount } from "@/src/server/auth/bootstrap";

export const metadata: Metadata = {
  title: "Noirly Flow",
  description:
    "Task boards, workspaces, and realtime collaboration for the Noirly ecosystem.",
};

const features = [
  {
    index: "01",
    title: "Boards",
    copy: "Projects as columns and cards you can reorder live.",
  },
  {
    index: "02",
    title: "Workspaces",
    copy: "Teams, members, and invites under one roof.",
  },
  {
    index: "03",
    title: "Inbox",
    copy: "Mentions, assignments, and activity in one feed.",
  },
  {
    index: "04",
    title: "Realtime",
    copy: "Updates land as they happen across the board.",
  },
  {
    index: "05",
    title: "Identity",
    copy: "Sign in once with Noirly Identity — email or Google.",
  },
  {
    index: "06",
    title: "Settings",
    copy: "Flow profile stays here; account lives in Identity.",
  },
];

export default async function LandingPage() {
  const session = await auth();
  if (session?.user?.id) {
    const account = await ensureFlowAccount({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    });
    redirect(`/w/${account.personalWorkspace.id}`);
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between gap-6 border-b border-dashed border-hairline px-5 py-5 md:px-10">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-light.png"
            alt=""
            width={48}
            height={48}
            className="h-11 w-11 border border-dashed border-hairline dark:hidden md:h-12 md:w-12"
            priority
          />
          <Image
            src="/logo-dark.png"
            alt=""
            width={48}
            height={48}
            className="hidden h-11 w-11 border border-dashed border-hairline dark:block md:h-12 md:w-12"
            priority
          />
          <p className="font-display text-lg font-bold tracking-[-0.04em] uppercase md:text-2xl">
            Noirly Flow
          </p>
        </div>
        <Link
          href="/login"
          className="font-mono text-[11px] font-semibold tracking-[0.16em] uppercase transition-colors hover:bg-ink hover:text-canvas"
        >
          Sign in
        </Link>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="pointer-events-none hidden w-10 shrink-0 items-center justify-center border-r border-dashed border-hairline lg:flex">
          <span className="font-mono text-[10px] font-medium tracking-[0.28em] uppercase [writing-mode:vertical-rl] rotate-180">
            flow.noirly.com
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <section className="relative overflow-hidden px-5 py-12 md:px-12 md:py-20">
            <div className="mb-8 flex items-center gap-5">
              <Image
                src="/logo-light.png"
                alt=""
                width={96}
                height={96}
                className="h-20 w-20 border border-dashed border-hairline dark:hidden md:h-24 md:w-24"
                priority
              />
              <Image
                src="/logo-dark.png"
                alt=""
                width={96}
                height={96}
                className="hidden h-20 w-20 border border-dashed border-hairline dark:block md:h-24 md:w-24"
                priority
              />
              <div>
                <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-muted">
                  Workspace 1.0
                </p>
                <p className="mt-2 font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
                  Plan. Execute. Ship.
                </p>
              </div>
            </div>
            <h1 className="text-perforated mt-4 max-w-[10ch] font-display text-[18vw] leading-[0.8] font-bold tracking-[-0.07em] uppercase md:text-[9rem]">
              Flow
            </h1>
            <DotMatrixNumeral className="mt-6 block text-5xl md:text-7xl">
              1.0
            </DotMatrixNumeral>
          </section>

          <section className="bg-panel px-5 py-10 text-panel-ink md:px-12 md:py-14">
            <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-panel-ink/50">
              Task management
            </p>
            <p className="mt-4 max-w-2xl font-display text-2xl leading-snug font-medium tracking-[-0.03em] md:text-4xl">
              Boards, workspaces, and realtime collaboration for Noirly
              products — signed in through Noirly Identity.
            </p>
            <div className="mt-8 flex max-w-sm flex-col gap-3">
              <NoirlyLoginButton redirectTo="/" />
              <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-panel-ink/50">
                Opens Identity in a secure popup
              </p>
            </div>
          </section>

          <section className="relative border-t border-dashed border-hairline">
            <div className="relative min-h-[200px] w-full bg-surface md:min-h-[280px]">
              <Image
                src="/feature-light.png"
                alt="Noirly Flow"
                fill
                className="object-contain p-8 dark:hidden md:p-12"
                sizes="100vw"
                priority
              />
              <Image
                src="/feature-dark.png"
                alt="Noirly Flow"
                fill
                className="hidden object-contain p-8 dark:block md:p-12"
                sizes="100vw"
                priority
              />
            </div>
          </section>

          <section className="grid gap-0 border-t border-dashed border-hairline md:grid-cols-2 xl:grid-cols-3">
            {features.map((item) => (
              <div
                key={item.index}
                className="flex min-h-44 flex-col justify-between gap-6 border-b border-r border-dashed border-hairline px-5 py-8 md:px-8"
              >
                <DotMatrixNumeral className="text-3xl">{item.index}</DotMatrixNumeral>
                <div>
                  <h2 className="font-display text-xl font-semibold tracking-[-0.03em]">
                    {item.title}
                  </h2>
                  <p className="mt-1 font-mono text-[11px] tracking-[0.08em] uppercase opacity-60">
                    {item.copy}
                  </p>
                </div>
              </div>
            ))}
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-hairline px-5 py-6 font-mono text-[10px] tracking-[0.16em] uppercase text-muted md:px-12">
            <span className="flex items-center gap-3">
              <Image
                src="/logo-light.png"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 dark:hidden"
              />
              <Image
                src="/logo-dark.png"
                alt=""
                width={28}
                height={28}
                className="hidden h-7 w-7 dark:block"
              />
              Noirly Flow
            </span>
            <span>Boards / Workspaces / Realtime</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
