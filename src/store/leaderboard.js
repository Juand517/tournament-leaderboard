import tournamentService from '@/services/tournamentService';

// Guarda los datos que reflejan el estado actual del leaderboard:
const state = {
  participants: [],   // Lista actual
  totalElements: 0,   // Total de participantes
  totalPages: 0,      // total páginas
  loading: false,      // Cargando datos o no
  error: null,        // Mensaje de error
};

const mutations = {
  setLeaderboard(state, participants) {
    state.participants = participants;
  },
  setPageInfo(state, { totalElements, totalPages }) {
    state.totalElements = totalElements;
    state.totalPages = totalPages;
  },
  setLoading(state, value) {
    state.loading = value;
  },
  setError(state, error) {
    state.error = error;
  },
  clearLeaderboard(state) {
    state.participants = [];
    state.totalElements = 0;
    state.totalPages = 0;
   
  },
};

const actions = {
  async fetchLeaderboard({ commit }, { page, size, sort, filters }) {
    commit('setLoading', true);
    commit('setError', null);

    try {
      let data;

      // Detectar si hay filtros activos
      const hasFilters =
        filters &&
        (
          (filters.username && filters.username.trim() !== "") ||
          (filters.country && filters.country.trim() !== "")
        );

      if (hasFilters) {
        // 👇 Usa el servicio filtrado
        data = await tournamentService.getFilteredLeaderboard(filters, {
          page,
          size,
          sort,
        });
      } else {
        // 👇 Sin filtros → leaderboard normal
        data = await tournamentService.getLeaderboard({
          page,
          size,
          sort,
        });
      }
      commit('setLeaderboard', data.content);
      commit('setPageInfo', {
        totalElements: data.totalElements,
        totalPages: data.totalPages,
      });
    } catch (error) {
      commit('setError', error.message || 'Error loading leaderboard');
      // Opcional: si no quieres perder la tabla anterior, comenta esta línea:
      // commit('clearLeaderboard');
    } finally {
      commit('setLoading', false);
    }
  },

  async fetchCountries() {
    return await tournamentService.getCountries();
  },
};

const getters = {
  leaderboardParticipants: (state) => state.participants,
  isLoading: (state) => state.loading,
  hasError: (state) => !!state.error,
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
