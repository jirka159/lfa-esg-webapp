import { notFound } from 'next/navigation';
import { ProjectDetailClient } from '@/components/project-detail-client';
import { fetchLfaProjectById } from '@/lib/google-sheets-lfa';
import { requireAuthSessionContext } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({ params }: { params: { projectId: string } }) {
  const session = await requireAuthSessionContext();
  const project = await fetchLfaProjectById(decodeURIComponent(params.projectId));
  if (!project) notFound();

  return (
    <ProjectDetailClient
      key={`${session.activeTeam.id}:${project.id}:${project.stavZapracovani}:${project.muzeDoProdukce ? '1' : '0'}`}
      project={project}
      session={session}
    />
  );
}
