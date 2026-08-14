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
        <section className="rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] p-4">
          <h2 className="text-sm font-medium text-[#F5F5F5]">Invite link</h2>
          <p className="mt-1 text-xs text-[#A3A3A3]">
            Copy a one-time link. It expires in 7 days.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <select
              value={inviteRole}
              onChange={(event) =>
                setInviteRole(event.target.value as Exclude<MemberRole, "owner">)
              }
              className="h-10 rounded-lg border border-[#2A2A2A] bg-[#121212] px-2 text-sm text-[#F5F5F5]"
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
              className="h-10 rounded-lg bg-[#52D3FE] px-4 text-sm font-semibold text-[#121212]"
            >
              Generate link
            </button>
          </div>
          {inviteUrl ? (
            <div className="mt-3 flex gap-2">
              <input
                readOnly
                value={inviteUrl}
                className="h-10 flex-1 truncate rounded-lg border border-[#2A2A2A] bg-[#121212] px-3 text-xs text-[#F5F5F5]"
              />
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(inviteUrl);
                  setCopied(true);
                }}
                className="h-10 rounded-lg border border-[#2A2A2A] px-3 text-sm text-[#A3A3A3]"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1E1E1E]">
        <table className="w-full text-left text-sm">
          <thead className="font-mono text-[10px] uppercase tracking-wide text-[#737373]">
            <tr className="border-b border-[#2A2A2A]">
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Role</th>
              {canManage ? <th className="px-4 py-3" /> : null}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.userId} className="border-b border-[#2A2A2A] last:border-0">
                <td className="px-4 py-3">
                  <p className="text-[#F5F5F5]">{member.displayName}</p>
                  <p className="text-xs text-[#737373]">{member.email}</p>
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
                      className="h-9 rounded-md border border-[#2A2A2A] bg-[#121212] px-2 text-xs text-[#F5F5F5]"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-mono text-xs uppercase text-[#A3A3A3]">
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
                        className="text-xs text-[#A3A3A3] hover:text-[#D9A759]"
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
        <p className="text-sm text-[#D9A759]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
