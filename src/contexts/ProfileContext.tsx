import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { whenEncryptionReady, decryptProfileField, encryptProfileField } from "@/lib/encryption";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface ProfileContextType {
  profiles: Profile[];
  activeProfile: Profile | null;
  isLoading: boolean;
  switchProfile: (profileId: string) => void;
  refreshProfiles: () => Promise<void>;
  createProfile: (profileData: Partial<Profile>) => Promise<boolean>;
  deleteProfile: (profileId: string) => Promise<boolean>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfiles([]);
        setActiveProfile(null);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("is_primary", { ascending: false });

      if (error) {
        console.error("Error fetching profiles:", error);
        throw error;
      }

      if (data && data.length > 0) {
        const key = await whenEncryptionReady();
        const decryptedProfiles = await Promise.all(
          data.map(async (profile) => {
            try {
              return {
                ...profile,
                full_name: profile.full_name ? await decryptProfileField(profile.full_name, key) : null,
                date_of_birth: profile.date_of_birth ? await decryptProfileField(profile.date_of_birth, key) : null,
                emergency_contact_name: profile.emergency_contact_name ? await decryptProfileField(profile.emergency_contact_name, key) : null,
                emergency_contact_phone: profile.emergency_contact_phone ? await decryptProfileField(profile.emergency_contact_phone, key) : null,
              };
            } catch (err) {
              console.error("Error decrypting profile:", profile.id, err);
              return profile;
            }
          })
        );
        setProfiles(decryptedProfiles);
        
        // Retain the current active profile if it exists in the fetched list
        setActiveProfile((current) => {
          if (current) {
            const stillExists = decryptedProfiles.find((p) => p.id === current.id);
            if (stillExists) return stillExists;
          }
          // Fallback to primary
          const primary = decryptedProfiles.find((p) => p.is_primary);
          return primary || decryptedProfiles[0];
        });
      } else {
        setProfiles([]);
        setActiveProfile(null);
      }
    } catch (error: any) {
      toast({
        title: "Error loading profiles",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProfiles();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          fetchProfiles();
        } else if (event === "SIGNED_OUT") {
          setProfiles([]);
          setActiveProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfiles]);

  const switchProfile = useCallback((profileId: string) => {
    const profile = profiles.find((p) => p.id === profileId);
    if (profile) {
      setActiveProfile(profile);
      toast({
        title: "Profile Switched",
        description: `Now viewing data for ${profile.full_name || profile.relationship || "Profile"}`,
      });
    }
  }, [profiles, toast]);

  const createProfile = useCallback(async (profileData: Partial<Profile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const key = await whenEncryptionReady();
      const encryptedProfileData = {
        ...profileData,
        full_name: profileData.full_name ? await encryptProfileField(profileData.full_name, key) : null,
        date_of_birth: profileData.date_of_birth ? await encryptProfileField(profileData.date_of_birth, key) : null,
        emergency_contact_name: profileData.emergency_contact_name ? await encryptProfileField(profileData.emergency_contact_name, key) : null,
        emergency_contact_phone: profileData.emergency_contact_phone ? await encryptProfileField(profileData.emergency_contact_phone, key) : null,
      };

      const { data, error } = await supabase
        .from("profiles")
        .insert({
          ...encryptedProfileData,
          user_id: user.id,
          is_primary: false,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchProfiles();
      
      toast({
        title: "Profile Created",
        description: "Family member profile has been added.",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Error creating profile",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }, [fetchProfiles, toast]);

  const deleteProfile = useCallback(async (profileId: string) => {
    try {
      const profileToDelete = profiles.find((p) => p.id === profileId);
      if (!profileToDelete) throw new Error("Profile not found");
      if (profileToDelete.is_primary) {
        throw new Error("Cannot delete primary profile");
      }

      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", profileId);

      if (error) throw error;

      await fetchProfiles();
      toast({
        title: "Profile Deleted",
        description: "The profile and all associated data have been removed.",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Error deleting profile",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }, [profiles, fetchProfiles, toast]);

  const value = useMemo(() => ({
    profiles,
    activeProfile,
    isLoading,
    switchProfile,
    refreshProfiles: fetchProfiles,
    createProfile,
    deleteProfile,
  }), [profiles, activeProfile, isLoading, switchProfile, fetchProfiles, createProfile, deleteProfile]);

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};
