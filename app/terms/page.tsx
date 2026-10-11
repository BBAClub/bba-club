import type { Metadata } from "next";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms & Conditions | BBA Club",
  description:
    "Terms and conditions for BBA Club events, registrations, tickets, payments, cancellations and refunds.",
};

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-white/10 py-10 first:border-t-0 first:pt-0 md:py-12">
      <div className="grid gap-5 md:grid-cols-[120px_1fr] md:gap-10">
        <div>
          <span className="text-sm font-semibold text-[#5790FF]">
            {number}
          </span>
        </div>

        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold tracking-[-0.025em] text-[#F6F8FB] md:text-3xl">
            {title}
          </h2>

          <div className="mt-5 space-y-4 text-sm leading-7 text-[#A9B5C3] md:text-base md:leading-8">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#071422] text-[#F6F8FB]">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10 px-6 py-14 md:py-20 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(0,87,255,0.16),transparent_35%)]" />

        <div className="relative mx-auto max-w-7xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8EC5FF] md:text-xs">
            Legal
          </p>

          <h1 className="mt-4 max-w-4xl text-[42px] font-bold leading-[0.98] tracking-[-0.045em] sm:text-5xl md:mt-5 md:text-7xl">
            Terms &amp;
            <br />
            <span className="text-[#0057FF]">
              Conditions.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-[#A9B5C3] md:mt-7 md:text-lg md:leading-8">
            These terms explain how registrations, tickets, payments,
            cancellations and refunds work for events organised by
            BBA Club.
          </p>

          <p className="mt-6 text-sm text-[#53687D]">
            Last updated: October 11, 2026
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="px-6 py-14 md:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 rounded-[24px] border border-white/10 bg-[#0B1A29] p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8EC5FF]">
              Organiser
            </p>

            <div className="mt-5 grid gap-6 text-sm leading-7 text-[#A9B5C3] md:grid-cols-2 md:text-base">
              <div>
                <p className="font-semibold text-white">
                  BBA Club, z.s.
                </p>
                <p>IČO: 29854059</p>
                <p>Opatovická 159/17</p>
                <p>Nové Město, 110 00 Praha 1</p>
                <p>Czech Republic</p>
              </div>

              <div>
                <p>
                  Registered under file no. L 82337 at the
                  Municipal Court in Prague.
                </p>

                <p className="mt-3">
                  Contact:{" "}
                  <a
                    href="mailto:bba.club@vse.cz"
                    className="text-[#5790FF] transition hover:text-[#8EC5FF]"
                  >
                    bba.club@vse.cz
                  </a>
                </p>
              </div>
            </div>
          </div>

          <Section number="01" title="Scope of these terms">
            <p>
              These Terms &amp; Conditions apply to registrations for
              events organised by BBA Club, z.s. through the BBA Club
              website or another registration channel operated by the
              Club.
            </p>

            <p>
              By submitting a registration, the participant agrees to
              these terms and to any event-specific conditions shown on
              the relevant event page.
            </p>

            <p>
              If an event page contains specific information that
              differs from these general terms, the event-specific
              information applies to that event unless stated otherwise.
            </p>
          </Section>

          <Section number="02" title="Event information">
            <p>
              The event page contains the key information for each
              event, including its date, time, location, capacity and,
              where applicable, ticket price.
            </p>

            <p>
              BBA Club may provide additional event-specific
              information such as age restrictions, registration
              deadlines, required equipment or other participation
              requirements.
            </p>

            <p>
              All ticket prices shown on the website are final prices
              payable by the participant unless clearly stated
              otherwise.
            </p>
          </Section>

          <Section number="03" title="Registration and tickets">
            <p>
              A participant must provide accurate and complete
              information when registering for an event.
            </p>

            <p>
              A registration is associated with the person whose
              details were submitted during registration. Tickets are
              not transferable to another person unless BBA Club
              expressly agrees otherwise.
            </p>

            <p>
              Where a QR ticket is issued, the participant should be
              prepared to present it at the event. BBA Club may also
              verify the participant using the registration details
              provided during registration.
            </p>

            <p>
              Submission of multiple registrations for the purpose of
              reserving additional places for the same participant is
              not permitted.
            </p>
          </Section>

          <Section number="04" title="Capacity and waitlist">
            <p>
              Event capacity may be limited. Once all available places
              have been reserved, additional participants may be placed
              on a waitlist.
            </p>

            <p>
              A place on the waitlist does not guarantee admission to
              the event.
            </p>

            <p>
              If a place becomes available, BBA Club may offer it to a
              participant on the waitlist. For a paid event, the
              participant may be required to complete payment within a
              specified period in order to secure the place.
            </p>
          </Section>

          <Section number="05" title="Payment">
            <p>
              The available payment method is shown during registration
              or on the relevant event page.
            </p>

            <p>
              Depending on the event, payment may be collected on site
              or online.
            </p>

            <p>
              Where online card payment is available, payment may be
              processed through the Comgate payment gateway or another
              payment provider identified during checkout. BBA Club
              does not receive or store the participant&apos;s complete
              payment card details.
            </p>

            <p>
              For an online paid event, a registration is considered
              fully confirmed only after successful payment, unless the
              event page or confirmation message states otherwise.
            </p>

            <p>
              If an online payment is not completed within the
              applicable payment period, the reserved place may be
              released and offered to another participant.
            </p>
          </Section>

          <Section number="06" title="Cancellation by the participant">
            <p>
              A participant may cancel a registration using the
              cancellation option provided by BBA Club or by contacting
              BBA Club at bba.club@vse.cz.
            </p>

            <p>
              For a paid event, a cancellation made more than 72 hours
              before the scheduled start of the event is eligible for
              a refund of the ticket price less a cancellation
              administration fee of 5 CZK.
            </p>

            <p>
              A cancellation made 72 hours or less before the scheduled
              start of the event is normally not eligible for a refund.
            </p>

            <p>
              However, if the released place is subsequently filled by
              another participant from the waitlist, BBA Club may
              provide a refund of the ticket price less the 5 CZK
              cancellation administration fee.
            </p>

            <p>
              The administration fee will never exceed the amount
              originally paid by the participant.
            </p>

            <p>
              A participant who does not attend the event without
              cancelling the registration is not entitled to a refund.
            </p>
          </Section>

          <Section number="07" title="Refunds">
            <p>
              Eligible refunds for online payments will normally be
              returned using the same payment method used for the
              original transaction.
            </p>

            <p>
              Processing time may depend on the payment provider and
              the participant&apos;s bank or card issuer.
            </p>

            <p>
              A registration for which payment has not yet been
              completed may be cancelled without a refund being
              necessary.
            </p>

            <p>
              If payment was to be collected on site and no payment has
              yet been made, cancellation simply releases the
              participant&apos;s reservation.
            </p>
          </Section>

          <Section
            number="08"
            title="Cancellation or changes by BBA Club"
          >
            <p>
              BBA Club may cancel, postpone, relocate or reasonably
              modify an event where necessary, including for
              organisational, safety or circumstances beyond the
              Club&apos;s reasonable control.
            </p>

            <p>
              If BBA Club cancels a paid event without providing a
              replacement event, participants who have already paid
              will receive a full refund of the ticket price without
              deduction of the 5 CZK cancellation fee.
            </p>

            <p>
              If an event is moved to a different date and the
              participant cannot or does not wish to attend the new
              date, the participant may request a full refund.
            </p>

            <p>
              For minor changes that do not materially affect the
              nature of the event, such as a room change within the
              same venue, a refund is not automatically provided.
            </p>
          </Section>

          <Section number="09" title="Right of withdrawal">
            <p>
              Events organised by BBA Club are generally leisure,
              educational, cultural, networking or similar services
              provided on a specific date or during a specific period.
            </p>

            <p>
              Where the statutory exception for leisure services
              provided on a specific date or during a specific period
              applies, the standard 14-day right to withdraw from a
              distance contract does not apply.
            </p>

            <p>
              This does not affect any cancellation or refund rights
              that BBA Club voluntarily provides under these Terms
              &amp; Conditions.
            </p>
          </Section>

          <Section number="10" title="Conduct and admission">
            <p>
              Participants are expected to behave respectfully toward
              other participants, organisers, speakers, venue staff and
              property.
            </p>

            <p>
              BBA Club may refuse admission or require a participant to
              leave an event where this is reasonably necessary for
              safety, serious misconduct, disruption of the event or a
              material breach of event rules.
            </p>

            <p>
              Any decision regarding a refund in such circumstances
              will depend on the specific situation and applicable
              legal requirements.
            </p>
          </Section>

          <Section number="11" title="Complaints and support">
            <p>
              Questions, complaints or requests relating to an event,
              registration, payment or refund can be sent to
              bba.club@vse.cz.
            </p>

            <p>
              Please include enough information for us to identify the
              relevant registration, such as your name, email address
              and event name. Do not send payment card details by
              email.
            </p>

            <p>
              BBA Club will aim to resolve reasonable requests as
              quickly as possible.
            </p>
          </Section>

          <Section
            number="12"
            title="Alternative dispute resolution"
          >
            <p>
              Where the participant acts as a consumer and a consumer
              dispute cannot be resolved directly with BBA Club, the
              participant may be entitled to use an alternative dispute
              resolution procedure.
            </p>

            <p>
              The competent entity for general consumer disputes in
              the Czech Republic is the Czech Trade Inspection
              Authority (Česká obchodní inspekce), Central
              Inspectorate – ADR Department, Gorazdova 1969/24,
              120 00 Prague 2.
            </p>

            <p>
              Information about alternative dispute resolution is
              available on the website of the Czech Trade Inspection
              Authority.
            </p>
          </Section>

          <Section number="13" title="Personal data">
            <p>
              Personal data submitted during registration is processed
              in accordance with the BBA Club Privacy Policy.
            </p>
          </Section>

          <Section number="14" title="Governing law">
            <p>
              These Terms &amp; Conditions are governed by the laws of
              the Czech Republic.
            </p>

            <p>
              Nothing in these terms limits any mandatory rights that
              a participant may have under applicable law.
            </p>
          </Section>

          <Section number="15" title="Changes to these terms">
            <p>
              BBA Club may update these Terms &amp; Conditions from
              time to time.
            </p>

            <p>
              The version applicable to a registration is generally the
              version in effect when the participant registers, unless
              a later change is required by law or is more favourable
              to the participant.
            </p>
          </Section>
        </div>
      </section>

      <Footer />
    </main>
  );
}

