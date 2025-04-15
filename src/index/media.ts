export interface Media{
    id: bigint,
    entryId: bigint,
    presignedUrl: string,
    type: "IMAGE" | "VIDEO" | "FILE",
}

