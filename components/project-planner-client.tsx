"use client";

import { ProjectPlanner } from '@/components/project-planner';
import { LFARoadmapState, LFAProject, LFAProjectCategory } from '@/lib/types';
import { type AuthSessionContext } from '@/lib/auth';

type Props = {
  projects: LFAProject[];
  categories: LFAProjectCategory[];
  initialPlan: LFARoadmapState;
  session: AuthSessionContext;
};

export function ProjectPlannerClient({ projects, categories, initialPlan, session }: Props) {
  return <ProjectPlanner projects={projects} categories={categories} initialPlan={initialPlan} session={session} />;
}
