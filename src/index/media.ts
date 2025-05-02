export interface Media{
    id: bigint,
    entryId: bigint,
    filename: string,
    presignedUrl: string,
    type: "IMAGE" | "VIDEO" | "FILE",
}

