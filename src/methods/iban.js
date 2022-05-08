import IBAN from "fast-iban";

const generateAccNumber = (accNumberPrefix, accMainNumber, bankCode) => {
  const remainingPrefixSize = 6 - (accNumberPrefix?.length || 0);
  let prefix = [...Array(remainingPrefixSize)].reduce((total, n) => {
    return `${total}0`
  }, "");
  prefix = `${prefix}${accNumberPrefix || ""}`;

  const numberWithPrefix = `${prefix}${accMainNumber}`;
  return `${bankCode}${numberWithPrefix}`;
}

export const generateIBAN = (accNumberPrefix, accMainNumber, bankCode, country) => {
  const accountNumber = generateAccNumber(accNumberPrefix, accMainNumber, bankCode);
  return IBAN.generateIBAN(accountNumber, country, true, false);
}

export const validateBBAN = (accNumberPrefix, accMainNumber, bankCode, country) => {
  const accountNumber = generateAccNumber(accNumberPrefix, accMainNumber, bankCode);
  return IBAN.validateBBAN(accountNumber, country);
}

export const validateIBAN = (IBAN) => {
  return IBAN.validateIBAN(IBAN, true);
}