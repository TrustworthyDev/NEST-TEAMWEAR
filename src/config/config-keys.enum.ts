import * as Joi from 'joi';

export interface ConfigKeys {
  DATABASE_HOST: string;
  DATABASE_PORT: number;
  DATABASE_USER: string;
  DATABASE_PASSWORD: string;
  DATABASE_SCHEMA: string;
  SUPPLIER_GLN: string;
  SUPPLIER_NAME_1: string;
  SUPPLIER_NAME_2?: string;
  SUPPLIER_ADDRESS_1: string;
  SUPPLIER_ADDRESS_2?: string;
  SUPPLIER_CITY_NAME: string;
  SUPPLIER_POSTCODE: string;
  SUPPLIER_COUNTRY_CODE: string;
  SUPPLIER_VAT_NUMBER: string;
  UPS_CLIENT_ID: string;
  UPS_CLIENT_SECRET: string;
  UPS_API_URL: string;
  TNT_CLIENT_USER: string;
  TNT_CLIENT_PASSWORD: string;
  DHL_API_KEY: string;
  DHL_API_SECRET: string;
  DHL_API_URL: string;
}

const schema: { [key in keyof ConfigKeys]?: any } = {
  SUPPLIER_GLN: Joi.string().required(),
  SUPPLIER_NAME_1: Joi.string().required(),
  SUPPLIER_ADDRESS_1: Joi.string().required(),
  SUPPLIER_CITY_NAME: Joi.string().required(),
  SUPPLIER_POSTCODE: Joi.string().required(),
  SUPPLIER_COUNTRY_CODE: Joi.string().required(),
  SUPPLIER_VAT_NUMBER: Joi.string().required(),
  UPS_CLIENT_ID: Joi.string().required(),
  UPS_CLIENT_SECRET: Joi.string().required(),
  UPS_API_URL: Joi.string().required(),
  TNT_CLIENT_USER: Joi.string().required(),
  TNT_CLIENT_PASSWORD: Joi.string().required(),
  DHL_API_KEY: Joi.string().required(),
  DHL_API_SECRET: Joi.string().required(),
  DHL_API_URL: Joi.string().required(),
};

export const environmentValidationSchema = Joi.object(schema);
