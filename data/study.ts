export type ResourceType =
  | "Course"
  | "Tip"
  | "Material"
  | "Test"
  | "Link";

export type CourseTip = {
  title: string;
  text: string;
};

export type CourseMaterial = {
  title: string;
  description: string;
  symbol: string;
  url?: string;
  fileUrl?: string;
};

export type CourseLink = {
  title: string;
  description?: string;
  url: string;
};

export type CourseDetails = {
  overview?: string;

  tips: CourseTip[];

  materials: CourseMaterial[];

  exam?: {
    format?: string;
    experience?: string;
  };

  links: CourseLink[];
};

export type Resource = {
  title: string;

  slug?: string;

  externalUrl?: string;

  fileUrl?: string;

  course?: string;

  type: ResourceType;

  description: string;

  tag: string;

  symbol: string;

  author?: string;

  order?: number;

  details?: CourseDetails;
};

export const filters = [
  "All",
  "Courses",
  "Tips",
  "Materials",
  "Tests",
  "Useful Links",
] as const;

export type Filter =
  (typeof filters)[number];

export const survivalItems = [
  {
    title: "How InSIS works",

    text:
      "Courses, grades, registrations and the parts worth knowing.",

    number: "01",
  },

  {
    title: "Exam registration",

    text:
      "What to watch out for before exam season begins.",

    number: "02",
  },

  {
    title: "First semester",

    text:
      "A practical checklist for students starting at VŠE.",

    number: "03",
  },

  {
    title:
      "Useful university services",

    text:
      "Libraries, printing, study spaces and other useful resources.",

    number: "04",
  },
];

export const studyHighlights = [
  {
    number: "01",

    title: "Course Tips",

    description:
      "Advice, materials and insights from students who have already taken the course.",

    label: "Subjects",

    accent: "blue",
  },

  {
    number: "02",

    title: "Useful Links",

    description:
      "InSIS, university systems, forms and other things you will eventually need.",

    label: "Resources",

    accent: "lightBlue",
  },

  {
    number: "03",

    title: "Student Survival",

    description:
      "Practical advice about university life, Prague and all the things nobody explains at the start.",

    label: "Student life",

    accent: "green",
  },

  {
    number: "04",

    title: "Exam Prep",

    description:
      "Study tips, exam advice and useful information before things get stressful.",

    label: "Exams",

    accent: "lightBlue",
  },
];

export function matchesFilter(
  resource: Resource,
  filter: Filter
) {
  if (filter === "All") {
    return true;
  }

  if (filter === "Courses") {
    return (
      resource.type ===
      "Course"
    );
  }

  if (filter === "Tips") {
    return (
      resource.type ===
      "Tip"
    );
  }

  if (filter === "Materials") {
    return (
      resource.type ===
      "Material"
    );
  }

  if (filter === "Tests") {
    return (
      resource.type ===
      "Test"
    );
  }

  if (
    filter ===
    "Useful Links"
  ) {
    return (
      resource.type ===
      "Link"
    );
  }

  return true;
}