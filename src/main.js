import { createApp, h } from "vue";
import App from "./App.vue";
import router from "./router";

// Virtual scroller
import VueVirtualScroller from "vue3-virtual-scroller";
import "vue3-virtual-scroller/dist/vue3-virtual-scroller.css";

// Bootstrap
import "bootstrap/dist/css/bootstrap.css";
import BootstrapVue3 from "bootstrap-vue-3";
import "bootstrap-vue-3/dist/bootstrap-vue-3.css";

// Bootstrap Icons como componentes Vue
import {
  BIconEye,
  BIconCartPlus,
  BIconCartDash,
  BIconBox,
  BIconGift,
} from "bootstrap-icons-vue";

// Toast
import Toast, { POSITION } from "vue-toastification";
import "vue-toastification/dist/index.css";

// AlertifyJS
import "alertifyjs/build/css/alertify.css";
import "alertifyjs/build/css/themes/default.css";

// -------------------------------------------------------
//   CREAR UNA SOLA APP
// -------------------------------------------------------
const app = createApp(App);

// Plugins
app.use(router);
app.use(VueVirtualScroller);
app.use(BootstrapVue3);

// Custom close button to fix Vue 3.5 incompatibility
const CloseBtn = {
  render: () => h('button', {
    class: ['Toastify__close-button', 'vue-toastification__close-button'],
    type: 'button',
    'aria-label': 'close'
  }, '✖')
};

app.use(Toast, {
  position: POSITION.TOP_RIGHT,
  timeout: 3000,
  closeOnClick: true,
  draggable: true,
  closeButton: CloseBtn,
});

// Registrar iconos globalmente
app.component("BIconEye", BIconEye);
app.component("BIconCartPlus", BIconCartPlus);
app.component("BIconCartDash", BIconCartDash);
app.component("BIconBox", BIconBox);
app.component("BIconGift", BIconGift);

// DB Service
import { dbService } from './services/db';

// Trigger migration
dbService.migrateFromLocalStorage();

// Montar app
app.mount("#app");
