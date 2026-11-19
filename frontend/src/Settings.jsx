import { useEffect, useState } from "react";

const sections = [
  { id: "profile", label: "Profile" },
  { id: "appearance", label: "Appearance" },
  { id: "preferences", label: "Preferences" },
  { id: "account", label: "Account" },
];

const readBool = (key, fallback) => {
  const value = localStorage.getItem(key);
  return value === null ? fallback : value === "true";
};

function getDark(mode) {
  if (mode === "dark") return true;
  if (mode === "light") return false;

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export default function Settings() {
  const [active, setActive] = useState("profile");

  const [name, setName] = useState(
    () => localStorage.getItem("userName") || ""
  );

  const [email] = useState(
    () => localStorage.getItem("userEmail") || ""
  );

  const [appearance, setAppearance] = useState(
    () => localStorage.getItem("appearance") || "system"
  );

  const [dark, setDark] = useState(() =>
    getDark(localStorage.getItem("appearance") || "system")
  );

  const [message, setMessage] = useState("");

  const [prefs, setPrefs] = useState(() => ({
    emailUpdates: readBool("emailUpdates", true),
    showTips: readBool("showTips", true),
    compactMode: readBool("compactMode", false),
    reduceMotion: readBool("reduceMotion", false),
  }));

  // Apply appearance globally across the entire app.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const isDark = getDark(appearance);

      setDark(isDark);

      document.documentElement.classList.toggle("dark", isDark);
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";

      document.documentElement.style.backgroundColor = isDark
        ? "#0b1220"
        : "#f4f6fa";

      document.body.style.backgroundColor = isDark ? "#0b1220" : "#f4f6fa";

      document.body.style.color = isDark ? "#ffffff" : "#0b1220";
    };

    localStorage.setItem("appearance", appearance);

    applyTheme();

    // Notify AppLayout so every page uses the selected theme.
    window.dispatchEvent(
      new CustomEvent("appearance-change", {
        detail: appearance,
      })
    );

    if (appearance === "system") {
      media.addEventListener("change", applyTheme);
    }

    return () => {
      media.removeEventListener("change", applyTheme);
    };
  }, [appearance]);

  // Save preferences and apply supported global classes.
  useEffect(() => {
    Object.entries(prefs).forEach(([key, value]) => {
      localStorage.setItem(key, String(value));
    });

    document.documentElement.classList.toggle("compact-mode", prefs.compactMode);

    document.documentElement.classList.toggle("reduce-motion", prefs.reduceMotion);

    window.dispatchEvent(
      new CustomEvent("preferences-change", {
        detail: prefs,
      })
    );
  }, [prefs]);

  const surface = dark
    ? "border-[#1e293b] bg-[#111a2e]"
    : "border-[#e2e8f0] bg-white";

  const muted = dark ? "text-[#94a3b8]" : "text-[#64748b]";

  const field = `w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-[#2f54eb] ${
    dark
      ? "border-[#334155] bg-[#0b1220] text-white placeholder:text-[#64748b]"
      : "border-[#e2e8f0] bg-white text-[#0b1220] placeholder:text-[#94a3b8]"
  }`;

  function saveProfile(event) {
    event.preventDefault();

    const cleanName = name.trim();

    if (!cleanName) {
      setMessage("Please enter your name.");
      return;
    }

    localStorage.setItem("userName", cleanName);
    setName(cleanName);
    setMessage("Profile saved successfully.");
  }

  function togglePreference(key) {
    setPrefs((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  }

  const options = [
    { id: "light", label: "Light" },
    { id: "dark", label: "Dark" },
    { id: "system", label: "System" },
  ];

  const preferenceOptions = [
    ["emailUpdates", "Email updates", "Your preference for receiving updates."],
    ["showTips", "Helpful tips", "Show guidance where supported."],
    ["compactMode", "Compact layout", "Reduce spacing on supported pages."],
    ["reduceMotion", "Reduce motion", "Limit animations across supported elements."],
  ];

  return (
    <div
      className={`min-h-screen transition-colors ${
        dark ? "bg-[#0b1220] text-white" : "bg-[#f4f6fa] text-[#0b1220]"
      }`}
    >
      <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Settings
            </h1>
            <p className={`mt-1 text-sm ${muted}`}>
              Manage your workspace and preferences.
            </p>
          </div>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2f54eb] text-sm font-bold text-white">
            {(name || email || "U").charAt(0).toUpperCase()}
          </div>
        </header>

        <div className="grid items-start gap-4 md:grid-cols-[175px_minmax(0,1fr)]">
          <nav
            className={`flex gap-1 overflow-x-auto rounded-xl border p-1.5 md:flex-col md:overflow-visible ${surface}`}
          >
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  setActive(section.id);
                  setMessage("");
                }}
                className={`shrink-0 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition sm:text-sm ${
                  active === section.id
                    ? "bg-[#2f54eb] text-white"
                    : `${muted} hover:bg-black/5`
                }`}
              >
