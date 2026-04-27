import Image from "next/image";
import Link from "next/link";
import TecdiaLogo from "@/components/layout/TecdiaLogo";
import MarketingTrayShowcase from "@/components/marketing/MarketingTrayShowcase";

const stats = [
  { value: "3.5s", label: "average tray recognition cycle" },
  { value: "99%", label: "cashier-side bill consistency target" },
  { value: "24/7", label: "kiosk-ready service flow" },
];

const highlights = [
  {
    title: "Scan-first billing",
    description:
      "Computer vision detects plate items, matches the daily menu, and prepares the bill without manual tapping.",
  },
  {
    title: "Built for cafeteria rush",
    description:
      "The flow keeps lines moving with a guided kiosk journey for login, tray scan, bill review, and payment.",
  },
  {
    title: "Admin visibility",
    description:
      "Menus, transactions, employees, and usage data live in one system so operations stay measurable.",
  },
];

const steps = [
  "Employee identifies at the kiosk",
  "Tray is scanned against today's menu",
  "Items and pricing are reviewed instantly",
  "Payment or account charging completes the visit",
];

export default function RootPage() {
  return (
    <main className="marketing-shell">
      <section className="marketing-hero">
        <div className="marketing-nav">
          <Link href="/" className="marketing-brand" aria-label="Tecdia Tray Track home">
            <TecdiaLogo size="sm" align="left" showLines={false} />
            <span>Tecdia Tray Track</span>
          </Link>
          <div className="marketing-nav__actions">
            <Link href="/admin/login" className="btn btn-ghost btn-sm">
              Admin login
            </Link>
            <Link href="/customer" className="btn btn-primary btn-sm">
              Launch kiosk
            </Link>
          </div>
        </div>

        <div className="marketing-hero__content">
          <div className="marketing-copy">
            <span className="marketing-eyebrow">Smart cafeteria automation</span>
            <h1>
              Premium self-service dining flow for modern employee cafeterias.
            </h1>
            <p>
              Inspired by hospitality-grade digital ordering experiences, Tecdia
              Tray Track turns tray recognition, billing, and payment into one
              polished journey that feels fast, clear, and trustworthy.
            </p>

            <div className="marketing-cta">
              <Link href="/customer" className="btn btn-primary btn-lg">
                Experience customer flow
              </Link>
              <Link href="/admin" className="btn btn-outline btn-lg">
                View operations dashboard
              </Link>
            </div>

            <div className="marketing-stats">
              {stats.map((stat) => (
                <article key={stat.label} className="marketing-stat">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </article>
              ))}
            </div>
          </div>

          <MarketingTrayShowcase />
        </div>
      </section>

      <section className="marketing-section marketing-section--split">
        <div className="marketing-section__intro">
          <span className="marketing-eyebrow">Why it feels better</span>
          <h2>A sales-ready front end with the same clarity as the kiosk itself.</h2>
          <p>
            The reference site uses confidence-building presentation: strong
            hierarchy, elegant spacing, visual proof, and repeated value
            messaging. This homepage brings that same energy to your product.
          </p>
        </div>
        <div className="marketing-grid">
          {highlights.map((item) => (
            <article key={item.title} className="marketing-feature-card">
              <span className="marketing-feature-card__index">
                {item.title.split(" ")[0]}
              </span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section marketing-band">
        <div className="marketing-band__content">
          <div>
            <span className="marketing-eyebrow">How it flows</span>
            <h2>One guided sequence from tray pickup to payment.</h2>
          </div>
          <div className="marketing-steps">
            {steps.map((step, index) => (
              <article key={step} className="marketing-step">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{step}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="marketing-section marketing-section--gallery">
        <div className="marketing-gallery-copy">
          <span className="marketing-eyebrow">Designed to reassure</span>
          <h2>Soft premium visuals, not a rough internal tool.</h2>
          <p>
            The homepage now presents Tecdia Tray Track like a polished product:
            editorial cards, layered imagery, refined colors, and clear calls to
            action for both customers and operators.
          </p>
        </div>
        <div className="marketing-gallery">
          <div className="marketing-gallery__tall">
            <Image src="/bg1.jpg" alt="Dining setup" fill className="object-cover" />
          </div>
          <div className="marketing-gallery__stack">
            <div className="marketing-gallery__small">
              <Image src="/bg3.jpg" alt="Prepared dish" fill className="object-cover" />
            </div>
            <div className="marketing-gallery__small">
              <Image src="/bg5.jpeg" alt="Cafeteria serving counter" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-section marketing-cta-band">
        <div>
          <span className="marketing-eyebrow">Ready to present</span>
          <h2>Use this as your polished front door, while the kiosk runs separately.</h2>
        </div>
        <div className="marketing-cta">
          <Link href="/customer" className="btn btn-primary btn-lg">
            Open customer kiosk
          </Link>
          <Link href="/admin/login" className="btn btn-outline btn-lg">
            Open admin portal
          </Link>
        </div>
      </section>
    </main>
  );
}
