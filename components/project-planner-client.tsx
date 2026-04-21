"use client";

import { useEffect, useState } from 'react';
import { ProjectPlanner } from '@/components/project-planner';
import { LFAProject, LFAProjectCategory } from '@/lib/types';
import { mergeProjectStatus, readProjectStatusOverrides } from '@/lib/lfa-project-status';

type Props = {
  projects: LFAProject[];
  categories: LFAProjectCategory[];
};

export function ProjectPlannerClient({ projects, categories }: Props) {
  const [hydratedProjects, setHydratedProjects] = useState(projects);

  useEffect(() => {
    setHydratedProjects(mergeProjectStatus(projects, readProjectStatusOverrides()));
  }, [projects]);

  return <ProjectPlanner projects={hydratedProjects} categories={categories} />;
}
