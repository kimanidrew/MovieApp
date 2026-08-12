import React from "react";

interface ContentBadgeProps {
  accessType?: "FREE" | "SUBSCRIPTION" | "PREMIUM" | "RENTAL" | "PURCHASE" | "ADMIN_ONLY";
  rentalPrice?: number | string;
  currency?: string;
}

export default function ContentBadge({ accessType = "FREE", rentalPrice, currency = "KES" }: ContentBadgeProps) {
  switch (accessType) {
    case "FREE":
      return (
        <span className="inline-flex items-center rounded-md bg-emerald-950/80 px-2 py-0.5 text-[10px] font-extrabold text-emerald-400 border border-emerald-800/60 shadow-sm">
          FREE
        </span>
      );
    case "PREMIUM":
      return (
        <span className="inline-flex items-center rounded-md bg-amber-950/80 px-2 py-0.5 text-[10px] font-extrabold text-amber-400 border border-amber-800/60 shadow-sm">
          PREMIUM 4K
        </span>
      );
    case "RENTAL":
      return (
        <span className="inline-flex items-center rounded-md bg-purple-950/80 px-2 py-0.5 text-[10px] font-extrabold text-purple-400 border border-purple-800/60 shadow-sm">
          RENT {rentalPrice ? `${currency} ${rentalPrice}` : ""}
        </span>
      );
    case "SUBSCRIPTION":
    default:
      return (
        <span className="inline-flex items-center rounded-md bg-red-950/80 px-2 py-0.5 text-[10px] font-extrabold text-red-400 border border-red-800/60 shadow-sm">
          VIP PLAN
        </span>
      );
  }
}
