import { notFound } from 'next/navigation';
import { AuthGuard } from '@/components/auth-guard';
import { ProjectDetailClient } from '@/components/project-detail-client';
import { fetchLfaProjectById } from '@/lib/google-sheets-lfa';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({ params }: { params: { projectId: string } }) {
  const project = await fetchLfaProjectById(decodeURIComponent(params.projectId));
  if (!project) notFound();

  return (
    <AuthGuard>
      <ProjectDetailClient project={project} />
    </AuthGuard>
  );
}
