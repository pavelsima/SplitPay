<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <header>
    <a href="/">
      <img
        alt="Split Pay logo"
        class="logo"
        src="@/assets/logo.png"
        width="400"
      />
    </a>
  </header>

  <RouterView class="content" />

  <div class="footer">
    Created by <a href="https://pavelsima.eu/">Pavel Sima</a> | 2022
  </div>
</template>

<style>
html {
  background: rgb(0,255,81);
  background: linear-gradient(0deg, #00ff51 0%, #01e3aa 100%);
  min-height: -webkit-fill-available;
  height: auto;
}
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;

  font-weight: normal;
}
header {
  text-align: center;
}
.content {
  max-width: 450px;
  margin: auto;
}
.footer {
  color: #ffffff;
  text-align: center;
  padding: 20px;
}
.footer a {
  color: #ffffff;
}
</style>
