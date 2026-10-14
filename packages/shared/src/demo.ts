/**
 * Demo businesses for template previews (/demo/{template}). Realistic enough
 * that a salon owner can picture their own site, never tied to a database row.
 */
import type { SiteContent } from "./site-content";
import { getTemplate } from "./templates";
import type { Business, OpeningHours, Service, ServiceCategory, SiteData, StaffMember, Weekday } from "./types";

const DEMO_ID = "00000000-0000-0000-0000-000000000000";

function demoBusiness(templateId: string, name: string, content: SiteContent): Business {
  return {
    id: DEMO_ID,
    ownerId: DEMO_ID,
    name,
    slug: "demo",
    templateId,
    status: "live",
    customDomain: null,
    customDomainVerified: false,
    email: "hello@example.com",
    phone: "020 7946 0123",
    address: { line1: "12 Park Road", line2: "", city: "London", postcode: "N8 8TE", country: "GB" },
    timezone: "Europe/London",
    currency: "GBP",
    bookingMode: "link",
    bookingUrl: "#book",
    content,
    publishedAt: null,
    createdAt: "",
    updatedAt: "",
  };
}

function category(id: string, name: string, position: number): ServiceCategory {
  return { id, businessId: DEMO_ID, name, position };
}

function service(
  id: string,
  categoryId: string,
  name: string,
  durationMinutes: number,
  priceCents: number | null,
  position: number,
  extra: Partial<Service> = {}
): Service {
  return {
    id,
    businessId: DEMO_ID,
    categoryId,
    name,
    description: "",
    durationMinutes,
    priceCents,
    priceIsFrom: false,
    bufferMinutes: 0,
    depositCents: null,
    isVisible: true,
    isBookable: true,
    position,
    ...extra,
  };
}

function person(id: string, name: string, role: string, bio: string, position: number): StaffMember {
  return {
    id,
    businessId: DEMO_ID,
    name,
    role,
    bio,
    photoUrl: "",
    isVisible: true,
    isBookable: true,
    position,
    serviceIds: [],
  };
}

function weekHours(open: string, close: string, days: Weekday[]): OpeningHours[] {
  return days.map((weekday) => ({
    id: `${DEMO_ID}-${weekday}`,
    businessId: DEMO_ID,
    weekday,
    opensAt: open,
    closesAt: close,
  }));
}

