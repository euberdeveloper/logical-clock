<template>
  <div class="vector-clock">
    <vector-clock />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import VectorClock from "@/components/pages/VectorClock.vue";

@Component({
  components: {
    VectorClock,
  },
})
export default class VectorClockView extends Vue {}
</script>
