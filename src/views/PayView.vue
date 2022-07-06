<script setup>
import { useRouter, useRoute } from "vue-router";
import cNames from "../dataObjects/countryNames.json";
import cCurrency from "../dataObjects/countryCurrency.json";
import PaypalButton from "../components/PaypalButton.vue";
import { decode } from "js-base64";

import SocialShareBlock from "../components/SocialShareBlock.vue";

import { generateIBAN } from "../methods/iban";
import generateQrCode from "sepa-payment-qr-code";
import spayd from "spayd";
import qrcode from "qrcode";

import { ref, onMounted } from "vue";
const route = useRoute();
const countryNames = cNames;
const countryCurrency = cCurrency;

const formData = ref({});
const selectedData = ref(null);
const paymentType = ref("spayd");

const selectPayer = (payer, i) => {
  const iban = generateIBAN(
    formData.value.prefix,
    formData.value.mainNumber,
    formData.value.bankCode,
    formData.value.country
  );

  const sepaQrCodeEl = document.getElementById("sepa");
  const spaydQrCodeEl = document.getElementById("spayd");

  const spaydPayment = {
    acc: iban,
    am: payer.amount.toFixed(2),
    cc: countryCurrency[formData.value.currency],
    msg: formData.value.paymentName,
  };
  const payerAmountInEur =
    formData.value.totalBillEur / (formData.value.totalBill / payer.amount);
  const sepaPayment = {
    name: "From PayMe",
    iban: formData.value.IBAN,
    bic: formData.value.BIC,
    amount: payerAmountInEur,
    remittance: formData.value.paymentName,
  };
  const sepaString = generateQrCode(sepaPayment);
  const spaydString = spayd(spaydPayment);
  qrcode
    .toDataURL(sepaString)
    .then((url) => {
      sepaQrCodeEl.setAttribute("src", url);
    })
    .catch(console.error);
  qrcode
    .toDataURL(spaydString)
    .then((url) => {
      spaydQrCodeEl.setAttribute("src", url);
    })
    .catch(console.error);
  const shareUrl = formData.value?.shortId
    ? `${window.location.origin}/short/${formData.value.shortId}/${i}`
    : `${window.location.origin}/payMe/${route.params.data}/${i}`;

  selectedData.value = {
    ...payer,
    iban,
    index: +i,
    shareUrl,
  };
};

onMounted(() => {
  formData.value = JSON.parse(decode(route.params.data));
  const index = route.params.index;
  if (index) {
    const payer = formData.value.payers[index];
    selectPayer(payer, index);
  }
});
</script>

<template>
  <div class="payView">
    <div class="selectionView">
      <h1>{{ formData.paymentName }}</h1>

      <div class="totalPriceLabel">
        <label> Total price to split: </label>
        <span
          >{{ formData.totalBill }}
          {{ countryCurrency[formData.currency] }}</span
        >
      </div>

      <div class="participantsBlock">
        <h2>Participants</h2>
        <ul>
          <li
            v-for="(payer, i) in formData.payers"
            :key="i"
            @click="selectPayer(payer, i)"
            :class="{ active: i === selectedData?.index }"
          >
            <span class="payerName">{{ payer.name }}</span>
            <span class="payerAmount">
              {{ payer.amount }} {{ countryCurrency[formData.currency] }}
              <span class="arrow">></span>
            </span>
          </li>
        </ul>
      </div>
    </div>
    <div class="detailView">
      <div v-if="selectedData" class="head">
        <span
          v-if="formData.isSPAYD"
          @click="paymentType = 'spayd'"
          :class="{ active: paymentType === 'spayd' }"
          >QR code</span
        >
        <span
          v-if="formData.isSEPA"
          @click="paymentType = 'sepa'"
          :class="{ active: paymentType === 'sepa' }"
          >SEPA</span
        >
        <span
          v-if="formData.isPayPal"
          @click="paymentType = 'paypal'"
          :class="{ active: paymentType === 'paypal' }"
          >PayPal</span
        >
      </div>
      <div>
        <img id="spayd" :class="{ hide: paymentType !== 'spayd' }" />
        <img id="sepa" :class="{ hide: paymentType !== 'sepa' }" />
        <div
          v-if="paymentType === 'paypal' && formData.email"
          class="paypalForm"
        >
          <PaypalButton
            :currency="countryCurrency[formData.currency]"
            :price="selectedData.amount"
            :name="formData.paymentName"
            :index="selectedData.index"
            :email="formData.email"
          />
        </div>
      </div>
      <div v-if="selectedData" class="paymentDetails">
        <table>
          <tr>
            <td>
              <h3>{{ selectedData.name }}</h3>
            </td>
          </tr>
          <tr>
            <td>
              <strong>Account number: </strong>
            </td>
            <td>
              {{ formData.prefix ? `${formData.prefix}-` : ""
              }}{{ formData.mainNumber }}/{{ formData.bankCode }}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Amount: </strong>
            </td>
            <td>
              {{ selectedData.amount }} {{ countryCurrency[formData.currency] }}
            </td>
          </tr>
        </table>

        <SocialShareBlock :selected-data="selectedData" :form-data="formData" />
      </div>
      <div class="noData" v-if="!selectedData">
        <h3>Please choose your section</h3>
      </div>
    </div>
  </div>
</template>

<style scoped>
.payView {
  display: flex;
  flex-wrap: wrap;
  max-width: 600px;
  border-radius: 15px;
  background: white;
  padding: 20px;
  min-height: 500px;
}
.payView .selectionView {
  max-width: 290px;
  width: 100%;
  padding-bottom: 25px;
}
.payView .selectionView .totalPriceLabel span {
  font-size: 25px;
  font-weight: 600;
}
.payView .selectionView .participantsBlock ul {
  padding-inline-start: 0;
  margin-left: -20px;
}
.payView .selectionView .participantsBlock ul > li {
  cursor: pointer;
  position: relative;
  display: block;
  width: 100%;
  background: #eff8fe;
  color: #000000;
  padding: 5px 0;
  margin: 1px 0;
}
.payView .selectionView .participantsBlock ul > li:hover,
.payView .selectionView .participantsBlock ul > li.active {
  background: #01e3aa;
  color: #ffffff;
}
.payView .selectionView .participantsBlock ul > li > span {
  padding: 5px 10px;
}
.payView .selectionView .participantsBlock ul > li > span.payerName {
  font-weight: bold;
}
.payView .selectionView .participantsBlock ul > li > span.payerAmount {
  position: absolute;
  bottom: 0;
  right: 0;
}
.payView .selectionView .participantsBlock ul > li > span.payerAmount .arrow {
  font-weight: bold;
  padding: 5px 10px;
}
.payView .detailView {
  max-width: 300px;
  width: 100%;
  border: 2px solid #00e3aa;
  border-radius: 15px;
}
.detailView .head {
  text-align: center;
  width: 100%;
  padding: 10px;
}
.detailView .noData {
  text-align: center;
  width: 100%;
  padding: 20px 0;
}
.detailView .head span {
  padding: 5px 10px;
  cursor: pointer;
}
.detailView .head span.active {
  border-bottom: 2px solid #02ff9a;
}
.detailView img {
  margin: auto;
  width: 100%;
}
.detailView img.hide {
  display: none;
}
.detailView .paymentDetails table {
  padding: 0 20px;
}
.detailView .paymentDetails table > tr > td {
  padding: 2px 5px;
}

@media only screen and (max-width: 600px) {
  .payView .selectionView,
  .payView .detailView {
    max-width: 100% !important;
    width: 100% !important;
  }
  .payView .selectionView .participantsBlock ul {
    margin-right: -20px;
  }
}
</style>
