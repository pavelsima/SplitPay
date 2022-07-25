import { createApp } from "vue";
import { plugin, defaultConfig } from "@formkit/vue";
import "@formkit/themes/genesis";
import VueSocialSharing from "vue-social-sharing";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

app.use(router);
app.use(VueSocialSharing);
app.use(plugin, defaultConfig);

app.mount("#app");
