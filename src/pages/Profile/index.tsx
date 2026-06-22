import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Loader2 } from "lucide-react";
import { showSuccess, showError, showInfo, showWarning } from "@/lib/toast-helpers";

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        setProfile({
          full_name: data.full_name || "",
          date_of_birth: data.date_of_birth || "",
          gender: data.gender || "",
          blood_type: data.blood_type || "",
          allergies: data.allergies || [],
          chronic_conditions: data.chronic_conditions || [],
          emergency_contact_name: data.emergency_contact_name || "",
          emergency_contact_phone: data.emergency_contact_phone || "",
        });
        setAllergiesInput(data.allergies?.join(", ") || "");
        setConditionsInput(data.chronic_conditions?.join(", ") || "");
        
        if (data.full_name) {
          showInfo("Profile Loaded", `Welcome back, ${data.full_name}!`);
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

      const allergiesArray = allergiesInput
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a);
      const conditionsArray = conditionsInput
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c);

      const profileData = {
        user_id: user.id,
        full_name: profile.full_name || null,
        date_of_birth: profile.date_of_birth || null,
        gender: profile.gender || null,
        blood_type: profile.blood_type || null,
        allergies: allergiesArray,
        chronic_conditions: conditionsArray,
        emergency_contact_name: profile.emergency_contact_name || null,
        emergency_contact_phone: profile.emergency_contact_phone || null,
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
    </div>
  );
};

export default Profile;