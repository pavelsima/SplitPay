import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import PayView from "../views/PayView.vue";
import ShortView from "../views/ShortView.vue";
import AboutView from "../views/AboutView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/about",
      name: "about",
      component: AboutView,
    },
    {
      path: "/payMe/:data/:index?",
      name: "payMe",
      component: PayView,
    },
    {
      path: "/short/:dataId/:index?",
      name: "short",
      component: ShortView,
    },
  ],
});

export default router;
