<script setup>
import { useRouter, useRoute } from 'vue-router'
import { doc, setDoc, collection, addDoc } from "firebase/firestore";
import { onMounted } from "vue";
import { db } from "../firebase";
import cNames from "./countryNames.json";
import cCurrency from "./countryCurrency.json";
import currencyPricesJSON from "./currencyPrices.json";
import { encode } from 'js-base64';

import { ref, nextTick } from 'vue'
const formData = ref({
  currency: "CZ",
  country: "CZ",
  payers: [],
})
const isSaving = ref(false);
const router = useRouter()
const countryNames = cNames;
const countryCurrency = cCurrency;
const currencyPrices = currencyPricesJSON;

onMounted(() => {
  const localData = localStorage.getItem("accounts");
  if (localData) {
    formData.value = {
      ...formData.value,
      ...JSON.parse(localData),
    };
  }
})

const saveAndEncodeShortData = async (formData) => {
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
  }
  catch (e) {
    console.error(e);
    const stringifiedData = JSON.stringify(formData);
    return encode(stringifiedData);
  }
}

const submitHandler = async () => {
  isSaving.value = true;
  const { email, country, currency, bankCode, mainNumber, prefix } = formData.value;
  const URIencodedData = await saveAndEncodeShortData(formData.value);
  const localStorageData = { email, country, currency, bankCode, mainNumber, prefix };
  localStorage.setItem("accounts", JSON.stringify(localStorageData));
  window.location.replace(`/payMe/${URIencodedData}`);
  isSaving.value = false;
}
const currencyChange = async () => {
  setTimeout(() => formData.value.currency = formData.value.country, 100);
}
const totalBillChanged = async () => {
  setTimeout(() => {
    const selectedCurr = countryCurrency[formData.value.currency];
    const currencyData = currencyPrices[selectedCurr?.toLowerCase()];
    const convertedPrice = formData.value.totalBill / currencyData.rate;
    formData.value.totalBillEur = convertedPrice.toFixed(0);
  }, 100);
}
const addPayer = () => {
  formData.value.payers.push({
    name: "",
    amount: 0,
  });
}
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
    <p>
      You can create payment link to separate invoice between your friends.
    </p>
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
      help="Needed for generating IBAN"
      :options="countryNames"
      @change="currencyChange"
    />
    <FormKit
      type="text"
      name="email"
      label="PayPal email"
      help="If you want to use paypal, please fill this in."
    />
    <div class="accountNumber">
      <FormKit
        type="number"
        name="prefix"
        label="Acc. prefix"
      />
      <div class="sign">-</div>
      <FormKit
        type="number"
        name="mainNumber"
        label="Main acc. number"
        validation="required"
      />
      <div class="sign">/</div>
      <FormKit
        type="number"
        name="bankCode"
        label="Bank code"
        validation="required"
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
        label="Bill currency"
        :options="countryCurrency"
        @change="totalBillChanged"
      />
      <FormKit
        type="number"
        name="totalBillEur"
        label="Bill in EUR"
        help="Approximated"
        validation="required"
        style="max-width: 100px;"
      />
    </div>

    <h2 v-if="formData.payers.length > 0">Payers</h2>

    <div class="payerBlock" v-for="(payer, i) in formData.payers" :key="i">
      <label>
        Payer Name
        <input
          type="text"
          v-model="payer.name"
          label="Payer name"
        />
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
            / {{countryCurrency[formData.currency]}}
          </span>
        </span>
      </label>
    </div>

    <div class="add-payer-button">
      <FormKit
        type="button"
        label="Add payer"
        @click="addPayer"
      />
    </div>

    <p style="color: #bbbbbb;font-size: 13px;">No data are saved in any database.</p>

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
</style>