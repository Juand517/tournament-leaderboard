<template>
  <v-card class="tournament-leaderboard neon-card pa-4">
    <div class="leaderboard-banner">🏆 TOURNAMENT LEADERBOARD 🏆</div>

    <v-row v-if="!error" dense class="mb-4 mt-6">

      <v-col cols="12" sm="4">
        <v-text-field
          class="filter-input"
          v-model="filters.username"
          label="Search by username"
          prepend-inner-icon="mdi-magnify"
          outlined
          dense
        />
      </v-col>

      <v-col cols="12" sm="4">
        <v-select
          class="filter-input"
          v-model="filters.country"
          :items="countries"
          item-text="name"
          item-value="code"
          label="Country"
          outlined
          dense
          clearable
        >
          <template v-slot:item="{ item }">
            <div class="d-flex align-center">
              <img :src="getFlagUrl(item.code)" class="flag-img" alt="" />
              <span>{{ item.name }}</span>
            </div>
          </template>
        </v-select>
      </v-col>

      <v-col cols="12" sm="4" class="d-flex justify-center">
        <v-btn
          class="clear-btn"
          :disabled="!filters.username && !filters.country"
          :style="{
            visibility:
              filters.username || filters.country ? 'visible' : 'hidden',
          }"
          @click="clearFilters"
        >
          Clear Filters
        </v-btn>
      </v-col>

    </v-row>

    <div v-if="loading" class="text-center my-6">
      <v-progress-circular indeterminate color="primary" size="40" />
      <div class="mt-2 grey--text">Loading leaderboard data...</div>
    </div>

    <v-alert v-else-if="error" type="error" outlined prominent class="my-4">
      {{ error }}
      <v-btn class="retry-btn" small @click="retryLoad">Retry</v-btn>
    </v-alert>

    <v-alert
      v-else-if="!participants.length"
      type="info"
      outlined
      icon="mdi-information"
      class="my-4"
    >
      No participants found. Try adjusting your filters.
    </v-alert>

    <v-data-table
      v-else
      :headers="headers"
      :items="participants"
      :loading="loading"
      class="elevation-1 leaderboard-table"
      disable-pagination
      hide-default-footer
      :aria-label="'Tournament leaderboard table'"
    >
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
      <template slot="item.username" slot-scope="{ item }">
        <img
          v-if="item.avatar"
          :src="item.avatar"
          alt="avatar"
          class="user-avatar"
        />
        {{ item.username }}
      </template>
      <template slot="item.country" slot-scope="{ item }">
        <img :src="getFlagUrl(item.country)" class="flag-img" alt="flag" />
        {{ item.countryName }}
      </template>

      <template slot="item.score" slot-scope="{ item }">
        {{ formatScore(item.score) }}
      </template>
    </v-data-table>


    <v-card-actions v-if="!error" class="justify-space-between flex-wrap mt-4">
      <span class="grey--text text--darken-1">
        Showing {{ pageStart }}–{{ pageEnd }} of {{ totalElements }} results
      </span>

      <div class="d-flex align-center">
        <v-pagination
          class="custom-pagination"
          v-model="currentPage"
          :length="totalPages"
          @input="changePage"
          :disabled="loading"
        />
      </div>
    </v-card-actions>
  </v-card>
</template>

<script>
import { mapState, mapGetters, mapActions } from "vuex";

export default {
  name: "TournamentLeaderboard",

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
  margin: 24px auto;
}

table tr:hover {
  background-color: #f9f9f9;
}

.flag-img {
  width: 22px;
  height: 16px;
  object-fit: cover;
  margin-right: 6px;
  border: 1px solid #ddd;
}

.user-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  vertical-align: middle;
}

