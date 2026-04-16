import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ChevronLeft } from 'lucide-react';

function LegalShell({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="absolute inset-0 overflow-y-auto bg-black px-5 pb-12 pt-[calc(1.5rem+env(safe-area-inset-top))] text-white">
      <header className="mb-8 flex items-center gap-3">
        <Link
          to="/sign-up"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/16"
          aria-label="Back to sign up"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-200/70">Moneetize Pre-game</p>
          <h1 className="mt-1 text-2xl font-black leading-tight">{title}</h1>
          <p className="mt-1 text-xs font-semibold text-white/45">Updated {updated}</p>
        </div>
      </header>

      <section className="space-y-6 rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        {children}
      </section>

      <footer className="mt-8 space-y-3 text-center text-xs font-semibold text-white/42">
        <p>Need help? Email support@moneetize.com.</p>
        <div className="flex justify-center gap-4">
          <Link to="/privacy-policy" className="text-white/70 hover:text-white">
            Privacy
          </Link>
          <Link to="/terms-and-conditions" className="text-white/70 hover:text-white">
            Terms
          </Link>
        </div>
      </footer>
    </main>
  );
}

function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="space-y-2">
      <h2 className="text-sm font-black text-white">{title}</h2>
      <div className="space-y-2 text-sm font-semibold leading-relaxed text-white/68">{children}</div>
    </article>
  );
}

export function PrivacyPolicyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="April 16, 2026">
      <LegalSection title="Information We Collect">
        <p>
          Moneetize collects information you provide when you create or complete a profile, including name, email address,
          password credentials, profile handle, profile photo, interests, team invitations, invite contact details, rewards,
          marketplace orders, shipping details, and gameplay activity.
        </p>
      </LegalSection>

      <LegalSection title="How We Use Information">
        <p>
          We use this information to run the Moneetize Pre-game app, process scratch and win rewards, track points, manage
          teams and follows, send requested invite messages, support marketplace redemptions, prevent abuse, provide customer
          support, and improve app reliability.
        </p>
      </LegalSection>

      <LegalSection title="SMS And Invite Data">
        <p>
          Phone numbers entered for invitations are used only to send the requested Moneetize Pre-game invitation and related
          service messages. Message and data rates may apply. Users may reply <strong>STOP</strong> to opt out or{' '}
          <strong>HELP</strong> for help.
        </p>
      </LegalSection>

      <LegalSection title="No Third-Party Marketing Sharing">
        <p>
          We do not sell, rent, or share mobile opt-in information, phone numbers, or SMS consent data with third parties or
          affiliates for their marketing or promotional purposes. We may share limited data with service providers only when
          needed to operate the app, deliver messages, process orders, or comply with law.
        </p>
      </LegalSection>

      <LegalSection title="Security And Retention">
        <p>
          We use reasonable safeguards to protect account, invite, reward, and order data. We keep information for as long as
          needed to operate the service, meet legal obligations, resolve disputes, and prevent fraud or abuse.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>Questions about this policy can be sent to support@moneetize.com.</p>
      </LegalSection>
    </LegalShell>
  );
}

export function TermsAndConditionsPage() {
  return (
    <LegalShell title="Terms And Conditions" updated="April 16, 2026">
      <LegalSection title="Program Name">
        <p>Moneetize Pre-game Invite Messages.</p>
      </LegalSection>

      <LegalSection title="Program Description">
        <p>
          Moneetize Pre-game lets users sign up, play one scratch and win opportunity, build a team through accepted invites,
          earn points, view rewards, and redeem eligible points for available marketplace merchandise. Invite messages are sent
          when a registered user manually requests an SMS or email invitation to a contact.
        </p>
      </LegalSection>

      <LegalSection title="Message Frequency">
        <p>
          Message frequency varies by user activity. Invitation recipients may receive one invite message per request and
          limited service-related follow-up messages related to that invitation or opt-out status.
        </p>
      </LegalSection>

      <LegalSection title="Rates And Availability">
        <p>
          Message and data rates may apply. Wireless carriers are not liable for delayed or undelivered messages. SMS delivery
          depends on carrier networks and phone number eligibility.
        </p>
      </LegalSection>

      <LegalSection title="Opt Out And Help">
        <p>
          Reply <strong>STOP</strong> to opt out of SMS messages from Moneetize. Reply <strong>HELP</strong> for help. You can
          also contact support@moneetize.com for assistance.
        </p>
      </LegalSection>

      <LegalSection title="Rewards And Marketplace">
        <p>
          Rewards, points, locked USDT, locked Tripto, and marketplace merchandise are part of the pre-launch experience and
          may be subject to eligibility, inventory, fraud prevention, and campaign budget limits.
        </p>
      </LegalSection>

      <LegalSection title="Privacy">
        <p>
          Your use of the app is also governed by the Moneetize Privacy Policy. Mobile opt-in data and consent information are
          not sold or shared with third parties for marketing purposes.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
