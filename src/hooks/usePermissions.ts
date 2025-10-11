import { useUserRole } from "./useUserRole";

export const usePermissions = () => {
  const { data: userRole, isLoading } = useUserRole();

  return {
    // User Management (only Manager can manage users within own company)
    canManageUsers: ['superadmin', 'ceo'].includes(userRole || ''),
    canViewUsers: ['superadmin', 'ceo'].includes(userRole || ''),
    
    // Company Management
    canManageCompanies: userRole === 'superadmin',
    canEditOwnCompany: ['superadmin', 'ceo'].includes(userRole || ''),
    canViewCompanies: userRole !== null,
    
    // Vacancy Management (Recruiter is READ-ONLY)
    canCreateVacancies: ['superadmin', 'ceo', 'accountmanager'].includes(userRole || ''),
    canEditVacancies: ['superadmin', 'ceo', 'accountmanager'].includes(userRole || ''),
    canDeleteVacancies: ['superadmin', 'ceo', 'accountmanager'].includes(userRole || ''),
    canViewVacancies: userRole !== null,
    
    // Candidate Management (Recruiter is READ-ONLY)
    canCreateCandidates: ['superadmin', 'ceo', 'accountmanager'].includes(userRole || ''),
    canEditCandidates: ['superadmin', 'ceo', 'accountmanager'].includes(userRole || ''),
    canDeleteCandidates: ['superadmin', 'ceo', 'accountmanager'].includes(userRole || ''),
    canViewCandidates: userRole !== null,
    
    // Analytics
    canViewAnalytics: ['superadmin', 'ceo', 'accountmanager'].includes(userRole || ''),
    canViewAdvancedAnalytics: ['superadmin', 'ceo', 'accountmanager'].includes(userRole || ''),
    
    // Relations (only for Manager within own company)
    canManageRelations: ['superadmin', 'ceo'].includes(userRole || ''),
    canViewRelations: ['superadmin', 'ceo', 'accountmanager'].includes(userRole || ''),
    
    // Role checks
    isSuperAdmin: userRole === 'superadmin',
    isManager: userRole === 'ceo',
    isAccountManager: userRole === 'accountmanager',
    isRecruiter: userRole === 'recruiter',
    
    // Loading state
    isLoading,
  };
};
