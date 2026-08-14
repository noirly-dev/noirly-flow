"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "@/src/lib/api-client";

const TIMEZONES = [
  { value: "", label: "Not set" },
  { value: "UTC", label: "UTC" },
  { value: "America/Los_Angeles", label: "Pacific Time" },
  { value: "America/Denver", label: "Mountain Time" },
  { value: "America/Chicago", label: "Central Time" },
  { value: "America/New_York", label: "Eastern Time" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Asia/Kolkata", label: "India (Kolkata)" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Australia/Sydney", label: "Sydney" },
];

type Props = {
  identityName: string;
  identityEmail: string;
  identityUrl: string;
};

export function SettingsView({
  identityName,
  identityEmail,
  identityUrl,
}: Props) {
  const queryClient = useQueryClient();
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => api.me(),
    staleTime: 60_000,
  });

  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [timezone, setTimezone] = useState("");
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const profile = meQuery.data?.user.profile;
    if (!profile) return;
    setDisplayName(profile.displayName ?? "");
    setTitle(profile.title ?? "");
    setTimezone(profile.timezone ?? "");
    setBio(profile.bio ?? "");
  }, [meQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      api.updateMe({
        displayName: displayName.trim() || null,
        title: title.trim() || null,
        timezone: timezone.trim() || null,
        bio: bio.trim() || null,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["me"], data);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    },
  });

  const identityHome = identityUrl.replace(/\/$/, "");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-10">
      <div>
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted">
          Account
        </p>
        <h1 className="text-perforated mt-2 font-display text-5xl font-bold tracking-[-0.05em] uppercase">
          Settings
        </h1>
        <p className="mt-2 text-sm text-muted">
          Sign-in details live in Noirly Identity. Optional Flow fields stay in
          this product only.
        </p>
      </div>

      <section className="border border-dashed border-hairline bg-surface p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              Noirly Identity
            </p>
            <h2 className="mt-1 text-sm font-medium text-ink">Account</h2>
          </div>
          {identityHome ? (
            <a
              href={`${identityHome}/account`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[11px] uppercase tracking-wide text-muted hover:text-ink"
            >
              Open Identity →
            </a>
          ) : null}
        </div>
        <dl className="mt-4 grid gap-3 font-mono text-xs text-muted">
          <div className="flex justify-between gap-4 border-b border-dashed border-hairline pb-3">
            <dt>Name</dt>
            <dd className="text-ink">{identityName || "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Email</dt>
            <dd className="text-ink">{identityEmail || "—"}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted">
          Password, Google login, and account details are managed in Identity.
          Open Identity uses your Identity session when you are already signed
          in there.
        </p>
      </section>

      <section className="border border-dashed border-hairline bg-surface p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          Noirly Flow
        </p>
        <h2 className="mt-1 text-sm font-medium text-ink">Profile</h2>
        <p className="mt-1 text-xs text-muted">
          Optional. Used in boards, comments, and members here. Other Noirly
          products keep their own profiles.
        </p>

        <form
          className="mt-5 flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            saveMutation.mutate();
          }}
        >
          <label className="space-y-1 text-xs text-muted">
            Display name
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={identityName || "How you appear in Flow"}
              maxLength={80}
              className="h-10 w-full border border-dashed border-hairline bg-canvas px-3 text-sm text-ink outline-none placeholder:text-muted"
            />
          </label>
          <label className="space-y-1 text-xs text-muted">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Role or title in this workspace"
              maxLength={80}
              className="h-10 w-full border border-dashed border-hairline bg-canvas px-3 text-sm text-ink outline-none placeholder:text-muted"
            />
          </label>
          <label className="space-y-1 text-xs text-muted">
            Timezone
            <select
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              className="h-10 w-full border border-dashed border-hairline bg-canvas px-3 text-sm text-ink"
            >
              {TIMEZONES.map((zone) => (
                <option key={zone.value || "none"} value={zone.value}>
                  {zone.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs text-muted">
            Bio
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="A short note about how you work"
              maxLength={280}
              rows={3}
              className="w-full resize-none border border-dashed border-hairline bg-canvas px-3 py-2 text-sm text-ink outline-none placeholder:text-muted"
            />
          </label>
          {saveMutation.isError ? (
            <p className="text-sm text-ink" role="alert">
              {(saveMutation.error as Error).message}
            </p>
          ) : null}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="h-10 bg-ink px-4 text-sm font-semibold text-canvas disabled:opacity-50"
            >
              {saveMutation.isPending ? "Saving…" : "Save Flow profile"}
            </button>
            {saved ? (
              <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
                Saved
              </p>
            ) : null}
          </div>
        </form>
      </section>
    </main>
  );
}
