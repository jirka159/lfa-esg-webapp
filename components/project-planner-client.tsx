"use client";

import { ProjectPlanner } from '@/components/project-planner';
import { LFARoadmapState, LFAProject, LFAProjectCategory } from '@/lib/types';
import { type LFAUser } from '@/lib/lfa-users';

type Props = {
  projects: LFAProject[];
  categories: LFAProjectCategory[];
  initialPlan: LFARoadmapState;
  currentUser: LFAUser;
};

export function ProjectPlannerClient({ projects, categories, initialPlan, currentUser }: Props) {
  return <ProjectPlanner projects={projects} categories={categories} initialPlan={initialPlan} currentUser={currentUser} />;
}
