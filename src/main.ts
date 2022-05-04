import { createApp } from "vue";
import { createPinia } from "pinia";
import { plugin, defaultConfig } from '@formkit/vue'
import '@formkit/themes/genesis';
import VueSocialSharing from 'vue-social-sharing'

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(VueSocialSharing);
app.use(plugin, defaultConfig);

app.mount("#app");
