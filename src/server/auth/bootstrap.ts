import { withDb } from "@/src/server/db/mongodb";
import {
  BoardColumn,
  FlowUser,
  Project,
  Workspace,
  WorkspaceMembership,
  type FlowUserDocument,
  type WorkspaceDocument,
} from "@/src/server/models";

export type BootstrapSessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

export type BootstrappedAccount = {
  user: {
    id: string;
    identitySub: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
  };
  personalWorkspace: {
    id: string;
    name: string;
    slug: string;
    kind: "personal";
  };
  defaultProject: {
    id: string;
    name: string;
  } | null;
};

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return base || "workspace";
}

async function ensurePersonalWorkspace(
  user: FlowUserDocument,
): Promise<{
  workspace: WorkspaceDocument;
  projectId: string | null;
  projectName: string | null;
}> {
  const existingMembership = await WorkspaceMembership.findOne({
    userId: user._id,
    role: "owner",
  }).lean();

  if (existingMembership) {
    const workspace = await Workspace.findOne({
      _id: existingMembership.workspaceId,
      kind: "personal",
    });
    if (workspace) {
      const project = await Project.findOne({
        workspaceId: workspace._id,
        deletedAt: null,
      })
        .sort({ createdAt: 1 })
        .lean();
      return {
        workspace,
        projectId: project?._id.toString() ?? null,
        projectName: project?.name ?? null,
      };
    }
  }

  const slugBase = slugify(`${user.displayName}-personal`);
  let slug = slugBase;
  let n = 0;
  while (await Workspace.exists({ slug })) {
    n += 1;
    slug = `${slugBase}-${n}`;
  }

  const workspace = await Workspace.create({
    kind: "personal",
    name: "Personal",
    slug,
    ownerUserId: user._id,
  });

  await WorkspaceMembership.create({
    workspaceId: workspace._id,
    userId: user._id,
    role: "owner",
  });

  const project = await Project.create({
    workspaceId: workspace._id,
    name: "Inbox board",
    description: "Your default personal project",
    defaultView: "board",
  });

  await BoardColumn.insertMany([
    {
      projectId: project._id,
      name: "Todo",
      statusMapped: "todo",
      position: 1000,
    },
    {
      projectId: project._id,
      name: "In progress",
      statusMapped: "in_progress",
      position: 2000,
    },
    {
      projectId: project._id,
      name: "Done",
      statusMapped: "done",
      position: 3000,
    },
  ]);

  return {
    workspace,
    projectId: project._id.toString(),
    projectName: project.name,
  };
}

/** Upsert Flow user from Identity session and ensure a personal workspace exists. */
export async function ensureFlowAccount(
  sessionUser: BootstrapSessionUser,
): Promise<BootstrappedAccount> {
  if (!sessionUser.id) {
    throw new Error("Session is missing Identity subject (sub)");
  }

  return withDb(async () => {
    const email =
      sessionUser.email?.trim().toLowerCase() || `${sessionUser.id}@users.local`;
    const displayName =
      sessionUser.name?.trim() || email.split("@")[0] || "Noirly user";

    const user = await FlowUser.findOneAndUpdate(
      { identitySub: sessionUser.id },
      {
        $set: {
          email,
          displayName,
          avatarUrl: sessionUser.image ?? null,
          emailVerified: Boolean(sessionUser.email),
        },
        $setOnInsert: {
          identitySub: sessionUser.id,
        },
      },
      { upsert: true, returnDocument: "after" },
    );

    if (!user) {
      throw new Error("Failed to upsert Flow user");
    }

    const { workspace, projectId, projectName } =
      await ensurePersonalWorkspace(user);

    return {
      user: {
        id: user._id.toString(),
        identitySub: user.identitySub,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? null,
      },
      personalWorkspace: {
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
        kind: "personal",
      },
      defaultProject:
        projectId && projectName ? { id: projectId, name: projectName } : null,
    };
  });
}
