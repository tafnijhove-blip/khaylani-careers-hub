import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserProfile } from "./useUserRole";
import { useUserRole } from "./useUserRole";

/**
 * Hook to ensure users can only access their own tenant's routes
 * Redirects if user tries to access another company's data
 */
export const useTenantGuard = () => {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const { data: profile } = useUserProfile();
  const { data: userRole } = useUserRole();

  useEffect(() => {
    // Skip check for superadmins (they can access all tenants)
    if (userRole === 'superadmin') return;
    
    // Skip if still loading or no company in route
    if (!profile || !companyId) return;

    // Check if user is trying to access another tenant's data
    if (profile.company_id !== companyId) {
      console.warn('Unauthorized tenant access attempt blocked');
      navigate(`/bedrijf/${profile.company_id}`, { replace: true });
    }
  }, [profile, companyId, userRole, navigate]);

  return {
    isAuthorized: !companyId || userRole === 'superadmin' || profile?.company_id === companyId,
    userTenantId: profile?.company_id,
  };
};
