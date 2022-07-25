<script setup lang="ts">
import { useRoute } from "vue-router";
import { doc, getDoc } from "firebase/firestore";
// config added localy
import { db } from "../firebase";

import { ref, onMounted } from "vue";
const route = useRoute();
const error = ref<string>();

onMounted(async () => {
  const dataId = route.params.dataId as string;
  const index = route.params.index as string;

  const docRef = doc(db, "short", dataId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    window.location.replace(`/payMe/${docSnap.data().data}/${index}`);
    return;
  }
  error.value = "Payment data not found.";
});
</script>

<template>
  <div class="shortView">
    <h3 v-if="!error">Loading data...</h3>
    <h3 v-else>{{ error }}</h3>
  </div>
</template>

<style scoped>
.shortView {
  padding: 50px 0;
}
.shortView h3 {
  text-align: center;
  color: #ffffff;
}
</style>
