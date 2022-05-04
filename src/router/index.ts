import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import PayView from "../views/PayView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/payMe/:data/:index?",
      name: "payMe",
      component: PayView,
    },
  ],
});

export default router;
