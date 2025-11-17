<template>
  <v-card class="tournament-leaderboard pa-4">
    <!-- ✅ TODO 1: Card title -->
    <v-card-title class="justify-center text-h5 font-weight-bold">
      🏆 Tournament Leaderboard
    </v-card-title>

    <v-row dense class="mb-4">
      <v-col cols="12" sm="4">
        <v-text-field
          v-model="filters.username"
          label="Search by username"
          prepend-inner-icon="mdi-magnify"
          outlined
          dense
        />
      </v-col>

      <v-col cols="12" sm="4">
        <v-select
          v-model="filters.country"
          :items="countries"
          item-text="name"
          item-value="code"
          label="Country"
          outlined
          dense
          clearable
        />
      </v-col>

      <v-col cols="12" sm="4" class="d-flex justify-center">
        <v-btn
          color="secondary"
          :disabled="!filters.username && !filters.country"
          @click="clearFilters"
        >
          Clear Filters
        </v-btn>
      </v-col>
    </v-row>
    <!-- <transition name="fade-slide"> -->
    <div v-if="loading" class="text-center my-6">
      <v-progress-circular indeterminate color="primary" size="40" />
      <div class="mt-2 grey--text">Loading leaderboard data...</div>
    </div>

    <!-- ✅ TODO 4: Error state -->
    <v-alert
      v-else-if="error"
      type="error"
      outlined
      prominent
      class="my-4"
      dismissible
    >
      {{ error }}
      <v-btn color="error" small text @click="retryLoad">Retry</v-btn>
    </v-alert>

    <!-- ✅ TODO 5: Empty state -->
    <v-alert
      v-else-if="!participants.length"
      type="info"
      outlined
      icon="mdi-information"
      class="my-4"
    >
      No participants found. Try adjusting your filters.
    </v-alert>

    <!-- ✅ TODO 6: Participants table -->
    <v-data-table
      :headers="headers"
      :items="participants"
      :loading="loading"
      class="elevation-1"
      disable-pagination
      hide-default-footer
      :aria-label="'Tournament leaderboard table'"
    >
      <!-- Rank Cell -->
      <template slot="item.rank" slot-scope="{ item }">
        <v-icon v-if="item.rank === 1" color="amber darken-2">mdi-crown</v-icon>
        <v-icon v-else-if="item.rank === 2" color="blue-grey lighten-1"
          >mdi-crown-outline</v-icon
        >
        <v-icon v-else-if="item.rank === 3" color="brown darken-1"
          >mdi-crown-outline</v-icon
        >
        <span v-else>{{ item.rank }}</span>
      </template>

      <template slot="item.country" slot-scope="{ item }">
        <img :src="getFlagUrl(item.country)" class="flag-img" alt="flag" />
        {{ item.countryName }}
      </template>

      <!-- Score Cell -->
      <template slot="item.score" slot-scope="{ item }">
        {{ formatScore(item.score) }}
      </template>
    </v-data-table>
    <!-- </transition> -->

    <!-- ✅ TODO 7: Pagination controls -->

    <v-card-actions class="justify-space-between flex-wrap mt-4">
      <span class="grey--text text--darken-1">
        Showing {{ pageStart }}–{{ pageEnd }} of {{ totalElements }} results
      </span>

      <div class="d-flex align-center">
        <!-- Botón Anterior -->
        <v-btn icon @click="goPrevPage" :disabled="loading || isFirstPage">
        </v-btn>

        <!-- Paginación -->
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          @input="changePage"
          :disabled="loading"
          color="primary"
        />

        <!-- Botón Siguiente -->
        <v-btn icon @click="goNextPage" :disabled="loading || isLastPage">
          <!-- <v-icon>mdi-chevron-right</v-icon> -->
        </v-btn>
      </div>
    </v-card-actions>
  </v-card>
</template>

<script>
import { mapState, mapGetters, mapActions } from "vuex";

