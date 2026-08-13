import type { TeamMember } from "@/lib/api-client";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { resolveMyThoughts } from "@/lib/my-thoughts";
import { MyThoughtQuote } from "@/components/my-thought-quote";

const THOUGHT_PREVIEW_LENGTH = 105;

function thoughtPreview(text: string) {
  if (text.length <= THOUGHT_PREVIEW_LENGTH) {
    return { text, hasMore: false };
  }

  const candidate = text.slice(0, THOUGHT_PREVIEW_LENGTH);
  const lastWordEnd = Math.max(candidate.lastIndexOf(" "), candidate.lastIndexOf("\n"));
  return {
    text: candidate.slice(0, lastWordEnd).trimEnd(),
    hasMore: true,
  };
}

interface MemberCardsProps {
  members: TeamMember[];
  maxItems?: number;
}

const founderMembers: TeamMember[] = [
  {
    id: -1,
    name: "Rajesh Shukla",
    customBadge: "Founder",
    role: "Founder",
    bio: null,
    thoughtTemplateId: 0,
    imageUrl: "https://ik.imagekit.io/harshshukla/founders/Founder-Rajesh-Shukla.png",
    order: -2,
    category: "leadership",
  },
  {
    id: -2,
    name: "Sachin Shukla",
    customBadge: "Co-Founder",
    role: "Co-Founder",
    bio: null,
    thoughtTemplateId: 5,
    imageUrl: "https://ik.imagekit.io/harshshukla/founders/Co-Founder-Sachin-Shukla.png",
    order: -1,
    category: "leadership",
  },
];

function memberRoleRank(member: TeamMember) {
  const role = member.role.toLowerCase();
  if (role.includes("admin")) return 0;
  if (role.includes("volunteer")) return 1;
  return 2;
}

function MemberRoleBadge({ role, customBadge }: { role: string; customBadge?: string | null }) {
  const normalizedRole = role.toLowerCase();
  const roleStyles = customBadge || normalizedRole.includes("admin")
    ? "border-secondary/35 bg-secondary/15 text-foreground shadow-secondary/10 dark:text-secondary"
    : normalizedRole.includes("volunteer")
      ? "border-primary/30 bg-primary/10 text-primary shadow-primary/10"
      : "border-border bg-muted text-muted-foreground shadow-black/5";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.62rem] font-bold uppercase leading-none tracking-[0.14em] shadow-sm sm:text-[0.68rem] ${roleStyles}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_0_2px_currentColor]" />
      {customBadge || role}
    </span>
  );
}

