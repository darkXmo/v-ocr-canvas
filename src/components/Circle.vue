<template>
  <div class="target">
    <img ref="imgRef" class="img" src="/1.jpg" @load="handleLoad" />
    <div id="container"></div>
  </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, ref } from 'vue';
import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';
const imgRef = ref<HTMLImageElement>();
type EventParams = [type: keyof DocumentEventMap, func: (e: any) => void];
let eventList: EventParams[] = [];
let stage: Konva.Stage;
const handleLoad = () => {
  const img = imgRef.value as HTMLImageElement;
  const width = img.width;
  const height = img.width;

  const stage = new Konva.Stage({
    container: 'container',
    width: width,
    height: height,
  });

  const layer = new Konva.Layer();
  stage.add(layer);

  const tr = new Konva.Transformer({
    nodes: [],
    // ignore stroke in size calculations
    ignoreStroke: true,
    // manually adjust size of transformer
    padding: 1,
    keepRatio: false,
    anchorCornerRadius: 4,
  });
  layer.add(tr);

  // 新建框
  const selectionRectangle = new Konva.Rect({
    fill: 'rgba(0,0,255,0.5)',
    visible: false,
  });
  layer.add(selectionRectangle);

  let x1: number, y1: number, x2: number, y2: number;
  stage.on('mousedown touchstart', (e: KonvaEventObject<MouseEvent>) => {
    // do nothing if we mousedown on any shape
    if (e.target !== stage || !e.evt.ctrlKey) {
      return;
    }
    e.evt.preventDefault();
    const position = stage.getPointerPosition();
    if (position) {
      x1 = position.x;
      y1 = position.y;
      x2 = position.x;
      y2 = position.y;
    }

    selectionRectangle.visible(true);
    selectionRectangle.width(0);
    selectionRectangle.height(0);
  });

  stage.on('mousemove touchmove', (e: KonvaEventObject<MouseEvent>) => {
    // do nothing if we didn't start selection
    if (!selectionRectangle.visible()) {
      return;
    }
    e.evt.preventDefault();
    const position = stage.getPointerPosition();
    if (position) {
      x2 = position.x;
      y2 = position.y;
    }

    selectionRectangle.setAttrs({
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1),
    });
  });
  let transforming: boolean = false;
  stage.on('mouseup touchend', (e) => {
    // do nothing if we didn't start selection
    if (!selectionRectangle.visible()) {
      return;
    }
    e.evt.preventDefault();
    // update visibility in timeout, so we can check it in click event
    setTimeout(() => {
      selectionRectangle.visible(false);
    });

    const randomHex = () =>
      `#${Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padEnd(6, '0')}`;

    const rect = new Konva.Rect({
      x: selectionRectangle.x(),
      y: selectionRectangle.y(),
      width: selectionRectangle.width(),
      height: selectionRectangle.height(),
      draggable: true,
      fill: `${randomHex()}33`,
      stroke: '#2d3137',
      strokeWidth: 2,
      name: 'rect',
    });
    rect.on('transform', () => {
      rect.setAttrs({
        width: Math.max(rect.width() * rect.scaleX(), 5),
        height: Math.max(rect.height() * rect.scaleY(), 5),
        scaleX: 1,
        scaleY: 1,
      });
      transforming = true;
    });
    rect.on('dragend', () => {
      console.log([
        Math.round(rect.x()),
        Math.round(rect.y()),
        Math.round(rect.x() + rect.width()),
        Math.round(rect.y() + rect.height()),
      ]);
    });
    console.log([
      Math.round(rect.x()),
      Math.round(rect.y()),
      Math.round(rect.x() + rect.width()),
      Math.round(rect.y() + rect.height()),
    ]);
    rect.on('move', () => {
      console.log('move');
    });
    layer.add(rect);
    tr.nodes([rect]);
  });

  // clicks should select/deselect shapes
  stage.on('click tap', function (e: KonvaEventObject<MouseEvent>) {
    // if we are selecting with rect, do nothing
    if (selectionRectangle.visible()) {
      return;
    }

    // if click on empty area - remove all selections
    if (e.target === stage) {
      tr.nodes([]);
      return;
    }

    // do nothing if clicked NOT on our rectangles
    if (!e.target.hasName('rect')) {
      return;
    }

    tr.nodes([e.target]);
  });

  stage.on('mouseup', (e: KonvaEventObject<MouseEvent>) => {
    if (tr.nodes().length > 0 && transforming) {
      const node = tr.nodes()[0];
      console.log([
        Math.round(node.x()),
        Math.round(node.y()),
        Math.round(node.x() + node.width()),
        Math.round(node.y() + node.height()),
      ]);
      transforming = false;
    }
  });

  const event: EventParams = [
    'keyup',
    (e: KeyboardEvent) => {
      if (e.key === 'Delete') {
        tr.nodes().forEach((ele) => {
          ele.destroy();
        });
        tr.nodes([]);
      }
    },
  ];
  document.addEventListener(...event);
};
onBeforeUnmount(() => {
  eventList.forEach((ele) => {
    document.removeEventListener(...ele);
  });
  if (stage) {
    stage.destroy();
  }
});
</script>

<style lang="less" scoped>
div.target {
  position: relative;
  div#container {
    top: 0;
    z-index: 9;
    position: absolute;
  }
}
</style>
