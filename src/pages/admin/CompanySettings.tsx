import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Building2, Phone, Globe, FileText, Bell } from "lucide-react";

interface CompanySetting {
  id: string;
  key: string;
  value: string | null;
  label: string;
  category: string;
}

const AdminCompanySettings = () => {
  const queryClient = useQueryClient();
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ["company-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .order("category", { ascending: true });
      if (error) throw error;
      return data as CompanySetting[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: { key: string; value: string }[]) => {
      for (const update of updates) {
        const { error } = await supabase
          .from("company_settings")
          .update({ value: update.value })
          .eq("key", update.key);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
      queryClient.invalidateQueries({ queryKey: ["announcement-settings"] });
      setEditedSettings({});
      toast.success("Settings saved successfully!");
    },
    onError: (error) => {
      toast.error("Failed to save settings: " + error.message);
    },
  });

  const handleChange = (key: string, value: string) => {
    setEditedSettings((prev) => ({ ...prev, [key]: value }));
  };

  const getValue = (setting: CompanySetting) => {
    return editedSettings[setting.key] ?? setting.value ?? "";
  };

  const getValueByKey = (key: string) => {
    const setting = settings?.find(s => s.key === key);
    return editedSettings[key] ?? setting?.value ?? "";
  };

  const handleSave = () => {
    const updates = Object.entries(editedSettings).map(([key, value]) => ({
      key,
      value,
    }));
    if (updates.length === 0) {
      toast.info("No changes to save");
      return;
    }
    updateMutation.mutate(updates);
  };

  const getSettingsByCategory = (category: string) => {
    return settings?.filter((s) => s.category === category) || [];
  };

  const isTextArea = (key: string) => {
    return ["about_us", "terms_conditions", "privacy_policy", "return_policy", "address"].includes(key);
  };

  const isAnnouncementSetting = (key: string) => {
    return key.startsWith("announcement_");
  };

  const isColorSetting = (key: string) => {
    return key.includes("_color");
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  const generalSettings = getSettingsByCategory("general").filter(s => !isAnnouncementSetting(s.key));
  const announcementSettings = getSettingsByCategory("general").filter(s => isAnnouncementSetting(s.key));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Company Settings</h1>
            <p className="text-muted-foreground">Manage your company information and links</p>
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending || Object.keys(editedSettings).length === 0}>
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Contact
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Social Links
            </TabsTrigger>
            <TabsTrigger value="pages" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Pages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            {/* Announcement Bar Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Announcement Bar
                </CardTitle>
                <CardDescription>Configure the promotional banner at the top of your website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Announcement Bar</Label>
                    <p className="text-sm text-muted-foreground">Show the promotional bar at the top of the page</p>
                  </div>
                  <Switch
                    checked={getValueByKey("announcement_enabled") === "true"}
                    onCheckedChange={(checked) => handleChange("announcement_enabled", checked ? "true" : "false")}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="announcement_message">Announcement Message</Label>
                  <Input
                    id="announcement_message"
                    value={getValueByKey("announcement_message")}
                    onChange={(e) => handleChange("announcement_message", e.target.value)}
                    placeholder="Enter your announcement message"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="announcement_bg_color">Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="announcement_bg_color"
                        type="color"
                        value={getValueByKey("announcement_bg_color") || "#f97316"}
                        onChange={(e) => handleChange("announcement_bg_color", e.target.value)}
                        className="w-14 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={getValueByKey("announcement_bg_color") || "#f97316"}
                        onChange={(e) => handleChange("announcement_bg_color", e.target.value)}
                        placeholder="#f97316"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="announcement_text_color">Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="announcement_text_color"
                        type="color"
                        value={getValueByKey("announcement_text_color") || "#ffffff"}
                        onChange={(e) => handleChange("announcement_text_color", e.target.value)}
                        className="w-14 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={getValueByKey("announcement_text_color") || "#ffffff"}
                        onChange={(e) => handleChange("announcement_text_color", e.target.value)}
                        placeholder="#ffffff"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div 
                    className="py-2 text-center text-sm font-medium rounded"
                    style={{ 
                      backgroundColor: getValueByKey("announcement_bg_color") || "#f97316", 
                      color: getValueByKey("announcement_text_color") || "#ffffff" 
                    }}
                  >
                    <span className="mr-2">🔔</span>
                    {getValueByKey("announcement_message") || "Your announcement message here"}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* General Company Info */}
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>Basic company details displayed across the website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {generalSettings.map((setting) => (
                  <div key={setting.id} className="space-y-2">
                    <Label htmlFor={setting.key}>{setting.label}</Label>
                    <Input
                      id={setting.key}
                      value={getValue(setting)}
                      onChange={(e) => handleChange(setting.key, e.target.value)}
                      placeholder={`Enter ${setting.label.toLowerCase()}`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Contact details shown in footer and contact pages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory("contact").map((setting) => (
                  <div key={setting.id} className="space-y-2">
                    <Label htmlFor={setting.key}>{setting.label}</Label>
                    {isTextArea(setting.key) ? (
                      <Textarea
                        id={setting.key}
                        value={getValue(setting)}
                        onChange={(e) => handleChange(setting.key, e.target.value)}
                        placeholder={`Enter ${setting.label.toLowerCase()}`}
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={setting.key}
                        value={getValue(setting)}
                        onChange={(e) => handleChange(setting.key, e.target.value)}
                        placeholder={`Enter ${setting.label.toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle>Social Media Links</CardTitle>
                <CardDescription>Links to your social media profiles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory("social").map((setting) => (
                  <div key={setting.id} className="space-y-2">
                    <Label htmlFor={setting.key}>{setting.label}</Label>
                    <Input
                      id={setting.key}
                      value={getValue(setting)}
                      onChange={(e) => handleChange(setting.key, e.target.value)}
                      placeholder={`https://...`}
                      type="url"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages">
            <Card>
              <CardHeader>
                <CardTitle>Page Content</CardTitle>
                <CardDescription>Content for static pages like About Us, Terms & Conditions, etc.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {getSettingsByCategory("pages").map((setting) => (
                  <div key={setting.id} className="space-y-2">
                    <Label htmlFor={setting.key}>{setting.label}</Label>
                    <Textarea
                      id={setting.key}
                      value={getValue(setting)}
                      onChange={(e) => handleChange(setting.key, e.target.value)}
                      placeholder={`Enter ${setting.label.toLowerCase()} content...`}
                      rows={6}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminCompanySettings;
