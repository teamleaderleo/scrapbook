import {
  BanknotesIcon,
  ClockIcon,
  UserGroupIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';
import { lusitana } from '@/components/ui/assets/fonts';
import { fetchCardData } from '@/app/lib/data/data';
import { ADMIN_UUID } from '@/app/lib/constants';

const iconMap = {
  collected: BanknotesIcon,
  blocks: UserGroupIcon,
  pending: ClockIcon,
  projects: InboxIcon,
};

export default async function CardWrapper() {
  const {
    numberOfArtifacts,
    numberOfProjects,
    numberOfPendingProjects,
    numberOfCompletedProjects,
  } = await fetchCardData(ADMIN_UUID);

  return (
    <>
      <Card title="Completed" value={numberOfCompletedProjects} type="collected" />
      <Card title="Pending" value={numberOfPendingProjects} type="pending" />
      <Card title="Total Projects" value={numberOfProjects} type="projects" />
      <Card
        title="Total Artifacts"
        value={numberOfArtifacts}
        type="blocks"
      />
    </>
  );
}

export function Card({
  title,
  value,
  type,
}: {
  title: string;
  value: number | string;
  type: 'projects' | 'blocks' | 'pending' | 'collected';
}) {
  const Icon = iconMap[type];

  return (
    <div className="rounded-xl bg-gray-50 p-2 shadow-sm">
      <div className="flex p-4">
        {Icon ? <Icon className="h-5 w-5 text-gray-700" /> : null}
        <h3 className="ml-2 text-sm font-medium">{title}</h3>
      </div>
      <p
        className={`${lusitana.className}
          truncate rounded-xl bg-white px-4 py-8 text-center text-2xl`}
      >
        {value}
      </p>
    </div>
  );
}
