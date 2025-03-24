//stackpress
import {
  isObject,
  objectFromQuery,
  objectFromFormData,
  objectFromJson
} from '@stackpress/lib/Nest';
import { withUnknownHost } from '@stackpress/lib/Request';

export {
  isObject,
  objectFromQuery,
  objectFromFormData,
  objectFromJson,
  withUnknownHost
};

/**
 * Returns the parsed form data from the request body (if any)
 */
export function formDataToObject(type: string, body: string) {
  return type.endsWith('/json') 
    ? objectFromJson(body)
    : type.endsWith('/x-www-form-urlencoded')
    ? objectFromQuery(body)
    : type.startsWith('multipart/form-data')
    ? objectFromFormData(body)
    : {} as Record<string, unknown>;
};
