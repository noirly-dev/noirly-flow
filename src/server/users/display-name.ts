type Named = {
  displayName: string;
  profile?: { displayName?: string | null } | null;
};

export function resolveFlowDisplayName(user: Named | null | undefined): string {
  const override = user?.profile?.displayName?.trim();
  if (override) return override;
  return user?.displayName?.trim() || "Unknown";
}
