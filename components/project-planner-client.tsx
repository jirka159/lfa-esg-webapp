"use client";

import { ProjectPlanner } from '@/components/project-planner';
import { LFAProject, LFAProjectCategory } from '@/lib/types';

type Props = {
  projects: LFAProject[];
  categories: LFAProjectCategory[];
};

export function ProjectPlannerClient({ projects, categories }: Props) {
  return <ProjectPlanner projects={projects} categories={categories} />;
}
