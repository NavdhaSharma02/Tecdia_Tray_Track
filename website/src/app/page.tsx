import Image from "next/image";
import Link from "next/link";
import TecdiaLogo from "@/components/layout/TecdiaLogo";

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
  "Employee authorization",
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
              Premium self service dining flow for modern employee cafeterias
            </h1>
            <p>
              Inspired by hospitality-grade digital ordering experiences, Tecdia
              Tray Track turns tray recognition, billing and payment into one
              polished journey that feels fast, clear and trustworthy.
            </p>

            <div className="marketing-cta">
              <Link href="/customer" className="btn btn-primary btn-lg">
                Customer Kiosk
              </Link>
              <Link href="/admin" className="btn btn-outline btn-lg">
                Admin Dashboard
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

          <div className="marketing-showcase">
            <div className="marketing-device">
              <div className="marketing-device__topbar">
                <span>Tray Vision Session</span>
                <span>Live Preview</span>
              </div>
              <div className="marketing-device__frame">
                <Image
                  src="/bg6.jpg"
                  alt="Cafeteria dining presentation"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="marketing-device__overlay">
                  <div className="marketing-detection-card">
                    <span className="marketing-detection-card__label">Detected items</span>
                    <strong>Chicken meal, rice, juice</strong>
                    <p>Menu matched and bill generated in a single pass.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="marketing-floating-card marketing-floating-card--a">
              <span>Today&apos;s menu synced</span>
              <strong>12 active dishes</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-section marketing-section--split">
        <div className="marketing-section__intro">
          <span className="marketing-eyebrow">Why it feels better</span>
          <h2>A seamless checkout experience that keeps long queues moving</h2>
          <p>
            Tecdia Tray Track shows how employees can scan a tray, confirm their
            meal, and complete payment in seconds while cafeteria teams manage
            menus, transactions, and daily activity from one dashboard.
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
            <h2>One guided sequence from tray pickup to payment</h2>
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
          <span className="marketing-eyebrow">Analytics dashboard</span>
          <h2>Turn every cafeteria checkout into useful operational insight</h2>
          <p>
            Tecdia Tray Track gives teams a clear view of daily transactions,
            popular dishes, employee activity, and menu performance so cafeteria
            decisions are backed by real usage data.
          </p>
        </div>
        <div className="marketing-gallery">
          <div className="marketing-gallery__tall marketing-analytics-preview" aria-label="Analytics dashboard preview">
            <div className="marketing-analytics-preview__top">
              <div>
                <span>Analytics</span>
                <strong>Cafeteria performance</strong>
              </div>
            </div>
            <div className="marketing-analytics-preview__stats">
              <article>
                <span>Revenue</span>
                <strong>PHP 84.2k</strong>
              </article>
              <article>
                <span>Orders</span>
                <strong>1,248</strong>
              </article>
            </div>
            <div className="marketing-analytics-preview__chart">
              {[46, 62, 54, 78, 68, 88, 72].map((height, index) => (
                <span key={index} style={{ height: `${height}%` }} />
              ))}
            </div>
            <div className="marketing-analytics-preview__list">
              <div>
                <span>Top dish</span>
                <strong>Chicken meal</strong>
              </div>
              <div>
                <span>Peak hour</span>
                <strong>12:30 PM</strong>
              </div>
            </div>
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
          <span className="marketing-eyebrow">Explore</span>
          <h2>Explore the kiosk and admin tools built for faster cafeteria service</h2>
        </div>
        <div className="marketing-cta">
          <Link
            href="https://online.fliphtml5.com/Tecdia/jhob/"
            className="btn btn-primary btn-lg"
            target="_blank"
            rel="noreferrer"
          >
            Operation manual
          </Link>
        </div>
      </section>
    </main>
  );
}
