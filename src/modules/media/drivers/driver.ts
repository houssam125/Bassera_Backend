export interface SaveInput {
  buffer: Buffer
  ext: string
  mime: string
}

export interface SaveResult {
  /** Publicly reachable URL for the stored object. */
  url: string
}

export interface MediaDriver {
  save(input: SaveInput): Promise<SaveResult>
}
