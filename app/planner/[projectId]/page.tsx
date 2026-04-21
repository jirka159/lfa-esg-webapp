import { notFound } from 'next/navigation';
import { AuthGuard } from '@/components/auth-guard';
import { ProjectDetailClient } from '@/components/project-detail-client';
import { lfaProjects } from '@/data/lfa-projects';

export function generateStaticParams() {
  return lfaProjects.map((project) => ({ projectId: project.id }));
}

export default function ProjectDetailPage({ params }: { params: { projectId: string } }) {
  const project = lfaProjects.find((item) => item.id === decodeURIComponent(params.projectId));
  if (!project) notFound();

  return (
    <AuthGuard>
      <ProjectDetailClient project={project} />
    </AuthGuard>
  );
}
