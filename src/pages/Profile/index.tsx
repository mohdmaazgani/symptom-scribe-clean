import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Loader2, Lock, Unlock, ShieldCheck } from "lucide-react";
import { showSuccess, showError, showInfo, showWarning } from "@/lib/toast-helpers";
import {
  whenEncryptionReady,
  encryptProfileField,
  decryptProfileField,
  encryptProfileArray,
  decryptProfileArray,
} from "@/lib/encryption";

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pinLocked, setPinLocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinEnabled, setPinEnabled] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPinSetup, setShowPinSetup] = useState(false);
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
    const storedPinEnabled = sessionStorage.getItem("profile_pin_enabled");
    if (storedPinEnabled === "true") {
      setPinEnabled(true);
      setPinLocked(true);
    } else {
      fetchProfile();
    }
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

  const verifyPin = () => {
    const storedPin = sessionStorage.getItem("profile_pin_hash");
    if (!storedPin) return false;
    // Simple hash comparison: store hash of input PIN
    const inputHash = String(pinInput).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0).toString();
    if (inputHash === storedPin) {
      setPinLocked(false);
      setPinInput("");
      fetchProfile();
      return true;
    }
    showError("Incorrect PIN", "The PIN you entered is incorrect");
    setPinInput("");
    return false;
  };

  const savePin = () => {
    if (newPin.length < 4 || newPin.length > 8) {
      showWarning("Invalid PIN", "PIN must be 4 to 8 digits");
      return;
    }
    if (!/^\d+$/.test(newPin)) {
      showWarning("Invalid PIN", "PIN must contain only digits");
      return;
    }
    if (newPin !== confirmPin) {
      showWarning("PIN Mismatch", "The PINs you entered do not match");
      return;
    }
    // Store hash of PIN (simple sum of char codes for demo; production should use bcrypt)
    const pinHash = newPin.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0).toString();
    sessionStorage.setItem("profile_pin_hash", pinHash);
    sessionStorage.setItem("profile_pin_enabled", "true");
    setPinEnabled(true);
    setShowPinSetup(false);
    setNewPin("");
    setConfirmPin("");
    showSuccess("PIN Enabled", "Your health profile is now protected with a PIN");
  };

  const disablePin = () => {
    sessionStorage.removeItem("profile_pin_hash");
    sessionStorage.removeItem("profile_pin_enabled");
    setPinEnabled(false);
    setShowPinSetup(false);
    showSuccess("PIN Disabled", "Your PIN lock has been removed");
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

  if (pinLocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="flex flex-col items-center gap-3 p-8 rounded-xl border shadow-sm bg-card text-center max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Profile Locked</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your PIN to access your health profile
            </p>
          </div>
          <div className="space-y-3 w-full">
            <Input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter PIN"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && verifyPin()}
              className="text-center text-lg tracking-widest"
              maxLength={8}
              autoFocus
            />
            <Button onClick={verifyPin} className="w-full" disabled={pinInput.length < 4}>
              <ShieldCheck className="w-4 h-4 mr-2" />
              Unlock Profile
            </Button>
          </div>
        </div>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {pinEnabled ? (
              <Lock className="w-5 h-5 text-green-600" />
            ) : (
              <Unlock className="w-5 h-5" />
            )}
            PIN Lock
          </CardTitle>
          <CardDescription>
            {pinEnabled
              ? "Your health profile is protected with a PIN"
              : "Add a PIN to protect access to your health profile"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showPinSetup ? (
            <div className="flex gap-3">
              {pinEnabled ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowPinSetup(true)}
                    className="flex-1"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Change PIN
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={disablePin}
                    className="flex-1"
                  >
                    <Unlock className="w-4 h-4 mr-2" />
                    Remove PIN
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setShowPinSetup(true)}
                  className="w-full"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Enable PIN Lock
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="new_pin">New PIN (4-8 digits)</Label>
                <Input
                  id="new_pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Enter new PIN"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  maxLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_pin">Confirm PIN</Label>
                <Input
                  id="confirm_pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Re-enter PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                  maxLength={8}
                  onKeyDown={(e) => e.key === "Enter" && savePin()}
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={savePin} className="flex-1">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Save PIN
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowPinSetup(false);
                    setNewPin("");
                    setConfirmPin("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;