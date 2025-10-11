import { useUserRole } from "./useUserRole";

export const usePermissions = () => {
  const { data: userRole, isLoading } = useUserRole();

  return {
    // User Management
    canManageUsers: ['superadmin', 'ceo'].includes(userRole || ''),
    canViewUsers: userRole !== null,
    
    // Company Management
    canManageCompanies: userRole === 'superadmin',
    canEditOwnCompany: ['superadmin', 'ceo'].includes(userRole || ''),
    canViewCompanies: userRole !== null,
    
    // Vacancy Management
    canCreateVacancies: ['superadmin', 'ceo', 'accountmanager'].includes(userRole || ''),
    canEditVacancies: ['superadmin', 'ceo', 'accountmanager', 'recruiter'].includes(userRole || ''),
    canDeleteVacancies: ['superadmin', 'ceo', 'accountmanager'].includes(userRole || ''),
    canViewVacancies: userRole !== null,
    
    // Candidate Management
    canCreateCandidates: userRole !== null,
    canEditCandidates: userRole !== null,
    canDeleteCandidates: ['superadmin', 'ceo', 'accountmanager'].includes(userRole || ''),
    canViewCandidates: userRole !== null,
    
    // Analytics
    canViewAnalytics: userRole !== null,
    canViewAdvancedAnalytics: ['superadmin', 'ceo', 'accountmanager'].includes(userRole || ''),
    
    // Relations
    canManageRelations: ['superadmin', 'ceo'].includes(userRole || ''),
    canViewRelations: ['superadmin', 'ceo', 'accountmanager'].includes(userRole || ''),
    
    // Role checks
    isSuperAdmin: userRole === 'superadmin',
    isCEO: userRole === 'ceo',
    isAccountManager: userRole === 'accountmanager',
    isRecruiter: userRole === 'recruiter',
    
    // Loading state
    isLoading,
  };
};
