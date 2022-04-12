<template>
  <div class="home">
    <router-link to="/lamport-clock">Lamport Clock</router-link>
    <br />
    <router-link to="/vector-clock">Vector Clock</router-link>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class HomeView extends Vue {}
</script>
