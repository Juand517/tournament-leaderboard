<template>
  <v-app>
    <TournamentLeaderboard />
  </v-app>
</template>

<script>
import TournamentLeaderboard from './components/TournamentLeaderboard.vue';
export default {
  name: 'App',
  components: { TournamentLeaderboard },
};
</script>


<style>
html, body {

  margin: 0;
  padding: 0;
  height: 100%;
}
#app,
.v-application,
.v-application--wrap {
 background: radial-gradient(circle at top, #2c3d7a 0, #1e2234 45%, #141624 100%) !important;}
</style>
