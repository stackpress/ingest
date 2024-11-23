//modules
import type { SourceFile, ProjectOptions } from 'ts-morph';
import crypto from 'crypto';
import { 
  Project, 
  IndentationText, 
  VariableDeclarationKind 
} from 'ts-morph';
//common
import type { IM } from '../types';
import { objectFromQuery, withUnknownHost } from '../helpers';


export { Project, IndentationText, VariableDeclarationKind };

/**
 * Parsed query object
 */
export function imToURL(resource: IM) {
  const { url, headers } = resource;
  //determine protocol (by default https)
  let protocol = 'https';
  //if there is an x-forwarded-proto header
  const proto = headers['x-forwarded-proto'];
  if (proto?.length) {
    //then let's use that instead
    if (Array.isArray(proto)) {
      protocol = proto[0];
    } else {
      protocol = proto;
    }
    protocol = protocol.trim();
    // Note: X-Forwarded-Proto is normally only ever a
    //       single value, but this is to be safe.
    if (protocol.indexOf(',') !== -1) {
      protocol = protocol.substring(0, protocol.indexOf(',')).trim();
    }
  }
  //form the URL
  const uri = `${protocol}://${headers.host}${url || '/'}`;
  //try to create a URL object
  try {
    return new URL(uri);  
  } catch(e) {}
  //we need to return a URL object
  return new URL(withUnknownHost(url || '/'));
};

/**
 * Parsed URL query object
 */
export function imQueryToObject(resource: IM) {
  return objectFromQuery(imToURL(resource).searchParams.toString());
};

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