export default {
  name: "TournamentLeaderboard",
//en data se definen todas la variables aqu
  data() {
    return {
      headers: [
        { text: "Rank", value: "rank" },
        { text: "Username", value: "username" },
        { text: "Country", value: "country" },
        { text: "Score", value: "score" },
      ],

      filters: { username: "", country: "" },
      countries: [],
      pageableParams: {
        page: 0,
        size: 10,
        sort: { value: "score", order: "desc" },
      },
      currentPage: 1,
      debounceTimer: null,
    };
  },

  computed: {
    ...mapState("leaderboard", [
      "totalElements",
      "totalPages",
      "error",
      "loading",
    ]),
    ...mapGetters("leaderboard", ["leaderboardParticipants"]),

    participants() {
      return this.leaderboardParticipants;
    },
    pageStart() {
      return this.participants.length
        ? this.pageableParams.page * this.pageableParams.size + 1
        : 0;
    },
    pageEnd() {
      return Math.min(
        (this.pageableParams.page + 1) * this.pageableParams.size,
        this.totalElements
      );
    },
    isFirstPage() {
      return this.currentPage <= 1;
    },

    isLastPage() {
      return this.currentPage >= this.totalPages || this.totalPages === 0;
    },
  },

  watch: {
    // Username search con debounce (500ms)
    "filters.username": {
      handler() {
        // Guardar filtros en localStorage
        localStorage.setItem(
          "leaderboardFilters",
          JSON.stringify(this.filters)
        );

        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          this.applyFilters();
        }, 500);
      },
    },

    "filters.country"() {
      // Guardar filtros en localStorage
      localStorage.setItem("leaderboardFilters", JSON.stringify(this.filters));
      this.applyFilters();
    },

    currentPage(newVal) {
      localStorage.setItem("leaderboardPage", String(newVal));
    },
  },

  mounted() {
    const savedFilters = localStorage.getItem("leaderboardFilters");
    if (savedFilters) {
      try {
        this.filters = JSON.parse(savedFilters);
      } catch (e) {
        console.warn("Could not parse saved filters", e);
      }
    }

    // Recuperar página guardada
    const savedPage = localStorage.getItem("leaderboardPage");
    if (savedPage) {
      const pageNumber = parseInt(savedPage, 10);
      if (!isNaN(pageNumber) && pageNumber > 0) {
        this.currentPage = pageNumber;
        this.pageableParams.page = pageNumber - 1;
      }
    }

    this.loadCountries();
    this.loadLeaderboard();
  },

  methods: {
    ...mapActions("leaderboard", ["fetchLeaderboard"]),

    async loadLeaderboard() {
      await this.fetchLeaderboard({
        page: this.pageableParams.page,
        size: this.pageableParams.size,
        sort: this.pageableParams.sort,
        filters: this.filters,
      });
    },

    async loadCountries() {
      try {
        this.countries = await this.$store.dispatch(
          "leaderboard/fetchCountries"
        );
      } catch (err) {
        console.warn("Could not load countries", err);
      }
    },

    async applyFilters() {
      this.pageableParams.page = 0;
      this.currentPage = 1;
      await this.loadLeaderboard();
    },

    clearFilters() {
      this.filters = { username: "", country: "" };
      this.pageableParams.page = 0;
      this.currentPage = 1;
      this.loadLeaderboard();
    },

    changePage(page) {
      if (page < 1 || page > this.totalPages) return;

      this.pageableParams.page = page - 1;
      this.currentPage = page;
      this.loadLeaderboard();
    },

    goPrevPage() {
      if (!this.isFirstPage && !this.loading) {
        this.changePage(this.currentPage - 1);
      }
    },

    goNextPage() {
      if (!this.isLastPage && !this.loading) {
        this.changePage(this.currentPage + 1);
      }
    },
    // ...mapMutations(["setError"]),
    retryLoad() {
      this.loadLeaderboard();
      // this.setError(null);
    },

    getFlagUrl(code) {
      if (!code) return "";
      return `https://flagcdn.com/24x18/${code.toLowerCase()}.png`;
    },

    formatScore(score) {
      return Math.round(score).toLocaleString();
    },
  },

  beforeDestroy() {
    clearTimeout(this.debounceTimer);
  },
};
</script>
<style scoped>
.tournament-leaderboard {
  max-width: 900px;
  margin: auto;
}

/* Rank badges for top 3 */
.rank-badge {
  display: inline-block;
  width: 32px;
  height: 32px;
  line-height: 32px;
  border-radius: 50%;
  text-align: center;
  font-weight: bold;
  color: black;
}

.rank-1 {
  background-color: gold;
  color: black;
}
.rank-2 {
  background-color: silver;
  color: black;
}
.rank-3 {
  background-color: #cd7f32;
  color: white;
}

table tr:hover {
  background-color: #f9f9f9;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}

.fade-slide-enter,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.flag-img {
  width: 22px;
  height: 16px;
  object-fit: cover;
  /* margin-right: 6px; */
  border: 1px solid #ddd;
}

</style>
