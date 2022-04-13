<template>
  <div class="lamport-clock">
    <div class="line" v-for="(line, index) of handledTime" :key="'l' + index">
      <span class="title">Line {{ index }}</span>
      <div
        class="event"
        :class="{ selected: event.name === selected }"
        v-for="(event, eventIndex) of line"
        :key="eventIndex + event.name + index"
        :style="{ visibility: event.time === undefined ? 'hidden' : 'visible' }"
        :title="event.time"
        @click="selectEvent(event.name)"
        @dblclick="remove(event.name)"
      >
        {{ event.name }} - {{ event.time }}
        <div class="arrow" v-if="event.causedBy">
          <div>
            <svg width="100" height="100"><line x1="0" y1="0" stroke="black"
              :x2="locateEventDifference(event.causedBy, index, eventIndex)[1]"
              :y2="locateEventDifference(event.causedBy, index, eventIndex)[0]"
            /></svg>
          </div>
        </div>
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

import { LamportClock as Lamport, Line } from "@/utils/clock";

@Component({
  components: {},
})
export default class LamportClock extends Vue {
  /* DATA */

  private lamport: Lamport = new Lamport();

  public newLineIndex: number = null as any;
  public newEventName = "";

  public from = "";
  public to = "";

  public selected: string | null = null;

  /* GETTERS */

  get time(): Line<number>[] {
    return this.lamport.time;
  }

  get handledTime(): Line<number>[] {
    return this.time.map((line) => {
      const result = [] as Line<number>;
      const to = line[line.length - 1]?.time ?? -1;

      for (let i = 0; i <= to; i++) {
        const l = line.find((l) => l.time === i);
        result.push(l ?? { time: undefined, name: "bobo" });
      }

      return result;
    });
  }

  /* LIFE CYCLE */

  created() {
    this.lamport.addEvent(0, "a");
    this.lamport.addEvent(1, "b");
    this.lamport.addEvent(2, "c");
    this.lamport.addEvent(2, "d");
    this.lamport.addEvent(2, "e");
    this.lamport.addEvent(2, "f");
    this.lamport.addEvent(0, "g");
    this.lamport.addRelation("f", "g");
  }

  /* METHODS */

  add() {
    this.lamport.addEvent(this.newLineIndex, this.newEventName);
    this.newEventName = "";
    this.newLineIndex = undefined as any;
  }

  addRelation() {
    this.lamport.addRelation(this.from, this.to);
    this.from = "";
    this.to = "";
  }

  selectEvent(name: string) {
    if (this.selected === null) {
      this.selected = name;
    } else {
      if (this.selected !== name) {
        this.lamport.addRelation(this.selected, name);
      }
      this.selected = null;
    }
  }

  locateEventDifference(name: string, index: number, eventIndex: number) {
    const r = this.lamport.locateEvent(name);
    if (!r) return [0,0];
    return [ 
      (r[0] - index) * 101,
      (r[1] -  eventIndex) * 70
    ];
  }

  remove(name: string) {
    this.lamport.removeEvent(name);
  }
}
</script>

<style lang="scss" scoped>
.lamport-clock {
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
      width: 50px;
      height: 50px;

      display: flex;
      justify-content: center;
      align-items: center;
      border: 1px solid black;
      background-color: white;
    }
  }

  .line-index,
  .from {
    margin-top: 30px;
  }

  .selected {
    background-color: red !important;
  }
}

.arrow {
  position: absolute;
  z-index: -100;
  > div {
    top: 50px;
    left: 50px;
    position: relative;
  }
}

svg {
  overflow: visible;
}
</style>
