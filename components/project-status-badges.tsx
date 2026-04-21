import { LFAProject } from '@/lib/types';
import { statusBadgeClass } from '@/lib/lfa-project-status';

type Props = {
  project: Pick<LFAProject, 'stavZapracovani' | 'muzeDoProdukce'>;
  compact?: boolean;
};

export function ProjectStatusBadges({ project, compact = false }: Props) {
  return (
    <div className={`projectStatusBadges ${compact ? 'isCompact' : ''}`}>
      <span className={`statusBadge ${statusBadgeClass(project.stavZapracovani)}`}>
        Stav: {project.stavZapracovani}
      </span>
      <span className={`statusBadge ${project.muzeDoProdukce ? 'prodYes' : 'prodNo'}`}>
        Produkce: {project.muzeDoProdukce ? 'Ano' : 'Ne'}
      </span>
    </div>
  );
}
