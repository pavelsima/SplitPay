<script setup lang="ts">
import { defineProps, toRefs, onMounted, watch } from "vue";
import qrcode from "qrcode";

const props = defineProps({
  data: { type: String, required: true },
  imageId: { type: String, required: true },
});
const { data } = toRefs(props);

const updateQrCode = () => {
  const qrCodeEl = document.getElementById(props.imageId);

  qrcode
    .toDataURL(props.data)
    .then((url: string) => {
      qrCodeEl?.setAttribute("src", url);
    })
    .catch(console.error);
}

watch(data, () => updateQrCode());
onMounted(() => updateQrCode());

</script>

<template>
  <img :id="imageId" />
</template>