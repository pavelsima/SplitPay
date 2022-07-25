<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";
import { doc, setDoc, collection, addDoc } from "firebase/firestore";
import { onMounted } from "vue";
import type { Payer, FormData, Json, KeysOfType } from "../types/Form";
// config added localy
import { db } from "../firebase";
import cNames from "../dataObjects/countryNames.json";
import cCurrency from "../dataObjects/countryCurrency.json";
import currencyPricesJSON from "../dataObjects/currencyPrices.json";
import { encode } from "js-base64";
import { generateIBAN, validateBBAN, validateIBAN } from "../services/iban";
import vueRecaptcha from "vue3-recaptcha2";

import { ref } from "vue";
const formData = ref<FormData>({
  paymentName: "",
  currency: "CZ",
  country: "CZ",
  payers: [],
  isSPAYD: true,
  isSEPA: false,
  isPayPal: false,
  doNotShortenUrl: false,
});
const isSaving = ref(false);
const reCaptcha = ref(false);
const isReCaptchaFailed = ref(false);
const vueRecaptchaRef = ref<HTMLElement | null>(null);
const countryNames = cNames as Json;
const countryCurrency = cCurrency as Json;
const currencyPrices = currencyPricesJSON as Json;
const errorMsg = ref("");

onMounted(() => {
  const localData = localStorage.getItem("accounts");
  if (localData) {
    formData.value = {
      ...formData.value,
      ...JSON.parse(localData),
    };
  }
});

const recaptchaVerified = () => {
  isReCaptchaFailed.value = false;
  reCaptcha.value = true;
};
const recaptchaExpired = () => {
  reCaptcha.value = false;
  vueRecaptchaRef.value?.reset();
};
const recaptchaFailed = () => {
  isReCaptchaFailed.value = true;
  reCaptcha.value = false;
};

const saveAndEncodeShortData = async (formData: FormData) => {
  try {
    const docRef = await addDoc(collection(db, "short"), {
      data: "",
    });
    const allFormData = {
      ...formData,
      shortId: docRef.id,
    };
    const stringifiedData = JSON.stringify(allFormData);
    const URIencodedData = encode(stringifiedData);
    await setDoc(doc(db, "short", docRef.id), {
      data: URIencodedData,
    });

    return encode(stringifiedData);
  } catch (e) {
    console.error(e);
    const stringifiedData = JSON.stringify(formData);
    return encode(stringifiedData);
  }
};

const submitHandler = async () => {
  if (!reCaptcha.value) return;

  if (
    formData.value.isSPAYD &&
    !validateBBAN(
      formData.value.prefix,
      formData.value.mainNumber,
      formData.value.bankCode,
      formData.value.country
    )
  ) {
    errorMsg.value = "Account number is not valid.";
    isSaving.value = false;
    return;
  }

  if (formData.value.isSEPA && !validateIBAN(formData.value.IBAN || "")) {
    errorMsg.value = "IBAN is not valid.";
    isSaving.value = false;
    return;
  }

  if (formData.value.payers?.length === 0) {
    errorMsg.value = "You need to add at least one payer.";
    isSaving.value = false;
    return;
  }

  const {
    email,
    country,
    currency,
    bankCode,
    mainNumber,
    prefix,
    doNotShortenUrl,
    BIC,
    isSPAYD,
    isSEPA,
    isPayPal,
  } = formData.value;
  let URIencodedData = "";
  if (doNotShortenUrl) {
    const stringifiedData = JSON.stringify(formData.value);
    URIencodedData = encode(stringifiedData);
  } else {
    URIencodedData = await saveAndEncodeShortData(formData.value);
  }

  isSaving.value = true;
  const localStorageData = {
    email,
    country,
    currency,
    bankCode,
    mainNumber,
    prefix,
    BIC,
    isSPAYD,
    isSEPA,
    isPayPal,
  };
  localStorage.setItem("accounts", JSON.stringify(localStorageData));
  window.location.replace(`/payMe/${URIencodedData}`);
  isSaving.value = false;
};

