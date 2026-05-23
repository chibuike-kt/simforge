import { Faker, en } from '@faker-js/faker';
import { SeededRandom } from './seeded-random';

function buildFaker(rng: SeededRandom): Faker {
  const seed = Math.floor(rng.next() * 2_147_483_647);
  const instance = new Faker({ locale: [en] });
  instance.seed(seed);
  return instance;
}

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
    const value = customKv[key] ?? customKv[stepMatch[2]];
    if (value !== undefined && value !== '') return String(value);
    console.warn(
      `[Template] Could not resolve ${variable} — key=${key} customKv keys:`,
      Object.keys(customKv),
    );
    return '';
  }

  // Dynamic digit strings: {{faker.number.digits.N}}
  const digitsMatch = variable.match(/^faker\.number\.digits\.(\d+)$/);
  if (digitsMatch) {
    const n = parseInt(digitsMatch[1]);
    return Array.from({ length: n }, () => faker.number.int({ min: 0, max: 9 })).join('');
  }

  // Dynamic pin: {{faker.finance.pin.N}}
  const pinMatch = variable.match(/^faker\.finance\.pin\.(\d+)$/);
  if (pinMatch) {
    const n = parseInt(pinMatch[1]);
    return faker.finance.pin({ length: n });
  }

  // Region variables
  if (variable === 'region.country') return countryCode;
  if (variable === 'region.code') return regionCode;
  if (variable === 'region.locale') return getLocale(countryCode);

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

    // Nigerian phone numbers
    case 'faker.phone.nigeria': {
      const prefixes = [
        '0703',
        '0706',
        '0803',
        '0806',
        '0810',
        '0813',
        '0814',
        '0816',
        '0903',
        '0906',
        '0701',
        '0708',
        '0802',
        '0808',
        '0812',
        '0902',
        '0705',
        '0805',
        '0807',
        '0811',
        '0815',
        '0905',
        '0809',
        '0817',
        '0818',
        '0908',
        '0909',
      ];
      const prefix = prefixes[Math.floor(faker.number.int({ min: 0, max: prefixes.length - 1 }))];
      return `+234${prefix.slice(1)}${faker.number.int({ min: 1000000, max: 9999999 })}`;
    }
    case 'faker.phone.nigeria.mtn': {
      const prefixes = [
        '0703',
        '0706',
        '0803',
        '0806',
        '0810',
        '0813',
        '0814',
        '0816',
        '0903',
        '0906',
      ];
      const prefix = prefixes[Math.floor(faker.number.int({ min: 0, max: prefixes.length - 1 }))];
      return `+234${prefix.slice(1)}${faker.number.int({ min: 1000000, max: 9999999 })}`;
    }
    case 'faker.phone.nigeria.airtel': {
      const prefixes = ['0701', '0708', '0802', '0808', '0812', '0902'];
      const prefix = prefixes[Math.floor(faker.number.int({ min: 0, max: prefixes.length - 1 }))];
      return `+234${prefix.slice(1)}${faker.number.int({ min: 1000000, max: 9999999 })}`;
    }
    case 'faker.phone.nigeria.glo': {
      const prefixes = ['0705', '0805', '0807', '0811', '0815', '0905'];
      const prefix = prefixes[Math.floor(faker.number.int({ min: 0, max: prefixes.length - 1 }))];
      return `+234${prefix.slice(1)}${faker.number.int({ min: 1000000, max: 9999999 })}`;
    }
    case 'faker.phone.nigeria.9mobile': {
      const prefixes = ['0809', '0817', '0818', '0908', '0909'];
      const prefix = prefixes[Math.floor(faker.number.int({ min: 0, max: prefixes.length - 1 }))];
      return `+234${prefix.slice(1)}${faker.number.int({ min: 1000000, max: 9999999 })}`;
    }

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
    case 'faker.finance.pin.4':
      return faker.finance.pin({ length: 4 });
    case 'faker.finance.pin.6':
      return faker.finance.pin({ length: 6 });
    case 'faker.finance.pin.8':
      return faker.finance.pin({ length: 8 });

    // Numbers
    case 'faker.number.int':
      return String(faker.number.int({ min: 1, max: 10000 }));
    case 'faker.number.float':
      return String(faker.number.float({ min: 0, max: 1000, fractionDigits: 2 }));
    case 'faker.number.digits.4':
      return Array.from({ length: 4 }, () => faker.number.int({ min: 0, max: 9 })).join('');
    case 'faker.number.digits.5':
      return Array.from({ length: 5 }, () => faker.number.int({ min: 0, max: 9 })).join('');
    case 'faker.number.digits.6':
      return Array.from({ length: 6 }, () => faker.number.int({ min: 0, max: 9 })).join('');
    case 'faker.number.digits.8':
      return Array.from({ length: 8 }, () => faker.number.int({ min: 0, max: 9 })).join('');

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
      return `{{${variable}}}`;
  }
}

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

export function resolveBody(
  body: unknown,
  rng: SeededRandom,
  regionCode: string,
  countryCode: string,
  customKv: Record<string, unknown>,
): unknown {
  if (typeof body === 'string')
    return resolveTemplate(body, rng, regionCode, countryCode, customKv);
  if (Array.isArray(body))
    return body.map((item) => resolveBody(item, rng, regionCode, countryCode, customKv));
  if (body !== null && typeof body === 'object') {
    const resolved: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      resolved[key] = resolveBody(value, rng, regionCode, countryCode, customKv);
    }
    return resolved;
  }
  return body;
}

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

    console.log(
      `[Extract] step=${stepIndex} var=${varName} path=${path} value=${JSON.stringify(value)}`,
    );

    if (value !== undefined && value !== null) {
      customKv[`step_${stepIndex}_${varName}`] = value;
      customKv[varName] = value;
      console.log(`[Extract] ✓ step_${stepIndex}_${varName} = ${value}`);
    } else {
      console.warn(`[Extract] ✗ Failed to extract "${varName}" from path "${path}"`);
      console.log(`[Extract] Body sample:`, JSON.stringify(responseBody)?.slice(0, 300));
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
  const map: Record<string, string> = {
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
  return map[countryCode] ?? 'en-US';
}
