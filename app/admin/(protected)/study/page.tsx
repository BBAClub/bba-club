import StudyReviewActions from "@/components/StudyReviewActions";
import {
  DraftLink,
  DraftPage,
  DraftTable,
  Metrics,
  Panel,
} from "@/components/AdminSectionDraft";
import { requireAdminPermission } from "@/lib/admin/auth";
import { client } from "@/sanity/lib/client";

type Submission = {
  _id: string;
  title?: string;
  course?: string;
  description?: string;
  url?: string;
  status?: string;
  submittedAt?: string;
  hasFile: boolean;
};
type Resource = {
  _id: string;
  title?: string;
  slug?: string;
  isPublished?: boolean;
};

export default async function StudyAdminPage() {
  await requireAdminPermission("study");
  const data = await client.fetch<{
    pending: number;
    submissions: Submission[];
    resources: Resource[];
  }>(
    `{
    "pending": count(*[_type == "submission" && status == "pending"]),
    "submissions": *[_type == "submission"] | order(select(status == "pending" => 0, 1) asc, submittedAt desc)[0...30] {_id,title,course,description,url,status,submittedAt,"hasFile":defined(privateFile.pathname)},
    "resources": *[_type == "studyResource"] | order(title asc) {_id,title,"slug":slug.current,"isPublished":coalesce(isPublished,true)}
  }`,
    {},
    { cache: "no-store" },
  );
  return (
    <DraftPage
      title="Study"
      description="See incoming Study Hub submissions and the current resource library."
    >
      <Metrics
        items={[
          { label: "Pending review", value: data.pending },
          {
            label: "Published resources",
            value: data.resources.filter((resource) => resource.isPublished)
              .length,
          },
        ]}
      />
      <Panel title="Submissions to review">
        <DraftTable
          headers={[
            "Title",
            "Course",
            "Status",
            "Submitted",
            "Attachment",
            "Review",
          ]}
          empty="No submissions yet."
          rows={data.submissions.map((item) => ({
            id: item._id,
            cells: [
              <div key={item._id} className="max-w-sm whitespace-normal">
                <p className="font-medium">{item.title || "Untitled"}</p>
                {(item.description || /^https?:\/\//i.test(item.url || "")) && (
                  <details className="mt-2 text-[#A9B5C3]">
                    <summary className="cursor-pointer text-[#8EC5FF]">
                      View submission
                    </summary>
                    {item.description && (
                      <p className="mt-2 whitespace-pre-wrap break-words">
                        {item.description}
                      </p>
                    )}
                    {item.url && /^https?:\/\//i.test(item.url) && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-[#8EC5FF] underline"
                      >
                        Open submitted link
                      </a>
                    )}
                  </details>
                )}
              </div>,
              item.course || "—",
              item.status || "—",
              item.submittedAt?.slice(0, 10) || "—",
              item.hasFile && item._id.startsWith("private.submission-") ? (
                <a
                  className="text-[#8EC5FF] underline"
                  href={`/api/study-submissions/file?submissionId=${encodeURIComponent(item._id)}`}
                >
                  Open file
                </a>
              ) : (
                "—"
              ),
              item.status === "pending" &&
              item._id.startsWith("private.submission-") ? (
                <StudyReviewActions submissionId={item._id} />
              ) : (
                "—"
              ),
            ],
          }))}
        />
      </Panel>
      <Panel title="Resource library">
        <DraftTable
          headers={["Resource", "Visibility"]}
          empty="No study resources yet."
          rows={data.resources.map((item) => ({
            id: item._id,
            cells: [
              item.isPublished && item.slug ? (
                <DraftLink href={`/study/${encodeURIComponent(item.slug)}`}>
                  {item.title || "Untitled"}
                </DraftLink>
              ) : (
                item.title || "Untitled"
              ),
              item.isPublished ? "Published" : "Unpublished",
            ],
          }))}
        />
      </Panel>
    </DraftPage>
  );
}
