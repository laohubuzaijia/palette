import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import { styleVariableInfo } from '../data'
import _ from 'lodash/lang'
import {
  safeGetValue,
  safeSetValue,
  setCssVariable,
  localStore
} from '../utils'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    themes: [],
    styleVariableInfo,
    mandMobileInfo: '',
    localStoreUnsupport: false,
    css: {}
  },
  mutations: {
    update (state, data) {
      Object.keys(data).map((key) => {
        state[key] = data[key]
      })
    },
    createTheme (state, { themeInfo, variables }) {
      const index = state.themes.length
      const newTheme = {
        data: _.cloneDeep(variables),
        default: _.cloneDeep(variables),
        lastModify: Date.now(),
        index,
        ...themeInfo
      }
      state.themes.push(newTheme)
    },
    deleteTheme (state, index) {
      state.themes.splice(index, 1)
    },
    updateThemeInfo (state, themeInfo) {
      state.themes[themeInfo.themeIndex] = {
        ...state.themes[themeInfo.themeIndex],
        ...themeInfo
      }
    },
    updateThemeVariables (state, options = {}) {
      const { themeIndex, moduleName, itemName, name, value } = options
      const theme = state.themes[themeIndex]
      const variables = safeGetValue(theme, 'data', null)

      if (!theme || !variables) {
        return null
      }
      theme.lastModify = Date.now()
      safeSetValue(variables, `${moduleName}['${itemName}']['${name}']`, value)
      setCssVariable(name, value)
    }
  },
  actions: {
    GET_MAND_MOBILE_RELEASE ({ commit }) {
      return axios.get('https://unpkg.com/mand-mobile@2/package.json' + `?${Date.now()}`)
        .then(res => {
          if (res.status === 200) {
            commit('update', {
              mandMobileInfo: res.data.version
            })
          }
        })
    },
    GET_MAND_MOBILE_VARIABLES ({ commit, state }, { version, type }) {
      if (!version) {
        return
      }
      const variables0 = axios.get(`https://unpkg.com/mand-mobile@${version}/${type}/theme.basic.json`)
      const variables1 = axios.get(`https://unpkg.com/mand-mobile@${version}/${type}/theme.components.json`)
      // const variables0 = axios.get(`/static/theme.basic.json`)
      // const variables1 = axios.get(`/static/theme.components.json`)
      return Promise.all([variables0, variables1])
    },
    GET_MAND_MOBILE_CSS ({ commit, state }, { themeIndex, type }) {
      const theme = state.themes[themeIndex]
      if (!theme) {
        return
      }
      const version = state.themes[themeIndex].version
      return axios.get(`https://unpkg.com/mand-mobile@${version}/${type}/mand-mobile.variable.css`)
    },
    GET_THEMES_STORE ({ commit }) {
      const themes = localStore('MAND_MOBILE_PALETTE_THEMES_2') || localStore('themes')
      if (themes) {
        commit('update', { themes })
      } else if (themes === null) {
        commit('update', {
          localStoreUnsupport: true
        })
      }
      return themes
    },
    SAVE_THEMES_STORE ({ state }) {
      return localStore('MAND_MOBILE_PALETTE_THEMES_2', state.themes)
    }
  }
})

export default store
