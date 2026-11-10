import { currentAccount } from "@/lib/admin/accounts";
import { canAccess } from "@/lib/admin/permissions";
import { trustedRequest } from "@/lib/admin/security";
import { saveTask, TaskError } from "@/lib/admin/tasks";

export async function POST(request: Request) {
  if (!trustedRequest(request))
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const account = await currentAccount();
    if (!account || !canAccess(account, "tasks"))
      return Response.json({ error: "Access denied." }, { status: 403 });
    return Response.json(
      await saveTask(await request.json().catch(() => null)),
    );
  } catch (error) {
    if (error instanceof TaskError)
      return Response.json({ error: error.message }, { status: error.status });
    if ((error as { statusCode?: number }).statusCode === 409)
      return Response.json(
        { error: "This task changed. Refresh and try again." },
        { status: 409 },
      );
    return Response.json(
      { error: "Could not save changes. Please try again." },
      { status: 500 },
    );
  }
}
