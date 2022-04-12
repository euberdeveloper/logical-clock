<template>
  <div class="lamport-clock">
    <lamport-clock />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import LamportClock from "@/components/pages/LamportClock.vue";

@Component({
  components: {
    LamportClock,
  },
})
export default class LamportClockView extends Vue {}
</script>