function luxeDemo(): SiteData {
  const content: SiteContent = {
    brand: { primaryColor: "#2a1e16", accentColor: "#d4af7c", font: "elegant" },
    hero: {
      tagline: "Premium hair salon · London",
      headline: "Healthy hair, confident you",
      subheadline: "Silk presses, braids, colour, wigs and more. Expert care for textured hair.",
      image: "/templates/luxe/hero.webp",
      ctaLabel: "Book now",
    },
    about: {
      heading: "More than a salon",
      image: "/templates/luxe/about.webp",
      body:
        "Luxe Hair Studio is a London salon specialising in textured hair. We create beautiful, healthy hair through expert technique, quality products and a premium salon experience, so you leave feeling like the best version of yourself.",
    },
    services: { heading: "Price list", intro: "Prices include a consultation. Longer or thicker hair may cost more." },
    team: { heading: "Meet the team" },
    gallery: { heading: "Our work", images: [] },
    reviews: {
      heading: "Real results, real people",
      items: [
        {
          quote: "The best salon in London! My silk press always looks amazing and lasts for weeks.",
          name: "Jessica R.",
          source: "Google",
          rating: "5",
        },
        {
          quote: "Professional, friendly and incredible results. I always leave feeling so confident.",
          name: "Monique T.",
          source: "Google",
          rating: "5",
        },
        {
          quote: "Amazing braids and such a beautiful salon. Highly recommend Luxe!",
          name: "Danielle K.",
          source: "Instagram",
          rating: "5",
        },
      ],
    },
    faqs: {
      heading: "Your questions answered",
      items: [
        {
          question: "How do I book an appointment?",
          answer: "Tap any Book now button to choose your service and a time that suits you.",
        },
        {
          question: "What hair types do you work with?",
          answer: "All of them. We specialise in natural, relaxed and textured hair, from 3A to 4C.",
        },
        {
          question: "Do you provide hair for braids and wigs?",
          answer: "Yes. Braiding hair is included in our braid prices. Wig units can be bought in salon or you can bring your own.",
        },
        {
          question: "What is your cancellation policy?",
          answer: "Please give us 48 hours' notice to cancel or move your appointment. Late cancellations may lose their deposit.",
        },
      ],
    },
    visit: { heading: "Visit us", directions: "Five minutes from Seven Sisters station.", showMap: true },
    contact: {
      heading: "Get in touch",
      showForm: false,
      instagram: "https://instagram.com/",
      tiktok: "https://tiktok.com/",
      facebook: "https://facebook.com/",
      whatsapp: "+44 7700 900123",
    },
    booking: {
      heading: "Ready for your next look?",
      body: "Book your appointment today and experience the Luxe difference.",
      ctaLabel: "Book now",
    },
    seo: { description: "Premium hair salon in London for textured hair: silk presses, braids, colour and wigs." },
  };
  const data: SiteData = {
    business: demoBusiness("luxe", "Luxe Hair Studio", content),
    categories: [
      category("c1", "Styling", 0),
      category("c2", "Braids", 1),
      category("c3", "Colour", 2),
      category("c4", "Wigs & installs", 3),
      category("c5", "Treatments", 4),
    ],
    services: [
      service("s1", "c1", "Silk press", 90, 6500, 0),
      service("s2", "c1", "Wash & blow dry", 60, 4000, 1),
      service("s3", "c2", "Knotless braids", 240, 12000, 0, { priceIsFrom: true }),
      service("s4", "c2", "Box braids", 240, 11000, 1, { priceIsFrom: true }),
      service("s5", "c3", "Full colour", 120, 9500, 0, { priceIsFrom: true }),
      service("s6", "c4", "Wig install", 120, 8500, 0),
      service("s7", "c5", "Deep conditioning treatment", 30, 3000, 0),
    ],
    staff: [
      person("p1", "Ama", "Founder & stylist", "Passionate about healthy hair and creating styles that make you feel confident.", 0),
      person("p2", "Esi", "Braider", "Specialising in knotless braids, protective styles and natural hair care.", 1),
      person("p3", "Nia", "Colourist", "Expert in colour, custom treatments and hair transformations.", 2),
    ],
    hours: [...weekHours("09:00", "19:00", [1, 2, 3, 4]), ...weekHours("09:00", "17:00", [5])],
  };
  data.business.address = { line1: "123 High Road", line2: "", city: "London", postcode: "N15 4AB", country: "GB" };
  data.business.email = "hello@luxehair.example";
  return data;
}

function salonDemo(): SiteData {
  const content: SiteContent = {
    brand: { primaryColor: "#3d2b24", accentColor: "#f4ece6", font: "elegant" },
    hero: {
      headline: "Healthy hair, beautifully done",
      subheadline: "Colour, cuts and silk presses in the heart of Crouch End.",
      ctaLabel: "Book an appointment",
    },
    about: {
      heading: "A calm space for great hair",
      body:
        "We opened Maison Bloom in 2019 to give North London a salon that takes time over every client. Our stylists specialise in natural and textured hair, lived-in colour and cuts that grow out well.",
    },
    services: { heading: "Services & prices", intro: "Every appointment starts with a consultation." },
    team: { heading: "Meet the team" },
    gallery: { heading: "Recent work", images: [] },
    reviews: {
      heading: "Kind words",
      items: [
        { quote: "Best silk press I've ever had. It lasted two weeks.", name: "Amara O.", source: "Google" },
        { quote: "Finally a salon that knows curly hair. Booking again already.", name: "Leah M.", source: "Instagram" },
        { quote: "Warm, relaxed and my colour is exactly what I asked for.", name: "Sophie T.", source: "Google" },
      ],
    },
    faqs: {
      heading: "Good to know",
      items: [
        { question: "Do I need a patch test?", answer: "Yes, for any colour service, at least 48 hours before your appointment." },
        { question: "What's your cancellation policy?", answer: "Please give us 24 hours' notice so we can offer the slot to someone else." },
      ],
    },
    visit: { heading: "Visit us", directions: "Two minutes from Crouch End Broadway. Street parking nearby." },
    contact: { heading: "Get in touch", instagram: "https://instagram.com/" },
    booking: { heading: "Ready for your next appointment?", body: "Pick a time that suits you online." },
    seo: { description: "Hair salon in Crouch End, London: colour, cuts and silk presses." },
  };
  return {
    business: demoBusiness("salon", "Maison Bloom", content),
    categories: [category("c1", "Cut & style", 0), category("c2", "Colour", 1), category("c3", "Treatments", 2)],
    services: [
      service("s1", "c1", "Cut & blow dry", 60, 5500, 0),
      service("s2", "c1", "Silk press", 90, 6500, 1),
      service("s3", "c1", "Blow dry", 45, 3500, 2),
      service("s4", "c2", "Full head colour", 120, 9500, 0, { priceIsFrom: true }),
      service("s5", "c2", "Balayage", 180, 15000, 1, { priceIsFrom: true }),
      service("s6", "c3", "Olaplex treatment", 30, 2500, 0),
      service("s7", "c3", "Scalp treatment", 30, 3000, 1),
    ],
    staff: [
      person("p1", "Nadia", "Founder & colourist", "Fifteen years of colour, with a soft spot for warm brunettes.", 0),
      person("p2", "Esi", "Senior stylist", "Textured hair specialist and silk press queen.", 1),
      person("p3", "Grace", "Stylist", "Precision cuts and long-lasting blow dries.", 2),
    ],
    hours: [...weekHours("09:00", "18:00", [1, 2, 4]), ...weekHours("10:00", "20:00", [3]), ...weekHours("09:00", "17:00", [5])],
  };
}

