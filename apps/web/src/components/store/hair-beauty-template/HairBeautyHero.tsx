"use client";

import { Menu, Search, ShoppingBag, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";

import "./HairBeautyHero.css";

type HairBeautyHeroProps = {
  base: string;
  brandName: string;
  headline?: string;
  subtext?: string;
  ctaLabel?: string;
};

export function HairBeautyHero({
  base,
  brandName,
  headline = "Luxury Hair Crafted For Every Crown",
  subtext = "Premium quality wigs and bundles designed to elevate your natural beauty.",
  ctaLabel = "SHOP WIGS",
}: HairBeautyHeroProps) {
  const { totalItems, hydrated } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const count = hydrated ? totalItems : 0;

  const navLinks = [
    { label: "HOME", href: base },
    { label: "WIGS", href: `${base}/search` },
    { label: "CONTACT", href: `${base}/contact` },
  ] as const;

  const headlineLines = splitHeadline(headline);

  return (
    <section className="hb-hero">
      <div className="hb-hero__content">
        <header className="hb-hero__header">
          <button
            type="button"
            className="hb-hero__menu-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X strokeWidth={1.5} /> : <Menu strokeWidth={1.5} />}
          </button>

          <Link href={base} className="hb-hero__brand" aria-label={`${brandName} home`}>
            {brandName}
          </Link>

          <nav className="hb-hero__nav" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hb-hero__icons" aria-label="Store actions">
            <Link href={`${base}/search`} aria-label="Search" className="hb-hero__icon-btn">
              <Search strokeWidth={1.5} aria-hidden />
            </Link>
            <Link
              href={`${base}/cart`}
              aria-label={count > 0 ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart"}
              className="hb-hero__icon-btn"
            >
              <ShoppingBag strokeWidth={1.5} aria-hidden />
              {count > 0 ? (
                <span className="hb-hero__badge">{count > 9 ? "9+" : count}</span>
              ) : null}
            </Link>
          </div>
        </header>

        {menuOpen ? (
          <nav className="hb-hero__mobile-nav" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="hb-hero__copy">
          <p className="hb-hero__eyebrow">PREMIUM HUMAN HAIR</p>
          <h1>
            {headlineLines.map((line, index) => {
              const isLast = index === headlineLines.length - 1;
              return (
                <span key={line}>
                  {isLast ? <em>{line}</em> : line}
                  {!isLast ? <br /> : null}
                </span>
              );
            })}
          </h1>

          <p className="hb-hero__description">{subtext}</p>

          <Link className="hb-hero__shop" href={`${base}/search`}>
            {ctaLabel} <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="hb-hero__benefits">
          <div className="hb-hero__benefit">
            <HairIcon />
            <span className="hb-hero__benefit-text">
              <b>100%</b>
              HUMAN HAIR
            </span>
          </div>
          <div className="hb-hero__benefit">
            <DiamondIcon />
            <span className="hb-hero__benefit-text">
              <b>PREMIUM</b>
              QUALITY
            </span>
          </div>
          <div className="hb-hero__benefit">
            <ShieldIcon />
            <span className="hb-hero__benefit-text">
              <b>LONG LASTING</b>
              &amp; DURABLE
            </span>
          </div>
          <div className="hb-hero__benefit">
            <TruckIcon />
            <span className="hb-hero__benefit-text">
              <b>FAST &amp; SECURE</b>
              SHIPPING
            </span>
          </div>
        </div>

        <Image
          className="hb-hero__model"
          src="/store/hair-beauty-template/model.png"
          alt="Woman wearing luxurious wavy hair"
          width={817}
          height={560}
          priority
        />
      </div>
    </section>
  );
}

/** Split into up to 3 lines matching the reference rhythm when using the default headline. */
function splitHeadline(headline: string): string[] {
  const trimmed = headline.trim();
  if (/^luxury hair crafted for every crown$/i.test(trimmed)) {
    return ["Luxury Hair", "Crafted For", "Every Crown"];
  }
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length <= 3) return [trimmed];
  const third = Math.ceil(words.length / 3);
  return [
    words.slice(0, third).join(" "),
    words.slice(third, third * 2).join(" "),
    words.slice(third * 2).join(" "),
  ].filter(Boolean);
}

function HairIcon() {
  return (
    <svg className="hb-hero__benefit-icon" viewBox="0 0 40 40" fill="none" aria-hidden>
      <path
        d="M12 6c2 6-2 10 1 16s-1 10 0 14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M20 5c2.5 6-1.5 11 1.5 17s-1 10 0 14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M28 6c2 6-2 10 1 16s-1 10 0 14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DiamondIcon() {
  return (
    <svg className="hb-hero__benefit-icon" viewBox="0 0 40 40" fill="none" aria-hidden>
      <path
        d="M20 5.5 34 20 20 34.5 6 20 20 5.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="hb-hero__benefit-icon" viewBox="0 0 40 40" fill="none" aria-hidden>
      <path
        d="M20 5.5c5.2 2.8 8.5 3.4 12.5 3.4v10.2c0 7.6-5.2 13.4-12.5 15.9-7.3-2.5-12.5-8.3-12.5-15.9V8.9C11.5 8.9 14.8 8.3 20 5.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m14.5 20 3.8 3.8 7.2-7.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg className="hb-hero__benefit-icon" viewBox="0 0 40 40" fill="none" aria-hidden>
      <path
        d="M4 14h18v12H4V14Zm18 3h8l4 5v4h-12V17Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="28" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="28" cy="28" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7.6 28h16.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
