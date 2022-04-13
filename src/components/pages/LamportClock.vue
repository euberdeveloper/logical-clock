<template>
  <div class="lamport-clock">lamport clock</div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

import { LamportClock as Lamport } from "@/utils/lamport";

@Component({
  components: {},
})
export default class LamportClock extends Vue {
  created() {
    const lamport = new Lamport();
    lamport.setStartingTime(0, 1);
    lamport.setStartingTime(1, 2);
    lamport.addEvent(0, 'a');
    lamport.addEvent(0, 'b');
    lamport.addEvent(0, 'c');
    lamport.addEvent(1, 'd');
    lamport.addEvent(1, 'e');
    lamport.addRelation('e', 'a');
    // console.log(lamport.time);
    (window as any).lamport = lamport;
  }
}
</script>