export function MemberCards({ members, maxItems }: MemberCardsProps) {
  const { language } = useLanguage();
  const orderedMembers = [
    ...founderMembers,
    ...members
      .map((member, index) => ({ member, index }))
      .sort(
        (left, right) =>
          memberRoleRank(left.member) - memberRoleRank(right.member) ||
          left.index - right.index,
      )
      .map(({ member }) => member),
  ];
  const visibleMembers = maxItems ? orderedMembers.slice(0, maxItems) : orderedMembers;
  const [expandedMemberIds, setExpandedMemberIds] = useState<Set<number>>(new Set());
  const [bioOverflow, setBioOverflow] = useState<Record<number, boolean>>({});
  const bioMeasureRefs = useRef<Record<number, HTMLParagraphElement | null>>({});

  useEffect(() => {
    const measureBioOverflow = () => {
      const nextOverflow: Record<number, boolean> = {};
      visibleMembers.forEach((member) => {
        const element = bioMeasureRefs.current[member.id];
        if (element) {
          nextOverflow[member.id] = element.scrollHeight > element.clientHeight + 1;
        }
      });

      setBioOverflow((current) => {
        const currentKeys = Object.keys(current);
        const nextKeys = Object.keys(nextOverflow);
        const hasChanged =
          currentKeys.length !== nextKeys.length ||
          nextKeys.some((key) => current[Number(key)] !== nextOverflow[Number(key)]);

        return hasChanged ? nextOverflow : current;
      });
    };

    measureBioOverflow();
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measureBioOverflow) : null;
    Object.values(bioMeasureRefs.current).forEach((element) => {
      if (element) resizeObserver?.observe(element);
    });
    window.addEventListener("resize", measureBioOverflow);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measureBioOverflow);
    };
  }, [visibleMembers]);

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 lg:grid-cols-2">
      {visibleMembers.map((member, index) => {
        const initials = member.name
          .split(" ")
          .map((name) => name[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        const imageOnRight = index % 2 === 1;
        const thoughts = resolveMyThoughts(member.bio, language, member.thoughtTemplateId);
        const preview = thoughts ? thoughtPreview(thoughts) : null;
        const isExpanded = expandedMemberIds.has(member.id);

        return (
          <article
            key={member.id}
            className={`member-card-surface group block min-h-48 rounded-[2rem] border p-4 shadow-[0_14px_34px_rgba(83,52,24,0.12)] ring-1 ring-black/[0.04] transition-all duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-xl hover:shadow-primary/10 dark:ring-white/[0.06] sm:min-h-56 sm:p-5 lg:flex lg:flex-row lg:items-center lg:gap-8 ${
              imageOnRight ? "lg:flex-row-reverse" : ""
            }`}
          >
            {member.id > 0 ? (
              <Link
                href={`/members/${member.id}`}
                aria-label={`View ${member.name}'s public profile`}
                className="member-mobile-photo float-left mb-2 mr-4 aspect-square h-auto w-[40%] min-w-[112px] max-w-[150px] shrink-0 rounded-[1.35rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 lg:float-none lg:mb-0 lg:mr-0 lg:aspect-square lg:h-52 lg:w-52 lg:flex-none lg:self-center"
              >
                <div className="h-full w-full overflow-hidden rounded-[1.35rem] border-2 border-white/80 bg-muted shadow-[0_8px_20px_rgba(83,52,24,0.18)] transition-colors group-hover:border-primary/50">
                  {member.imageUrl ? (
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                      <span className="font-serif text-3xl font-bold sm:text-5xl">{initials}</span>
                    </div>
                  )}
                </div>
              </Link>
            ) : (
              <div className="member-mobile-photo float-left mb-2 mr-4 aspect-square h-auto w-[40%] min-w-[112px] max-w-[150px] shrink-0 rounded-[1.35rem] lg:float-none lg:mb-0 lg:mr-0 lg:aspect-square lg:h-52 lg:w-52 lg:flex-none lg:self-center">
                <div className="h-full w-full overflow-hidden rounded-[1.35rem] border-2 border-white/80 bg-muted shadow-[0_8px_20px_rgba(83,52,24,0.18)] transition-colors group-hover:border-primary/50">
                  <img
                    src={member.imageUrl ?? ""}
                    alt={member.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </div>
            )}
            <div className="contents lg:flex lg:min-w-0 lg:flex-1 lg:flex-col">
              <div className="member-card-member-heading mb-1 min-w-0 text-left lg:mb-0 lg:flex lg:flex-wrap lg:items-center lg:justify-start lg:gap-x-2 lg:gap-y-1">
                {member.id > 0 ? (
                  <Link
                    href={`/members/${member.id}`}
                    className="rounded-sm font-sans text-lg font-normal leading-tight tracking-tight transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 sm:text-2xl"
                  >
                    {member.name}
                  </Link>
                ) : (
                  <span className="font-sans text-lg font-normal leading-tight tracking-tight sm:text-2xl">
                    {member.name}
                  </span>
                )}
                <MemberRoleBadge role={member.role} customBadge={member.customBadge} />
              </div>
              {thoughts && preview && (
                <div className="member-card-thoughts relative w-full min-w-0 text-left lg:flex-1">
                  <p
                    ref={(element) => {
                      bioMeasureRefs.current[member.id] = element;
                    }}
                    aria-hidden="true"
                    className="invisible absolute inset-x-0 top-10 -z-10 line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:top-14 sm:text-base"
                  >
                    {resolveMyThoughts(member.bio, language, member.thoughtTemplateId)}
                  </p>
                  <MyThoughtQuote
                    className="mt-3 px-4 py-2"
                    textClassName=""
                    highlightLead
                    action={
                      !isExpanded && (bioOverflow[member.id] || preview.hasMore) ? (
                        <button
                          type="button"
                          aria-expanded={false}
                          onClick={() =>
                            setExpandedMemberIds((current) => {
                              const next = new Set(current);
                              next.add(member.id);
                              return next;
                            })
                          }
                          className="ml-1 inline whitespace-nowrap text-sm font-semibold text-primary transition-colors hover:text-primary/75"
                        >
                          See more
                        </button>
                      ) : null
                    }
                  >
                    {isExpanded ? thoughts : preview.text}
                  </MyThoughtQuote>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}