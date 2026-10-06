"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Building2,
  Check,
  CreditCard,
  Globe,
  Lock,
  Mail,
  Save,
  Shield,
  User,
  Settings as SettingsIcon,
} from "lucide-react";

type SettingsTab =
  | "general"
  | "account"
  | "notifications"
  | "security"
  | "billing";

interface SettingsData {
  platformName: string;
  supportEmail: string;
  adminEmail: string;
  timezone: string;
  currency: string;

  notifications: {
    email: boolean;
    payments: boolean;
    newRestaurants: boolean;
    support: boolean;
  };

  security: {
    twoFactor: boolean;
  };
}

const defaultSettings: SettingsData = {
  platformName: "Restova",
  supportEmail: "support@restova.com",
  adminEmail: "admin@restova.com",
  timezone: "Asia/Kolkata",
  currency: "INR",

  notifications: {
    email: true,
    payments: true,
    newRestaurants: true,
    support: true,
  },

  security: {
    twoFactor: false,
  },
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] =
    useState<SettingsTab>("general");

  const [settings, setSettings] =
    useState<SettingsData>(defaultSettings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const tabs = [
    {
      id: "general" as SettingsTab,
      label: "General",
      description: "Platform configuration",
      icon: SettingsIcon,
    },
    {
      id: "account" as SettingsTab,
      label: "Account",
      description: "Administrator profile",
      icon: User,
    },
    {
      id: "notifications" as SettingsTab,
      label: "Notifications",
      description: "Alerts and emails",
      icon: Bell,
    },
    {
      id: "security" as SettingsTab,
      label: "Security",
      description: "Security preferences",
      icon: Shield,
    },
    {
      id: "billing" as SettingsTab,
      label: "Billing",
      description: "Payment configuration",
      icon: CreditCard,
    },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/super-admin/settings",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load settings"
        );
      }

      const serverSettings = data.settings;

      setSettings({
        platformName:
          serverSettings.platformName ||
          defaultSettings.platformName,

        supportEmail:
          serverSettings.supportEmail ||
          defaultSettings.supportEmail,

        adminEmail:
          serverSettings.adminEmail ||
          defaultSettings.adminEmail,

        timezone:
          serverSettings.timezone ||
          defaultSettings.timezone,

        currency:
          serverSettings.currency ||
          defaultSettings.currency,

        notifications: {
          email:
            serverSettings.notifications?.email ??
            defaultSettings.notifications.email,

          payments:
            serverSettings.notifications?.payments ??
            defaultSettings.notifications.payments,

          newRestaurants:
            serverSettings.notifications?.newRestaurants ??
            defaultSettings.notifications.newRestaurants,

          support:
            serverSettings.notifications?.support ??
            defaultSettings.notifications.support,
        },

        security: {
          twoFactor:
            serverSettings.security?.twoFactor ??
            defaultSettings.security.twoFactor,
        },
      });
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load settings"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setSaved(false);
      setError("");

      const response = await fetch(
        "/api/super-admin/settings",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settings),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to save settings"
        );
      }

      if (data.settings) {
        setSettings({
          ...settings,
          ...data.settings,

          notifications: {
            ...settings.notifications,
            ...(data.settings.notifications || {}),
          },

          security: {
            ...settings.security,
            ...(data.settings.security || {}),
          },
        });
      }

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save settings"
      );
    } finally {
      setSaving(false);
    }
  }

  function updateSetting<K extends keyof SettingsData>(
    key: K,
    value: SettingsData[K]
  ) {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  return (
    <div className="min-h-full bg-[#f8fafc]">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="px-7 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <SettingsIcon size={19} />
            </div>

            <div>
              <div className="mb-1 text-xs font-medium text-slate-500">
                Super Admin
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Settings
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage Restova platform configuration and
                administrator preferences.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-7">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />

            <p className="text-sm text-slate-500">
              Loading settings...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
            {/* Sidebar */}
            <div className="h-fit rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition last:mb-0 ${
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={17} />

                    <span className="min-w-0">
                      <span
                        className={`block text-sm font-medium ${
                          active
                            ? "text-white"
                            : "text-slate-800"
                        }`}
                      >
                        {tab.label}
                      </span>

                      <span
                        className={`mt-0.5 block text-[10px] ${
                          active
                            ? "text-slate-300"
                            : "text-slate-400"
                        }`}
                      >
                        {tab.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="space-y-6">
              {/* GENERAL */}
              {activeTab === "general" && (
                <>
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-6 py-5">
                      <h2 className="text-sm font-semibold text-slate-900">
                        General Settings
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Configure basic information about the
                        Restova platform.
                      </p>
                    </div>

                    <div className="space-y-5 p-6">
                      <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                          Platform Name
                        </label>

                        <div className="relative">
                          <Building2
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />

                          <input
                            value={settings.platformName}
                            onChange={(event) =>
                              updateSetting(
                                "platformName",
                                event.target.value
                              )
                            }
                            className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                          Support Email
                        </label>

                        <div className="relative">
                          <Mail
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />

                          <input
                            type="email"
                            value={settings.supportEmail}
                            onChange={(event) =>
                              updateSetting(
                                "supportEmail",
                                event.target.value
                              )
                            }
                            className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-xs font-semibold text-slate-700">
                            Timezone
                          </label>

                          <div className="relative">
                            <Globe
                              size={16}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <select
                              value={settings.timezone}
                              onChange={(event) =>
                                updateSetting(
                                  "timezone",
                                  event.target.value
                                )
                              }
                              className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                            >
                              <option value="Asia/Kolkata">
                                Asia/Kolkata
                              </option>

                              <option value="UTC">
                                UTC
                              </option>

                              <option value="Asia/Dubai">
                                Asia/Dubai
                              </option>

                              <option value="Europe/London">
                                Europe/London
                              </option>

                              <option value="America/New_York">
                                America/New_York
                              </option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-semibold text-slate-700">
                            Currency
                          </label>

                          <select
                            value={settings.currency}
                            onChange={(event) =>
                              updateSetting(
                                "currency",
                                event.target.value
                              )
                            }
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                          >
                            <option value="INR">
                              INR — Indian Rupee
                            </option>

                            <option value="USD">
                              USD — US Dollar
                            </option>

                            <option value="EUR">
                              EUR — Euro
                            </option>

                            <option value="GBP">
                              GBP — British Pound
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <InfoCard
                    icon={<Globe size={18} />}
                    title="Platform Configuration"
                    description="These settings control how Restova displays platform-level information throughout the Super Admin panel."
                  />
                </>
              )}

              {/* ACCOUNT */}
              {activeTab === "account" && (
                <>
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-6 py-5">
                      <h2 className="text-sm font-semibold text-slate-900">
                        Administrator Account
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Manage the Super Admin account information.
                      </p>
                    </div>

                    <div className="space-y-5 p-6">
                      <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-white">
                          SA
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            Super Administrator
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Full platform access
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                          Administrator Email
                        </label>

                        <div className="relative">
                          <Mail
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />

                          <input
                            type="email"
                            value={settings.adminEmail}
                            onChange={(event) =>
                              updateSetting(
                                "adminEmail",
                                event.target.value
                              )
                            }
                            className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                          Role
                        </label>

                        <input
                          value="Super Admin"
                          disabled
                          className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  <InfoCard
                    icon={<User size={18} />}
                    title="Administrator Access"
                    description="The Super Admin account has access to restaurants, owners, subscriptions, payments, analytics, support and platform settings."
                  />
                </>
              )}

              {/* NOTIFICATIONS */}
              {activeTab === "notifications" && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-6 py-5">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Notification Preferences
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Choose which platform events should generate notifications.
                    </p>
                  </div>

                  <div className="divide-y divide-slate-100">
                    <SettingToggle
                      icon={<Mail size={17} />}
                      title="Email Notifications"
                      description="Receive important platform notifications by email."
                      enabled={settings.notifications.email}
                      onChange={(value) =>
                        setSettings((previous) => ({
                          ...previous,
                          notifications: {
                            ...previous.notifications,
                            email: value,
                          },
                        }))
                      }
                    />

                    <SettingToggle
                      icon={<CreditCard size={17} />}
                      title="Payment Notifications"
                      description="Get notified when subscription payments succeed or fail."
                      enabled={settings.notifications.payments}
                      onChange={(value) =>
                        setSettings((previous) => ({
                          ...previous,
                          notifications: {
                            ...previous.notifications,
                            payments: value,
                          },
                        }))
                      }
                    />

                    <SettingToggle
                      icon={<Building2 size={17} />}
                      title="New Restaurant Notifications"
                      description="Receive an alert whenever a new restaurant joins Restova."
                      enabled={
                        settings.notifications.newRestaurants
                      }
                      onChange={(value) =>
                        setSettings((previous) => ({
                          ...previous,
                          notifications: {
                            ...previous.notifications,
                            newRestaurants: value,
                          },
                        }))
                      }
                    />

                    <SettingToggle
                      icon={<Bell size={17} />}
                      title="Support Notifications"
                      description="Receive notifications when a new support ticket is created."
                      enabled={settings.notifications.support}
                      onChange={(value) =>
                        setSettings((previous) => ({
                          ...previous,
                          notifications: {
                            ...previous.notifications,
                            support: value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              )}

              {/* SECURITY */}
              {activeTab === "security" && (
                <>
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-6 py-5">
                      <h2 className="text-sm font-semibold text-slate-900">
                        Security
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Manage authentication and security preferences.
                      </p>
                    </div>

                    <div className="divide-y divide-slate-100">
                      <SettingToggle
                        icon={<Shield size={17} />}
                        title="Two-Factor Authentication"
                        description="Require an additional verification step when administrators sign in."
                        enabled={settings.security.twoFactor}
                        onChange={(value) =>
                          setSettings((previous) => ({
                            ...previous,
                            security: {
                              ...previous.security,
                              twoFactor: value,
                            },
                          }))
                        }
                      />

                      <div className="flex items-center justify-between gap-4 px-6 py-5">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 text-slate-500">
                            <Lock size={17} />
                          </div>

                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              Password
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Update the Super Admin account password.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Change Password
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                    <div className="flex gap-3">
                      <Shield
                        className="mt-0.5 shrink-0 text-amber-600"
                        size={18}
                      />

                      <div>
                        <p className="text-sm font-semibold text-amber-900">
                          Security Recommendation
                        </p>

                        <p className="mt-1 text-xs leading-5 text-amber-800">
                          Enable two-factor authentication before deploying the production Super Admin panel.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* BILLING */}
              {activeTab === "billing" && (
                <>
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-6 py-5">
                      <h2 className="text-sm font-semibold text-slate-900">
                        Billing Configuration
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Configure the payment gateway used by Restova.
                      </p>
                    </div>

                    <div className="space-y-5 p-6">
                      <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                            <CreditCard size={18} />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-blue-900">
                              Razorpay
                            </p>

                            <p className="mt-1 text-xs text-blue-700">
                              Primary payment gateway
                            </p>
                          </div>
                        </div>

                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                          Configured
                        </span>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                          Currency
                        </label>

                        <select
                          value={settings.currency}
                          onChange={(event) =>
                            updateSetting(
                              "currency",
                              event.target.value
                            )
                          }
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                        >
                          <option value="INR">
                            INR — Indian Rupee
                          </option>

                          <option value="USD">
                            USD — US Dollar
                          </option>

                          <option value="EUR">
                            EUR — Euro
                          </option>

                          <option value="GBP">
                            GBP — British Pound
                          </option>
                        </select>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-700">
                          Payment Gateway Security
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Razorpay credentials should be stored in environment variables and never exposed in client-side code.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* SAVE */}
              <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {saved ? (
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                      <Check size={16} />
                      Settings saved successfully.
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Changes will be saved to the Restova database.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={16} />

                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        {icon}
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-900">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function SettingToggle({
  icon,
  title,
  description,
  enabled,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 px-6 py-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-slate-500">
          {icon}
        </div>

        <div>
          <p className="text-sm font-medium text-slate-800">
            {title}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!enabled)}
        aria-label={`Toggle ${title}`}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          enabled ? "bg-slate-900" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}