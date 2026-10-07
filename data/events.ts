export type EventStatus =
  | "upcoming"
  | "past";

export type RegistrationStatus =
  | "coming-soon"
  | "open"
  | "closed"
  | "full";

export type Event = {
  slug: string;

  date: string;
  month: string;

  title: string;
  description: string;
  fullDescription: string[];

  location: string;
  venue: string;
  address?: string;

  time: string;

  /*
    Cena vstupu v CZK.

    0 = zdarma
    undefined = cena zatím není uvedena
  */
  price?: number;

  gradient: string;
  label: string;

  status: EventStatus;

  capacity?: number;

  highlights?: string[];

  registration: {
    status: RegistrationStatus;
    deadline?: string;
    url?: string;
    note?: string;
  };
};

export const events: Event[] = [
  {
    slug: "welcome-drinks",

    date: "12",
    month: "APR",

    title: "Welcome Drinks",

    description:
      "Meet new students and start the semester together.",

    fullDescription: [
      "Welcome Drinks is an opportunity to meet other BBA students in a relaxed setting and get to know people from across the programme.",
      "More detailed information about the venue, programme and registration will be added once the event is confirmed.",
    ],

    location: "Prague",
    venue:
      "Venue to be announced",

    time: "19:00",

    price: 0,

    gradient:
      "from-[#0057FF] via-[#164EA6] to-[#102B4C]",

    label: "SOCIAL",

    status: "upcoming",

    highlights: [
      "Meet other BBA students",
      "Informal social evening",
      "Open to the BBA community",
    ],

    registration: {
      status: "coming-soon",
      note:
        "Registration details will be announced later.",
    },
  },

  {
    slug: "prague-walk",

    date: "19",
    month: "APR",

    title: "Prague Walk",

    description:
      "Discover the city and some of our favourite places.",

    fullDescription: [
      "Explore Prague together with other students and discover places worth knowing beyond the university campus.",
      "The final route, meeting point and other practical details will be published before the event.",
    ],

    location: "Prague 1",
    venue:
      "Meeting point to be announced",

    time: "14:00",

    price: 0,

    gradient:
      "from-[#164B64] via-[#1D596B] to-[#163449]",

    label: "EXPLORE",

    status: "upcoming",

    highlights: [
      "Discover Prague",
      "Meet other students",
      "Student-friendly city recommendations",
    ],

    registration: {
      status: "coming-soon",
      note:
        "Registration details will be announced later.",
    },
  },

  {
    slug: "bba-community-night",

    date: "26",
    month: "APR",

    title:
      "BBA Community Night",

    description:
      "An evening to meet people from across the programme.",

    fullDescription: [
      "BBA Community Night brings students from across the programme together for an informal evening.",
      "More information about the location, programme and registration will be added closer to the event.",
    ],

    location: "Prague",
    venue:
      "Venue to be announced",

    time: "19:00",

    price: 0,

    gradient:
      "from-[#343064] via-[#243A66] to-[#10243A]",

    label: "COMMUNITY",

    status: "upcoming",

    highlights: [
      "Meet students across BBA",
      "Community-focused evening",
      "Informal networking",
    ],

    registration: {
      status: "coming-soon",
      note:
        "Registration details will be announced later.",
    },
  },
];