import { Faker, en } from '@faker-js/faker';
import { SeededRandom } from './seeded-random';

function buildFaker(rng: SeededRandom): Faker {
  const seed = Math.floor(rng.next() * 2_147_483_647);
  const instance = new Faker({ locale: [en] });
  instance.seed(seed);
  return instance;
}

// All supported template variables
function resolveVariable(
  variable: string,
  faker: Faker,
  regionCode: string,
  countryCode: string,
  customKv: Record<string, unknown>,
): string {
  // Step response extraction: {{step.1.response.fieldName}}
  const stepMatch = variable.match(/^step\.(\d+)\.response\.(.+)$/);
  if (stepMatch) {
    const key = `step_${stepMatch[1]}_${stepMatch[2]}`;
    return String(customKv[key] ?? '');
  }

  // Region variables
  if (variable === 'region.country') return countryCode;
  if (variable === 'region.code') return regionCode;
  if (variable === 'region.locale') return getLocale(countryCode);

  // Faker variables
  switch (variable) {
    // Person
    case 'faker.person.fullName':
      return faker.person.fullName();
    case 'faker.person.firstName':
      return faker.person.firstName();
    case 'faker.person.lastName':
      return faker.person.lastName();
    case 'faker.person.gender':
      return faker.person.sex();
    case 'faker.person.jobTitle':
      return faker.person.jobTitle();

    // Internet
    case 'faker.internet.email':
      return faker.internet.email();
    case 'faker.internet.username':
      return faker.internet.username();
    case 'faker.internet.password':
      return faker.internet.password({ length: 12, memorable: false });
    case 'faker.internet.url':
      return faker.internet.url();
    case 'faker.internet.ipv4':
      return faker.internet.ipv4();
    case 'faker.internet.userAgent':
      return faker.internet.userAgent();

    // Phone
    case 'faker.phone.number':
      return faker.phone.number();
    case 'faker.phone.imei':
      return faker.phone.imei();

    // Location
    case 'faker.location.city':
      return faker.location.city();
    case 'faker.location.country':
      return faker.location.country();
    case 'faker.location.streetAddress':
      return faker.location.streetAddress();
    case 'faker.location.zipCode':
      return faker.location.zipCode();
    case 'faker.location.latitude':
      return String(faker.location.latitude());
    case 'faker.location.longitude':
      return String(faker.location.longitude());

    // Finance
    case 'faker.finance.amount':
      return faker.finance.amount({ min: 10, max: 10000, dec: 2 });
    case 'faker.finance.currency':
      return faker.finance.currency().code;
    case 'faker.finance.accountNumber':
      return faker.finance.accountNumber();
    case 'faker.finance.iban':
      return faker.finance.iban();
    case 'faker.finance.creditCard':
      return faker.finance.creditCardNumber();
    case 'faker.finance.pin':
      return faker.finance.pin();

    // Commerce
    case 'faker.commerce.productName':
      return faker.commerce.productName();
    case 'faker.commerce.price':
      return faker.commerce.price({ min: 5, max: 500 });
    case 'faker.commerce.department':
      return faker.commerce.department();
    case 'faker.commerce.description':
      return faker.commerce.productDescription();

    // String / ID
    case 'faker.string.uuid':
      return faker.string.uuid();
    case 'faker.string.alphanumeric':
      return faker.string.alphanumeric(12);
    case 'faker.string.nanoid':
      return faker.string.nanoid();
    case 'faker.number.int':
      return String(faker.number.int({ min: 1, max: 10000 }));
    case 'faker.number.float':
      return String(faker.number.float({ min: 0, max: 1000, fractionDigits: 2 }));

    // Date
    case 'faker.date.past':
      return faker.date.past().toISOString();
    case 'faker.date.future':
      return faker.date.future().toISOString();
    case 'faker.date.recent':
      return faker.date.recent().toISOString();
    case 'faker.date.birthdate':
      return faker.date.birthdate({ min: 18, max: 65, mode: 'age' }).toISOString().split('T')[0];

    // Company
    case 'faker.company.name':
      return faker.company.name();
    case 'faker.company.buzzPhrase':
      return faker.company.catchPhrase();

    // Lorem
    case 'faker.lorem.word':
      return faker.lorem.word();
    case 'faker.lorem.sentence':
      return faker.lorem.sentence();
    case 'faker.lorem.paragraph':
      return faker.lorem.paragraph();

    // Database
    case 'faker.database.mongodbId':
      return faker.database.mongodbObjectId();

    default:
      return `{{${variable}}}`; // leave unresolved variables as-is
  }
}

