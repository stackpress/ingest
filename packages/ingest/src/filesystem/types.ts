//--------------------------------------------------------------------//
// Filesystem Types

export type FileStat = { isFile(): boolean };

export interface FileSystem {
  existsSync(path: string): boolean;
  readFileSync(path: string, encoding: BufferEncoding): string;
  realpathSync(string: string): string;
  lstatSync(path: string): FileStat;
  writeFileSync(path: string, data: string, encoding?: BufferEncoding): void;
}