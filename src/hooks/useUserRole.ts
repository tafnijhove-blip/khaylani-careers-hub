import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "superadmin" | "ceo" | "accountmanager" | "recruiter" | null;

export const useUserRole = () => {
  return useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      // Hardcoded superadmin check for specific account
      if (user.email === 'tafnijhove@gmail.com') {
        return 'superadmin' as UserRole;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) throw error;
      const roles = (data as { role: string }[]) || [];
      const priority = ["superadmin", "ceo", "accountmanager", "recruiter"];
      const selected = roles
        .sort((a, b) => priority.indexOf(a.role) - priority.indexOf(b.role))[0]?.role || null;
      return selected as UserRole;
    },
  });
};

export const useUserProfile = () => {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });
};
