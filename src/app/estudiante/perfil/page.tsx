import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import Link from "next/link";
import { Eye, PencilLine } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ProfileEditor, type ProfileData } from "./editor";

export const metadata: Metadata = { title: "Editar mi perfil" };
export const dynamic = "force-dynamic";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ seccion?: string }> }) {
  const session = await requireRole(["student"]);
  const { seccion } = await searchParams;
  const supabase = await createClient();
  const id = session.userId;

  const [student, priv, profile, skills, soft, areas, languages, experiences, projects, courses, subjects, documents, programs, catalog, domains, softCatalog, areaCatalog] =
    await Promise.all([
      supabase.from("students").select("*").eq("id", id).single(),
      supabase.from("student_private").select("*").eq("student_id", id).single(),
      supabase.from("profiles").select("full_name, email").eq("id", id).single(),
      supabase.from("student_skills").select("skill_id, level, evidence_url").eq("student_id", id),
      supabase.from("student_soft_skills").select("soft_skill_id").eq("student_id", id),
      supabase.from("student_areas").select("area_id").eq("student_id", id),
      supabase.from("student_languages").select("language, level, certificate").eq("student_id", id).order("id"),
      supabase.from("experiences").select("organization, role, start_date, end_date, description").eq("student_id", id).order("id"),
      supabase.from("projects").select("title, year, description, url").eq("student_id", id).order("id"),
      supabase.from("courses").select("name, institution, year, hours").eq("student_id", id).order("id"),
      supabase.from("relevant_subjects").select("name, reason").eq("student_id", id).order("id"),
      supabase.from("documents").select("id, kind, path, file_name, created_at").eq("student_id", id).order("created_at", { ascending: false }),
      supabase.from("programs").select("id, name, level, department").eq("active", true).order("sort"),
      // Approved skills plus the ones this student proposed and are still in review
      supabase.from("skills").select("id, name, domain_id, description, icon_path, status").eq("active", true).or(`status.eq.approved,proposed_by.eq.${id}`).order("name"),
      supabase.from("skill_domains").select("id, name").order("sort"),
      supabase.from("soft_skills").select("id, name").order("sort"),
      supabase.from("areas").select("id, name").eq("active", true).order("sort"),
    ]);

  const data: ProfileData = {
    id,
    email: profile.data?.email ?? session.email,
    fullName: profile.data?.full_name ?? "",
    student: student.data,
    priv: priv.data,
    skills: skills.data ?? [],
    softSkills: (soft.data ?? []).map((r) => r.soft_skill_id),
    areas: (areas.data ?? []).map((r) => r.area_id),
    languages: languages.data ?? [],
    experiences: experiences.data ?? [],
    projects: projects.data ?? [],
    courses: courses.data ?? [],
    subjects: subjects.data ?? [],
    documents: documents.data ?? [],
    catalogs: {
      programs: programs.data ?? [],
      skills: catalog.data ?? [],
      domains: domains.data ?? [],
      softSkills: softCatalog.data ?? [],
      areas: areaCatalog.data ?? [],
    },
  };

  return (
    <>
      <PageHeader
        kicker="Mi perfil"
        icon={PencilLine}
        title="Editar mi perfil"
        description="Es lo que la Facultad comparte con las empresas para presentarte. Escribe breve y profesional, y guarda cada sección al terminarla."
        actions={
          <Link href="/estudiante/vista-previa" className="btn btn-secondary">
            <Eye /> Ver cómo me ven
          </Link>
        }
      />
      <div className="wrap">
        <ProfileEditor key={seccion ?? "personales"} data={data} initialSection={seccion} />
      </div>
    </>
  );
}