const updateIBAN = (update?: string, name?: string) => {
  const prefix = name === "prefix" ? update : formData.value?.prefix || "";
  const mainNumber =
    name === "mainNumber" ? update : formData.value?.mainNumber || "";
  const bankCode =
    name === "bankCode" ? update : formData.value?.bankCode || "";
  const country = name === "country" ? update : formData.value.country;
  if (name && update) {
    const propKey: KeysOfType<FormData, string> = name;
    formData.value[propKey] = update;
  }
  if (!validateBBAN(prefix, mainNumber, bankCode, country)) return;
  formData.value.IBAN = generateIBAN(prefix, mainNumber, bankCode, country);
};
const currencyChange = async () => {
  setTimeout(() => {
    formData.value.currency = formData.value.country;
    updateIBAN(formData.value.country, "country");
  }, 100);
};
const totalBillChanged = async () => {
  setTimeout(() => {
    const selectedCurr = countryCurrency[formData.value.currency];
    const currencyData = currencyPrices[selectedCurr?.toLowerCase()];
    const convertedPrice = formData.value.totalBill
      ? formData.value.totalBill / currencyData.rate : 0;
    formData.value.totalBillEur = convertedPrice.toFixed(0);
  }, 100);
};
const paymentOptionAdded = (paymentOption: string) => {
  const localData = localStorage.getItem("accounts");
  if (!localData) return;

  const parsedLocalData = JSON.parse(localData);
  const obj = {
    isSPAYD: ["prefix", "mainNumber", "bankCode"],
    isSEPA: ["receiver", "IBAN", "BIC"],
    isPayPal: ["email"],
  };

  const optionKey: KeysOfType<FormData, string> = paymentOption;
  formData.value[paymentOption] = !formData.value[paymentOption];
  obj[paymentOption as keyof typeof obj].map((option: string) => {
    if (option === "IBAN") {
      return updateIBAN();
    }
    formData.value[option as keyof FormData] = parsedLocalData[option];
  });
};
const addPayer = () => {
  if (!formData.value.payers) {
    formData.value.payers = [];
  }

  formData.value.payers.push({
    name: "",
    amount: 0,
  });
};
const removePayer = (index: number) => {
  formData.value.payers?.splice(index, 1);
};
</script>

