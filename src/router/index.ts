import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';

import Home from '@/views/HomeView.vue';
import LamportClock from '@/views/LamportClockView.vue';
import VectorClock from '@/views/VectorClockView.vue';

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/lamport-clock',
    name: 'lamport-clock',
    component: LamportClock
  },
  {
    path: '/vector-clock',
    name: 'vector-clock',
    component: VectorClock
  }
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
});

export default router;
