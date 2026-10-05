import type {
  StructureResolver,
} from "sanity/structure";

export const structure: StructureResolver =
  (S) => {
    /*
      Běžné document types.

      Submission a Event Registration
      odstraníme z automatického seznamu,
      protože pro ně máme vlastní admin sekce.
    */

    const regularDocumentTypes =
      S.documentTypeListItems().filter(
        (item) =>
          item.getId() !==
            "submission" &&
          item.getId() !==
            "eventRegistration"
      );

    return S.list()
      .title("Content")
      .items([
        ...regularDocumentTypes,

        S.divider(),

        /*
          STUDENT SUBMISSIONS
        */

        S.listItem()
          .title(
            "Student Submissions"
          )
          .child(
            S.list()
              .title(
                "Student Submissions"
              )
              .items([
                /*
                  PENDING
                */

                S.listItem()
                  .title("Pending")
                  .child(
                    S.documentList()
                      .title(
                        "Pending Submissions"
                      )
                      .schemaType(
                        "submission"
                      )
                      .filter(
                        '_type == "submission" && status == "pending"'
                      )
                      .defaultOrdering([
                        {
                          field:
                            "submittedAt",
                          direction:
                            "desc",
                        },
                      ])
                  ),

                /*
                  APPROVED
                */

                S.listItem()
                  .title("Approved")
                  .child(
                    S.documentList()
                      .title(
                        "Approved Submissions"
                      )
                      .schemaType(
                        "submission"
                      )
                      .filter(
                        '_type == "submission" && status == "approved"'
                      )
                      .defaultOrdering([
                        {
                          field:
                            "submittedAt",
                          direction:
                            "desc",
                        },
                      ])
                  ),

                /*
                  REJECTED
                */

                S.listItem()
                  .title("Rejected")
                  .child(
                    S.documentList()
                      .title(
                        "Rejected Submissions"
                      )
                      .schemaType(
                        "submission"
                      )
                      .filter(
                        '_type == "submission" && status == "rejected"'
                      )
                      .defaultOrdering([
                        {
                          field:
                            "submittedAt",
                          direction:
                            "desc",
                        },
                      ])
                  ),

                S.divider(),

                /*
                  ALL SUBMISSIONS
                */

                S.listItem()
                  .title(
                    "All Submissions"
                  )
                  .child(
                    S.documentList()
                      .title(
                        "All Submissions"
                      )
                      .schemaType(
                        "submission"
                      )
                      .filter(
                        '_type == "submission"'
                      )
                      .defaultOrdering([
                        {
                          field:
                            "submittedAt",
                          direction:
                            "desc",
                        },
                      ])
                  ),
              ])
          ),

        S.divider(),

        /*
          EVENT REGISTRATIONS
        */

        S.listItem()
          .title(
            "Event Registrations"
          )
          .child(
            S.list()
              .title(
                "Event Registrations"
              )
              .items([
                /*
                  BY EVENT
                */

                S.listItem()
                  .title("By Event")
                  .child(
                    S.documentTypeList(
                      "event"
                    )
                      .title(
                        "Events"
                      )
                      .child(
                        (
                          eventId
                        ) =>
                          S.documentList()
                            .title(
                              "Registrations"
                            )
                            .schemaType(
                              "eventRegistration"
                            )
                            .filter(
                              '_type == "eventRegistration" && event._ref == $eventId'
                            )
                            .params({
                              eventId,
                            })
                            .defaultOrdering(
                              [
                                {
                                  field:
                                    "registeredAt",
                                  direction:
                                    "desc",
                                },
                              ]
                            )
                      )
                  ),

                S.divider(),

                /*
                  CONFIRMED
                */

                S.listItem()
                  .title(
                    "Confirmed"
                  )
                  .child(
                    S.documentList()
                      .title(
                        "Confirmed Registrations"
                      )
                      .schemaType(
                        "eventRegistration"
                      )
                      .filter(
                        '_type == "eventRegistration" && status == "confirmed"'
                      )
                      .defaultOrdering([
                        {
                          field:
                            "registeredAt",
                          direction:
                            "desc",
                        },
                      ])
                  ),

                /*
                  WAITLIST
                */

                S.listItem()
                  .title(
                    "Waitlist"
                  )
                  .child(
                    S.documentList()
                      .title(
                        "Waitlist"
                      )
                      .schemaType(
                        "eventRegistration"
                      )
                      .filter(
                        '_type == "eventRegistration" && status == "waitlist"'
                      )
                      .defaultOrdering([
                        {
                          field:
                            "registeredAt",
                          direction:
                            "asc",
                        },
                      ])
                  ),

                /*
                  CHECKED IN
                */

                S.listItem()
                  .title(
                    "Checked In"
                  )
                  .child(
                    S.documentList()
                      .title(
                        "Checked In"
                      )
                      .schemaType(
                        "eventRegistration"
                      )
                      .filter(
                        '_type == "eventRegistration" && status == "checked-in"'
                      )
                      .defaultOrdering([
                        {
                          field:
                            "checkedInAt",
                          direction:
                            "desc",
                        },
                      ])
                  ),

                /*
                  CANCELLED
                */

                S.listItem()
                  .title(
                    "Cancelled"
                  )
                  .child(
                    S.documentList()
                      .title(
                        "Cancelled Registrations"
                      )
                      .schemaType(
                        "eventRegistration"
                      )
                      .filter(
                        '_type == "eventRegistration" && status == "cancelled"'
                      )
                      .defaultOrdering([
                        {
                          field:
                            "registeredAt",
                          direction:
                            "desc",
                        },
                      ])
                  ),

                S.divider(),

                /*
                  ALL REGISTRATIONS
                */

                S.listItem()
                  .title(
                    "All Registrations"
                  )
                  .child(
                    S.documentList()
                      .title(
                        "All Registrations"
                      )
                      .schemaType(
                        "eventRegistration"
                      )
                      .filter(
                        '_type == "eventRegistration"'
                      )
                      .defaultOrdering([
                        {
                          field:
                            "registeredAt",
                          direction:
                            "desc",
                        },
                      ])
                  ),
              ])
          ),
      ]);
  };