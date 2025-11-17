import Vue from 'vue';
import Vuex from 'vuex';
import leaderboard from './leaderboard';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    leaderboard,
  },
});
