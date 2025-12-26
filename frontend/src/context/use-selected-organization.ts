import { useRevalidator } from "react-router";
import { useSelectedOrganizationStore } from "#/stores/selected-organization-store";

export const useSelectedOrganizationId = () => {
  const revalidator = useRevalidator();
  const { organizationId: orgId, setOrganizationId: setOrganizationIdStore } =
    useSelectedOrganizationStore();

  const setOrgId = (newOrganizationId: string | null) => {
    setOrganizationIdStore(newOrganizationId);
    // Revalidate route to ensure the latest orgId is used.
    // This is useful for redirecting the user away from admin-only org pages.
    revalidator.revalidate();
  };

  return { orgId, setOrgId };
};