/* lead board table */
.leaderboard-banner {
  background: linear-gradient(180deg, #3fa9ff, #1768e5);
  padding: 14px 32px;
  font-size: 22px;
  font-weight: 700;
  color: white;
  text-align: center;
  border-radius: 10px 10px 0 0;
  box-shadow: 0 0 15px rgba(0, 168, 255, 0.6);
  letter-spacing: 1px;
  margin-bottom: 10px;
}

.neon-card.v-card {
  background: rgba(10, 15, 40, 0.8) !important;
  border: 2px solid rgba(80, 120, 255, 0.4);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 25px rgba(80, 120, 255, 0.4) !important;
}

.leaderboard-table ::v-deep tbody tr {
  background: rgb(0, 0, 0) !important;
  border-bottom: 1px solid rgba(98, 255, 7, 0.05);
  transition: background 0.2s ease;
}

.leaderboard-table ::v-deep tbody tr:hover {
  background: rgba(45, 70, 150, 0.6) !important;
}


/* Controles de filtro */
.filter-input >>> .v-input__slot {
  background: rgba(10, 15, 40, 0.9);
  border-radius: 8px;
  border: 1px solid rgba(80, 140, 255, 0.7);
  box-shadow: 0 0 12px rgba(80, 140, 255, 0.35);
}


.filter-input >>> .v-label {
  color: #c7d8ff !important;
  font-weight: 500;
}


.filter-input >>> input {
  color: #ffffff !important;
}


.filter-input >>> .v-input__prepend-inner .v-icon,
.filter-input >>> .v-input__append-inner .v-icon {
  color: #c7d8ff !important;
}


.filter-input >>> .v-select__selections {
  color: #ffffff !important;
}


.filter-input:hover >>> .v-input__slot {
  box-shadow: 0 0 16px rgba(120, 170, 255, 0.7);
}


/* Button clear */
.clear-btn {
  background: rgba(37, 69, 212, 0.8) !important;
  color: #e1e4eb !important;
  border-radius: 8px !important;
  border: 1px solid rgba(6, 97, 255, 0.35) !important;
  text-transform: uppercase;
  font-weight: 600;
  padding: 8px 18px !important;
  letter-spacing: 1px;
  transition: 0.25s ease;
  box-shadow: 0 0 6px rgba(243, 13, 13, 0.25);
}

.clear-btn:hover {
  background: rgba(55, 60, 85, 0.95) !important;
  box-shadow: 0 0 14px rgba(120, 170, 255, 0.55);
  border-color: rgba(150, 200, 255, 0.6) !important;
  transform: translateY(-1px);
}

.clear-btn.v-btn--disabled {
  opacity: 0.4 !important;
  cursor: not-allowed !important;
  box-shadow: none !important;
}


/* Botón RETRY  */
.retry-btn {
  background: rgba(255, 80, 80, 0.15) !important ;
  border: 1px solid rgba(255, 120, 120, 0.5);
  color: #ff8c8c !important ;
  padding: 4px 14px;
  border-radius: 6px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: 0.2s ease;
}

.retry-btn:hover {
  background: rgba(255, 100, 100, 0.3) !important;
  border-color: rgba(255, 150, 150, 0.7) !important;
  color: #ffd2d2 !important;
  box-shadow: 0 0 10px rgba(255, 120, 120, 0.6);
}


.retry-btn:active {
  transform: scale(0.96);
}


/* Estilo para los encabezados de la tabla */
.leaderboard-table >>> .v-data-table-header th {
  color: #ffffff !important; /* azul claro */
  font-size: 15px !important;
  font-weight: 600 !important;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(120, 170, 255, 0.3);
  padding-top: 12px !important;
  padding-bottom: 12px !important;
}

.leaderboard-table >>> .v-data-table-header th:hover {
  color: #b6c4d6 !important;
  text-shadow: 0 0 6px rgba(255, 25, 25, 0.7);
}

.leaderboard-table >>> .v-data-table-header th .v-icon {
  color: #b6c4d6 !important;
}

.leaderboard-table >>> thead tr {
  background: rgb(40, 80, 241) !important;
  backdrop-filter: blur(6px);
}

.leaderboard-table >>> td {
  color: #ffffff !important;
}


/* para redondear la tabla */

.leaderboard-table {
  border-radius: 12px !important;
  overflow: hidden !important;
}

.leaderboard-table >>> .v-data-table__wrapper {
  border-radius: 12px !important;
  overflow: hidden !important;
}

.leaderboard-table >>> thead tr {
  border-radius: 12px !important;
}

.leaderboard-table >>> table {
  border-collapse: separate !important;
  border-spacing: 0 !important;
  border-radius: 12px !important;
}


/* HOVER en la paginación  */
.custom-pagination ::v-deep .v-pagination__item:not(.v-pagination__item--active):hover {
  background-color: #1e88e5 !important; /* azul hover */
  color: #ffffff !important;
  box-shadow: 0 0 8px rgba(30, 136, 229, 0.6);
  transition: 0.2s ease;
}


.custom-pagination ::v-deep .v-pagination__navigation:hover {
  background-color: #1e88e5 !important;
  color: #ffffff !important;
  box-shadow: 0 0 8px rgba(30, 136, 229, 0.6);
  transition: 0.2s ease;
}

</style>
