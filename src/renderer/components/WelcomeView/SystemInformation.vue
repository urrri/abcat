<template>
    <v-card>
        <v-card-title class="headline">
            Informations
        </v-card-title>
        <v-divider></v-divider>
        <v-layout row wrap class="pa-3">
            <v-flex xs12 sm6 md4 class="item">
                <div class="name">Chrome:</div>
                <div class="value">{{ chrome }}</div>
            </v-flex>
            <v-flex xs12 sm6 md4 class="item">
                <div class="name">V8:</div>
                <div class="value">{{ v8 }}</div>
            </v-flex>
            <v-flex xs12 sm6 md4 class="item">
                <div class="name">Vue.js:</div>
                <div class="value">{{ vue }}</div>
            </v-flex>
            <v-flex xs12 sm6 md4 class="item">
                <div class="name">Electron:</div>
                <div class="value">{{ electron }}</div>
            </v-flex>
            <v-flex xs12 sm6 md4 class="item">
                <div class="name">Node:</div>
                <div class="value">{{ node }}</div>
            </v-flex>
            <v-flex xs12 sm6 md4 class="item">
                <div class="name">Platform:</div>
                <div class="value">{{ platform }}</div>
            </v-flex>
        </v-layout>
    </v-card>
</template>

<script>
  export default {
    data() {
      console.log(process.versions);
      return {
        chrome: process.versions.chrome,
        electron: process.versions.electron,
        v8: process.versions.v8,
        node: process.versions.node,
        path: '/',
        platform: require('os').platform(),
        vue: require('vue/package.json').version
      };
    }
  };
</script>

<style scoped>
    .item {
        text-align: center;
    }

    .name {
        display: inline;
        font-style: italic;
        font-weight: 300;
        font-size: 16px;
        letter-spacing: 1px;
    }

    .value {
        display: inline;
        font-style: italic;
        font-weight: 600;
        font-size: 18px;
        padding-left: 5px;
    }
</style>
