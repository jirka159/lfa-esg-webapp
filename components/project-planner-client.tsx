"use client";

import { ProjectPlanner } from '@/components/project-planner';
import { LFARoadmapState, LFAProject, LFAProjectCategory } from '@/lib/types';

type PlannerSession = {
  user: {
    id: string;
    username: string;
    displayName: string;
    teamName: string;
    clubId: string;
    planId: string;
    isAdmin: boolean;
  };
  activeTeam: {
    id: string;
    username: string;
    displayName: string;
    teamName: string;
    clubId: string;
    planId: string;
    isAdmin: boolean;
  };
  availableTeams: Array<{
    id: string;
    username: string;
    displayName: string;
    teamName: string;
    clubId: string;
    planId: string;
    isAdmin: boolean;
  }>;
};

type Props = {
  projects: LFAProject[];
  categories: LFAProjectCategory[];
  initialPlan: LFARoadmapState;
  session: PlannerSession;
};

export function ProjectPlannerClient({ projects, categories, initialPlan, session }: Props) {
  return <ProjectPlanner projects={projects} categories={categories} initialPlan={initialPlan} session={session} />;
}
