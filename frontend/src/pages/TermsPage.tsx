import { Link } from 'react-router-dom'
import { Shield, ArrowLeft } from 'lucide-react'

export function TermsPage() {
  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1 text-[10px] text-secondary hover:text-gold mb-4 transition-colors">
          <ArrowLeft size={12} /> Back to map
        </Link>

        <div className="ornate-card rounded-xl p-5 sm:p-7">
          <div className="flex items-center gap-2 mb-5">
            <Shield size={20} className="text-gold" />
            <h1 className="font-display text-xl font-bold text-gold">Terms of Service</h1>
          </div>

          <div className="space-y-5 text-xs text-secondary leading-relaxed">
            <p className="text-primary font-semibold text-sm">
              Last updated: March 2026. By using Wardrove, you agree to these terms.
            </p>

            <Section title="1. Acceptance of Terms">
              <p>
                By creating an account, uploading data, or otherwise using the Wardrove platform ("Service"),
                you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Service.
              </p>
            </Section>

            <Section title="2. Description of Service">
              <p>
                Wardrove is a self-hosted wardriving data aggregation and visualization platform with RPG progression
                mechanics. Users can upload wireless network observation data captured through legitimate wardriving
                activities, view network maps, earn experience points, unlock badges, and compete on leaderboards.
              </p>
            </Section>

            <Section title="3. User Data & Uploads">
              <p>By uploading data to Wardrove, you represent and warrant that:</p>
              <ul className="list-disc pl-4 space-y-1 mt-1.5">
                <li>You have the legal right to collect and share the data you upload.</li>
                <li>The data was collected in compliance with all applicable local, national, and international laws.</li>
                <li>The data does not contain personally identifiable information (PII) beyond what is publicly broadcast by wireless devices.</li>
                <li>You understand that uploaded data may be aggregated with data from other users and displayed publicly.</li>
              </ul>
            </Section>

            <Section title="4. Data License">
              <p>
                By uploading data to the Service, you grant Wardrove a non-exclusive, worldwide, royalty-free license
                to store, process, aggregate, display, and distribute the uploaded data as part of the Service.
                You retain ownership of your original capture files.
              </p>
            </Section>

            <Section title="5. Acceptable Use">
              <p>You agree NOT to:</p>
              <ul className="list-disc pl-4 space-y-1 mt-1.5">
                <li>Upload falsified, fabricated, or intentionally misleading data.</li>
                <li>Use the Service to facilitate unauthorized access to any network or device.</li>
                <li>Attempt to exploit, disrupt, or overload the Service infrastructure.</li>
                <li>Scrape, mirror, or redistribute the aggregate dataset without permission.</li>
                <li>Create multiple accounts to manipulate leaderboards or badge progression.</li>
              </ul>
            </Section>

            <Section title="6. Privacy">
              <p>Wardrove collects the minimum data necessary to operate: GitHub username, email, avatar (from OAuth),
                wireless network observations, and usage data (XP, badges, uploads). We do not sell personal data.</p>
            </Section>

            <Section title="7. Disclaimer">
              <p>
                The Service is provided "AS IS" without warranty. Wardriving legality varies by jurisdiction.
                You are solely responsible for ensuring your data collection activities comply with applicable laws.
              </p>
            </Section>

            <Section title="8. Open Source">
              <p>
                Wardrove is open-source software (MIT License). These Terms apply to this specific instance,
                not to the software itself. Self-hosted instances may have their own terms.
              </p>
            </Section>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-display font-bold text-gold/80 mb-1.5">{title}</h2>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}