/**
 * Resolve all {{variable}} placeholders in a string template.
 */
export function resolveTemplate(
  template: string,
  rng: SeededRandom,
  regionCode: string,
  countryCode: string,
  customKv: Record<string, unknown>,
): string {
  const faker = buildFaker(rng);
  return template.replace(/\{\{([^}]+)\}\}/g, (_, variable) => {
    try {
      return resolveVariable(variable.trim(), faker, regionCode, countryCode, customKv);
    } catch {
      return `{{${variable}}}`;
    }
  });
}

/**
 * Resolve template variables inside a JSON object recursively.
 * Handles nested objects and arrays.
 */
export function resolveBody(
  body: unknown,
  rng: SeededRandom,
  regionCode: string,
  countryCode: string,
  customKv: Record<string, unknown>,
): unknown {
  if (typeof body === 'string') {
    return resolveTemplate(body, rng, regionCode, countryCode, customKv);
  }
  if (Array.isArray(body)) {
    return body.map((item) => resolveBody(item, rng, regionCode, countryCode, customKv));
  }
  if (body !== null && typeof body === 'object') {
    const resolved: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      resolved[key] = resolveBody(value, rng, regionCode, countryCode, customKv);
    }
    return resolved;
  }
  return body;
}

/**
 * Extract values from a response body and store in customKv.
 * Extract rules: { "userId": "body.id", "token": "headers.authorization" }
 */
export function extractFromResponse(
  extractRules: Record<string, string>,
  responseBody: unknown,
  responseHeaders: Record<string, string>,
  stepIndex: number,
  customKv: Record<string, unknown>,
): void {
  for (const [varName, path] of Object.entries(extractRules)) {
    const parts = path.split('.');
    const source = parts[0];
    const fieldPath = parts.slice(1);

    let value: unknown;

    if (source === 'body') {
      value = getNestedValue(responseBody, fieldPath);
    } else if (source === 'headers') {
      value =
        responseHeaders[fieldPath.join('.')] ?? responseHeaders[fieldPath.join('.').toLowerCase()];
    }

    if (value !== undefined) {
      // Store as step-scoped variable: step_1_userId
      customKv[`step_${stepIndex}_${varName}`] = value;
      // Also store as plain variable for convenience
      customKv[varName] = value;
    }
  }
}

function getNestedValue(obj: unknown, path: string[]): unknown {
  let current = obj;
  for (const key of path) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function getLocale(countryCode: string): string {
  const localeMap: Record<string, string> = {
    US: 'en-US',
    GB: 'en-GB',
    NG: 'en-NG',
    IN: 'hi-IN',
    DE: 'de-DE',
    FR: 'fr-FR',
    JP: 'ja-JP',
    KR: 'ko-KR',
    BR: 'pt-BR',
    MX: 'es-MX',
    SA: 'ar-SA',
    ZA: 'en-ZA',
    AU: 'en-AU',
    CA: 'en-CA',
    CN: 'zh-CN',
    RU: 'ru-RU',
    TR: 'tr-TR',
    PL: 'pl-PL',
    UA: 'uk-UA',
    EG: 'ar-EG',
  };
  return localeMap[countryCode] ?? 'en-US';
}
