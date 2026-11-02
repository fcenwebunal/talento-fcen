import type { StudentDetail } from "./types";

// What a company sees of the student's own CV, mirroring the rules of get_student_detail, for «Cómo me ven».
export function previewAs(detail: StudentDetail, { authorized, consentContact }: { authorized: boolean; consentContact: boolean }): StudentDetail {
  const contact = authorized && consentContact;
  const papa = authorized && detail.papa_visibility === "autorizadas" ? detail.papa : null;
  if (contact) return { ...detail, papa, papa_visibility: null };
  return {
    ...detail,
    papa,
    papa_visibility: null,
    contact_visible: false,
    contact: null,
    projects: detail.projects.map((p) => ({ ...p, url: null })),
    skills: detail.skills.map((s) => ({ ...s, evidence_url: null })),
    courses: detail.courses.map((c) => ({ ...c, url: null })),
    outputs: detail.outputs.map((o) => ({ ...o, title: null, url: null })),
  };
}
