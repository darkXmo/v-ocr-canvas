import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';
export interface PointPosition {
  A: { x: number; y: number };
  B: { x: number; y: number };
  C: { x: number; y: number };
  D: { x: number; y: number };
}
export interface RectPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}
function isPointPosition(
  position: Record<string, any>
): position is PointPosition {
  return position.A && position.B && position.C && position.D;
}

export type Position = PointPosition | RectPosition;
export type IdPosition = {
  id?: string;
} & Position;

export type RectForm = { id: string } & Position & {
    fill?: string;
    stroke?: string;
  };

/** 新建Rect */
export const rectItemInit = (
  config: {
    id?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fill?: string;
    stroke?: string;
  },
  callback?: (rect: Konva.Rect) => void
) => {
  const rect = new Konva.Rect({
    ...config,
    draggable: true,
    fill: config.fill ? `${config.fill}33` : `#ffffff33`,
    stroke: config.stroke ?? '#2d3137',
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
    if (callback) {
      callback(rect);
    }
  });
  return rect;
};
/** 新建框 */
export const selectionRectInit = (
  stage: Konva.Stage,
  layer: Konva.Layer,
  tr: Konva.Transformer,
  callback?: (rect: Konva.Rect) => void
) => {
  const selectionRectangle = new Konva.Rect({
    fill: 'rgba(0,0,255,0.5)',
    visible: false,
  });
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
      x: Math.min(x1, x2) / stage.scaleX(),
      y: Math.min(y1, y2) / stage.scaleY(),
      width: Math.abs(x2 - x1) / stage.scaleX(),
      height: Math.abs(y2 - y1) / stage.scaleY(),
    });
  });
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
    const rect = rectItemInit({
      x: selectionRectangle.x(),
      y: selectionRectangle.y(),
      width: selectionRectangle.width(),
      height: selectionRectangle.height(),
    });

    layer.add(rect);
    if (callback) {
      callback(rect);
    }
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

  return selectionRectangle;
};

export const initWindowDrag = (
  stage: Konva.Stage,
  selectionRectangle: Konva.Rect
) => {
  let draggingWindow: boolean = false;
  const draggingContext = {
    x: 0,
    y: 0,
    scrollTop: 0,
    scrollLeft: 0,
  };
  stage.on('mousedown', (e: KonvaEventObject<MouseEvent>) => {
    if (e.target === stage && !e.evt.ctrlKey) {
      // 鼠标拖拽滑动窗口
      draggingWindow = true;
      stage.container().style.cursor = 'grab';
      draggingContext.x = e.evt.screenX;
      draggingContext.y = e.evt.screenY;
      const targetElement = (stage.container() as HTMLDivElement)
        .parentNode as HTMLDivElement;
      draggingContext.scrollTop = targetElement.scrollTop;
      draggingContext.scrollLeft = targetElement.scrollLeft;
      return;
    }
  });

  let timer: NodeJS.Timeout | null;
  stage.on('mousemove', (e: KonvaEventObject<MouseEvent>) => {
    if (!selectionRectangle.visible()) {
      if (draggingWindow) {
        if (timer) {
          return;
        }
        const offsetX = e.evt.screenX - draggingContext.x;
        const offsetY = e.evt.screenY - draggingContext.y;
        const targetElement = (stage.container() as HTMLDivElement)
          .parentNode as HTMLDivElement;
        targetElement.scrollTop = draggingContext.scrollTop - offsetY;
        targetElement.scrollLeft = draggingContext.scrollLeft - offsetX;
        timer = setTimeout(() => {
          timer = null;
        }, 5);
      }
      return;
    }
  });

  stage.on('mouseup touchend', (e) => {
    // do nothing if we didn't start selection
    if (!selectionRectangle.visible()) {
      // 结束鼠标拖拽滑动窗口
      draggingWindow = false;
      stage.container().style.cursor = 'default';
    }
  });
};

export const initDelete = (
  stage: Konva.Stage,
  tr: Konva.Transformer,
  callback?: (rect: Konva.Rect) => void
) => {
  stage.container().tabIndex = 1;
  stage.container().addEventListener(
    'keyup',
    function (e: KeyboardEvent) {
      e.preventDefault();
      if (e.key === 'Delete') {
        tr.nodes().forEach((ele) => {
          ele.destroy();
          if (callback) {
            callback(ele as Konva.Rect);
          }
        });
        tr.nodes([]);
      }
    },
    true
  );
};

export const konvaInit = (
  width: number,
  height: number,
  preRects?: RectForm[]
) => {
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
  const selectionRectangle = selectionRectInit(stage, layer, tr);
  layer.add(selectionRectangle);
  if (preRects) {
    preRects.forEach((item) => {
      if (isPointPosition(item)) {
        // TODO:
      } else {
        // TODO:
        rectItemInit(item);
      }
    });
  }
  initWindowDrag(stage, selectionRectangle);
  initDelete(stage, tr);

  return stage;
};

export const rebuildContainer = (container: HTMLDivElement) => {
  const newElement = container.cloneNode(true);
  container.parentNode?.replaceChild(newElement, container);
  return newElement;
};

export const getAllRectWithPoints = (allRects: Array<Konva.Rect>) => {
  const res = allRects.map<{ item: Konva.Rect } & IdPosition>((item) => ({
    item,
    id: item.id(),
    A: { x: item.x(), y: item.y() },
    B: {
      x: item.x() + item.width() * Math.cos((item.rotation() * Math.PI) / 180),
      y: item.y() + item.width() * Math.sin((item.rotation() * Math.PI) / 180),
    },
    C: {
      x:
        item.x() +
        item.width() * Math.cos((item.rotation() * Math.PI) / 180) -
        item.height() * Math.sin((item.rotation() * Math.PI) / 180),
      y:
        item.y() +
        item.width() * Math.sin((item.rotation() * Math.PI) / 180) +
        item.height() * Math.cos((item.rotation() * Math.PI) / 180),
    },
    D: {
      x: item.x() - item.height() * Math.sin((item.rotation() * Math.PI) / 180),
      y: item.y() + item.height() * Math.cos((item.rotation() * Math.PI) / 180),
    },
  }));
  return res;
};
