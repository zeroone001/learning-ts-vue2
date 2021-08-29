import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    todoLists: [
      {
        text: 'qwe',
        age: 1,
      },
      {
        text: 'asd',
        age: 2,
      },
    ],
  },
  mutations: {
  },
  actions: {
  },
  modules: {
  },
});
