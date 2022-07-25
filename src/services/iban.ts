import IBAN from "fast-iban";

const generateAccNumber = (
  accNumberPrefix: string,
  accMainNumber: string,
  bankCode: string
) => {
  const remainingPrefixSize = 6 - (accNumberPrefix?.length || 0);
  let prefix = [...Array(remainingPrefixSize)].reduce((total, n) => {
    return `${total}0`;
  }, "");
  prefix = `${prefix}${accNumberPrefix || ""}`;

  const numberWithPrefix = `${prefix}${accMainNumber}`;
  return `${bankCode}${numberWithPrefix}`;
};

export const generateIBAN = (
  accNumberPrefix: string,
  accMainNumber: string,
  bankCode: string,
  country: string
) => {
  const accountNumber = generateAccNumber(
    accNumberPrefix,
    accMainNumber,
    bankCode
  );
  return IBAN.generateIBAN(accountNumber, country, true, false);
};

export const validateBBAN = (
  accNumberPrefix: string,
  accMainNumber: string,
  bankCode: string,
  country: string
) => {
  const accountNumber = generateAccNumber(
    accNumberPrefix,
    accMainNumber,
    bankCode
  );
  return IBAN.validateBBAN(accountNumber, country);
};

export const validateIBAN = (IBANToValidate: string) => {
  return IBAN.validateIBAN(IBANToValidate, true);
};
