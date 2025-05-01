import { Folder} from "@/index/folder";


export default function FolderContainer({folder}: {folder: Folder}) {
    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">{folder.name}</h1>
            <div className="flex flex-col gap-2">
            </div>
        </div>
    )
}