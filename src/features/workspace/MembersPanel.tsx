"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/src/lib/api-client";
import { qk } from "@/src/core/sync/query-keys";
import type { MemberRole } from "@/src/core/models/enums";

const ROLES: MemberRole[] = ["owner", "admin", "member", "viewer"];
const INVITE_ROLES: Array<Exclude<MemberRole, "owner">> = [
  "admin",
  "member",
  "viewer",
];

type Props = {
  workspaceId: string;
  currentUserId: string;
  canManage: boolean;
};

export function MembersPanel({ workspaceId, currentUserId, canManage }: Props) {
  const queryClient = useQueryClient();
  const [inviteRole, setInviteRole] = useState<Exclude<MemberRole, "owner">>("member");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const membersQuery = useQuery({
    queryKey: qk.members(workspaceId),
    queryFn: () => api.listMembers(workspaceId),
  });

  const inviteMutation = useMutation({
    mutationFn: () => api.createInvite(workspaceId, inviteRole),
    onSuccess: (result) => {
      setInviteUrl(result.invite.url);
      setCopied(false);
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: MemberRole }) =>
      api.updateMember(workspaceId, userId, role),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.members(workspaceId) });
    },
    onError: (err: Error) => setError(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => api.removeMember(workspaceId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.members(workspaceId) });
    },
    onError: (err: Error) => setError(err.message),
  });

  const members = membersQuery.data?.members ?? [];

  return (
    <div className="flex flex-col gap-6">
      {canManage ? (
        <section className="border border-dashed border-hairline bg-surface p-4">
          <h2 className="text-sm font-medium text-ink">Invite link</h2>
          <p className="mt-1 text-xs text-muted">
            Copy a one-time link. It expires in 7 days.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <select
              value={inviteRole}
              onChange={(event) =>
                setInviteRole(event.target.value as Exclude<MemberRole, "owner">)
              }
              className="h-10 border border-dashed border-hairline bg-canvas px-2 text-sm text-ink"
            >
              {INVITE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => inviteMutation.mutate()}
              className="h-10 bg-ink px-4 text-sm font-semibold text-canvas"
            >
              Generate link
            </button>
          </div>
          {inviteUrl ? (
            <div className="mt-3 flex gap-2">
              <input
                readOnly
                value={inviteUrl}
                className="h-10 flex-1 truncate border border-dashed border-hairline bg-canvas px-3 text-xs text-ink"
              />
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(inviteUrl);
                  setCopied(true);
                }}
                className="h-10 border border-dashed border-hairline px-3 text-sm text-muted"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="overflow-hidden border border-dashed border-hairline bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="font-mono text-[10px] uppercase tracking-wide text-muted">
            <tr className="border-b border-dashed border-hairline">
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Role</th>
              {canManage ? <th className="px-4 py-3" /> : null}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.userId} className="border-b border-dashed border-hairline last:border-0">
                <td className="px-4 py-3">
                  <p className="text-ink">{member.displayName}</p>
                  <p className="text-xs text-muted">{member.email}</p>
                </td>
                <td className="px-4 py-3">
                  {canManage && member.userId !== currentUserId ? (
                    <select
                      value={member.role}
                      onChange={(event) =>
                        roleMutation.mutate({
                          userId: member.userId,
                          role: event.target.value as MemberRole,
                        })
                      }
                      className="h-9 border border-dashed border-hairline bg-canvas px-2 text-xs text-ink"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-mono text-xs uppercase text-muted">
                      {member.role}
                    </span>
                  )}
                </td>
                {canManage ? (
                  <td className="px-4 py-3 text-right">
                    {member.userId !== currentUserId ? (
                      <button
                        type="button"
                        onClick={() => removeMutation.mutate(member.userId)}
                        className="text-xs text-muted hover:text-ink"
                      >
                        Remove
                      </button>
                    ) : null}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {error ? (
        <p className="text-sm text-ink" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
