import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Phone, ArrowUpRight } from "lucide-react";
import { sitePath } from "@glamsite/shared/domain";
import { sectionText } from "@glamsite/shared/site-content";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { BookingFrame, BookingNotice, NoticeButton, NoticeLinkButton } from "@/components/booking/BookingFrame";
import { loadBookingSite } from "@/lib/booking";
import { bookingHref, siteTitle } from "@/templates/shared";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string }; searchParams: { service?: string; staff?: string; ref?: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const loaded = await loadBookingSite(params.slug);
  if (!loaded.ok && !loaded.business) return { title: "Book an appointment" };
  const business = loaded.ok ? loaded.site.business : loaded.business!;
  return { title: `Book · ${siteTitle(business)}`, robots: { index: false } };
}

/** The online booking page on every site whose owner has turned on Glam Site booking. */
export default async function BookPage({ params, searchParams }: Props) {
  const loaded = await loadBookingSite(params.slug);
  if (!loaded.ok && loaded.reason === "not_found") notFound();

  if (!loaded.ok) {
    const business = loaded.business;
    if (!business) {
      return (
        <BookingFrame business={null} homeHref="/">
          <BookingNotice title="Booking isn't available right now">Please try again in a few minutes.</BookingNotice>
        </BookingFrame>
      );
    }
    const elsewhere = bookingHref(business);
    return (
      <BookingFrame business={business} homeHref={sitePath(business.slug, "/")}>
        <BookingNotice
          title="Online booking isn't available here"
          actions={
            elsewhere.startsWith("http") ? (
              <NoticeLinkButton href={elsewhere}>
                Book with {business.name} here
                <ArrowUpRight className="size-4" aria-hidden />
              </NoticeLinkButton>
            ) : business.phone ? (
              <NoticeButton href={`tel:${business.phone}`}>
                <Phone className="size-4" aria-hidden />
                Call {business.phone}
              </NoticeButton>
            ) : undefined
          }
        >
          We&apos;d still love to hear from you &mdash; get in touch directly to arrange your appointment.
        </BookingNotice>
      </BookingFrame>
    );
  }

  const { site } = loaded;
  const { business } = site;
  const bookableServiceIds = new Set(site.services.map((service) => service.id));

  return (
    <BookingFrame business={business} homeHref={sitePath(business.slug, "/")}>
      {site.services.length === 0 || site.staff.length === 0 ? (
        <BookingNotice
          title="No times are open for booking yet"
          actions={business.phone ? <NoticeButton href={`tel:${business.phone}`}><Phone className="size-4" aria-hidden />Call {business.phone}</NoticeButton> : undefined}
        >
          There aren&apos;t any upcoming appointments available online at the moment.{" "}
          {business.phone ? "Please get in touch and we'll be happy to help." : "Please check back soon."}
        </BookingNotice>
      ) : (
        <BookingFlow
          slug={business.slug}
          businessName={business.name}
          currency={business.currency}
          categories={site.categories}
          services={site.services}
          staff={site.staff.map((person) => ({
            id: person.id,
            name: person.name,
            role: person.role,
            photoUrl: person.photoUrl,
            isBookable: person.isBookable,
            // Only links to services that can be booked online matter here.
            serviceIds: person.serviceIds.filter((id) => bookableServiceIds.has(id)),
          }))}
          policyText={site.rules.policyText}
          cancellationNoticeHours={site.rules.cancellationNoticeHours}
          autoConfirm={site.rules.autoConfirm}
          paymentPolicy={site.rules.paymentPolicy}
          depositFixedCents={site.rules.depositFixedCents}
          homeHref={sitePath(business.slug, "/")}
          manageBase={sitePath(business.slug, "/appointment/")}
          initialServiceId={searchParams.service}
          initialStaffId={searchParams.staff}
          initialReferralCode={searchParams.ref}
          bookingHeading={sectionText(business.content, "booking", "heading", "Book an appointment")}
        />
      )}
    </BookingFrame>
  );
}
