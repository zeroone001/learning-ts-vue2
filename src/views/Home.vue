<template>
  <div class="home">
    <!-- <img alt="Vue logo" src="../assets/logo.png"> -->
    <!-- <HelloWorld msg="Welcome to Your Vue.js + TypeScript App"/> -->
    <ul>
      <!-- <li v-for="(item, index) in list" :key="index">
        {{item.age}}: {{ item.text }}
      </li> -->
      <todo 
        v-for="(item, index) in list" 
        :key="index"
        :item="item"
        :num="item.age"
        @handleSave="handleSave"
      ></todo>
    </ul>
  </div>
</template>

<script lang="ts">
// 装饰器
import { Component, Vue } from 'vue-property-decorator';
import HelloWorld from '@/components/HelloWorld.vue'; // @ is an alias to /src
import Todo from '@/components/todo';
import { State, Mutation } from 'vuex-class';

interface Item {
    text: string;
    age: number;
}

@Component({
  name: 'Home',
  components: {
    HelloWorld,
    Todo,
  },
})

export default class Home extends Vue {

  @State('todoLists') public list!: Item[];
  // public list = [
  //   {
  //     text: 'qwe',
  //     age: 1,
  //   },
  //   {
  //     text: 'asd',
  //     age: 2,
  //   },
  // ];
  public editIndex = -1;

  public handleSave(item: string): void {
    console.log(item);
  }
}
</script>
