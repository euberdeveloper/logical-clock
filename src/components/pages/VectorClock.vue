<template>
  <div class="vector-clock">
    <div class="line" v-for="(line, index) of handledTime" :key="'l' + index">
      <span class="title">Line {{numToSSColumn(index)}}</span>
      <div
        class="event"
        :class="{ selected: event.name === selected }"
        v-for="(event, eventIndex) of line"
        :key="eventIndex + event.name + index"
        :style="{ visibility: event.time === undefined ? 'hidden' : 'visible' }"
        :title="event.time"
        @click="selectEvent(event.name)"
        @dblclick="remove(event.name)"
        @contextmenu="removeRelation(event.name)"
      >
        {{ event.name }} - {{ event.time }}
        <div class="arrow" v-if="event.causedBy">
          <div>
            <svg width="100" height="100">
              <line
                x1="0"
                y1="0"
                stroke="black"
                :x2="locateEventDifference(event.causedBy, index, eventIndex)[1]"
                :y2="locateEventDifference(event.causedBy, index, eventIndex)[0]"
              />
            </svg>
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

    <input class="line-index" type="number" v-model="bestiaLineIndex" placeholder="Line index" />
    <input class="how-many-index" type="number" v-model="howMany" placeholder="How many events" />
    <button class="add" :disabled="!howMany || bestiaLineIndex === null" @click="addMany()">ADD MANY EVENTS</button>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

import { VectorClock as Vector, Line } from "@/utils/clock";
// import { partialsort } from "@/utils/partialOrder";

@Component({
  components: {},
})
export default class VectorClock extends Vue {
  /* DATA */

  private vector: Vector = new Vector();

  public newLineIndex: number = null as any;
  public newEventName = "";

  public bestiaLineIndex: number = null as any;
  public howMany = 0;

  public from = "";
  public to = "";

  

  public selected: string | null = null;

  /* GETTERS */

  get time(): Line<number[]>[] {
    return this.vector.time;
  }

  get handledTime(): Line<number[]>[] {
    const orTimes = this.time.flat();
    let el = this.time
      .map((t, i) => {
        return t.map((x) => {
          const newTime = [...(x.time as number[])];
          newTime[i]--;
          return { ...x, time: newTime, orIndex: i };
        });
      })
      .flat();

    const maxTime = Math.max(...orTimes.map((x) => x.time ?? []).flat()) + 2;

    const resLines = this.time.map((_) => []) as Line<number[]>[];
    for (let i = 0; i < maxTime; i++) {
      const sel = el.filter((x) => x.time.every((n) => n < i));
      el = el.filter((x) => !sel.includes(x));

      if (sel.length >= 0) {
        let tempLines = this.time.map((_) => []) as Line<number[]>[];
        sel.forEach((s) => {
          tempLines[s.orIndex].push(s);
        });
        tempLines = tempLines.map((tl, i) => tl.sort((a, b) => (a.time?.[i] as number) - (b.time?.[i] as number)));
        const maxI = Math.max(...tempLines.map((tl) => tl.length));

        if (maxI > 0) {
          for (let i = 0; i < resLines.length; i++) {
            for (let j = 0; j < maxI; j++) {
              const empty = { time: undefined, name: "bobo" };
              resLines[i].push(tempLines[i][j] ? orTimes.find((ot) => ot.name === tempLines[i][j].name) ?? empty : empty);
            }
          }
        }
      }
    }
    return resLines;
    // return this.time.map((line) => {
    //   const result = [] as Line<number[]>;
    // let sortMap: any[] = partialsort(this.time.flat(), (x, y) => {
    //     if ((x.time?.[0] as number) <= y?.[0] && (x.time?.[1] as number) <= y?.[1] && (x.time?.[2] as number) <= y?.[2]) {
    //       return -1;
    //     }
    //     if ((x.time?.[0] as number) >= y?.[0] && (x.time?.[1] as number) >= y?.[1] && (x.time?.[2] as number) >= y?.[2]) {
    //       return 1;
    //     }
    //     return 0;
    //   });
    //   sortMap = sortMap.map((el) => el.name);

    //   // console.log(sortMap);
    //   const to = sortMap.length;

    //   for (let i = 0; i <= to; i++) {
    //     const l = line.find((event) => event.name === sortMap[i]);
    //     result.push(l ?? { time: undefined, name: "bobo" });
    //   }

    //   return result;
    // });
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

  removeRelation(name: string) {
    this.vector.removeRelation(name);
  }

  selectEvent(name: string) {
    if (this.selected === null) {
      this.selected = name;
    } else {
      if (this.selected !== name) {
        this.vector.addRelation(this.selected, name);
      }
      this.selected = null;
    }
  }

  locateEvent(name: string) {
    for (let i = 0; i < this.handledTime.length; i++) {
      const x = this.handledTime[i].findIndex((x) => x.name === name);
      if (x >= 0) return [i, x];
    }
    return null;
  }

  locateEventDifference(name: string, index: number, eventIndex: number) {
    const r = this.locateEvent(name);
    if (!r) return [0, 0];
    return [(r[0] - index) * 101, (r[1] - eventIndex) * 120];
  }

  remove(name: string) {
    this.vector.removeEvent(name);
  }

  numToSSColumn(num: number): string {
      num++;
      let s = "",
        t;

      while (num > 0) {
        t = (num - 1) % 26;
        s = String.fromCharCode(65 + t) + s;
        num = ((num - t) / 26) | 0;
      }
      return s || (num + '');
    }

  addMany() {
    
    const label = this.numToSSColumn(this.bestiaLineIndex);
    for (let i = 0; i < this.howMany; i++) {
      this.vector.addEvent(this.bestiaLineIndex, `${label}${i + 1}`);
    }
  }


  /* LIFECYCLE */

  created() {
    const nOfLines = +this.$route.query.lines;
    if (!isNaN(nOfLines)) {
      this.vector = new Vector(nOfLines);
    }
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
