import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Loader2, Plus, Trash2, HeartHandshake, Users } from "lucide-react";
import { showSuccess, showError, showInfo, showWarning } from "@/lib/toast-helpers";
import { useFamily, Dependent } from "@/context/FamilyContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  whenEncryptionReady,
  encryptProfileField,
  decryptProfileField,
  encryptProfileArray,
  decryptProfileArray,
} from "@/lib/encryption";

const Profile = () => {
  const { dependents, addDependent, deleteDependent } = useFamily();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDept, setNewDept] = useState({
    full_name: "",
    relationship: "child",
    date_of_birth: "",
    gender: "other",
    blood_type: "O+",
    allergies: "",
    chronic_conditions: "",
  });
  const [profile, setProfile] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "",
    blood_type: "",
    allergies: [] as string[],
    chronic_conditions: [] as string[],
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });
  const [allergiesInput, setAllergiesInput] = useState("");
  const [conditionsInput, setConditionsInput] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showWarning("Not Signed In", "Please sign in to view your profile");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        showError("Error Loading Profile", error.message);
        throw error;
      }

      if (data) {
        const key = await whenEncryptionReady();
        const decryptedFullName = await decryptProfileField(data.full_name, key);
        const decryptedDob = await decryptProfileField(data.date_of_birth, key);
        const decryptedEmergencyName = await decryptProfileField(data.emergency_contact_name, key);
        const decryptedEmergencyPhone = await decryptProfileField(data.emergency_contact_phone, key);
        const decryptedAllergies = await decryptProfileArray(data.allergies, key);
        const decryptedChronicConditions = await decryptProfileArray(data.chronic_conditions, key);

        setProfile({
          full_name: decryptedFullName,
          date_of_birth: decryptedDob,
          gender: data.gender || "",
          blood_type: data.blood_type || "",
          allergies: decryptedAllergies,
          chronic_conditions: decryptedChronicConditions,
          emergency_contact_name: decryptedEmergencyName,
          emergency_contact_phone: decryptedEmergencyPhone,
        });
        setAllergiesInput(decryptedAllergies.join(", ") || "");
        setConditionsInput(decryptedChronicConditions.join(", ") || "");
        
        if (decryptedFullName) {
          showInfo("Profile Loaded", `Welcome back, ${decryptedFullName}!`);
        } else {
          showInfo("Complete Your Profile", "Add your health information for better AI recommendations");
        }
      } else {
        showInfo("New Profile", "Fill out your health information to get started");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      showError("Connection Error", "Failed to load your profile");
    } finally {
      setLoading(false);
    }
  };

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
    
    if (!validateProfile()) return;
    
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showError("Authentication Error", "You must be logged in to save your profile");
        setSaving(false);
        return;
      }

      console.log("Current user:", user.id);

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
        user_id: user.id,
        full_name: encryptedFullName,
        date_of_birth: encryptedDob,
        gender: profile.gender || null,
        blood_type: profile.blood_type || null,
        allergies: encryptedAllergies,
        chronic_conditions: encryptedChronicConditions,
        emergency_contact_name: encryptedEmergencyName,
        emergency_contact_phone: encryptedEmergencyPhone,
        updated_at: new Date().toISOString(),
      };

      console.log("Saving profile data:", profileData);

      // Upsert the profile data targeting the unique user_id constraint
      const result = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: "user_id" });

      if (result.error) {
        console.error("Supabase error:", result.error);
        showError("Save Failed", result.error.message);
        return;
      }

      console.log("Save successful:", result);
      
      // Show success message
      if (profile.full_name) {
        showSuccess("Profile Updated!", `Great! Your health profile is now complete, ${profile.full_name}`);
      } else {
        showSuccess("Profile Saved", "Your health information has been updated");
      }

      // Show helpful warnings (optional)
      if (allergiesArray.length === 0 && conditionsArray.length === 0) {
        showWarning("Health Info Missing", "Consider adding allergies or conditions for better AI recommendations");
      }
      
      if (!profile.emergency_contact_name || !profile.emergency_contact_phone) {
        showWarning("Emergency Contact Missing", "Adding an emergency contact is recommended for safety");
      }
      
    } catch (error) {
      console.error("Error saving profile:", error);
      showError("Save Failed", "Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Health Profile</h1>
        <p className="text-muted-foreground">Manage your personal health information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Keep your health information up to date for better AI recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  <p className="text-xs text-muted-foreground">
                    Include country code for international numbers
                  </p>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Family & Dependents Section */}
      <Card className="max-w-2xl mx-auto shadow-lg bg-slate-900/60 border-slate-800/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-800/60">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
              <Users className="h-5 w-5 text-cyan-400" />
              Family & Dependents
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Manage sub-profiles for children, parents, or spouse to track their health data under your account.
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            size="sm"
            className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Family Member
          </Button>
        </CardHeader>

        <CardContent className="pt-4">
          {dependents.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
              <HeartHandshake className="h-10 w-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-300 text-sm font-semibold">No Family Members Added</p>
              <p className="text-slate-500 text-xs mt-0.5">
                Add dependents to monitor symptoms, prescriptions, and health metrics for your loved ones.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {dependents.map((dept) => (
                <div
                  key={dept.id}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                      {dept.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{dept.full_name}</h4>
                        <Badge className="bg-slate-800 text-cyan-300 text-[10px] capitalize">
                          {dept.relationship}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        DOB: {dept.date_of_birth || "N/A"} • Blood Type: {dept.blood_type || "N/A"}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => deleteDependent(dept.id)}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-rose-400 hover:bg-slate-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Family Member Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md bg-slate-950 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-cyan-400" /> Add Family Dependent Profile
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Enter details for your family member to create their sub-profile.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newDept.full_name) {
                showWarning("Missing Name", "Please enter family member's name.");
                return;
              }
              const success = await addDependent({
                full_name: newDept.full_name,
                relationship: newDept.relationship,
                date_of_birth: newDept.date_of_birth || null,
                gender: newDept.gender || null,
                blood_type: newDept.blood_type || null,
                allergies: newDept.allergies ? newDept.allergies.split(",").map((s) => s.trim()) : [],
                chronic_conditions: newDept.chronic_conditions
                  ? newDept.chronic_conditions.split(",").map((s) => s.trim())
                  : [],
              });

              if (success) {
                setShowAddModal(false);
                setNewDept({
                  full_name: "",
                  relationship: "child",
                  date_of_birth: "",
                  gender: "other",
                  blood_type: "O+",
                  allergies: "",
                  chronic_conditions: "",
                });
              }
            }}
            className="space-y-3 mt-2"
          >
            <div className="space-y-1">
              <Label htmlFor="dept_name" className="text-xs">Full Name <span className="text-red-400">*</span></Label>
              <Input
                id="dept_name"
                value={newDept.full_name}
                onChange={(e) => setNewDept({ ...newDept, full_name: e.target.value })}
                placeholder="e.g. Sophia Doe"
                className="bg-slate-900 border-slate-800 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="dept_rel" className="text-xs">Relationship</Label>
                <Select
                  value={newDept.relationship}
                  onValueChange={(val) => setNewDept({ ...newDept, relationship: val })}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-800 text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800">
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="dept_dob" className="text-xs">Date of Birth</Label>
                <Input
                  id="dept_dob"
                  type="date"
                  value={newDept.date_of_birth}
                  onChange={(e) => setNewDept({ ...newDept, date_of_birth: e.target.value })}
                  className="bg-slate-900 border-slate-800 text-xs h-8"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="dept_gender" className="text-xs">Gender</Label>
                <Select
                  value={newDept.gender}
                  onValueChange={(val) => setNewDept({ ...newDept, gender: val })}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-800 text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800">
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="dept_blood" className="text-xs">Blood Type</Label>
                <Select
                  value={newDept.blood_type}
                  onValueChange={(val) => setNewDept({ ...newDept, blood_type: val })}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-800 text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800">
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bt) => (
                      <SelectItem key={bt} value={bt}>
                        {bt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="dept_allergies" className="text-xs">Allergies (comma-separated)</Label>
              <Input
                id="dept_allergies"
                value={newDept.allergies}
                onChange={(e) => setNewDept({ ...newDept, allergies: e.target.value })}
                placeholder="Peanuts, Latex"
                className="bg-slate-900 border-slate-800 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="text-xs bg-slate-900 border-slate-800"
              >
                Cancel
              </Button>
              <Button type="submit" className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white">
                Save Family Member
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;