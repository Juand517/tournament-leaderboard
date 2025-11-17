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
  async fetchLeaderboard({ commit }, pageableParams) {
    commit('setLoading', true);
    commit('setError', null);

    try {
      const data = await tournamentService.getLeaderboard(pageableParams);
      commit('setLeaderboard', data.content);
      commit('setPageInfo', {
        totalElements: data.totalElements,
        totalPages: data.totalPages,
      });
    } catch (error) {
      commit('setError', error.message || 'Error loading leaderboard');
      commit('clearLeaderboard');
    } finally {
      commit('setLoading', false);
    }
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
