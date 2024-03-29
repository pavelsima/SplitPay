<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";
import cCurrency from "../dataObjects/countryCurrency.json";
import { decode } from "js-base64";
import type { Payer, FormData, Json, SelectedData } from "../types/Form";

import SocialShareBlock from "../components/SocialShareBlock.vue";
import PaypalButton from "../components/PaypalButton.vue";
import QrCode from "../components/QrCode.vue";

import { generateIBAN } from "../services/iban";
import generateQrCode from "sepa-payment-qr-code";
import spayd from "spayd";
import qrcode from "qrcode";

import { ref, onMounted } from "vue";
const route = useRoute();
const countryCurrency = cCurrency as Json;

const formData = ref<FormData>();
const selectedData = ref<SelectedData>();
const paymentType = ref("spayd");
const sepaString = ref<string>()
const spaydString = ref<string>();

const selectPayer = (payer: Payer, i: number) => {
  if (!formData.value) return;
  const iban = formData.value.IBAN || "";

  const spaydPayment = {
    acc: iban,
    am: payer.amount.toFixed(2),
    cc: countryCurrency[formData.value.currency],
    msg: formData.value?.paymentName,
  };
  const totalIntInEur = parseInt(formData.value.totalBillEur || "");
  const payerAmountInEur = totalIntInEur / ((formData.value.totalBill || 0) / payer.amount);
  const sepaPayment = {
    name: "From PayMe",
    iban: iban,
    bic: formData.value.BIC,
    amount: payerAmountInEur,
    remittance: formData.value.paymentName,
  };
  console.log(sepaPayment)
  sepaString.value = generateQrCode(sepaPayment);
  spaydString.value = spayd(spaydPayment);

  console.log(sepaString.value, spaydString.value)

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
  const routeData = route.params.data as string;
  formData.value = JSON.parse(decode(routeData));
  const index = parseInt(route.params.index as string);
  const payer = index ? formData.value?.payers?.[index] : null;
  if (payer) {
    selectPayer(payer, index);
  }
});
</script>

<template>
  <div class="payView">
    <div class="selectionView">
      <h1>{{ formData?.paymentName }}</h1>

      <div v-if="formData" class="totalPriceLabel">
        <label> Total price to split: </label>
        <span
          >{{ formData?.totalBill }}
          {{ countryCurrency[formData.currency] }}</span
        >
      </div>

      <div class="participantsBlock">
        <h2>Participants</h2>
        <ul>
          <li
            v-for="(payer, i) in formData?.payers"
            :key="i"
            @click="selectPayer(payer, i)"
            :class="{ active: i === selectedData?.index }"
          >
            <span class="payerName">{{ payer.name }}</span>
            <span v-if="formData" class="payerAmount">
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
          v-if="formData?.isSPAYD"
          @click="paymentType = 'spayd'"
          :class="{ active: paymentType === 'spayd' }"
          >QR code</span
        >
        <span
          v-if="formData?.isSEPA"
          @click="paymentType = 'sepa'"
          :class="{ active: paymentType === 'sepa' }"
          >SEPA</span
        >
        <span
          v-if="formData?.isPayPal"
          @click="paymentType = 'paypal'"
          :class="{ active: paymentType === 'paypal' }"
          >PayPal</span
        >
      </div>
      <div>
        <QrCode
          v-if="spaydString"
          image-id="spayd"
          :data="spaydString"
          :class="{ hide: paymentType !== 'spayd' }"
        />
        <QrCode
          v-if="sepaString"
          image-id="sepa"
          :data="sepaString"
          :class="{ hide: paymentType !== 'sepa' }"
        />
        <div
          v-if="paymentType === 'paypal' && formData?.email"
          class="paypalForm"
        >
          <PaypalButton
            :currency="countryCurrency[formData.currency]"
            :price="selectedData?.amount"
            :name="formData.paymentName"
            :index="selectedData?.index"
            :email="formData.email"
          />
        </div>
      </div>
      <div v-if="selectedData" class="paymentDetails">
        <table>
          <tr>
            <td>
              <h3>{{ selectedData?.name }}</h3>
            </td>
          </tr>
          <tr>
            <td>
              <strong>Account number: </strong>
            </td>
            <td>
              {{ formData?.prefix ? `${formData?.prefix}-` : ""
              }}{{ formData?.mainNumber }}/{{ formData?.bankCode }}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Amount: </strong>
            </td>
            <td v-if="formData">
              {{ selectedData?.amount }} {{ countryCurrency[formData.currency] }}
            </td>
          </tr>
        </table>

        <SocialShareBlock
          v-if="formData"
          :selected-data="selectedData"
          :form-data="formData"
        />
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
