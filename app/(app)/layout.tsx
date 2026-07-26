import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isModuleEnabled } from "@/lib/modules.config";
import { SignOutButton } from "./sign-out-button";
import { NavLink } from "./nav-link";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("vibe_profiles")
    .select("full_name, role, vibe_tenants(name)")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 border-r border-border bg-white flex flex-col">
        <div className="px-5 py-5 border-b border-border">
          <span className="font-semibold text-sm">
            {(profile as any)?.vibe_tenants?.name ?? "VibeSaaS"}
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink href="/dashboard">Panel</NavLink>
          {isModuleEnabled("leads") && <NavLink href="/leads">Müşteri Adayları</NavLink>}
          {isModuleEnabled("sales") && <NavLink href="/sales">Satışlar</NavLink>}
          {isModuleEnabled("reports") && <NavLink href="/reports">Raporlar</NavLink>}
          <div className="pt-3 mt-3 border-t border-border">
            <NavLink href="/settings/team">Takım</NavLink>
          </div>
        </nav>

        <div className="px-3 py-4 border-t border-border">
          <p className="px-3 text-sm font-medium truncate">
            {profile?.full_name ?? user.email}
          </p>
          <p className="px-3 text-xs text-muted truncate mb-3">{user.email}</p>
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
