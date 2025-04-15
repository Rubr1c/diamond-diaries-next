export interface Media{
    id: bigint,
    entryId: bigint,
    presignedUrl: string,
    type: MediaType,
}


export enum MediaType{
    IMAGE,
    VIDEO,
    FILE,
}