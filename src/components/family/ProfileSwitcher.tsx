import React from "react";
import { useFamily } from "@/context/FamilyContext";
import { Users, User, ChevronDown, Check, Plus, HeartHandshake } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export function ProfileSwitcher() {
  const { dependents, activeProfile, setActiveProfile } = useFamily();
  const navigate = useNavigate();

  return (
    <div className="w-full px-2 mb-2">
      <DropdownMenu>
        <DropdownMenuTrigger className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-left transition-all group outline-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              {activeProfile.isPrimary ? <User className="h-4 w-4" /> : <HeartHandshake className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                <span>{activeProfile.name}</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {activeProfile.isPrimary ? "Primary Account" : `Dependent (${activeProfile.relationship})`}
              </p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-white shrink-0 ml-1 transition-transform group-data-[state=open]:rotate-180" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-60 bg-slate-950 border-slate-800 text-slate-100 p-1.5 shadow-xl">
          <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center justify-between">
            <span>Select Active Profile</span>
            <Users className="h-3 w-3 text-cyan-400" />
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-800/80 my-1" />

          {/* Primary Profile */}
          <DropdownMenuItem
            onClick={() =>
              setActiveProfile({
                id: "primary",
                name: "Self (Primary)",
                isPrimary: true,
              })
            }
            className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-slate-900 focus:bg-slate-900 text-xs"
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-cyan-400" />
              <span className="font-medium text-white">Self (Primary)</span>
            </div>
            {activeProfile.isPrimary && <Check className="h-3.5 w-3.5 text-cyan-400" />}
          </DropdownMenuItem>

          {/* Dependents List */}
          {dependents.length > 0 && (
            <>
              <DropdownMenuSeparator className="bg-slate-800/60 my-1" />
              <div className="text-[10px] uppercase font-semibold text-slate-500 px-2 py-0.5">
                Family Members
              </div>
              {dependents.map((dept) => {
                const isActive = activeProfile.id === dept.id;
                return (
                  <DropdownMenuItem
                    key={dept.id}
                    onClick={() =>
                      setActiveProfile({
                        id: dept.id,
                        name: dept.full_name,
                        isPrimary: false,
                        relationship: dept.relationship,
                        dependent: dept,
                      })
                    }
                    className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-slate-900 focus:bg-slate-900 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <HeartHandshake className="h-4 w-4 text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-medium text-white truncate block">{dept.full_name}</span>
                        <span className="text-[10px] text-slate-400 capitalize">{dept.relationship}</span>
                      </div>
                    </div>
                    {isActive && <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0" />}
                  </DropdownMenuItem>
                );
              })}
            </>
          )}

          <DropdownMenuSeparator className="bg-slate-800/80 my-1" />

          {/* Manage Family Button */}
          <DropdownMenuItem
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs text-cyan-400 hover:bg-cyan-950/30 focus:bg-cyan-950/30 font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Manage Family Profiles</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active Profile Banner if viewing a dependent */}
      {!activeProfile.isPrimary && (
        <div className="mt-1 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300 flex items-center justify-between">
          <span className="truncate">Active Context: {activeProfile.name}</span>
          <button
            onClick={() => setActiveProfile({ id: "primary", name: "Self (Primary)", isPrimary: true })}
            className="hover:underline font-semibold text-emerald-400 ml-1 shrink-0"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
