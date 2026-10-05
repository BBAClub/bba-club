import SubmitForm, {
  type CourseOption,
} from "./SubmitForm";

import { client } from "@/sanity/lib/client";

export const dynamic =
  "force-dynamic";

const COURSE_OPTIONS_QUERY = `
  *[
    _type == "studyResource"
    && resourceType == "Course"
    && defined(title)
  ]
  | order(title asc) {
    _id,
    title,
    "slug": slug.current
  }
`;

export default async function StudySubmitPage() {
  const courses =
    await client.fetch<
      CourseOption[]
    >(
      COURSE_OPTIONS_QUERY
    );

  return (
    <SubmitForm
      courses={courses}
    />
  );
}