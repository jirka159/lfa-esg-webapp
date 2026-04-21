import { notFound } from 'next/navigation';
import { ProjectDetailClient } from '@/components/project-detail-client';
import { fetchLfaProjectById } from '@/lib/google-sheets-lfa';
import { requireAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({ params }: { params: { projectId: string } }) {
  const currentUser = await requireAuthenticatedUser();
  const project = await fetchLfaProjectById(decodeURIComponent(params.projectId));
  if (!project) notFound();

  return <ProjectDetailClient project={project} currentUser={currentUser} />;
}
