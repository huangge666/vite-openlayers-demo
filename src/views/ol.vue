<template>
  <div ref="olMapRef" class="map__x"></div>

  <!-- 弹窗容器 -->
  <div ref="popupComRef" class="popup">
    <!-- 关闭按钮 -->
    <span class="icon-close" @click="closePopup">✖</span>
    <!-- 弹窗内容（展示坐标信息） -->
    <div class="content">{{ detailNode?.data }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Map, View } from "ol"; // 地图实例方法、视图方法
import TileLayer from "ol/layer/Tile"; // 瓦片渲染方法
import XYZ from "ol/source/XYZ";
import "ol/ol.css"; // 地图样式
// 经纬度工具函数
import { fromLonLat, toLonLat, transform } from "ol/proj";
import Overlay from "ol/Overlay";
import {
  // gotoPoint,
  renderOverlayPoint,
  createTrajectory,
} from "../utils/map";

// 点位图片
const imgSrc1 = "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png";
const imgSrc2 =
  "data:image/png;base64,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";

/**
 * 数据部分
 */
const olMapRef = ref();
const olMapData = ref(null);
// 点位弹窗数据
const popupComRef = ref();
const detailNode = ref(null);
const overlayData = ref(null); // 覆盖物实例

// 地图点位
const deviceList = ref([
  { lng: 125.927905, lat: 42.178945, data: "第一个点" },
  { lng: 116.927905, lat: 35.278945, data: "第二个点" },
]);
// 地图点位
const deviceList2 = ref([
  { lng: 100.927905, lat: 22.178945, data: "第三个点" },
  { lng: 84.927905, lat: 42.278945, data: "第四个点" },
]);
const shipTrajectory = ref([
  {
    latitude: 42.178945,
    longitude: 125.927905,
    time: "2023-12-12 12:00:00",
  },
  {
    latitude: 42.278945,
    longitude: 84.927905,
    time: "2023-12-12 14:00:00",
  },
  {
    latitude: 35.278945,
    longitude: 116.927905,
    time: "2023-12-12 15:00:00",
  },
  {
    latitude: 22.178945,
    longitude: 100.927905,
    time: "2023-12-12 16:00:00",
  },
]);

const initOlMap = () => {
  // 注册一个覆盖物
  overlayData.value = new Overlay({
    element: popupComRef.value, // 弹窗标签，在html里
    stopEvent: true, //是否停止事件传播到地图窗口
    autoPan: true, // 如果弹窗在底图边缘时，底图会移动
    autoPanAnimation: {
      // 底图移动动画
      duration: 250,
    },
  });
  olMapData.value = new Map({
    target: olMapRef.value, // 对应页面里 id 为 map 的元素
    layers: [
      // 图层
      new TileLayer({
        source: new XYZ({
          url: "https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
          // url: 'http://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}'
        }),
      }),
    ],
    view: new View({
      // 地图视图
      projection: "EPSG:4326", //EPSG:3857坐标系（投影坐标） EPSG:4326 坐标系（地理坐标）
      // center: [113.927905, 22.578945], // 定义地图显示中心于经度，纬度
      center: [104.2159909375, 33.23568], // 定义地图显示中心于经度，纬度
      minZoom: 4, // 地图缩放最小级别
      zoom: 5, // 地图缩放级别（打开页面时默认级别）
      constrainResolution: true, // 设置缩放级别为整数
      smoothResolutionConstraint: false, // 关闭无级缩放地图
    }),
    overlays: [overlayData.value], // 绑定一个覆盖物
  });

  addPointHandle();
  renderPoint(deviceList.value, imgSrc1);
  renderPoint(deviceList2.value, imgSrc2);
  renderTrajectory(shipTrajectory.value);
};

const renderPoint = (points, pointImg) => {
  const vectorLayer = renderOverlayPoint(points, pointImg);
  //加入点位
  olMapData.value.addLayer(vectorLayer);
};

const renderTrajectory = (coordinate) => {
  const traskvectorValue = createTrajectory(coordinate, "red");
  //加入轨迹
  olMapData.value.addLayer(traskvectorValue);
  // olMapData.value.getView().animate({
  //   // center: transform(
  //   //   [coordinate[0].longitude, coordinate[0].latitude],
  //   //   'EPSG:4326',
  //   //   'EPSG:3857'
  //   // ),
  //   center: [coordinate[0].longitude, coordinate[0].latitude],
  //   duration: 1000,
  //   zoom: 8,
  // });
};

const closePopup = () => {
  overlayData.value.setPosition(undefined);
  detailNode.value = null;
};

//地图点击事件
const addPointHandle = () => {
  // //添加事件
  olMapData.value.on("click", (evt) => {
    console.log("点击了地图：evt", evt);
    //捕获到要素
    let feature = olMapData.value.forEachFeatureAtPixel(
      evt.pixel,
      (feature) => {
        return feature;
      }
    );
    // console.log("点击了地图：feature", feature);
    if (!feature) {
      closePopup();
      return;
    }
    //地图点位点击
    const temp = feature.get("data");
    if (feature && temp) {
      detailNode.value = temp; //点位数据
      /* let popup = new Overlay({
        element: popupComRef.value, //挂载的点位弹窗dom
        autoPan: true,
        // positioning: "center-center", //Popup放置的位置
        stopEvent: true, //是否停止事件传播到地图窗口
        autoPanAnimation: {
          //当Popup超出地图边界时，为了Popup全部可见，地图移动的速度
          duration: 250,
        },
      });
      popup.setPosition(evt.coordinate); //此处为投影坐标
      popup.setPosition(
        transform([temp.lng, temp.lat], "EPSG:4326", "EPSG:3857")
      ); //此处为投影坐标
      popup.setPosition([temp.lng, temp.lat]); //此处为投影坐标
      olMapData.value.addOverlay(popup); */

      overlayData.value.setPosition(evt.coordinate);
    }
  });
};

onMounted(() => {
  initOlMap();
});
</script>
<style scoped lang="less">
.map__x {
  width: 100vw;
  height: 100vh;
  box-sizing: border-box;
  border: 1px solid #eee;
}
.popup {
  width: 300px;
  height: 100px;
  background: #fff;
  position: absolute;
  top: -115px;
  left: -150px;
  box-sizing: border-box;
  padding: 10px;

  &::after {
    content: "";
    display: block;
    position: absolute;
    width: 20px;
    height: 20px;
    background: #fff;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
  }

  .icon-close {
    position: absolute;
    top: 0px;
    right: 8px;
    cursor: pointer;
  }

  .content {
    margin-top: 14px;
  }
}
</style>
