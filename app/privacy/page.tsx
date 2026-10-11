import type { Metadata } from "next";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | BBA Club",
  description:
    "Information about how BBA Club processes personal data when you use our website, register for events or contact us.",
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

export default function PrivacyPage() {
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
            Privacy
            <br />
            <span className="text-[#0057FF]">
              Policy.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-[#A9B5C3] md:mt-7 md:text-lg md:leading-8">
            This policy explains what personal data BBA Club collects,
            why we use it, who may process it and what rights you have.
          </p>

          <p className="mt-6 text-sm text-[#53687D]">
            Last updated: October 11, 2026
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="px-6 py-14 md:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          {/* CONTROLLER */}
          <div className="mb-14 rounded-[24px] border border-white/10 bg-[#0B1A29] p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8EC5FF]">
              Data controller
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
                  Privacy contact:{" "}
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

          <Section number="01" title="Who is responsible for your data?">
            <p>
              BBA Club, z.s. is the controller of personal data
              described in this Privacy Policy. This means that BBA Club
              determines why and how the relevant personal data is
              processed.
            </p>

            <p>
              If you have any questions about your personal data or
              wish to exercise your data protection rights, you can
              contact us at{" "}
              <a
                href="mailto:bba.club@vse.cz"
                className="text-[#5790FF] transition hover:text-[#8EC5FF]"
              >
                bba.club@vse.cz
              </a>
              .
            </p>
          </Section>

          <Section number="02" title="What data do we collect?">
            <p>
              The personal data we process depends on how you interact
              with BBA Club.
            </p>

            <div className="rounded-[20px] border border-white/10 bg-[#0B1A29] p-5 md:p-6">
              <p className="font-semibold text-white">
                Event registrations
              </p>

              <p className="mt-2">
                We may process your first name, last name, email
                address, university, information you voluntarily add in
                a registration note, the event you registered for,
                registration date and status, waitlist status, ticket
                identifier, check-in status and related administrative
                information.
              </p>
            </div>

            <div className="rounded-[20px] border border-white/10 bg-[#0B1A29] p-5 md:p-6">
              <p className="font-semibold text-white">
                Payments
              </p>

              <p className="mt-2">
                For paid events, we may process information such as the
                payment amount, currency, payment status, transaction
                identifier and timestamps needed to connect a payment
                with your event registration.
              </p>

              <p className="mt-2">
                BBA Club does not receive or store your complete
                payment card number, card security code or other full
                card credentials.
              </p>
            </div>

            <div className="rounded-[20px] border border-white/10 bg-[#0B1A29] p-5 md:p-6">
              <p className="font-semibold text-white">
                Study Hub submissions
              </p>

              <p className="mt-2">
                If you voluntarily submit study materials or other
                content to BBA Club, we process the information and
                files you provide in order to review and administer
                the submission.
              </p>
            </div>

            <div className="rounded-[20px] border border-white/10 bg-[#0B1A29] p-5 md:p-6">
              <p className="font-semibold text-white">
                Communication
              </p>

              <p className="mt-2">
                If you contact us by email or another communication
                channel, we may process your contact details and the
                content of your message in order to respond.
              </p>
            </div>

            <div className="rounded-[20px] border border-white/10 bg-[#0B1A29] p-5 md:p-6">
              <p className="font-semibold text-white">
                Technical information
              </p>

              <p className="mt-2">
                Our website and its hosting providers may process basic
                technical information such as IP addresses, request
                information, timestamps, device or browser information
                and security logs where necessary to operate, secure
                and troubleshoot the website.
              </p>
            </div>
          </Section>

          <Section number="03" title="Why do we process your data?">
            <p>
              We use personal data only for purposes connected with
              operating BBA Club and providing the relevant service.
            </p>

            <p>
              These purposes include processing event registrations,
              managing event capacity and waitlists, issuing tickets,
              checking participants in, communicating important event
              information, processing payments and refunds, handling
              cancellations, responding to requests and maintaining
              the security and operation of the website.
            </p>

            <p>
              We may also process information where necessary to comply
              with accounting, tax or other legal obligations or to
              establish, exercise or defend legal claims.
            </p>

            <p>
              We do not use event registration information to send
              unrelated marketing messages or newsletters unless a
              person has separately agreed to receive them.
            </p>
          </Section>

          <Section number="04" title="Legal bases for processing">
            <p>
              Depending on the purpose, BBA Club processes personal
              data on one or more of the following legal bases under
              the GDPR.
            </p>

            <div className="space-y-4">
              <div>
                <p className="font-semibold text-white">
                  Performance of a contract
                </p>

                <p>
                  We process information needed to register you for an
                  event, provide a ticket, manage your participation and
                  process a payment or refund where applicable.
                </p>
              </div>

              <div>
                <p className="font-semibold text-white">
                  Legal obligations
                </p>

                <p>
                  Certain payment, accounting or transaction records may
                  need to be retained where required by applicable law.
                </p>
              </div>

              <div>
                <p className="font-semibold text-white">
                  Legitimate interests
                </p>

                <p>
                  We may process limited information where necessary for
                  the proper organisation of events, prevention of
                  misuse, website security, administration of the Club,
                  handling disputes and protection of our legal rights.
                </p>
              </div>

              <div>
                <p className="font-semibold text-white">
                  Consent
                </p>

                <p>
                  Where processing is based specifically on your
                  consent, you may withdraw that consent at any time.
                  Withdrawal does not affect processing that was lawful
                  before the withdrawal.
                </p>
              </div>
            </div>
          </Section>

          <Section number="05" title="Payments">
            <p>
              When online payment is available, BBA Club may use the
              Comgate payment gateway to process the transaction.
            </p>

            <p>
              Payment card credentials are entered into the payment
              environment provided by the payment service provider and
              are not stored by BBA Club.
            </p>

            <p>
              BBA Club may receive and store information necessary to
              identify and administer the transaction, such as the
              transaction identifier, payment status, amount, currency
              and payment timestamps.
            </p>

            <p>
              The payment provider may process personal data in
              accordance with its own legal obligations and privacy
              information.
            </p>
          </Section>

          <Section number="06" title="Who may process your data?">
            <p>
              We use selected service providers to operate the BBA Club
              website and related services. These providers receive
              only the information necessary for the relevant service.
            </p>

            <div className="space-y-4">
              <div>
                <p className="font-semibold text-white">
                  Sanity
                </p>

                <p>
                  Used for content management and storage of website
                  and registration-related data.
                </p>
              </div>

              <div>
                <p className="font-semibold text-white">
                  Vercel
                </p>

                <p>
                  Used to host and operate the BBA Club website and its
                  server-side functionality.
                </p>
              </div>

              <div>
                <p className="font-semibold text-white">
                  Resend
                </p>

                <p>
                  Used to send transactional emails such as event
                  registration confirmations, tickets and waitlist
                  notifications.
                </p>
              </div>

              <div>
                <p className="font-semibold text-white">
                  Comgate
                </p>

                <p>
                  Used to process online payments where the payment
                  gateway is enabled.
                </p>
              </div>
            </div>

            <p>
              We may also disclose information where required by law,
              a competent public authority or where necessary to
              establish, exercise or defend legal claims.
            </p>
          </Section>

          <Section number="07" title="International data transfers">
            <p>
              Some technology service providers or their
              subprocessors may process data outside the European
              Economic Area.
            </p>

            <p>
              Where personal data is transferred to a country without
              an applicable adequacy decision, the relevant provider
              must use an appropriate transfer mechanism where required
              by data protection law, such as standard contractual
              clauses or another recognised safeguard.
            </p>
          </Section>

          <Section number="08" title="How long do we keep your data?">
            <p>
              We keep personal data only for as long as reasonably
              necessary for the purpose for which it was collected and
              for any period required by applicable law.
            </p>

            <p>
              Event registration records may be retained after an event
              where reasonably necessary to handle cancellations,
              refunds, disputes, event administration or related
              requests.
            </p>

            <p>
              Payment and accounting information may be retained for
              longer where required by accounting, tax or other legal
              obligations.
            </p>

            <p>
              Communication records are normally retained only for as
              long as necessary to resolve the relevant request and any
              related follow-up.
            </p>

            <p>
              Study Hub submission information may be retained for as
              long as necessary to review and administer the submission.
              Approved content may remain available until it is removed
              or replaced.
            </p>

            <p>
              When personal data is no longer needed and no legal basis
              requires continued processing, it will be deleted or
              anonymised where reasonably possible.
            </p>
          </Section>

          <Section number="09" title="Your rights">
            <p>
              Depending on the circumstances and applicable law, you
              may have the right to request access to your personal
              data, correction of inaccurate data, deletion of data,
              restriction of processing or portability of certain data.
            </p>

            <p>
              Where processing is based on legitimate interests, you
              may also have the right to object to that processing.
            </p>

            <p>
              Where processing is based on consent, you may withdraw
              your consent at any time.
            </p>

            <p>
              These rights are not absolute. For example, we may need
              to retain certain information where a legal obligation
              requires us to do so or where the information is
              necessary for the establishment, exercise or defence of
              legal claims.
            </p>

            <p>
              To exercise your rights, contact{" "}
              <a
                href="mailto:bba.club@vse.cz"
                className="text-[#5790FF] transition hover:text-[#8EC5FF]"
              >
                bba.club@vse.cz
              </a>
              .
            </p>
          </Section>

          <Section number="10" title="Complaints">
            <p>
              If you believe that your personal data is being processed
              unlawfully, you may contact us first so that we can
              investigate and try to resolve the issue.
            </p>

            <p>
              You also have the right to lodge a complaint with the
              Czech supervisory authority:
            </p>

            <div className="rounded-[20px] border border-white/10 bg-[#0B1A29] p-5 md:p-6">
              <p className="font-semibold text-white">
                Úřad pro ochranu osobních údajů
              </p>

              <p className="mt-2">Pplk. Sochora 27</p>
              <p>170 00 Praha 7</p>
              <p>Czech Republic</p>
            </div>
          </Section>

          <Section number="11" title="Cookies and similar technologies">
            <p>
              The BBA Club website may use strictly necessary
              technical storage or cookies where required for security,
              administration or essential website functionality.
            </p>

            <p>
              At the time of this update, BBA Club does not intentionally
              use advertising cookies or behavioural advertising
              profiles on the public website.
            </p>

            <p>
              If optional analytics, advertising or similar tracking
              technologies are introduced in the future, this Privacy
              Policy and, where required, the website&apos;s consent
              mechanism will be updated before such technologies are
              used.
            </p>
          </Section>

          <Section number="12" title="Security">
            <p>
              We take reasonable technical and organisational measures
              to protect personal data against unauthorised access,
              loss, misuse, alteration or disclosure.
            </p>

            <p>
              Access to registration and administrative information is
              limited to people who need it for the operation of BBA
              Club and its events.
            </p>

            <p>
              No internet-based service can guarantee absolute
              security. If we become aware of a personal data breach,
              we will respond in accordance with applicable data
              protection requirements.
            </p>
          </Section>

          <Section
            number="13"
            title="Automated decision-making and profiling"
          >
            <p>
              BBA Club does not use personal data for automated
              profiling or solely automated decisions that produce
              legal or similarly significant effects on individuals.
            </p>
          </Section>

          <Section number="14" title="Photography and event media">
            <p>
              Photos and video recordings may be taken during BBA Club events
              to document the event and the activities of BBA Club.
            </p>

            <p>
              Selected photos or recordings may be published on the BBA Club
              website, social media channels or other BBA Club communication
              materials and may also be used to promote BBA Club and future
              events.
            </p>

            <p>
              When creating and using event photography, BBA Club will respect
              the privacy and personality rights of participants and will use
              such material in a reasonable manner appropriate to the nature of
              the event.
            </p>

            <p>
              Where a participant is the main identifiable subject of a photo
              or recording intended for specific promotional use, BBA Club may
              request additional permission where appropriate.
            </p>

            <p>
              If you do not wish to be photographed, please let the organiser or
              photographer know at the event. If you have a concern about a
              photo or recording already published by BBA Club, you can contact
              us at{" "}
              <a
                href="mailto:bba.club@vse.cz"
                className="text-[#5790FF] transition hover:text-[#8EC5FF]"
              >
                bba.club@vse.cz
              </a>
              .
            </p>
          </Section>

          <Section number="15" title="Changes to this policy">
            <p>
              We may update this Privacy Policy when our services,
              technology providers or legal obligations change.
            </p>

            <p>
              The current version will always be published on this
              page together with its last updated date.
            </p>
          </Section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
