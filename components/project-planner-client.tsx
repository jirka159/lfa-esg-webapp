"use client";

import { ProjectPlanner } from '@/components/project-planner';
import { LFARoadmapState, LFAProject, LFAProjectCategory } from '@/lib/types';

type Props = {
  projects: LFAProject[];
  categories: LFAProjectCategory[];
  initialPlan: LFARoadmapState;
};

export function ProjectPlannerClient({ projects, categories, initialPlan }: Props) {
  return <ProjectPlanner projects={projects} categories={categories} initialPlan={initialPlan} />;
}
