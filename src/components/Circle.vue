<template>
  <div class="target">
    <img ref="imgRef" class="img" src="/1.jpg" @load="handleLoad" />
    <div id="container"></div>
    <div class="tools">
      <ul>
        <li>
          <button @click="zoomIn">+</button>
        </li>
        <li><button @click="zoomOut">-</button></li>
        <li><button @click="showAllRect">=</button></li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted } from 'vue';
import logic from './konva-service';
const { clear, zoomIn, zoomOut, handleLoad, imgRef, getAllRect } = logic();
defineExpose({ zoomIn, zoomOut, getAllRect });
const showAllRect = () => {
  getAllRect();
};
onBeforeUnmount(clear);
</script>

<style lang="less" scoped>
div.target {
  position: relative;
  overflow: auto;
  height: 100vh;
  width: 100vw;
  div#container {
    top: 0;
    z-index: 9;
    position: absolute;
  }
  div.tools {
    top: 0;
    left: 0;
    z-index: 10;
    cursor: pointer;
    position: fixed;
    > ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  }
}
</style>
