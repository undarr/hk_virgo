import { useState, useEffect, useRef } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import './index.css';

const BASE_WIDTH = 900;
const BASE_HEIGHT = 1600;

// Orange boundary coordinates: [lon, lat] -> converted to [lat, lon]
const ORANGE_BOUNDARY = [
  [114.163618683815, 22.326343262919895],
  [114.16492223739625, 22.32529621890989],
  [114.16628479957582, 22.318671374457004],
  [114.16411757469179, 22.31856219835636],
  [114.16304469108583, 22.318194969027452],
  [114.16083991527557, 22.317430731921014],
  [114.15968656539918, 22.319668843058455],
  [114.15968656539918, 22.322388273480033],
  [114.15938079357149, 22.323122709103764],
  [114.15893018245698, 22.323653683802593],
  [114.15796458721162, 22.324398037455417],
  [114.15852248668672, 22.324869459381738],
  [114.15910720825197, 22.32502329145514],
  [114.16151583194733, 22.3250679523479],
  [114.16181087493898, 22.325256520404206],
  [114.16183769702913, 22.32617950774],
  [114.16202008724214, 22.326298602435354],
].map(([lon, lat]) => [lat, lon]);

// 8 Tasks Definition
const INITIAL_TASKS = {
  1: {
    id:1,
    label: "樂群街公園",
    shape: "polygon",
    scene: 10,
    vertices: [
      [114.15995478630066, 22.324063078803032],
      [114.15995478630066, 22.323202107318046],
      [114.16026324033739, 22.323197144930976],
      [114.16026324033739, 22.323249249986414],
      [114.1609311103821, 22.32325173117903],
      [114.160915017128, 22.32407796587133],
      [114.15995478630066, 22.324063078803032]
    ]
  },
  2: {
    id:2,
    label: "詩歌舞街",
    shape: "polygon",
    scene: 20,
    vertices: [
      [114.16307151317598, 22.326263866493047],
      [114.16308224201204, 22.325608844247526],
      [114.16324853897096, 22.325559221224836],
      [114.16332900524141, 22.32624401737928],
      [114.16307151317598, 22.326263866493047]
    ]
  },
  3: {
    id:3,
    label: "嘉善街",
    shape: "polygon",
    scene: 30,
    vertices: [
      [114.16086405515672, 22.32008321224729],
      [114.16086405515672, 22.319899599704634],
      [114.16167676448823, 22.319889674695446],
      [114.16167676448823, 22.32008321224729],
      [114.16086405515672, 22.32008321224729]
    ]
  },
  4: {
    id:4,
    label: "好世界洋樓",
    shape: "polygon",
    scene: 40,
    vertices: [
      [114.16477471590044, 22.325162236407923],
      [114.16488468647005, 22.324608936935153],
      [114.16468352079393, 22.3245692382339],
      [114.1645708680153, 22.325125019023414],
      [114.16477471590044, 22.325162236407923]
    ]
  },
  5: {
    id:5,
    label: "大同新邨",
    shape: "polygon",
    scene: 50,
    vertices: [
      [114.16086405515672, 22.321656315211907],
      [114.16134148836137, 22.32166624009544],
      [114.16134685277942, 22.321400749217414],
      [114.16086673736574, 22.3213957867663],
      [114.16086405515672, 22.321656315211907]
    ]
  },
  6: {
    id:6,
    label: "港灣豪庭",
    shape: "polygon",
    scene: 60,
    vertices: [
      [114.16028201580049, 22.32413999530546],
      [114.16114300489427, 22.324154882365534],
      [114.16114300489427, 22.324298790531138],
      [114.16027933359148, 22.324276459963446],
      [114.16028201580049, 22.32413999530546]
    ]
  },
  7: {
    id:7,
    label: "福澤街轉角",
    shape: "polygon",
    scene: 70,
    vertices: [
      [114.16178405284883, 22.320403292994047],
      [114.16178137063982, 22.32029659949336],
      [114.16196644306184, 22.320289155757713],
      [114.16196912527086, 22.32040825548047],
      [114.16178405284883, 22.320403292994047]
    ]
  },
  8: {
    id:8,
    label: "形品星寓",
    shape: "polygon",
    scene: 80,
    vertices: [
      [114.16486591100696, 22.321492554531446],
      [114.16469961404803, 22.32129901893404],
      [114.16531383991243, 22.320800291349947],
      [114.16549623012544, 22.321033527357404],
      [114.16486591100696, 22.321492554531446]
    ]
  }
};

