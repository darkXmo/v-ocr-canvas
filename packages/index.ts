import OcrCanvas from './v-ocr-canvas/v-ocr-canvas';
OcrCanvas.install = function (Vue: any) {
  Vue.component(OcrCanvas.name, OcrCanvas);
};
export default OcrCanvas;
