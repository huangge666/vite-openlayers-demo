// 经纬度工具函数
import { fromLonLat, toLonLat, transform } from "ol/proj";
// ol
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import LineString from "ol/geom/LineString";
import { Circle, Icon, Fill, Stroke, Style, Text } from "ol/style";

// 定位到某个点（经度，纬度，动画时间）
export const gotoPoint = (mapRef, lng, lat, duration = 1000) => {
  if (!lng || !lat) return;
  // let centers = transform([lng, lat], 'EPSG:4326', 'EPSG:3857');
  let centers = [lng, lat];
  mapRef.value.getView().animate({
    center: centers,
    duration: duration, //动画时间
    zoom: 10,
  });
};

// 绘制点位
export const renderOverlayPoint = (points, pointImg) => {
  const iconFeatureArr = points.map((v) => {
    const iconFeature = new Feature({
      //feature-矢量集合图形
      // geometry: new Point(transform([v.lng, v.lat], "EPSG:4326", "EPSG:3857")), //生成集合体的形状是一个点
      geometry: new Point([v.lng, v.lat]),
      data: v, //原数据--将要保存的点位数据存到集合体中，在点位交互的时候可以直拿到
      population: 40000,
      rainfall: 500,
    });
    const iconStyle = new Style({
      //点位样式
      image: new Icon({
        anchor: [0.5, 0.5],
        //anchorXUnits: "fraction",
        //anchorYUnits: "pixels",
        width: 40,
        height: 40,
        src: pointImg,
      }),
    });
    iconFeature.setStyle(iconStyle);
    return iconFeature;
  });

  let vectorSource = new VectorSource({
    features: iconFeatureArr,
  });

  let vectorLayer = new VectorLayer({
    source: vectorSource,
  });
  //加入点位
  // olMapData.value.addLayer(vectorLayer);
  return vectorLayer;
};

// 绘制轨迹 start
const renderStyle = (feature, resolution, lineColor = "yellow") => {
  console.log(feature, "feature renderStyle");
  console.log(resolution, "resolution renderStyle");
  // 箭头样式
  let styles = [];
  // 线条样式
  let backgroundLineStyle = new Style({
    stroke: new Stroke({
      color: lineColor,
      width: 5,
    }),
  });
  styles.push(backgroundLineStyle);

  let geometry = feature.getGeometry();
  // 获取线段长度
  const length = geometry.getLength();
  // 箭头间隔距离（像素）
  const step = 50;
  // 将间隔像素距离转换成地图的真实距离
  const StepLength = step * resolution;

  // 得到一共需要绘制多少个 箭头
  const arrowNum = Math.floor(length / StepLength);
  const rotations = [];
  const distances = [0];
  geometry.forEachSegment(function (start, end) {
    let dx = end[0] - start[0];
    let dy = end[1] - start[1];
    let rotation = Math.atan2(dy, dx);
    distances.unshift(Math.sqrt(dx ** 2 + dy ** 2) + distances[0]);
    rotations.push(rotation);
  });
  // 利用之前计算得到的线段矢量信息，生成对应的点样式塞入默认样式中
  // 从而绘制内部箭头
  for (let i = 1; i < arrowNum; ++i) {
    const arrowCoord = geometry.getCoordinateAt(i / arrowNum);
    const d = i * StepLength;
    const grid = distances.findIndex((x) => x <= d);
    styles.push(
      new Style({
        geometry: new Point(arrowCoord),
        image: new Icon({
          src: `data:image/png;base64,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`, //引入的图标样式--即箭头（也可通过canvas画一个）
          opacity: 0.8,
          anchor: [0.5, 0.5],
          rotateWithView: false,
          // 读取 rotations 中计算存放的方向信息
          rotation: -rotations[distances.length - grid - 1],
          scale: 0.3,
        }),
      })
    );
  }
  return styles;
};

export const createTrajectory = (
  coordinate,
  lineColor = "yellow",
  showArrow = true
) => {
  let LineGeometry = new LineString([]);
  coordinate.forEach((item, index) => {
    LineGeometry.appendCoordinate(
      // transform([item.longitude, item.latitude], "EPSG:4326", "EPSG:3857")
      [item.longitude, item.latitude]
    );
  });
  let lineFeature = new Feature({ geometry: LineGeometry, coordinate });
  if (!showArrow) {
    lineFeature.setStyle(
      new Style({
        fill: new Fill({
          color: "rgba(1, 210, 241, 0.2)",
        }),
        stroke: new Stroke({
          color: lineColor,
          width: 2,
        }),
      })
    );
  } else {
    const createRenderStyle = function (extraParam) {
      return function (feature, resolution) {
        return renderStyle(feature, resolution, extraParam);
      };
    };
    lineFeature.setStyle(createRenderStyle(lineColor));
  }

  let source = new VectorSource({
    features: [lineFeature],
  });
  const traskvectorValue = new VectorLayer({
    source: source,
  });

  // mapref.value.addLayer(traskvector.value);
  // mapref.value.getView().animate({
  //   center: transform(
  //     [coordinate[0].longitude, coordinate[0].latitude],
  //     'EPSG:4326',
  //     'EPSG:3857'
  //   ),
  //   duration: 1000,
  //   zoom: 8,
  // });

  return traskvectorValue;
};
// end
