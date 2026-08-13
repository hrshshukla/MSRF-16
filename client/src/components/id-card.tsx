import type { RefObject } from "react";
import { ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { type AuthUser } from "@/lib/auth-context";
import { initials, memberDisplayLabel, memberId, profileImageSrc } from "@/components/id-card-data";

interface IdCardProps {
  user: AuthUser;
  qrRef: RefObject<HTMLCanvasElement | null>;
}

export function IdCard({ user, qrRef }: IdCardProps) {
  return (
    <div
      className="mx-auto -mx-1 flex aspect-[1.2] w-[calc(100%+0.5rem)] max-w-none flex-col overflow-hidden rounded-[1.5rem] border-2 border-primary/30 bg-white shadow-[0_18px_45px_-20px_rgba(124,45,18,0.55)] sm:mx-auto sm:aspect-auto sm:w-full sm:max-w-3xl"
    >
      <div className="flex h-[4.5rem] shrink-0 items-center gap-2.5 border-b-4 border-primary bg-gradient-to-r from-orange-600 to-amber-500 px-3 py-1.5 text-primary-foreground sm:h-auto sm:gap-4 sm:px-6 sm:py-4">
        <div className="h-10 w-10 shrink-0 sm:h-20 sm:w-20">
          <BrandLogo
            className="h-10 w-10 rounded-full bg-white sm:h-20 sm:w-20"
            sizes="80px"
          />
        </div>
        <div className="min-w-0">
          <p className="font-sans text-[0.82rem] font-extrabold leading-[1.15] tracking-wide sm:text-3xl">MAHAKAL SANATAN</p>
          <p className="font-sans text-[0.82rem] font-extrabold leading-[1.15] tracking-wide sm:text-3xl">RAKSHA FOUNDATION</p>
          <p className="mt-0.5 text-[5px] font-semibold uppercase tracking-[0.16em] opacity-90 sm:mt-2 sm:text-[10px] sm:tracking-[0.24em]">
            Member identity card
          </p>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-0 pt-3 text-orange-950 sm:px-8 sm:pt-7">
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]" aria-hidden="true">
          <div className="absolute -right-16 top-20 h-56 w-56 rounded-full border-[18px] border-primary" />
          <div className="absolute -left-20 top-36 h-48 w-48 rounded-full border-[14px] border-primary" />
        </div>
        <div className="relative flex min-h-0 flex-1 items-start gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-center lg:gap-7">
          <div className="flex min-w-0 flex-1 flex-row items-start gap-4 sm:gap-6">
            <div className="flex h-24 w-20 shrink-0 aspect-[4/5] items-center justify-self-auto overflow-hidden rounded-xl border-2 border-white bg-primary/10 text-2xl font-bold text-primary shadow-lg ring-1 ring-primary/20 sm:h-44 sm:w-36 sm:rounded-xl sm:border-4 sm:text-4xl">
              {profileImageSrc(user.profileImageUrl) ? <img src={profileImageSrc(user.profileImageUrl)!} alt={`${user.name} profile`} className="h-full w-full object-cover" /> : initials(user.name)}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden text-left">
              <h3 className="truncate font-serif text-[1.2rem] font-extrabold leading-[1.25] sm:text-3xl sm:font-sans">{user.name}</h3>
               <p className="mt-0.5 text-[0.8rem] font-medium text-orange-800 sm:mt-1 sm:text-base">{memberDisplayLabel(user)}</p>
              <div className="mt-2 max-w-[20rem] space-y-0.5 border-t border-orange-900/15 pt-2 text-[0.65rem] leading-[1.3] sm:mt-5 sm:space-y-2 sm:pt-4 sm:text-base sm:leading-normal">
                <p className="truncate"><span className="font-semibold">Member ID:</span> {memberId(user)}</p>
                <p className="truncate" title={user.email}><span className="font-semibold">Email:</span> {user.email}</p>
                {user.phone && <p className="truncate"><span className="font-semibold">Phone:</span> {user.phone}</p>}
                 <p className="truncate"><span className="font-semibold">Status:</span> {memberDisplayLabel(user)}</p>
              </div>
            </div>
          </div>
          <div className="relative hidden min-w-0 overflow-hidden border-l-2 border-dashed border-orange-900/15 pl-2 text-center lg:block lg:pl-7">
            <p className="mb-1 text-[6px] font-bold uppercase tracking-[0.08em] text-orange-800 lg:mb-2 lg:text-xs lg:tracking-[0.2em]">Scan to verify</p>
            <div className="mx-auto box-border aspect-square w-full max-w-[5.25rem] min-w-0 rounded-lg bg-white p-1 shadow-md ring-1 ring-orange-900/10 lg:max-w-none lg:rounded-xl lg:p-2">
              <canvas ref={qrRef} className="block h-full w-full" aria-label="Member QR code" />
            </div>
            <p className="mt-1 text-[6px] text-orange-800 lg:mt-2 lg:text-[10px]">Member verification QR</p>
          </div>
        </div>
        <div className="relative -mx-4 mt-1 flex h-9 shrink-0 items-center justify-center gap-2 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground sm:-mx-8 sm:mt-7 sm:h-14 sm:gap-2 sm:py-3 sm:text-base">
          <ShieldCheck className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
          <span>{memberId(user)}</span>
        </div>
      </div>
    </div>
  );
}