import { getTemplate } from "@glamsite/shared/templates";
import type { SiteData } from "@glamsite/shared/types";
import { StarterSite } from "./starter/StarterSite";

type SiteComponent = (props: { data: SiteData; demo?: boolean }) => React.ReactNode;

/**
 * Template id → the component that renders it. Every template currently uses
 * the starter layout; each gets its own component when it's designed.
 */
const SITE_COMPONENTS: Record<string, SiteComponent> = {
  salon: StarterSite,
  barber: StarterSite,
};

export function SiteRenderer({ data, demo = false }: { data: SiteData; demo?: boolean }) {
  const Component = SITE_COMPONENTS[getTemplate(data.business.templateId).id] ?? StarterSite;
  return <Component data={data} demo={demo} />;
}
