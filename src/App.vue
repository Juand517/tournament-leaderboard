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
