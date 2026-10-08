"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Globe,
  Info,
  Lock,
  Mail,
  Save,
  Settings as SettingsIcon,
  Shield,
  User,
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

      const serverSettings =
        data.settings || {};

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
            serverSettings.notifications
              ?.newRestaurants ??
            defaultSettings.notifications
              .newRestaurants,

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

  function updateSetting<
    K extends keyof SettingsData
  >(
    key: K,
    value: SettingsData[K]
  ) {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  return (
    <>
      <style jsx>{`
        @keyframes settings-flow-one {
          0% {
            transform: translate3d(-8%, -5%, 0)
              scale(1);
          }

          50% {
            transform: translate3d(10%, 8%, 0)
              scale(1.12);
          }

          100% {
            transform: translate3d(-8%, -5%, 0)
              scale(1);
          }
        }

        @keyframes settings-flow-two {
          0% {
            transform: translate3d(8%, 5%, 0)
              scale(1.05);
          }

          50% {
            transform: translate3d(-10%, -6%, 0)
              scale(1);
          }

          100% {
            transform: translate3d(8%, 5%, 0)
              scale(1.05);
          }
        }

        .settings-flow-one {
          animation: settings-flow-one 9s ease-in-out
            infinite;
        }

        .settings-flow-two {
          animation: settings-flow-two 11s ease-in-out
            infinite;
        }
      `}</style>

      <div className="min-h-[calc(100vh-76px)] bg-[#f6f7fb] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-[1450px]">

          {/* =====================================================
              HEADER
          ====================================================== */}

          <section className="relative mb-7 overflow-hidden rounded-[28px] border border-indigo-200/60 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-white to-cyan-100" />

            <div className="settings-flow-one absolute -left-24 -top-28 h-80 w-80 rounded-full bg-indigo-400/25 blur-3xl" />

            <div className="settings-flow-two absolute -right-24 -bottom-28 h-80 w-80 rounded-full bg-cyan-400/25 blur-3xl" />

            <div className="absolute right-1/3 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full bg-violet-300/20 blur-3xl" />

            <div className="absolute inset-0 bg-white/30" />

            <div className="relative px-6 py-8 sm:px-8 lg:px-10">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-indigo-600 shadow-sm backdrop-blur">
                    <SettingsIcon size={13} />

                    Administration
                  </div>

                  <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                    Settings
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Manage Restova platform configuration,
                    administrator preferences and security.
                  </p>
                </div>

                <div className="hidden items-center gap-2 rounded-2xl border border-white/80 bg-white/65 px-4 py-3 shadow-sm backdrop-blur sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={17} />
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Configuration
                    </p>

                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      Platform Settings
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================
              ERROR
          ====================================================== */}

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
              <Info
                size={18}
                className="mt-0.5 shrink-0"
              />

              <div>
                <p className="font-semibold">
                  Something went wrong
                </p>

                <p className="mt-0.5">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setError("")}
                className="ml-auto rounded-lg p-1 transition hover:bg-red-100"
              >
                ×
              </button>
            </div>
          )}

          {/* =====================================================
              LOADING
          ====================================================== */}

          {loading ? (
            <LoadingSettings />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">

              {/* =================================================
                  SETTINGS NAVIGATION
              ================================================== */}

              <aside className="h-fit lg:sticky lg:top-6">
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm">

                  <div className="px-3 pb-3 pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Settings
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Configure your platform
                    </p>
                  </div>

                  <div className="space-y-1">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const active =
                        activeTab === tab.id;

                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() =>
                            setActiveTab(tab.id)
                          }
                          className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 ${
                            active
                              ? "bg-slate-950 text-white shadow-sm"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                          }`}
                        >
                          {active && (
                            <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-indigo-400" />
                          )}

                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                              active
                                ? "bg-white/10 text-white"
                                : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-900"
                            }`}
                          >
                            <Icon size={17} />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span
                              className={`block text-sm font-semibold ${
                                active
                                  ? "text-white"
                                  : "text-slate-800"
                              }`}
                            >
                              {tab.label}
                            </span>

                            <span
                              className={`mt-0.5 block truncate text-[10px] ${
                                active
                                  ? "text-slate-300"
                                  : "text-slate-400"
                              }`}
                            >
                              {tab.description}
                            </span>
                          </span>

                          <ChevronRight
                            size={14}
                            className={`shrink-0 transition ${
                              active
                                ? "text-slate-300"
                                : "text-slate-300 opacity-0 group-hover:opacity-100"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sidebar status */}

                <div className="mt-4 rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />

                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </span>

                    <span className="text-xs font-bold text-emerald-700">
                      Platform Active
                    </span>
                  </div>

                  <p className="mt-2 text-[11px] leading-5 text-slate-500">
                    Settings are stored securely in the
                    Restova database.
                  </p>
                </div>
              </aside>

              {/* =================================================
                  CONTENT
              ================================================== */}

              <main className="min-w-0 space-y-6">

                {/* =================================================
                    GENERAL
                ================================================== */}

                {activeTab === "general" && (
                  <>
                    <SettingsSection
                      title="General Settings"
                      description="Configure the basic information used across the Restova platform."
                      icon={<SettingsIcon size={19} />}
                    >
                      <div className="grid gap-5 sm:grid-cols-2">
                        <FormField
                          label="Platform Name"
                          description="Name displayed throughout the platform."
                          icon={<Building2 size={16} />}
                        >
                          <input
                            value={
                              settings.platformName
                            }
                            onChange={(event) =>
                              updateSetting(
                                "platformName",
                                event.target.value
                              )
                            }
                            className={inputClass}
                          />
                        </FormField>

                        <FormField
                          label="Support Email"
                          description="Primary platform support address."
                          icon={<Mail size={16} />}
                        >
                          <input
                            type="email"
                            value={
                              settings.supportEmail
                            }
                            onChange={(event) =>
                              updateSetting(
                                "supportEmail",
                                event.target.value
                              )
                            }
                            className={inputClass}
                          />
                        </FormField>

                        <FormField
                          label="Timezone"
                          description="Default timezone for platform operations."
                          icon={<Globe size={16} />}
                        >
                          <select
                            value={
                              settings.timezone
                            }
                            onChange={(event) =>
                              updateSetting(
                                "timezone",
                                event.target.value
                              )
                            }
                            className={selectClass}
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
                        </FormField>

                        <FormField
                          label="Currency"
                          description="Default currency used for platform billing."
                          icon={<CreditCard size={16} />}
                        >
                          <select
                            value={
                              settings.currency
                            }
                            onChange={(event) =>
                              updateSetting(
                                "currency",
                                event.target.value
                              )
                            }
                            className={selectClass}
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
                        </FormField>
                      </div>
                    </SettingsSection>

                    <InfoCard
                      icon={<Globe size={18} />}
                      title="Platform Configuration"
                      description="These settings control how Restova displays platform-level information throughout the Super Admin panel."
                    />
                  </>
                )}

                {/* =================================================
                    ACCOUNT
                ================================================== */}

                {activeTab === "account" && (
                  <>
                    <SettingsSection
                      title="Administrator Account"
                      description="Manage the Super Admin account information."
                      icon={<User size={19} />}
                    >
                      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 sm:flex-row sm:items-center">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-xl font-bold text-white shadow-lg shadow-slate-950/10">
                          SA
                        </div>

                        <div>
                          <p className="text-base font-bold text-slate-950">
                            Super Administrator
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Full Restova platform access
                          </p>

                          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 size={12} />
                            Active account
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <FormField
                          label="Administrator Email"
                          description="Primary email associated with the Super Admin account."
                          icon={<Mail size={16} />}
                        >
                          <input
                            type="email"
                            value={
                              settings.adminEmail
                            }
                            onChange={(event) =>
                              updateSetting(
                                "adminEmail",
                                event.target.value
                              )
                            }
                            className={inputClass}
                          />
                        </FormField>

                        <FormField
                          label="Role"
                          description="System-level access role."
                          icon={<Shield size={16} />}
                        >
                          <input
                            value="Super Admin"
                            disabled
                            className={`${inputClass} cursor-not-allowed bg-slate-50 text-slate-500`}
                          />
                        </FormField>
                      </div>
                    </SettingsSection>

                    <InfoCard
                      icon={<Shield size={18} />}
                      title="Administrator Access"
                      description="The Super Admin account has access to restaurants, owners, subscriptions, payments, analytics, support and platform settings."
                    />
                  </>
                )}

                {/* =================================================
                    NOTIFICATIONS
                ================================================== */}

                {activeTab === "notifications" && (
                  <SettingsSection
                    title="Notification Preferences"
                    description="Choose which platform events should generate notifications."
                    icon={<Bell size={19} />}
                  >
                    <div className="divide-y divide-slate-100">
                      <SettingToggle
                        icon={<Mail size={18} />}
                        title="Email Notifications"
                        description="Receive important platform notifications by email."
                        enabled={
                          settings.notifications.email
                        }
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
                        icon={
                          <CreditCard size={18} />
                        }
                        title="Payment Notifications"
                        description="Get notified when subscription payments succeed or fail."
                        enabled={
                          settings.notifications
                            .payments
                        }
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
                        icon={
                          <Building2 size={18} />
                        }
                        title="New Restaurant Notifications"
                        description="Receive an alert whenever a new restaurant joins Restova."
                        enabled={
                          settings.notifications
                            .newRestaurants
                        }
                        onChange={(value) =>
                          setSettings((previous) => ({
                            ...previous,
                            notifications: {
                              ...previous.notifications,
                              newRestaurants:
                                value,
                            },
                          }))
                        }
                      />

                      <SettingToggle
                        icon={<Bell size={18} />}
                        title="Support Notifications"
                        description="Receive notifications when a new support ticket is created."
                        enabled={
                          settings.notifications
                            .support
                        }
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
                  </SettingsSection>
                )}

                {/* =================================================
                    SECURITY
                ================================================== */}

                {activeTab === "security" && (
                  <>
                    <SettingsSection
                      title="Security"
                      description="Manage authentication and security preferences."
                      icon={<Shield size={19} />}
                    >
                      <div className="divide-y divide-slate-100">
                        <SettingToggle
                          icon={
                            <Shield size={18} />
                          }
                          title="Two-Factor Authentication"
                          description="Require an additional verification step when administrators sign in."
                          enabled={
                            settings.security
                              .twoFactor
                          }
                          onChange={(value) =>
                            setSettings(
                              (previous) => ({
                                ...previous,
                                security: {
                                  ...previous.security,
                                  twoFactor:
                                    value,
                                },
                              })
                            )
                          }
                        />

                        <div className="flex flex-col gap-4 px-1 py-5 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                              <Lock size={17} />
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                Password
                              </p>

                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                Update the Super Admin
                                account password.
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Change Password
                          </button>
                        </div>
                      </div>
                    </SettingsSection>

                    <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
                      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-200/40 blur-2xl" />

                      <div className="relative flex gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                          <Shield size={18} />
                        </div>

                        <div>
                          <p className="text-sm font-bold text-amber-900">
                            Security Recommendation
                          </p>

                          <p className="mt-1.5 max-w-2xl text-xs leading-5 text-amber-800">
                            Enable two-factor authentication
                            before deploying the production
                            Super Admin panel.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* =================================================
                    BILLING
                ================================================== */}

                {activeTab === "billing" && (
                  <>
                    <SettingsSection
                      title="Billing Configuration"
                      description="Configure the payment gateway used by Restova."
                      icon={<CreditCard size={19} />}
                    >
                      <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                              <CreditCard size={19} />
                            </div>

                            <div>
                              <p className="text-sm font-bold text-slate-950">
                                Razorpay
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Primary payment gateway
                              </p>
                            </div>
                          </div>

                          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 size={12} />
                            Configured
                          </span>
                        </div>
                      </div>

                      <div className="mt-6">
                        <FormField
                          label="Currency"
                          description="Default currency used for subscription billing."
                          icon={
                            <CreditCard size={16} />
                          }
                        >
                          <select
                            value={
                              settings.currency
                            }
                            onChange={(event) =>
                              updateSetting(
                                "currency",
                                event.target.value
                              )
                            }
                            className={selectClass}
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
                        </FormField>
                      </div>

                      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex gap-3">
                          <Lock
                            size={17}
                            className="mt-0.5 shrink-0 text-slate-500"
                          />

                          <div>
                            <p className="text-xs font-bold text-slate-700">
                              Payment Gateway Security
                            </p>

                            <p className="mt-1.5 text-xs leading-5 text-slate-500">
                              Razorpay credentials should be
                              stored in environment variables
                              and never exposed in client-side
                              code.
                            </p>
                          </div>
                        </div>
                      </div>
                    </SettingsSection>
                  </>
                )}

                {/* =================================================
                    SAVE BAR
                ================================================== */}

                <div className="sticky bottom-4 z-20 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-xl shadow-slate-900/10 backdrop-blur-xl sm:p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="px-1">
                      {saved ? (
                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                            <Check size={15} />
                          </span>

                          Settings saved successfully.
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            Unsaved changes
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            Save your changes to update the
                            Restova platform.
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save size={16} />

                      {saving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                </div>
              </main>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* =========================================================
   CONSTANT STYLES
========================================================= */

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10";

const selectClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10";

/* =========================================================
   SETTINGS SECTION
========================================================= */

function SettingsSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm">
            {icon}
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-950">
              {title}
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */

function FormField({
  label,
  description,
  icon,
  children,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="text-slate-400">
            {icon}
          </span>

          {label}
        </label>
      </div>

      {children}

      <p className="mt-1.5 text-[11px] leading-5 text-slate-400">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

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
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
      <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-indigo-100/60 blur-2xl" />

      <div className="relative flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          {icon}
        </div>

        <div>
          <p className="text-sm font-bold text-slate-950">
            {title}
          </p>

          <p className="mt-1.5 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SETTING TOGGLE
========================================================= */

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
    <div className="group flex items-center justify-between gap-5 px-1 py-5">
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
            enabled
              ? "bg-slate-950 text-white"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">
            {title}
          </p>

          <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!enabled)}
        aria-label={`Toggle ${title}`}
        aria-pressed={enabled}
        className={`relative h-7 w-12 shrink-0 rounded-full p-0.5 transition-all duration-200 ${
          enabled
            ? "bg-slate-950 shadow-sm"
            : "bg-slate-200"
        }`}
      >
        <span
          className={`block h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            enabled
              ? "translate-x-5"
              : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingSettings() {
  return (
    <div className="grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
      <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-4 h-3 w-20 rounded bg-slate-100" />

        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(
            (item) => (
              <div
                key={item}
                className="h-14 rounded-xl bg-slate-100"
              />
            )
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
          <div className="h-5 w-48 rounded bg-slate-100" />

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="h-24 rounded-xl bg-slate-100" />
            <div className="h-24 rounded-xl bg-slate-100" />
            <div className="h-24 rounded-xl bg-slate-100" />
            <div className="h-24 rounded-xl bg-slate-100" />
          </div>
        </div>

        <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
          <div className="h-5 w-40 rounded bg-slate-100" />

          <div className="mt-5 h-20 rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}