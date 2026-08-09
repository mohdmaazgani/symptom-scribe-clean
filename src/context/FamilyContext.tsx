import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toastUtils";

export interface Dependent {
  id: string;
  primary_user_id: string;
  full_name: string;
  relationship: "child" | "parent" | "spouse" | "sibling" | "other" | string;
  date_of_birth?: string | null;
  gender?: string | null;
  blood_type?: string | null;
  allergies?: string[] | null;
  chronic_conditions?: string[] | null;
  notes?: string | null;
  created_at?: string;
}

export interface ActiveProfile {
  id: string; // 'primary' or dependent UUID
  name: string;
  isPrimary: boolean;
  relationship?: string;
  dependent?: Dependent;
}

interface FamilyContextType {
  dependents: Dependent[];
  activeProfile: ActiveProfile;
  setActiveProfile: (profile: ActiveProfile) => void;
  loading: boolean;
  refreshDependents: () => Promise<void>;
  addDependent: (dept: Omit<Dependent, "id" | "primary_user_id">) => Promise<boolean>;
  updateDependent: (id: string, dept: Partial<Dependent>) => Promise<boolean>;
  deleteDependent: (id: string) => Promise<boolean>;
}

const PRIMARY_PROFILE: ActiveProfile = {
  id: "primary",
  name: "Self (Primary)",
  isPrimary: true,
};

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error("useFamily must be used within a FamilyProvider");
  }
  return context;
};

interface FamilyProviderProps {
  children: ReactNode;
}

export const FamilyProvider = ({ children }: FamilyProviderProps) => {
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [activeProfile, setActiveProfileState] = useState<ActiveProfile>(() => {
    try {
      const saved = sessionStorage.getItem("symptom_scribe_active_profile");
      return saved ? JSON.parse(saved) : PRIMARY_PROFILE;
    } catch {
      return PRIMARY_PROFILE;
    }
  });
  const [loading, setLoading] = useState(true);

  const setActiveProfile = (profile: ActiveProfile) => {
    setActiveProfileState(profile);
    try {
      sessionStorage.setItem("symptom_scribe_active_profile", JSON.stringify(profile));
    } catch (e) {
      console.warn("Unable to persist active profile state", e);
    }
  };

  const fetchDependents = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setDependents([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("dependents")
        .select("*")
        .eq("primary_user_id", user.id)
        .order("full_name", { ascending: true });

      if (error) {
        console.warn("Error loading dependents:", error);
      } else if (data) {
        setDependents(data as Dependent[]);
      }
    } catch (err) {
      console.error("Failed to fetch family profiles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependents();
  }, []);

  const addDependent = async (deptData: Omit<Dependent, "id" | "primary_user_id">): Promise<boolean> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        showError("Auth Error", "Please sign in to add family profiles.");
        return false;
      }

      const newId = crypto.randomUUID();
      const payload = {
        id: newId,
        primary_user_id: user.id,
        full_name: deptData.full_name,
        relationship: deptData.relationship || "other",
        date_of_birth: deptData.date_of_birth || null,
        gender: deptData.gender || null,
        blood_type: deptData.blood_type || null,
        allergies: deptData.allergies || [],
        chronic_conditions: deptData.chronic_conditions || [],
        notes: deptData.notes || null,
      };

      const { error } = await supabase.from("dependents").insert(payload);

      if (error) {
        showError("Failed to Add Family Profile", error.message);
        return false;
      }

      showSuccess("Family Profile Added", `${deptData.full_name} added to your family profiles.`);
      await fetchDependents();
      return true;
    } catch (err: any) {
      showError("Error", err.message || "Failed to add family member");
      return false;
    }
  };

  const updateDependent = async (id: string, deptData: Partial<Dependent>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("dependents")
        .update({ ...deptData, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        showError("Failed to Update", error.message);
        return false;
      }

      showSuccess("Updated", "Family profile details saved.");
      await fetchDependents();
      return true;
    } catch (err: any) {
      showError("Error", err.message);
      return false;
    }
  };

  const deleteDependent = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("dependents").delete().eq("id", id);

      if (error) {
        showError("Delete Failed", error.message);
        return false;
      }

      showSuccess("Profile Removed", "Family profile deleted successfully.");
      if (activeProfile.id === id) {
        setActiveProfile(PRIMARY_PROFILE);
      }
      await fetchDependents();
      return true;
    } catch (err: any) {
      showError("Error", err.message);
      return false;
    }
  };

  return (
    <FamilyContext.Provider
      value={{
        dependents,
        activeProfile,
        setActiveProfile,
        loading,
        refreshDependents: fetchDependents,
        addDependent,
        updateDependent,
        deleteDependent,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
};