<template>
  <FormKit
    v-if="!isSaving"
    type="form"
    v-model="formData"
    submit-label="Make payment link"
    @submit="submitHandler"
  >
    <h1>Create new payment link</h1>
    <p>You can create payment link to separate invoice between your friends.</p>
    <hr />
    <FormKit
      type="text"
      name="paymentName"
      label="Payment name"
      placeholder="Uber home"
      help="What people are paying for"
      validation="required"
    />
    <FormKit
      type="select"
      name="country"
      label="Country of your account"
      :options="countryNames"
      @change="currencyChange"
    />
    <div>
      <h3>Pyment methods</h3>
      <FormKit
        type="checkbox"
        name="isSPAYD"
        label="SPD (SPAYD) QR code"
        help="Short Payment Descriptor"
        @change="paymentOptionAdded('isSPAYD')"
      />
      <div v-if="formData.isSPAYD" class="accountNumber">
        <FormKit
          type="number"
          name="prefix"
          label="Acc. prefix"
          @input="(e) => updateIBAN(e, 'prefix')"
        />
        <div class="sign">-</div>
        <FormKit
          type="number"
          name="mainNumber"
          label="Acc. number"
          @input="(e) => updateIBAN(e, 'mainNumber')"
        />
        <div class="sign">/</div>
        <FormKit
          type="number"
          name="bankCode"
          label="Bank code"
          @input="(e) => updateIBAN(e, 'bankCode')"
        />
      </div>

      <FormKit
        type="checkbox"
        name="isSEPA"
        label="SEPA QR code"
        help="European Payments Council QR code"
        @change="paymentOptionAdded('isSEPA')"
      />
      <div v-if="formData.isSEPA">
        <FormKit
          type="text"
          name="IBAN"
          label="IBAN"
          help="If SPD is active IBAN is automaticly generaded from acount number"
        />
        <FormKit
          type="text"
          name="BIC"
          label="BIC/SWIFT"
          help="You can find here: https://wise.com/cz/swift-codes/"
        />
      </div>

      <FormKit
        type="checkbox"
        name="isPayPal"
        label="Paypal"
        help="Recive money over your PayPal account"
        @change="paymentOptionAdded('isPayPal')"
      />
      <FormKit
        v-if="formData.isPayPal"
        type="text"
        name="email"
        label="PayPal email"
        help="If you want to use paypal, please fill this in."
      />
    </div>
    <div class="priceBlock">
      <FormKit
        type="number"
        name="totalBill"
        label="Total bill"
        help="How much was the total"
        validation="required"
        @change="totalBillChanged"
      />
      <FormKit
        type="select"
        name="currency"
        label="Currency"
        :options="countryCurrency"
        @change="totalBillChanged"
      />
      <FormKit
        type="number"
        name="totalBillEur"
        label="In EUR"
        help="Approximated"
        validation="required"
        style="max-width: 100px"
      />
    </div>

    <h2 v-if="formData?.payers && formData.payers.length > 0">Payers</h2>

    <div class="payerBlock" v-for="(payer, i) in formData.payers" :key="i">
      <label>
        Payer Name
        <input type="text" v-model="payer.name" label="Payer name" />
      </label>
      <label>
        Corresponding amount
        <span class="price">
          <input
            type="number"
            v-model="payer.amount"
            label="Corresponding amount"
            validation="required"
          />
          <span class="currency">
            {{ countryCurrency[formData.currency] }}
          </span>
        </span>
      </label>
      <a class="removePayer" @click="removePayer(i)">X</a>
    </div>

    <div class="add-payer-button">
      <FormKit type="button" label="Add payer" @click="addPayer" />
    </div>

    <vue-recaptcha
      sitekey="6LeqCswfAAAAAMVE7pZ8xan6csuBCLt_N9gyv5_w"
      class="reCaptcha"
      size="normal"
      theme="light"
      @verify="recaptchaVerified"
      @expire="recaptchaExpired"
      @fail="recaptchaFailed"
      ref="vueRecaptchaRef"
    >
    </vue-recaptcha>

    <p v-if="isReCaptchaFailed" style="color: red">
      reCaptcha failed, please try again.
    </p>

    <div class="grayText">
      <p>
        Encrypted data are stored in the database for purpose of URL shortening.
      </p>
      <FormKit
        type="checkbox"
        label="Do not shorten the URL"
        help="(do not save any data)"
        name="doNotShortenUrl"
      />
    </div>

    <p v-if="errorMsg" style="color: red">{{ errorMsg }}</p>
  </FormKit>
  <h3 v-else id="savingHeader">Saving data...</h3>
</template>

<style>
#savingHeader {
  text-align: center;
  color: #ffffff;
  padding: 50px 0;
}
.priceBlock {
  display: flex;
  justify-content: space-between;
}
.accountNumber {
  display: flex;
  align-content: space-around;
  justify-content: space-around;
  align-items: center;
}
.accountNumber .sign {
  padding: 5px;
}
.priceBlock .currency {
  margin-left: 20px;
}
.payerBlock {
  padding: 10px;
  background: #f2f2f2;
  border: 1px dashed gray;
  border-radius: 5px;
  margin: 15px 0;
  position: relative;
}
.payerBlock .removePayer {
  position: absolute;
  right: 10px;
  top: 5px;
  cursor: pointer;
}
.payerBlock label {
  display: block;
  font-weight: 700;
  margin-bottom: 5px;
}
.payerBlock input {
  display: block;
  padding: 10px;
  width: -webkit-fill-available;
  border: 1px solid black;
  border-radius: var(--fk-border-radius);
  padding: var(--fk-padding-input);
  margin: 5px 0;
}
.payerBlock label .price {
  display: flex;
  align-items: center;
}
.payerBlock label .price .currency {
  min-width: 60px;
  text-align: center;
}
.content form {
  background: #fff;
  padding: 10px 20px;
  border-radius: 15px;
}
.content form .formkit-wrapper button {
  background: #05e79c;
  font-weight: 500;
}
.content form .formkit-wrapper button:hover {
  background: #01ff52;
}
.content form .add-payer-button .formkit-wrapper button {
  background: transparent;
  color: black;
  border: 1px solid black;
}
.content form .add-payer-button .formkit-wrapper button:hover {
  background: #eeeeee;
}
.reCaptcha {
  padding: 10px 0;
}
.grayText,
.grayText .formkit-help {
  color: #bbbbbb;
  font-size: 13px;
}
</style>
