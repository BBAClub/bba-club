import {
  NextResponse,
} from "next/server";

import {
  client,
} from "@/sanity/lib/client";

import {
  isAdminAuthenticated,
} from "@/lib/admin/auth";

export const runtime =
  "nodejs";

export async function DELETE(
  request: Request,
  context: {
    params:
      Promise<{
        slug: string;
      }>;
  }
) {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          error:
            "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const writeToken =
      process.env
        .SANITY_API_WRITE_TOKEN;

    if (!writeToken) {
      return NextResponse.json(
        {
          error:
            "Server configuration is incomplete.",
        },
        {
          status: 500,
        }
      );
    }

    const {
      slug,
    } =
      await context.params;

    const event =
      await client.fetch<{
        _id: string;
        title: string;
        registrationCount: number;
      } | null>(
        `
          *[
            _type == "event"
            && slug.current == $slug
          ][0] {
            _id,
            title,

            "registrationCount":
              count(
                *[
                  _type == "eventRegistration"
                  && event._ref == ^._id
                ]
              )
          }
        `,
        {
          slug,
        }
      );

    if (!event) {
      return NextResponse.json(
        {
          error:
            "Event not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      event.registrationCount >
      0
    ) {
      return NextResponse.json(
        {
          error:
            "This event cannot be deleted because it already has registrations.",
        },
        {
          status: 409,
        }
      );
    }

    const writeClient =
      client.withConfig({
        token:
          writeToken,

        useCdn:
          false,
      });

    await writeClient.delete(
      event._id
    );

    return NextResponse.json({
      success: true,

      event: {
        _id:
          event._id,

        title:
          event.title,
      },
    });
  } catch (error) {
    console.error(
      "Admin event deletion error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not delete event.",
      },
      {
        status: 500,
      }
    );
  }
}
