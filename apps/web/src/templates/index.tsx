import { getTemplate } from "@glamsite/shared/templates";
import type { SiteData } from "@glamsite/shared/types";
import { LuxeSite } from "./luxe/LuxeSite";
import { StarterSite } from "./starter/StarterSite";

type SiteComponent = (props: { data: SiteData; demo?: boolean }) => React.ReactNode;

/**
 * Template id → the component that renders it. Templates still waiting for
 * their design use the starter layout.
 */
const SITE_COMPONENTS: Record<string, SiteComponent> = {
  luxe: LuxeSite,
  salon: StarterSite,
  barber: StarterSite,
};

export function SiteRenderer({ data, demo = false }: { data: SiteData; demo?: boolean }) {
  const Component = SITE_COMPONENTS[getTemplate(data.business.templateId).id] ?? StarterSite;
  return <Component data={data} demo={demo} />;
}
