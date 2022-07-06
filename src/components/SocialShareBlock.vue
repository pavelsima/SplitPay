<script setup>
import { defineProps, toRefs, ref } from "vue";
import { copyText } from "vue3-clipboard";
import countryCurrency from "../dataObjects/countryCurrency";

const props = defineProps(["formData", "selectedData"]);
const { formData, selectedData } = toRefs(props);
const copyLabel = ref("Copy to clipboard");

const doCopy = (shareUrl) => {
  copyText(shareUrl, undefined, (error) => {
    if (!error) {
      copyLabel.value = "Copied!";
      setTimeout(() => (copyLabel.value = "Copy to clipboard"), 3000);
    }
  });
};
</script>

<template>
  <h3 style="padding-left: 25px">Share</h3>
  <div class="share-btn">
    <ShareNetwork
      network="messenger"
      :url="selectedData.shareUrl"
      :title="`Lets split this bill: ${formData.paymentName}`"
      :description="`Total price to split: ${formData.totalBill} ${
        countryCurrency[formData.currency]
      }`"
    >
      Messenger
    </ShareNetwork>
    <ShareNetwork
      network="telegram"
      :url="selectedData.shareUrl"
      :title="`Lets split this bill: ${formData.paymentName}`"
      :description="`Total price to split: ${formData.totalBill} ${
        countryCurrency[formData.currency]
      }`"
    >
      Telegram
    </ShareNetwork>
    <ShareNetwork
      network="whatsapp"
      :url="selectedData.shareUrl"
      :title="`Lets split this bill: ${formData.paymentName}`"
      :description="`Total price to split: ${formData.totalBill} ${
        countryCurrency[formData.currency]
      }`"
    >
      WhatsApp
    </ShareNetwork>
    <ShareNetwork
      network="email"
      :url="selectedData.shareUrl"
      :title="`Lets split this bill: ${formData.paymentName}`"
      :description="`Total price to split: ${formData.totalBill} ${
        countryCurrency[formData.currency]
      }`"
    >
      Email
    </ShareNetwork>
    <br />
    <a @click="doCopy(selectedData.shareUrl)">
      {{ copyLabel }}
    </a>
  </div>
</template>

<style scoped>
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