/**
 * Ray-casting algorithm to test point [lat, lon] in polygon
 */
function isPointInPolygon(point, vs) {
  const x = point[0];
  const y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Calculates geographic center (centroid) of polygon vertices
 */
function getCentroid(coords) {
  let latSum = 0;
  let lonSum = 0;
  const count = coords.length;
  for (let i = 0; i < count; i++) {
    latSum += coords[i][0];
    lonSum += coords[i][1];
  }
  return [latSum / count, lonSum / count];
}

/**
 * OpenStreetMap Component with Tasks and Dynamic Shading
 */
function OSMMap({ coords, taskcomplete }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const orangePolyRef = useRef(null);
  const taskGroupRef = useRef(null); // Dedicated Leaflet LayerGroup for tasks

  const syncMapState = (map, currentCoords) => {
    if (!map || !currentCoords || !taskGroupRef.current) return;
    const userPt = [currentCoords.lat, currentCoords.lon];

    // 1. Move User GPS Dot
    if (markerRef.current) {
      markerRef.current.setLatLng(userPt);
    }

    // 2. Check if user is inside orange boundary
    const isInsideOrange = isPointInPolygon(userPt, ORANGE_BOUNDARY);
    if (orangePolyRef.current) {
      orangePolyRef.current.setStyle({
        fillOpacity: isInsideOrange ? 0 : 0.35,
      });
    }

    // 3. Clear existing task layers before re-drawing
    taskGroupRef.current.clearLayers();

    // If outside orange area, do not draw tasks
    if (!isInsideOrange) {
      return;
    }

    // 4. Render all 8 tasks inside taskGroup
    Object.entries(INITIAL_TASKS).forEach(([taskId, task]) => {
      const taskCoords = task.vertices.map(([lon, lat]) => [lat, lon]);
      const userInTask = isPointInPolygon(userPt, taskCoords);
      const isComplete = taskcomplete[taskId];
      console.log(taskId);

      let strokeColor, fillColor, badgeClass, dotClass;

      if (isComplete) {
        strokeColor = '#2e7d32';
        fillColor = '#81c784';
        badgeClass = 'green-badge-inner';
        dotClass = 'green-badge-dot';
      } else if (userInTask) {
        strokeColor = '#f57f17';
        fillColor = '#ffeb3b';
        badgeClass = 'yellow-badge-inner';
        dotClass = 'yellow-badge-dot';
      } else {
        strokeColor = '#800020';
        fillColor = '#c2185b';
        badgeClass = null;
      }

      // Draw task polygon
      const poly = window.L.polygon(taskCoords, {
        color: strokeColor,
        weight: 3,
        fillColor: fillColor,
        fillOpacity: 0.6,
      });

      taskGroupRef.current.addLayer(poly);
      poly.bringToFront(); // Ensure it renders above the orange boundary

      // Centroid badge if user is inside this specific task
      if (userInTask) {
        const centroid = getCentroid(taskCoords);
        const badgeHtml = `
          <div class="task-badge-wrapper">
            <div class="${badgeClass}">
              <span class="${dotClass}"></span>
              <span>${task.label}</span>
            </div>
          </div>
        `;
        const badgeIcon = window.L.divIcon({
          className: 'task-yellow-badge',
          html: badgeHtml,
          iconSize: [0, 0],
        });

        const badgeMarker = window.L.marker(centroid, { icon: badgeIcon });
        taskGroupRef.current.addLayer(badgeMarker);
      }
    });
  };

  // Map Initialization
  useEffect(() => {
    if (!window.L || !mapContainerRef.current) return;

    const userPt = [coords.lat, coords.lon];
    const isInsideOrange = isPointInPolygon(userPt, ORANGE_BOUNDARY);

    // Zoom level 15 ensures the ~1km orange zone fits on mobile screen
    const map = window.L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(userPt, 15);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // 1. Base Orange Boundary
    const orangePoly = window.L.polygon(ORANGE_BOUNDARY, {
      color: '#ff6600',
      weight: 3,
      fillColor: '#ffa500',
      fillOpacity: isInsideOrange ? 0 : 0.35,
    }).addTo(map);
    orangePolyRef.current = orangePoly;

    // 2. Task LayerGroup (Rendered above the base map)
    const taskGroup = window.L.layerGroup().addTo(map);
    taskGroupRef.current = taskGroup;

    // 3. User GPS Marker
    const gpsIcon = window.L.divIcon({
      className: 'live-gps-marker',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    const marker = window.L.marker(userPt, { icon: gpsIcon }).addTo(map);
    markerRef.current = marker;
    mapInstanceRef.current = map;

    // Force Leaflet to recalculate container bounds after flex layout stabilizes
    setTimeout(() => {
      map.invalidateSize();
      syncMapState(map, coords);
    }, 150);

    return () => {
      map.remove();
      taskGroupRef.current = null;
      mapInstanceRef.current = null;
    };
  }, []);

  // Update on GPS movement
  useEffect(() => {
    if (!mapInstanceRef.current || !coords) return;
    //mapInstanceRef.current.panTo([coords.lat, coords.lon], { animate: true, duration: 1 });
    syncMapState(mapInstanceRef.current, coords);
  }, [coords]);

  return <div ref={mapContainerRef} className="map-frame" style={{ zIndex: 0 }} />;
}

/**
 * Radio Button Group Component
 * Identical to regular action-buttons, shaded blue when selected.
 */
function RadioGroup({ config }) {
  const [selectedKey, setSelectedKey] = useState(config.defaultValue || null);

  return (
    <div className="radio-group" style={{ zIndex: config.z || 2 }}>
      {Object.entries(config.buttons || {}).map(([key, btn]) => {
        const isSelected = selectedKey === key;
        const bgImage = btn.image
          ? `url(${btn.image.startsWith('/') ? btn.image : `/${btn.image}`})`
          : undefined;

        return (
          <button
            key={`radio-${key}`}
            className={`action-button radio-button ${isSelected ? 'is-selected' : ''}`}
            onClick={() => {
              setSelectedKey(key);
              if (btn.func) btn.func(key);
            }}
            style={{
              left: `${(btn.x / BASE_WIDTH) * 100}%`,
              top: `${(btn.y / BASE_HEIGHT) * 100}%`,
              width: `${(btn.w / BASE_WIDTH) * 100}%`,
              height: `${(btn.h / BASE_HEIGHT) * 100}%`,
              zIndex: btn.z || config.z || 2,
              backgroundImage: bgImage,
              backgroundSize: bgImage ? '100% 100%' : undefined,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {btn.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Infinite Generator & Slot Drag-and-Drop Component
 * (Plus sign badge removed)
 */
function GeneratorsGroup({ config, stageRef }) {
  const [slotItems, setSlotItems] = useState({});
  const [dragState, setDragState] = useState(null);

  const startDrag = (sourceType, originSlotId, itemData, e) => {
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);

    const stageRect = stageRef.current.getBoundingClientRect();
    const initX = sourceType === 'gen' ? itemData.x : config.slots[originSlotId].x;
    const initY = sourceType === 'gen' ? itemData.y : config.slots[originSlotId].y;

    setDragState({
      source: sourceType,
      originSlotId: originSlotId,
      image: itemData.image,
      x: initX,
      y: initY,
      initX,
      initY,
      startX: e.clientX,
      startY: e.clientY,
      stageW: stageRect.width,
      stageH: stageRect.height,
    });
  };

  const handlePointerMove = (e) => {
    if (!dragState) return;

    const deltaX = ((e.clientX - dragState.startX) / dragState.stageW) * BASE_WIDTH;
    const deltaY = ((e.clientY - dragState.startY) / dragState.stageH) * BASE_HEIGHT;

    setDragState((prev) => ({
      ...prev,
      x: prev.initX + deltaX,
      y: prev.initY + deltaY,
    }));
  };

  const handlePointerUp = (e) => {
    if (!dragState) return;
    try {
      e.target.releasePointerCapture(e.pointerId);
    } catch (_) {}

    const { source, originSlotId, image, x, y } = dragState;

    let targetSlotId = null;
    let minDistance = Infinity;

    Object.entries(config.slots).forEach(([slotId, slotCoords]) => {
      const dist = Math.hypot(slotCoords.x - x, slotCoords.y - y);
      if (dist < minDistance) {
        minDistance = dist;
        targetSlotId = Number(slotId);
      }
    });

    const SNAP_RADIUS = 125;

    setSlotItems((prev) => {
      const next = { ...prev };

      // Remove from source slot if dragged from a slot
      if (source === 'slot' && originSlotId !== null) {
        delete next[originSlotId];
      }

      // If dropped onto a slot, replace/set item
      if (targetSlotId !== null && minDistance < SNAP_RADIUS) {
        next[targetSlotId] = {
          id: Date.now(),
          image: image,
        };
      }

      return next;
    });

    setDragState(null);
  };

  return (
    <div
      className="generators-container"
      style={{ zIndex: config.z || 2 }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* 1. Target Slots */}
      {Object.entries(config.slots).map(([slotId, slot]) => (
        <div
          key={`slot-${slotId}`}
          className="slot-target"
          style={{
            left: `${(slot.x / BASE_WIDTH) * 100}%`,
            top: `${(slot.y / BASE_HEIGHT) * 100}%`,
            width: `${(config.w / BASE_WIDTH) * 100}%`,
            height: `${(config.h / BASE_HEIGHT) * 100}%`,
          }}
        />
      ))}

      {/* 2. Items currently placed in Slots */}
      {Object.entries(slotItems).map(([slotId, item]) => {
        if (dragState?.source === 'slot' && String(dragState.originSlotId) === String(slotId)) {
          return null;
        }

        const slot = config.slots[slotId];
        if (!slot) return null;

        return (
          <div
            key={`slot-item-${slotId}`}
            className="generator-item slotted-item"
            onPointerDown={(e) => startDrag('slot', slotId, item, e)}
            style={{
              left: `${(slot.x / BASE_WIDTH) * 100}%`,
              top: `${(slot.y / BASE_HEIGHT) * 100}%`,
              width: `${(config.w / BASE_WIDTH) * 100}%`,
              height: `${(config.h / BASE_HEIGHT) * 100}%`,
              backgroundImage: `url(${item.image})`,
            }}
          />
        );
      })}

      {/* 3. The Generator Spawners (Plus sign removed) */}
      {Object.entries(config.gen || {}).map(([genId, genData]) => (
        <div
          key={`gen-${genId}`}
          className="generator-spawner"
          onPointerDown={(e) => startDrag('gen', null, genData, e)}
          style={{
            left: `${(genData.x / BASE_WIDTH) * 100}%`,
            top: `${(genData.y / BASE_HEIGHT) * 100}%`,
            width: `${(config.w / BASE_WIDTH) * 100}%`,
            height: `${(config.h / BASE_HEIGHT) * 100}%`,
            backgroundImage: `url(${genData.image})`,
          }}
        />
      ))}

      {/* 4. Active Dragging Floating Clone */}
      {dragState && (
        <div
          className="generator-item is-dragging"
          style={{
            left: `${(dragState.x / BASE_WIDTH) * 100}%`,
            top: `${(dragState.y / BASE_HEIGHT) * 100}%`,
            width: `${(config.w / BASE_WIDTH) * 100}%`,
            height: `${(config.h / BASE_HEIGHT) * 100}%`,
            backgroundImage: `url(${dragState.image})`,
          }}
        />
      )}
    </div>
  );
}

function App() {
  const [currentSceneId, setCurrentSceneId] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [textboxValue, setTextboxValue] = useState('');

  const stageRef = useRef(null);
  const watchIdRef = useRef(null);

  const taskcompleteRef = useRef({1:false, 2:false, 3:false, 4:false, 5:false, 6:false, 7:false, 8:false});

  const [blackFade, setBlackFade] = useState({ opacity: 1, duration: 0 });
  const [crossfade, setCrossfade] = useState(null);

  const enablelocation = async () => {
    setUserCoords({ lat: 22.32040329, lon: 114.161784 });
    goToScene(5, 'fade', 800);
    /*
    try {

      const permissionStatus = await Geolocation.requestPermissions();
      if (permissionStatus.location !== 'granted') {
        goToScene(4, 'fade', 800);
        return;
      }

      let isFirstFix = true;
      const id = await Geolocation.watchPosition(
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 },
        (position, err) => {
          if (err) {
            if (isFirstFix) goToScene(4, 'fade', 800);
            return;
          }
          if (position?.coords) {
            const { latitude, longitude } = position.coords;
            setUserCoords({ lat: latitude, lon: longitude });
            if (isFirstFix) {
              isFirstFix = false;
              goToScene(5, 'fade', 800);
            }
          }
        }
      );
      watchIdRef.current = id;
    } catch (_) {
      goToScene(4, 'fade', 800);
    }
    */
  };

  const getUserLocationStatus = () => {
    if (!userCoords) return { text: "💡前往大角咀", activeTask: null };

    const userPt = [userCoords.lat, userCoords.lon];
    const inOrange = isPointInPolygon(userPt, ORANGE_BOUNDARY);

    if (!inOrange) {
      return { text: "💡前往大角咀", activeTask: null };
    }

    for (const task of Object.values(INITIAL_TASKS)) {
      const taskCoords = task.vertices.map(([lon, lat]) => [lat, lon]);
      if (isPointInPolygon(userPt, taskCoords)) {
        return { text: `📍已到達${task.label}`, activeTask: task };
      }
    }

    return { text: "💡前往任務區域", activeTask: null };
  };

  const { text: statusText, activeTask } = getUserLocationStatus();

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch({ id: watchIdRef.current });
      }
    };
  }, []);

  const goToScene = (sceneId, transition = 'default', time = 600) => {
    if (isTransitioning) return;
    const durationMs = time <= 20 ? time * 1000 : time;

    if (transition === 'fade') {
      const halfTime = durationMs / 2;
      setIsTransitioning(true);
      setBlackFade({ opacity: 0, duration: halfTime });

      setTimeout(() => {
        setCurrentSceneId(sceneId);
        setBlackFade({ opacity: 1, duration: halfTime });

        setTimeout(() => {
          setIsTransitioning(false);
          setBlackFade({ opacity: 1, duration: 0 });
        }, halfTime);
      }, halfTime);
    } else if (transition === 'crossfade') {
      setIsTransitioning(true);
      setCrossfade({
        fromId: currentSceneId,
        toId: sceneId,
        topOpacity: 0,
        duration: durationMs,
      });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setCrossfade((prev) => (prev ? { ...prev, topOpacity: 1 } : null));
        });
      });

      setTimeout(() => {
        setCurrentSceneId(sceneId);
        setCrossfade(null);
        setIsTransitioning(false);
      }, durationMs);
    } else {
      setCurrentSceneId(sceneId);
    }
  };

  // Demo Scenes Configuration
  const SCENES = {
    1: {
      wallpaper: '/1_1.png',
      divs: {
        1: {
          type: 'button',
          x: 175, y: 1251, w: 556, h: 151, z: 2,
          label: '',
          func: () => goToScene(2, 'crossfade', 1000),
        },
      },
    },
    2: {
      wallpaper: '/1_4.png',
      divs: {
        1: {
          type: 'button',
          x: 197, y: 1327, w: 502, h: 128, z: 2,
          func: () => goToScene(3, 'fade', 1000),
        },
        2: {
          type: 'button',
          x: 21, y: 11, w: 119, h: 119, z: 2,
          func: () => goToScene(1, 'fade', 1000),
        }
      },
    },
    3: {
      wallpaper: '/2_1.png',
      divs: {
        1: {
          type: 'button',
          x: 194, y: 1254, w: 515, h: 161, z: 1,
          func: () => enablelocation(),
        },
      },
    },
    4: {
      wallpaper: '/2_3.png',
      divs: {},
    },
    5: {
      isMap: true,
      divs: {
        1: { 
          type: 'div',
          x: 49, y: 48, w: 807, h: 176, z: 1, 
          image: '/3_1.png',
          func: () => goToScene(3, 'fade', 1000) 
        },
        2: { 
          type: 'button',
          x: 600, y: 500, w: 50, h: 50, z: 1,
          func: () => setUserCoords(prev => ({ ...prev, lat: prev.lat + 0.00005 }))
        },
        3: { 
          type: 'button',
          x: 550, y: 550, w: 50, h: 50, z: 1,
          func: () => setUserCoords(prev => ({ ...prev, lon: prev.lon - 0.00005 }))
        },
        4: { 
          type: 'button',
          x: 600, y: 600, w: 50, h: 50, z: 1,
          func: () => setUserCoords(prev => ({ ...prev, lat: prev.lat - 0.00005 }))
        },
        5: { 
          type: 'button',
          x: 650, y: 550, w: 50, h: 50, z: 1,
          func: () => setUserCoords(prev => ({ ...prev, lon: prev.lon + 0.00005 }))
        },
        6: { 
          type: 'button',
          x: 600, y: 750, w: 100, h: 100, z: 1,
          func: () => setUserCoords(prev => ({ ...prev, lat: prev.lat + 0.0005 }))
        },
        7: { 
          type: 'button',
          x: 500, y: 850, w: 100, h: 100, z: 1,
          func: () => setUserCoords(prev => ({ ...prev, lon: prev.lon - 0.0005 }))
        },
        8: { 
          type: 'button',
          x: 600, y: 950, w: 100, h: 100, z: 1,
          func: () => setUserCoords(prev => ({ ...prev, lat: prev.lat - 0.0005 }))
        },
        9: { 
          type: 'button',
          x: 700, y: 850, w: 100, h: 100, z: 1,
          func: () => setUserCoords(prev => ({ ...prev, lon: prev.lon + 0.0005 }))
        },
        10: { 
          type: 'text',
          text: statusText,
          color: "000000",
          fontSize: 20,
          x: 93, y: 89, w: 465, h: 98, z: 1,
        },
        // Button 10 only appears when the user is inside a task
        ...(activeTask && !taskcompleteRef.current[activeTask.id] && {
          11: { 
            type: 'button',
            label: `Enter ${activeTask.label}`,
            x: 175, y: 1251, w: 556, h: 151, z: 1,
            func: () => goToScene(activeTask.scene, 'fade', 800),
          },
        }),
        
      },
    },
    10: {
      wallpaper: '/10_1.png',
      divs: {
        1: { 
            type: 'button',
            x: 187, y: 1176, w: 519, h: 151, z: 1,
            func: () => goToScene(11, 'fade', 800),
          },
      },
    },
    20: {
      wallpaper: '/20_1.png',
      divs: {
        1: { 
            type: 'button',
            x: 187, y: 1176, w: 519, h: 151, z: 1,
            func: () => goToScene(21, 'fade', 800),
          },
      },
    },
    30: {
      wallpaper: '/30_1.png',
      divs: {
        1: { 
            type: 'button',
            x: 187, y: 1176, w: 519, h: 151, z: 1,
            func: () => goToScene(31, 'fade', 800),
          },
      },
    },
    40: {
      wallpaper: '/40_1.png',
      divs: {
        1: { 
            type: 'button',
            x: 187, y: 1176, w: 519, h: 151, z: 1,
            func: () => goToScene(41, 'fade', 800),
          },
      },
    },
    50: {
      wallpaper: '/50_1.png',
      divs: {
        1: { 
            type: 'button',
            x: 187, y: 1176, w: 519, h: 151, z: 1,
            func: () => goToScene(51, 'fade', 800),
          },
      },
    },
    60: {
      wallpaper: '/60_1.png',
      divs: {
        1: { 
            type: 'button',
            x: 187, y: 1176, w: 519, h: 151, z: 1,
            func: () => goToScene(60, 'fade', 800),
          },
        2: { 
            type: 'button',
            x: 552, y: 1374, w: 301, h: 157, z: 1,
            func: () => {
              taskcompleteRef.current[6]=true;
              goToScene(5, 'fade', 800);
            }
          },
      },
    },
    70: {
      wallpaper: '/70_1.png',
      divs: {
        1: { 
            type: 'button',
            x: 187, y: 1176, w: 519, h: 151, z: 1,
            func: () => goToScene(71, 'fade', 800),
          },
      },
    },
    80: {
      wallpaper: '/80_1.png',
      divs: {
        1: { 
            type: 'button',
            x: 187, y: 1176, w: 519, h: 151, z: 1,
            func: () => goToScene(81, 'fade', 800),
          },
      },
    }
  };

  // Prevent mobile gesture scrolling, allow interactions on all interactive widgets
  useEffect(() => {
    const preventDefault = (e) => {
      if (
        e.target.closest('.map-frame') ||
        e.target.closest('.action-textbox') ||
        e.target.closest('.generator-item') ||
        e.target.closest('.generator-spawner') ||
        e.target.closest('.draggable-item')
      ) {
        return;
      }
      e.preventDefault();
    };
    document.addEventListener('touchmove', preventDefault, { passive: false });
    return () => document.removeEventListener('touchmove', preventDefault);
  }, []);

  const renderSceneLayer = (sceneId, opacity = 1, duration = 0, zIndex = 1) => {
    const scene = SCENES[sceneId];
    if (!scene) return null;

    const elements = scene.divs || {};

    return (
      <div
        className="scene-layer"
        style={{
          backgroundImage: scene.isMap ? 'none' : `url(${scene.wallpaper})`,
          opacity,
          transition: duration > 0 ? `opacity ${duration}ms ease-in-out` : 'none',
          zIndex,
        }}
      >
        {scene.isMap && userCoords && <OSMMap coords={userCoords} taskcomplete={taskcompleteRef.current} />}

        {Object.entries(elements).map(([key, item]) => {
          // 1. Radio Group
          if (item.type === 'radio') {
            return <RadioGroup key={key} config={item} />;
          }

          // 2. Generators & Slots
          if (item.type === 'generators') {
            return (
              <GeneratorsGroup
                key={key}
                config={item}
                stageRef={stageRef}
              />
            );
          }

          // 3. Text
          if (item.type === 'text') {
            const hex = item.color ? (item.color.startsWith('#') ? item.color : `#${item.color}`) : '#ffffff';
            return (
              <div
                key={key}
                className="action-text"
                style={{
                  position: 'absolute',
                  left: `${(item.x / BASE_WIDTH) * 100}%`,
                  top: `${(item.y / BASE_HEIGHT) * 100}%`,
                  width: item.w ? `${(item.w / BASE_WIDTH) * 100}%` : 'auto',
                  height: item.h ? `${(item.h / BASE_HEIGHT) * 100}%` : 'auto',
                  zIndex: item.z || 1,
                  fontFamily: item.font || 'inherit',
                  fontSize: item.fontSize || '16px',
                  color: hex,
                }}
              >
                {item.text}
              </div>
            );
          }

          // Standard items: image, button, div, textbox
          const bgImage = item.image
            ? `url(${item.image.startsWith('/') ? item.image : `/${item.image}`})`
            : undefined;

          const itemStyle = {
            position: 'absolute',
            left: `${(item.x / BASE_WIDTH) * 100}%`,
            top: `${(item.y / BASE_HEIGHT) * 100}%`,
            width: `${(item.w / BASE_WIDTH) * 100}%`,
            height: `${(item.h / BASE_HEIGHT) * 100}%`,
            zIndex: item.z || 1,
            backgroundImage: bgImage,
            backgroundSize: bgImage ? '100% 100%' : undefined,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            cursor: item.func ? 'pointer' : 'default',
          };

          if (item.type === 'textbox') {
            return (
              <input
                key={key}
                type="text"
                className="action-textbox"
                style={itemStyle}
                placeholder={item.placeholder || ''}
                value={item.value !== undefined ? item.value : undefined}
                onChange={item.onChange}
              />
            );
          }

          if (item.type === 'div') {
            return (
              <div key={key} className="action-div" onClick={item.func} style={itemStyle}>
                {item.label}
              </div>
            );
          }

          return (
            <button key={key} className="action-button" onClick={item.func} style={itemStyle}>
              {item.label}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="screen-container">
      <div
        ref={stageRef}
        className="stage"
        style={{
          pointerEvents: isTransitioning ? 'none' : 'auto',
        }}
      >
        {crossfade ? (
          <>
            {renderSceneLayer(crossfade.fromId, 1, 0, 1)}
            {renderSceneLayer(crossfade.toId, crossfade.topOpacity, crossfade.duration, 2)}
          </>
        ) : (
          renderSceneLayer(currentSceneId, blackFade.opacity, blackFade.duration, 1)
        )}
      </div>
    </div>
  );
}

export default App;