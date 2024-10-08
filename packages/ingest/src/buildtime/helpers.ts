//modules
import type { SourceFile, ProjectOptions } from 'ts-morph';
import crypto from 'crypto';
import { Project } from 'ts-morph';

/**
 * Converts source file to javascript
 */
export function toJS(source: SourceFile) {
  return source
    .getEmitOutput()
    .getOutputFiles()
    .filter(file => file.getFilePath().endsWith('.js'))
    .map(file => file.getText())
    .join('\n');
}

/**
 * Converts source file to typescript
 */
export function toTS(source: SourceFile) {
  return source.getFullText();
};

/**
 * API to create a ts-morph source file
 */
export function createSourceFile(filePath: string, config: ProjectOptions) {
  const project = new Project(config);
  const source = project.createSourceFile(filePath);
  return { project, source };
};

/**
 * Creates a serialized hash of a string
 */
export function serialize(string: string) {
  return crypto
    .createHash('shake256', { outputLength: 10 })
    .update(string)
    .digest('hex');
}