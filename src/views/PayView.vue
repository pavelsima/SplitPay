<script setup>
import { useRouter, useRoute } from 'vue-router'
import cNames from "../components/countryNames.json";
import cCurrency from "../components/countryCurrency.json";
import PaypalButton from "../components/PaypalButton.vue";
import { decode } from 'js-base64';
import { copyText } from 'vue3-clipboard';

import IBAN from "fast-iban";
import generateQrCode from "sepa-payment-qr-code";
import spayd from 'spayd';
import qrcode from 'qrcode';

import { ref, onMounted } from 'vue'
const route = useRoute();
const countryNames = cNames;
const countryCurrency = cCurrency;

const formData = ref({});
const selectedData = ref(null);
const copyLabel = ref("Copy to clipboard");
const paymentType = ref("spayd");

const doCopy = (shareUrl) => {
  copyText(shareUrl, undefined, (error) => {
    if (!error) {
      copyLabel.value = "Copied!";
      setTimeout(() => copyLabel.value = "Copy to clipboard", 3000);
    }
  })
}

const selectPayer = async (payer, i) => {
  const remainingPrefixSize = 6 - (formData.value.prefix?.length || 0);
  let prefix = [...Array(remainingPrefixSize)].reduce((total, n) => {
    return `${total}0`
  }, "");
  prefix = `${prefix}${formData.value?.prefix || ""}`;
  const numberWithPrefix = `${prefix}${formData.value.mainNumber}`;
  const accountNumber = `${formData.value.bankCode}${numberWithPrefix}`;
  const iban = IBAN.generateIBAN(accountNumber, formData.value.country, true, false);

  const sepaQrCodeEl = document.getElementById('sepa');
  const spaydQrCodeEl = document.getElementById('spayd');

  const spaydPayment = {
    acc: iban,
    am: payer.amount.toFixed(2),
    cc: countryCurrency[formData.value.currency],
    msg: formData.value.paymentName,
  };
  const payerAmountInEur = formData.value.totalBillEur / (formData.value.totalBill / payer.amount);
  const sepaPayment = {
    name: "From PayMe",
    iban: iban,
    amount: payerAmountInEur,
    remittance: formData.value.paymentName,
  }
  const sepaString = generateQrCode(sepaPayment);
  const spaydString = spayd(spaydPayment);
  qrcode.toDataURL(sepaString)
    .then((url) => {
      sepaQrCodeEl.setAttribute('src', url);
    })
    .catch(console.error);
  qrcode.toDataURL(spaydString)
    .then((url) => {
      spaydQrCodeEl.setAttribute('src', url);
    })
    .catch(console.error);
  const shareFullUrl = `${window.location.origin}/payMe/${route.params.data}/${i}`
  const response = await fetch(`https://api.shrtco.de/v2/shorten?url=${encodeURI(shareFullUrl)}`)
  const json = await response.json();
  const shareUrl = json?.result?.full_short_link3;

  selectedData.value = {
    ...payer,
    iban,
    index: +i,
    shareUrl,
  };
}

onMounted(() => {
  formData.value = JSON.parse(decode(route.params.data));
  const index = route.params.index;
  if (index) {
    const payer = formData.value.payers[index];
    selectPayer(payer, index);
  }
})
</script>

<template>
  <div class="payView">
    <div class="selectionView">
      <h1>{{formData.paymentName}}</h1>

      <div class="totalPriceLabel">
        <label>
          Total price to split:
        </label>
        <span>{{formData.totalBill}} {{countryCurrency[formData.currency]}}</span>
      </div>

      <div class="participantsBlock">
        <h2>Participants</h2>
        <ul>
          <li
            v-for="(payer, i) in formData.payers"
            :key="i"
            @click="selectPayer(payer, i)"
            :class="{active: i === selectedData?.index}"
          >
            <span class="payerName">{{payer.name}}</span>
            <span class="payerAmount">
              {{payer.amount}} {{countryCurrency[formData.currency]}}
              <span class="arrow">></span>
            </span>
          </li>
        </ul>
      </div>
    </div>
    <div class="detailView">
      <div v-if="selectedData" class="head">
        <span @click="paymentType = 'spayd'" :class="{active: paymentType === 'spayd'}">QR code</span>
        <!---<span @click="paymentType = 'sepa'" :class="{active: paymentType === 'sepa'}">SEPA</span>--->
        <span @click="paymentType = 'paypal'" :class="{active: paymentType === 'paypal'}">PayPal</span>
      </div>
      <div>
        <img id="spayd" :class="{hide: paymentType !== 'spayd'}">
        <img id="sepa" :class="{hide: paymentType !== 'sepa'}">
        <div v-if="paymentType === 'paypal' && formData.email" class="paypalForm">
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
              <h3>{{selectedData.name}}</h3>
            </td>
          </tr>
          <tr>
            <td>
              <strong>Account number: </strong>
            </td>
            <td>
              {{formData.prefix ? `${formData.prefix}-` : ""}}{{formData.mainNumber}}/{{formData.bankCode}}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Amount: </strong>
            </td>
            <td>
              {{selectedData.amount}} {{countryCurrency[formData.currency]}}
            </td>
          </tr>
        </table>

        <h3 style="padding-left: 25px;">Share</h3>
        <div class="share-btn">
          <ShareNetwork
            network="messenger"
            :url="selectedData.shareUrl"
            :title="`Lets split this bill: ${formData.paymentName}`"
            :description="`Total price to split: ${formData.totalBill} ${countryCurrency[formData.currency]}`"
          >
            Messenger
          </ShareNetwork>
          <ShareNetwork
            network="telegram"
            :url="selectedData.shareUrl"
            :title="`Lets split this bill: ${formData.paymentName}`"
            :description="`Total price to split: ${formData.totalBill} ${countryCurrency[formData.currency]}`"
          >
            Telegram
          </ShareNetwork>
          <ShareNetwork
            network="whatsapp"
            :url="selectedData.shareUrl"
            :title="`Lets split this bill: ${formData.paymentName}`"
            :description="`Total price to split: ${formData.totalBill} ${countryCurrency[formData.currency]}`"
          >
            WhatsApp
          </ShareNetwork>
          <ShareNetwork
            network="email"
            :url="selectedData.shareUrl"
            :title="`Lets split this bill: ${formData.paymentName}`"
            :description="`Total price to split: ${formData.totalBill} ${countryCurrency[formData.currency]}`"
          >
            Email
          </ShareNetwork>
          <br />
          <a @click="doCopy(selectedData.shareUrl)">
            {{copyLabel}}
          </a>
        </div>
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
.payView .selectionView .participantsBlock ul > li:hover, .payView .selectionView .participantsBlock ul > li.active {
  background: #01e3aa;
  color: #ffffff
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
.share-btn {
  line-height: 35px;
  padding: 0 20px 20px 20px;
  text-align: center;
}
.share-btn > a {
  padding: 5px 10px;
  margin: 2px;
  border-radius: 15px;
  background: #00e3a9;
  color: #ffffff;
  text-decoration: none;
}
.share-btn > a:hover {
  cursor: pointer;
  background: #00f869;
}
</style>

<style>
html {
  background: rgb(0,255,81);
  background: linear-gradient(0deg, #00ff51 0%, #01e3aa 100%);
  min-height: -webkit-fill-available;
  height: auto;
}
</style>