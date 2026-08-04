import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Loader2, Plus, Trash2 } from "lucide-react";
import { showSuccess, showError, showWarning } from "@/lib/toast-helpers";
import {
  whenEncryptionReady,
  encryptProfileField,
  encryptProfileArray,
} from "@/lib/encryption";
import { useProfile } from "@/contexts/ProfileContext";

const Profile = () => {
  const { profiles, activeProfile, isLoading, createProfile, deleteProfile, refreshProfiles, switchProfile } = useProfile();
  
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "",
    blood_type: "",
    relationship: "Self",
    allergies: [] as string[],
    chronic_conditions: [] as string[],
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });
  const [allergiesInput, setAllergiesInput] = useState("");
  const [conditionsInput, setConditionsInput] = useState("");

  const [isAddingFamilyMember, setIsAddingFamilyMember] = useState(false);
  const [newFamilyMember, setNewFamilyMember] = useState({ full_name: "", relationship: "Child" });

  useEffect(() => {
    if (activeProfile) {
      setProfile({
        full_name: activeProfile.full_name || "",
        date_of_birth: activeProfile.date_of_birth || "",
        gender: activeProfile.gender || "",
        blood_type: activeProfile.blood_type || "",
        relationship: activeProfile.relationship || "Self",
        allergies: activeProfile.allergies || [],
        chronic_conditions: activeProfile.chronic_conditions || [],
        emergency_contact_name: activeProfile.emergency_contact_name || "",
        emergency_contact_phone: activeProfile.emergency_contact_phone || "",
      });
      setAllergiesInput((activeProfile.allergies || []).join(", "));
      setConditionsInput((activeProfile.chronic_conditions || []).join(", "));
    }
  }, [activeProfile]);

  const validateProfile = () => {
    if (!profile.date_of_birth) {
      showWarning("Missing Field", "Date of Birth is required");
      return false;
    }
    if (!profile.gender) {
      showWarning("Missing Field", "Gender is required");
      return false;
    }
    if (!profile.blood_type) {
      showWarning("Missing Field", "Blood Type is required");
      return false;
    }
    if (
      profile.emergency_contact_phone &&
      !/^\+?[0-9]{10,15}$/.test(
        profile.emergency_contact_phone.replace(/[\s()-]/g, "")
      )
    ) {
      showWarning(
        "Invalid Phone Number",
        "Please enter a valid emergency contact number"
      );
      return false;
    }
    
    if (profile.date_of_birth) {
      const age = new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear();
      if (age < 0 || age > 120) {
        showWarning("Invalid Date of Birth", "Please enter a valid date of birth");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfile() || !activeProfile) return;
    
    setSaving(true);
    try {
      const key = await whenEncryptionReady();

      const allergiesArray = allergiesInput
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a);
      const conditionsArray = conditionsInput
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c);

      const encryptedFullName = await encryptProfileField(profile.full_name, key);
      const encryptedDob = await encryptProfileField(profile.date_of_birth, key);
      const encryptedEmergencyName = await encryptProfileField(profile.emergency_contact_name, key);
      const encryptedEmergencyPhone = await encryptProfileField(profile.emergency_contact_phone, key);
      const encryptedAllergies = await encryptProfileArray(allergiesArray, key);
      const encryptedChronicConditions = await encryptProfileArray(conditionsArray, key);

      const profileData = {
        full_name: encryptedFullName,
        date_of_birth: encryptedDob,
        gender: profile.gender || null,
        blood_type: profile.blood_type || null,
        relationship: profile.relationship || "Self",
        allergies: encryptedAllergies,
        chronic_conditions: encryptedChronicConditions,
        emergency_contact_name: encryptedEmergencyName,
        emergency_contact_phone: encryptedEmergencyPhone,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("id", activeProfile.id);

      if (error) throw error;

      await refreshProfiles();
      
      showSuccess("Profile Saved", "Health information has been updated");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      showError("Save Failed", error.message || "Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyMember.full_name) {
      showWarning("Missing Field", "Full name is required");
      return;
    }
    
    setSaving(true);
    const success = await createProfile({
      full_name: newFamilyMember.full_name,
      relationship: newFamilyMember.relationship,
    });
    setSaving(false);
    if (success) {
      setIsAddingFamilyMember(false);
      setNewFamilyMember({ full_name: "", relationship: "Child" });
    }
  };

  const handleDeleteProfile = async (id: string, name: string | null) => {
    if (window.confirm(`Are you sure you want to delete the profile for ${name || "this family member"}?`)) {
      await deleteProfile(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Health Profiles</h1>
        <p className="text-muted-foreground">Manage health profiles for you and your family</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Family Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profiles.map(p => (
                <div key={p.id} className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${activeProfile?.id === p.id ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`} onClick={() => switchProfile(p.id)}>
                  <div>
                    <p className="font-medium">{p.full_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{p.is_primary ? "Primary (Self)" : p.relationship}</p>
                  </div>
                  {!p.is_primary && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDeleteProfile(p.id, p.full_name); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              {isAddingFamilyMember ? (
                <form onSubmit={handleAddFamilyMember} className="space-y-3 p-3 border rounded-lg bg-accent/30 mt-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input size={1} className="h-8 text-sm" value={newFamilyMember.full_name} onChange={e => setNewFamilyMember({...newFamilyMember, full_name: e.target.value})} placeholder="Jane Doe" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Relationship</Label>
                    <Select value={newFamilyMember.relationship} onValueChange={v => setNewFamilyMember({...newFamilyMember, relationship: v})}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Child">Child</SelectItem>
                        <SelectItem value="Parent">Parent</SelectItem>
                        <SelectItem value="Spouse">Spouse</SelectItem>
                        <SelectItem value="Sibling">Sibling</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" className="w-full text-xs" onClick={() => setIsAddingFamilyMember(false)}>Cancel</Button>
                    <Button type="submit" size="sm" className="w-full text-xs" disabled={saving}>Add</Button>
                  </div>
                </form>
              ) : (
                <Button variant="outline" className="w-full mt-4" onClick={() => setIsAddingFamilyMember(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Add Family Member
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {activeProfile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {activeProfile.is_primary ? "Personal Information" : `${activeProfile.full_name}'s Information`}
              </CardTitle>
              <CardDescription>
                Keep health information up to date for better AI recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form id="profileForm" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth <span className="text-red-500">*</span></Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={profile.date_of_birth}
                      onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                    />
                  </div>
                  
                  {!activeProfile.is_primary && (
                    <div className="space-y-2">
                      <Label>Relationship <span className="text-red-500">*</span></Label>
                      <Select
                        value={profile.relationship}
                        onValueChange={(value) => setProfile({ ...profile, relationship: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Child">Child</SelectItem>
                          <SelectItem value="Parent">Parent</SelectItem>
                          <SelectItem value="Spouse">Spouse</SelectItem>
                          <SelectItem value="Sibling">Sibling</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender <span className="text-red-500">*</span></Label>
                    <Select
                      value={profile.gender}
                      onValueChange={(value) => setProfile({ ...profile, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="blood_type">Blood Type <span className="text-red-500">*</span></Label>
                    <Select
                      value={profile.blood_type}
                      onValueChange={(value) => setProfile({ ...profile, blood_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent>
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies (comma-separated)</Label>
                  <Input
                    id="allergies"
                    value={allergiesInput}
                    onChange={(e) => setAllergiesInput(e.target.value)}
                    placeholder="Peanuts, Penicillin, Latex"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate multiple allergies with commas
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conditions">Chronic Conditions (comma-separated)</Label>
                  <Input
                    id="conditions"
                    value={conditionsInput}
                    onChange={(e) => setConditionsInput(e.target.value)}
                    placeholder="Diabetes, Hypertension"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate multiple conditions with commas
                  </p>
                </div>

                <div className="border-t pt-4 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergency_name">Contact Name</Label>
                      <Input
                        id="emergency_name"
                        value={profile.emergency_contact_name}
                        onChange={(e) =>
                          setProfile({ ...profile, emergency_contact_name: e.target.value })
                        }
                        placeholder="Jane Doe"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emergency_phone">Contact Phone</Label>
                      <Input
                        id="emergency_phone"
                        type="tel"
                        value={profile.emergency_contact_phone}
                        onChange={(e) =>
                          setProfile({ ...profile, emergency_contact_phone: e.target.value })
                        }
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button type="submit" form="profileForm" disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Profile"
                )}
              </Button>
            </CardFooter>
          </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;