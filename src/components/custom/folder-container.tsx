import { Folder } from '@/index/folder';
import { useRouter } from 'next/navigation';

export default function FolderContainer({ folder }: { folder: Folder }) {
  const router = useRouter();

  function handleFolderClick() {
    router.push(`/folders/${folder.publicId}`);
  }

  return (
    <div className="flex flex-col gap-4" onClick={handleFolderClick}>
      <h1 className="text-2xl font-bold">{folder.name}</h1>
      <div className="flex flex-col gap-2"></div>
    </div>
  );
}
