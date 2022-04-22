import Konva from 'konva';
import { defineComponent, onBeforeUnmount, PropType, ref } from 'vue';
import './index.less';
import { getAllRectWithPoints, konvaInit, rebuildContainer } from './service';
export default defineComponent({
  name: 'OcrCanvas',
  props: {
    img: {
      type: String,
      required: true,
    },
    showTools: {
      type: Boolean,
      default: true,
    },
    defaultCanvas: {
      // type: Array as PropType<[]>
    },
  },
  expose: ['zoomIn'],
  setup(props, { expose }) {
    const imgRef = ref<HTMLImageElement>();
    let imgWidth: number;

    let times = 4;
    /** 放大 */
    const zoomIn = () => {
      if (times <= 8 && imgWidth * (times / 4) <= 4000) {
        times *= 2;
      }
      imgResize();
    };
    /** 缩小 */
    const zoomOut = () => {
      if (times >= 2) {
        times /= 2;
      }
      imgResize();
    };
    let stage: Konva.Stage;
    /** 放大缩小后调整img和konva的宽高 */
    const imgResize = () => {
      const img = imgRef.value as HTMLImageElement;
      img.width = imgWidth * (times / 4);
      // const reatSet = new Set(getAllRect());
      // clear();
      // stage = konvaInit(img.width, img.height);
      stage.width(img.width);
      stage.height(img.height);
      stage.scale({
        x: times / 4,
        y: times / 4,
      });
    };
    /** 图片加载完成后的回调 */
    const handleLoad = () => {
      const img = imgRef.value as HTMLImageElement;
      imgWidth = img.width;
      stage = konvaInit(img.width, img.height);
    };
    const clear = () => {
      if (stage) {
        const container = stage.container();
        rebuildContainer(container);
        stage.destroy();
      }
    };
    const getAllRect = () => {
      const rects = stage.find('.rect') as Array<Konva.Rect>;
      return getAllRectWithPoints(rects);
    };
    const getItemById = (id: number) => {
      const rects = stage.find('.rect') as Array<Konva.Rect>;
      return rects.find((item) => item._id === id);
    };

    expose({ zoomIn, zoomOut, getAllRect, getItemById });
    const log = () => console.log(getAllRect());
    onBeforeUnmount(clear);

    return () => (
      <div class="ocr-canvas-container">
        <div class="ocr-canvas">
          <img ref={imgRef} class="img" src={props.img} onLoad={handleLoad} />
          <div id="container"></div>
        </div>
        {props.showTools ? (
          <div class="tools">
            <ul>
              <li>
                <button onClick={zoomIn}>+</button>
              </li>
              <li>
                <button onClick={zoomOut}>-</button>
              </li>
              <li>
                <button onClick={log}>?</button>
              </li>
            </ul>
          </div>
        ) : (
          ''
        )}
      </div>
    );
  },
});