function barberDemo(): SiteData {
  const content: SiteContent = {
    brand: { primaryColor: "#111111", accentColor: "#e9e4dc", font: "modern" },
    hero: {
      headline: "Sharp cuts. No fuss.",
      subheadline: "Skin fades, beard trims and hot towel shaves on Holloway Road.",
      ctaLabel: "Book a chair",
    },
    about: {
      heading: "Proper barbering",
      body: "Three chairs, good music and barbers who've been doing this for over a decade. Walk-ins welcome when we've got space.",
    },
    services: { heading: "Price list" },
    team: { heading: "The barbers" },
    gallery: { heading: "Fresh cuts", images: [] },
    reviews: {
      heading: "What clients say",
      items: [
        { quote: "Cleanest fade in North London.", name: "Jordan K.", source: "Google" },
        { quote: "In and out in 30 minutes, every time.", name: "Marcus D.", source: "Google" },
      ],
    },
    faqs: { heading: "FAQs", items: [{ question: "Do you take walk-ins?", answer: "Yes, when a chair's free. Booking guarantees your slot." }] },
    visit: { heading: "Find us" },
    contact: { heading: "Contact", instagram: "https://instagram.com/" },
    booking: { heading: "Need a trim?", body: "Book your slot in under a minute." },
    seo: { description: "Barbershop on Holloway Road, London: fades, beard trims and hot towel shaves." },
  };
  return {
    business: demoBusiness("barber", "North Cut Barbers", content),
    categories: [category("c1", "Haircuts", 0), category("c2", "Beard & shave", 1)],
    services: [
      service("s1", "c1", "Skin fade", 45, 2500, 0),
      service("s2", "c1", "Scissor cut", 45, 2800, 1),
      service("s3", "c1", "Kids cut (under 12)", 30, 1800, 2),
      service("s4", "c2", "Beard trim & line-up", 20, 1500, 0),
      service("s5", "c2", "Hot towel shave", 30, 2200, 1),
      service("s6", "c2", "Cut & beard combo", 60, 3500, 2),
    ],
    staff: [
      person("p1", "Dee", "Owner", "Twelve years behind the chair.", 0),
      person("p2", "Kofi", "Barber", "Fades and designs.", 1),
    ],
    hours: [...weekHours("09:00", "19:00", [0, 1, 2, 3, 4]), ...weekHours("08:00", "18:00", [5]), ...weekHours("10:00", "16:00", [6])],
  };
}

const DEMOS: Record<string, () => SiteData> = {
  luxe: luxeDemo,
  salon: salonDemo,
  barber: barberDemo,
};

/** Demo site for a template; templates without their own demo borrow the salon one. */
export function demoSiteData(templateId: string): SiteData {
  const id = getTemplate(templateId).id;
  const data = (DEMOS[id] ?? salonDemo)();
  return { ...data, business: { ...data.business, templateId: id } };
}
