<template>
  <div class="vector-clock">
    <div class="line" v-for="(line, index) of handledTime" :key="'l' + index">
      <span class="title">Line {{ index }}</span>
      <div
        class="event"
        v-for="(event, eventIndex) of line"
        :key="eventIndex + event.name + index"
        :style="{ visibility: event.time === undefined ? 'hidden' : 'visible' }"
        :title="event.time"
      >
        {{ event.name }} - {{ event.time }}
      </div>
    </div>
    <input class="line-index" type="number" v-model="newLineIndex" placeholder="Line index" />
    <input type="text" v-model="newEventName" placeholder="Event name" />
    <button class="add" :disabled="!newEventName || newLineIndex === null" @click="add()">ADD EVENT</button>

    <input class="from" type="text" v-model="from" placeholder="From relation" />
    <input class="to" type="text" v-model="to" placeholder="To relation" />
    <button class="add-relation" :disabled="!from || !to" @click="addRelation()">ADD RELATION</button>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

import { VectorClock as Vector, Line } from "@/utils/clock";

@Component({
  components: {},
})
export default class VectorClock extends Vue {
  /* DATA */

  private vector: Vector = new Vector();

  public newLineIndex: number = null as any;
  public newEventName = "";

  public from = "";
  public to = "";

  /* GETTERS */

  get time(): Line<number[]>[] {
    return this.vector.time;
  }

  get handledTime(): Line<number[]>[] {
    return this.time.map((line, indexone) => {
      const result = [] as Line<number[]>;
      const to = line[line.length - 1]?.time?.[indexone] ?? -1;

      for (let i = 0; i <= to; i++) {
        const l = line.find((l) => l.time?.[indexone] === i);
        result.push(l ?? { time: undefined, name: "bobo" });
      }

      return result;
    });
  }

  /* LIFE CYCLE */

  created() {
    this.vector.addEvent(0, "a");
    this.vector.addEvent(1, "b");
    this.vector.addEvent(2, "c");
    this.vector.addEvent(2, "d");
    this.vector.addEvent(2, "e");
    this.vector.addEvent(2, "f");
    this.vector.addEvent(0, "g");
    this.vector.addRelation("f", "g");
  }

  /* METHODS */

  add() {
    this.vector.addEvent(this.newLineIndex, this.newEventName);
    this.newEventName = "";
    this.newLineIndex = undefined as any;
  }

  addRelation() {
    this.vector.addRelation(this.from, this.to);
    this.from = "";
    this.to = "";
  }
}
</script>

<style lang="scss" scoped>
.vector-clock {
  display: flex;
  flex-direction: column;
  justify-content: center;

  width: 100%;
  height: 100%;

  > .line {
    height: 100px;
    border: 1px solid black;

    display: flex;
    flex-direction: row;
    align-items: center;

    > .title {
      margin: 5px;
      text-decoration: underline;
    }

    > .event {
      margin: 10px;
      width: 100px;
      height: 50px;

      display: flex;
      justify-content: center;
      align-items: center;
      border: 1px solid black;
    }
  }

  .line-index, .from {
    margin-top: 30px;
  }
}
</style>
