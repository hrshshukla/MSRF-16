import type { Project } from "@/lib/api-client";

export type ProjectDetailsFallback = {
  location: string;
  beneficiariesCount: number;
  budgetInr: number;
  membersInvolvedCount: number;
};

export type ProjectImpactMetric = {
  kind: "beneficiaries";
  placeholder: string;
  value: number | null;
};

export function getProjectImpactMetric(
  title: string,
  category: string,
  project?: Pick<Project, "beneficiariesCount">,
): ProjectImpactMetric {
  const normalized = `${title} ${category}`.toLowerCase();

  if (/(education|school|student|siksha|शिक्षा|विद्यार्थ)/.test(normalized)) {
    return {
      kind: "beneficiaries",
      placeholder: "500",
      value: project?.beneficiariesCount ?? null,
    };
  }

  if (/(food|meal|anna|bhojan| भोजन|अन्न)/.test(normalized)) {
    return {
      kind: "beneficiaries",
      placeholder: "1000",
      value: project?.beneficiariesCount ?? null,
    };
  }

  if (
    /(medical|health|patient|clinic|hospital|स्वास्थ्य|चिकित्सा)/.test(
      normalized,
    )
  ) {
    return {
      kind: "beneficiaries",
      placeholder: "250",
      value: project?.beneficiariesCount ?? null,
    };
  }

  return {
    kind: "beneficiaries",
    placeholder: "500",
    value: project?.beneficiariesCount ?? null,
  };
}

export function getProjectDetailsFallback(
  project: Pick<Project, "title" | "category">,
): ProjectDetailsFallback {
  const normalized = `${project.title} ${project.category}`.toLowerCase();

  if (/\b(gau|cow| गो|गौ)\b/.test(normalized)) {
    return {
      location: "Ujjain, Madhya Pradesh",
      beneficiariesCount: 180,
      budgetInr: 325000,
      membersInvolvedCount: 24,
    };
  }

  if (/(education|school|student|siksha|शिक्षा|विद्यार्थ)/.test(normalized)) {
    return {
      location: "Ujjain, Madhya Pradesh",
      beneficiariesCount: 520,
      budgetInr: 275000,
      membersInvolvedCount: 31,
    };
  }

  if (/(food|meal|anna|bhojan| भोजन|अन्न)/.test(normalized)) {
    return {
      location: "Indore, Madhya Pradesh",
      beneficiariesCount: 1450,
      budgetInr: 210000,
      membersInvolvedCount: 38,
    };
  }

  if (
    /(medical|health|patient|clinic|hospital|स्वास्थ्य|चिकित्सा)/.test(
      normalized,
    )
  ) {
    return {
      location: "Dewas, Madhya Pradesh",
      beneficiariesCount: 285,
      budgetInr: 390000,
      membersInvolvedCount: 19,
    };
  }

  if (/(clean|swachh|sanitation|community|स्वच्छ|सफाई)/.test(normalized)) {
    return {
      location: "Ujjain, Madhya Pradesh",
      beneficiariesCount: 760,
      budgetInr: 185000,
      membersInvolvedCount: 42,
    };
  }

  return {
    location: "Ujjain, Madhya Pradesh",
    beneficiariesCount: 500,
    budgetInr: 250000,
    membersInvolvedCount: 28,
  };
}
