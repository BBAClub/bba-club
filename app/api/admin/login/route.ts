import {
  NextResponse,
} from "next/server";

import {
  createAdminSession,
  verifyAdminPassword,
} from "@/lib/admin/auth";

export const runtime =
  "nodejs";

type LoginBody = {
  password?: unknown;
};

export async function POST(
  request: Request
) {
  try {
    let body:
      LoginBody;

    try {
      body =
        (await request.json()) as
          LoginBody;
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid request.",
        },
        {
          status: 400,
        }
      );
    }

    const password =
      typeof body.password ===
        "string"
        ? body.password
        : "";

    if (
      !verifyAdminPassword(
        password
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid password.",
        },
        {
          status: 401,
        }
      );
    }

    await createAdminSession();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Admin login error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not sign in.",
      },
      {
        status: 500,
      }
    );
  }
}