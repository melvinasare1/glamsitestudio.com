import Link from "next/link";

export function NotFoundView({ homeHref }: { homeHref: string }) {
  return (
    <div className="mx-auto w-full max-w-[1170px] px-4 sm:px-6">
      <nav aria-label="Breadcrumb" className="py-10 text-sm text-black/40 md:py-16">
        <ol className="flex items-center gap-2">
          <li>
            <Link href={homeHref} className="transition-colors hover:text-black">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-black">404 Error</li>
        </ol>
      </nav>

      <div className="flex flex-col items-center pb-24 pt-6 text-center md:pb-32 md:pt-10">
        <h1 className="text-[42px] font-medium leading-none tracking-wide text-black sm:text-6xl md:text-[80px] lg:text-[90px]">
          404 Not Found
        </h1>
        <p className="mt-8 text-sm text-black/80 md:mt-10 md:text-base">
          Your visited page not found. You may go home page.
        </p>
        <Link
          href={homeHref}
          className="mt-10 inline-flex h-14 items-center justify-center rounded bg-[#DB4444] px-10 text-sm font-medium text-white transition-colors hover:bg-[#c33b3b] md:mt-12 md:px-12"
        >
          Back to home page
        </Link>
      </div>
    </div>
  );
}
