import { useState, useEffect, useRef } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import './index.css';

const BASE_WIDTH = 900;
const BASE_HEIGHT = 1600;

const NOTE_OFFSETS = {
  C: 0, 'C#': 1, Db: 1,
  D: 2, 'D#': 3, Eb: 3,
  E: 4,
  F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8,
  A: 9, 'A#': 10, Bb: 10,
  B: 11,
};

// Orange boundary coordinates: [lon, lat] -> converted to [lat, lon]
const ORANGE_BOUNDARY = [
  [114.16209536142506, 22.326219373571995],
  [114.16340197828417, 22.326226871915402],
  [114.16471383698824, 22.3252124341665],
  [114.16504049448997, 22.32351640791365],
  [114.16598565758046, 22.318716000269962],
  [114.16378525104024, 22.318606886173264],
  [114.1630875611616, 22.31835889927258],
  [114.16265821354402, 22.318239865403747],
  [114.1622718006882, 22.318061314410162],
  [114.16156337711915, 22.317803407016182],
  [114.16111256212065, 22.31759509685007],
  [114.16081201878832, 22.317505820969423],
  [114.16059734497951, 22.31738678637308],
  [114.16023239950455, 22.318239865403747],
  [114.15967424760167, 22.319380602471433],
  [114.15928783474581, 22.319975765935965],
  [114.15878335129516, 22.320640362138537],
  [114.15839693843928, 22.321265278068772],
  [114.15863307962897, 22.321761241101033],
  [114.15884775343778, 22.3221282526101],
  [114.15901949248484, 22.322495263153932],
  [114.15916976415099, 22.322822596067866],
  [114.15916976415099, 22.32335823008894],
  [114.15908389462744, 22.323606208106106],
  [114.15877261760471, 22.323824428396687],
  [114.1585042753437, 22.324072405585355],
  [114.15823593308272, 22.324241029821938],
  [114.15802125927392, 22.32437989668728],
  [114.15788172129818, 22.324439411015835],
  [114.15808566141654, 22.324717144213448],
  [114.1583754710584, 22.32491552473041],
  [114.15869748177163, 22.325064309933055],
  [114.15910536200832, 22.325113904965335],
  [114.15962057914949, 22.3251337429733],
  [114.16031826902808, 22.325183337980913],
  [114.16071541557436, 22.325183337980913],
  [114.1609944915258, 22.325193256980317],
  [114.16134870331034, 22.32517341898081],
  [114.16161704557133, 22.325213094977023],
  [114.16176731723749, 22.325252770961953],
  [114.1619819910463, 22.325252770961953],
  [114.1620141921176, 22.32597685570512],
  [114.16197125735584, 22.3260958829745],
  [114.16209536142506, 22.326219373571995]
].map(([lon, lat]) => [lat, lon]);

// 8 Tasks Definition
const INITIAL_TASKS = {
  1: {
    id:1,
    label: "樂群街公園",
    shape: "polygon",
    scene: 10,
    vertices: [
      [114.15996034807675, 22.324090568926795],
      [114.1609371326603, 22.324090568926795],
      [114.16095055003095, 22.32323256609015],
      [114.1602984658172, 22.32321272781189],
      [114.16029309886896, 22.32317801081812],
      [114.1599737654474, 22.323173051246865],
      [114.15996034807675, 22.324090568926795]
    ]
  },
  2: {
    id:2,
    label: "詩歌舞街",
    shape: "polygon",
    scene: 20,
    vertices: [
      [114.16311968271641, 22.326227850968706],
      [114.16318945784441, 22.326227850968706],
      [114.16320555979702, 22.3256525521035],
      [114.16315725393919, 22.32565751158661],
      [114.16311968271641, 22.326227850968706]
    ]
  },
  3: {
    id:3,
    label: "嘉善街",
    shape: "polygon",
    scene: 30,
    vertices: [
      [114.16087514630489, 22.320071683417922],
      [114.161653395424, 22.320076643099384],
      [114.16165607904165, 22.319945211480995],
      [114.16087514630489, 22.319935292108536],
      [114.16087514630489, 22.320071683417922]
    ]
  },
  4: {
    id:4,
    label: "雷生春",
    shape: "polygon",
    scene: 40,
    vertices: [
      [114.16463017101881, 22.325197235980415],
      [114.16519104710811, 22.324770718381384],
      [114.16509712049027, 22.32463433166472],
      [114.1647428829602, 22.32457977694072],
      [114.16463017101881, 22.325197235980415]
    ]
  },
  5: {
    id:5,
    label: "大同新邨",
    shape: "polygon",
    scene: 50,
    vertices: [
      [114.160005792551, 22.321989054746762],
      [114.15995480654252, 22.321969216291684],
      [114.15996554043905, 22.321393899868113],
      [114.16001920992167, 22.321361662239713],
      [114.16139314867652, 22.321374061328434],
      [114.16138778172824, 22.321989054746762],
      [114.160005792551, 22.321989054746762]
    ]
  },
  6: {
    id:6,
    label: "港灣豪庭",
    shape: "polygon",
    scene: 60,
    vertices: [
      [114.16013177883337, 22.324254484291345],
      [114.16022570042793, 22.324162732902625],
      [114.16149766716583, 22.324152813829954],
      [114.16148424979517, 22.324261923590473],
      [114.16013177883337, 22.324254484291345]
    ]
  },
  7: {
    id:7,
    label: "福澤街轉角",
    shape: "polygon",
    scene: 70,
    vertices: [
      [114.16179292306619, 22.320339505964856],
      [114.16179292306619, 22.32029982858294],
      [114.1619163628762, 22.320304788256287],
      [114.1619163628762, 22.320428780032955],
      [114.16186806034185, 22.320423820363985],
      [114.1618626933936, 22.320364304322837],
      [114.16179292306619, 22.320339505964856]
    ]
  },
  8: {
    id:8,
    label: "形品星寓",
    shape: "polygon",
    scene: 80,
    vertices: [
      [114.16439173697295, 22.321848576636373],
      [114.16548130243321, 22.320988080190077],
      [114.1653310175421, 22.320782254605323],
      [114.16422803378802, 22.321662590822246],
      [114.16439173697295, 22.321848576636373]
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
        strokeColor = '#ff6600'; 
        fillColor = '#ffa500'; 
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
        /*
        <div class="${badgeClass}">
              <span class="${dotClass}"></span>
              <span>${task.label}</span>
            </div>
        */
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
      minZoom: 15,
      maxZoom: 19,
    }).addTo(map);

    // 1. Base Orange Boundary
    const orangePoly = window.L.polygon(ORANGE_BOUNDARY, {
      color: '#800020',
      weight: 3,
      fillColor: '#c2185b',//#ffa500
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
 * Checkboxes Group Component
 * Allows multi-select, reuses identical CSS as radio buttons (shaded blue when selected)
 */
function CheckboxesGroup({ config }) {
  // Store selected IDs in a Set: e.g. ['1', '2']
  const [selectedKeys, setSelectedKeys] = useState(
    new Set(config.defaultValues ? config.defaultValues.map(String) : [])
  );

  const toggleKey = (key, btn) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      if (config.onChange) {
        config.onChange(Array.from(next));
      }
      if (btn.func) btn.func(key, next.has(key));
      return next;
    });
  };

  return (
    <div className="radio-group checkboxes-group" style={{ zIndex: config.z || 2 }}>
      {Object.entries(config.buttons || {}).map(([key, btn]) => {
        const isSelected = selectedKeys.has(key);
        const bgImage = btn.image
          ? `url(${btn.image.startsWith('/') ? btn.image : `/${btn.image}`})`
          : undefined;

        return (
          <button
            key={`checkbox-${key}`}
            className={`action-button radio-button ${isSelected ? 'is-selected' : ''}`}
            onClick={() => toggleKey(key, btn)}
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

function WheelColumn({ items, value, onChange, loop = true }) {
  const ITEM_HEIGHT = 44; 
  const VISIBLE_ITEMS = 5;
  const containerRef = useRef(null);
  const scrollTimeout = useRef(null);

  const repeatedItems = loop ? [...items, ...items, ...items] : items;
  const offset = loop ? items.length : 0;

  // Set initial position
  useEffect(() => {
    if (containerRef.current) {
      const targetIndex = items.indexOf(value) + offset;
      containerRef.current.scrollTop = targetIndex * ITEM_HEIGHT;
    }
  }, []);

  const handleScroll = (e) => {
    const el = e.target;
    const scrollTop = el.scrollTop;

    // Handle seamless infinite looping without jitter on mobile
    if (loop) {
      if (scrollTop <= ITEM_HEIGHT * 0.5) {
        el.scrollTop += items.length * ITEM_HEIGHT;
        return;
      }
      if (scrollTop >= (repeatedItems.length - VISIBLE_ITEMS + 0.5) * ITEM_HEIGHT) {
        el.scrollTop -= items.length * ITEM_HEIGHT;
        return;
      }
    }

    // Debounce state emission so mobile momentum doesn't spam re-renders
    clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      const index = Math.round(el.scrollTop / ITEM_HEIGHT);
      const actualItem = repeatedItems[index % repeatedItems.length];
      if (actualItem !== undefined && actualItem !== value) {
        onChange(actualItem);
      }
    }, 60);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: `${ITEM_HEIGHT * VISIBLE_ITEMS}px`,
        overflowY: 'auto',
        
        /* --- Mobile Touch & Scroll Fixes --- */
        WebkitOverflowScrolling: 'touch',  // Native iOS momentum flick
        touchAction: 'pan-y',               // Disables horizontal swipes/navigation
        overscrollBehaviorY: 'contain',     // Prevents whole page from bouncing
        scrollSnapType: 'y mandatory',
        /* ----------------------------------- */

        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        width: '50%',
        position: 'relative',
        zIndex: 3, // Above gradient vignette so touch touches the scroll area
      }}
    >
      <style>{`div::-webkit-scrollbar { display: none; }`}</style>

      {/* Top buffer space */}
      <div style={{ height: `${ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2)}px` }} />

      {repeatedItems.map((item, idx) => {
        const isSelected = item === value;
        return (
          <div
            key={`wheel-item-${idx}-${item}`}
            style={{
              height: `${ITEM_HEIGHT}px`,
              lineHeight: `${ITEM_HEIGHT}px`,
              textAlign: 'center',
              scrollSnapAlign: 'center',
              scrollSnapStop: 'normal',
              fontSize: isSelected ? '28px' : '20px',
              fontWeight: isSelected ? '600' : '400',
              color: isSelected ? '#ffffff' : '#666666',
              transform: isSelected ? 'scale(1.1)' : 'scale(0.9)',
              transition: 'transform 0.15s ease, color 0.15s ease',
              userSelect: 'none',
              WebkitUserSelect: 'none', // Prevents iOS text selection highlight on tap
            }}
            onClick={() => {
              if (containerRef.current) {
                containerRef.current.scrollTo({
                  top: idx * ITEM_HEIGHT,
                  behavior: 'smooth',
                });
              }
            }}
          >
            {typeof item === 'number' ? String(item).padStart(2, '0') : item}
          </div>
        );
      })}

      {/* Bottom buffer space */}
      <div style={{ height: `${ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2)}px` }} />
    </div>
  );
}

function WheelTimePicker({ config, onChange }) {
  const ITEM_HEIGHT = 44; // Height of each number row in pixels
  const VISIBLE_ITEMS = 5; // How many items visible at once (must be odd)
  const [hour, setHour] = useState(config.defaultHour || 12);
  const [minute, setMinute] = useState(config.defaultMinute || 0);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1); // 1 to 12
  const minutes = Array.from({ length: 60 }, (_, i) => i);   // 0 to 59

  const handleHourChange = (newHour) => {
    setHour(newHour);
    if (onChange) onChange({ hour: newHour, minute });
  };

  const handleMinuteChange = (newMinute) => {
    setMinute(newMinute);
    if (onChange) onChange({ hour, minute: newMinute });
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${(config.x / BASE_WIDTH) * 100}%`,
        top: `${(config.y / BASE_HEIGHT) * 100}%`,
        width: `${(config.w / BASE_WIDTH) * 100}%`,
        height: `${ITEM_HEIGHT * VISIBLE_ITEMS}px`,
        zIndex: config.z || 2,
        backgroundColor: '#1c1c1e',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      }}
    >
      {/* Center Highlight Bar */}
      <div
        style={{
          position: 'absolute',
          top: `${ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2)}px`,
          left: '4%',
          width: '92%',
          height: `${ITEM_HEIGHT}px`,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Top & Bottom Gradient Vignette (Gives the cylinder 3D fade) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, #1c1c1e 0%, rgba(28,28,30,0) 25%, rgba(28,28,30,0) 75%, #1c1c1e 100%)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* Hour Column */}
      <WheelColumn
        items={hours}
        value={hour}
        onChange={handleHourChange}
      />

      {/* Minute Column */}
      <WheelColumn
        items={minutes}
        value={minute}
        onChange={handleMinuteChange}
      />
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
            data-slot-id={slotId}
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
  const audioCtxRef = useRef(null);
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const [currentSceneId, setCurrentSceneId] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [userCoords, setUserCoords] = useState(null);

  const [textboxValue, setTextboxValue] = useState('');
  const [timeText, setTimeText] = useState('12:00');
  const [selectedModes, setSelectedModes] = useState([]);

  const stageRef = useRef(null);
  const watchIdRef = useRef(null);

  const taskcompleteRef = useRef({1:false, 2:false, 3:false, 4:false, 5:false, 6:false, 7:false, 8:false});
  const [currentOverlayId, setCurrentOverlayId] = useState(null);

  const openOverlay = (id) => setCurrentOverlayId(id);
  const closeOverlay = () => setCurrentOverlayId(null);

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

    return { text: "💡前往謎題區域", activeTask: null };
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
    if (sceneId==9) {setTimeout(() => goToScene(5, 'fade', 800), 3500);}
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

  const playpiano = (note) => {
    // 3. Lazy initialize AudioContext on the first user interaction
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    const audioCtx = audioCtxRef.current;

    // Resume context if browser put it in 'suspended' state
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    // Parse note pitch and octave (defaults to octave 4 if omitted)
    const match = String(note).trim().match(/^([A-Ga-g][#b]?)([4-5])?$/);
    if (!match) {
      console.warn(`Invalid note format: "${note}". Use e.g. "C", "C#", "F#4", "A5".`);
      return;
    }

    const pitch = match[1].toUpperCase();
    const octave = match[2] ? parseInt(match[2], 10) : 4;

    const semitoneOffset = NOTE_OFFSETS[pitch];
    if (semitoneOffset === undefined) return;

    // Calculate frequency: f = 440 * 2^((midi - 69) / 12)
    const midiNumber = (octave + 1) * 12 + semitoneOffset;
    const frequency = 440 * Math.pow(2, (midiNumber - 69) / 12);

    const now = audioCtx.currentTime;

    // 1. Harmonics
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(frequency, now);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 2, now); // 2nd harmonic overtone

    // 2. Piano envelope
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.7, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.8);
    osc2.stop(now + 1.8);

    // 3. Garbage collection: disconnect nodes to prevent memory leak when spammed
    osc1.onended = () => {
      osc1.disconnect();
      osc2.disconnect();
      gain.disconnect();
    };
  };

  // Demo Scenes Configuration
  const SCENES = {
    1: {
      wallpaper: '/1_1.png',
      divs: {
        1: {
          type: 'button',
          x: 175, y: 1251, w: 556, h: 151, z: 2,
          func: () => goToScene(2, 'crossfade', 1000),
        },
      },
    },
    2: {
      wallpaper: '/1_4.png',
      divs: {
        1: {
          type: 'button',
          x: 213, y: 1374, w: 474, h: 138,
          func: () => goToScene(6, 'fade', 1000),
        },
        2: {
          type: 'button',
          x: 43, y: 14, w: 122, h: 119,
          func: () => goToScene(1, 'fade', 1000),
        }
      },
    },
    6: {
      wallpaper: '/1_5.png',
      divs: {
        1: {
          type: 'button',
          x: 213, y: 1374, w: 474, h: 138,
          func: () => goToScene(3, 'fade', 1000),
        },
        2: {
          type: 'button',
          x: 43, y: 14, w: 122, h: 119,
          func: () => goToScene(2, 'fade', 1000),
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
        2: {
          type: 'button',
          x: 21, y: 36, w: 113, h: 113,
          func: () => goToScene(6, 'fade', 1000),
        }
      },
    },
    4: {
      wallpaper: '/2_3.png',
      divs: {},
    },
    5: {
      isMap: true,
      divs: {
        20: { 
            type: 'button',
            x: 580, y: 80, w: 119, h: 107, z: 1,
            func: () => openOverlay(2),
          },
        30: { 
          type: 'button',
          x: 706, y: 80, w: 122, h: 110, z: 1,
          func: () => openOverlay(3),
        },
        1: { 
          type: 'div',
          x: 49, y: 48, w: 807, h: 176, z: 1, 
          image: '/3_1.png'
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
            image: '/map_bottom.png',
            label: `進入${activeTask.label}`,
            x: 191, y: 1248, w: 524, h: 170, z: 1,
            func: () => {
              setTextboxValue("");
              goToScene(activeTask.scene, 'fade', 800);
            },
          },
        }),
        
      },
    },
    9: {
      wallpaper: '/cor.png',
      divs: {},
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
    11: {
      wallpaper: '/10_2.png',
      divs: {
        1: {
          type: 'generators',
          w: 80, h: 80, z: 3,
          slots: {
            1: { x: 65, y: 431 },
            2: { x: 170, y: 431 },
            3: { x: 655, y: 431 },
            4: { x: 760, y: 431 },
            5: { x: 60, y: 935 },
            6: { x: 165, y: 935 },
            7: { x: 650, y: 935 },
            8: { x: 755, y: 935 },
            9: { x: 305, y: 658 },
            10: { x: 410, y: 658 },
            11: { x: 515, y: 658 },
          },
          gen: {
            1: { image: '/1w1.png', x: 30, y: 1150 },
            2: { image: '/1w2.png', x: 115, y: 1150 },
            3: { image: '/1w3.png', x: 200, y: 1150 },
            4: { image: '/1w4.png', x: 285, y: 1150 },
            5: { image: '/1w5.png', x: 370, y: 1150 },
            6: { image: '/1w6.png', x: 455, y: 1150 },
            7: { image: '/1w7.png', x: 540, y: 1150 },
            8: { image: '/1w8.png', x: 625, y: 1150 },
            9: { image: '/1w9.png', x: 710, y: 1150 },
            10: { image: '/1w10.png', x: 795, y: 1150 },
            11: { image: '/1w11.png', x: 30, y: 1250 },
            12: { image: '/1w12.png', x: 115, y: 1250 },
            13: { image: '/1w13.png', x: 200, y: 1250 },
            14: { image: '/1w14.png', x: 285, y: 1250 },
            15: { image: '/1w15.png', x: 370, y: 1250 },
            16: { image: '/1w16.png', x: 455, y: 1250 },
            17: { image: '/1w17.png', x: 540, y: 1250 },
            18: { image: '/1w18.png', x: 625, y: 1250 },
            19: { image: '/1w19.png', x: 710, y: 1250 },
            20: { image: '/1w20.png', x: 795, y: 1250 },
          },
        },
        2: { 
          type: 'button',
          x: 278, y: 1383, w: 534, h: 160, z: 1,
          func: () => {
            const cor = document.querySelector('[data-slot-id="1"]')?.style.backgroundImage.includes('/1w10.png') &&
              document.querySelector('[data-slot-id="2"]')?.style.backgroundImage.includes('/1w2.png') &&
              document.querySelector('[data-slot-id="3"]')?.style.backgroundImage.includes('/1w10.png') &&
              document.querySelector('[data-slot-id="4"]')?.style.backgroundImage.includes('/1w11.png') &&
              document.querySelector('[data-slot-id="9"]')?.style.backgroundImage.includes('/1w10.png') &&
              document.querySelector('[data-slot-id="10"]')?.style.backgroundImage.includes('/1w13.png') &&
              document.querySelector('[data-slot-id="11"]')?.style.backgroundImage.includes('/1w16.png') &&
              document.querySelector('[data-slot-id="5"]')?.style.backgroundImage.includes('/1w17.png') &&
              document.querySelector('[data-slot-id="6"]')?.style.backgroundImage.includes('/1w20.png') &&
              document.querySelector('[data-slot-id="7"]')?.style.backgroundImage.includes('/1w4.png') &&
              document.querySelector('[data-slot-id="8"]')?.style.backgroundImage.includes('/1w8.png');
            if (cor) {
              taskcompleteRef.current[1]=true;
              goToScene(9, 'crossfade', 800);
            }
            else {
              openOverlay(1);
            }
          },
        },
        3: { 
          type: 'button',
          x: 775, y: 61, w: 94, h: 88, z: 1,
          func: () => {
            openOverlay(4);
          },
        },
        4: { 
          type: 'button',
          x: 77, y: 1389, w: 154, h: 139, z: 1,
          func: () => {
            openOverlay(5);
          },
        },
      },
    },
    20: {
      wallpaper: '/20_1.png',
      divs: {
        1: { 
            type: 'button',
            label: '',
            x: 200, y: 1198, w: 499, h: 151, z: 1,
            func: () => goToScene(21, 'fade', 800),
          },
      },
    },
    21: {
      wallpaper: '/20_2.png',
      divs: {
        1: {
          type: 'textbox',
          x: 65, y: 1220, w: 765, h: 116, z: 3,
          placeholder: '請在此輸入答案…',
          value: textboxValue,
          onChange: (e) => setTextboxValue(e.target.value),
        },
        2: { 
          type: 'button',
          x: 278, y: 1383, w: 534, h: 160, z: 1,
          func: () => {
            if (textboxValue=="76374760") {
              setTextboxValue("");
              goToScene(22, 'crossfade', 800);
            }
            else {
              openOverlay(1);
            }
          },
        },
        3: { 
          type: 'button',
          x: 775, y: 61, w: 94, h: 88, z: 1,
          func: () => {
            openOverlay(4);
          },
        },
        4: { 
          type: 'button',
          x: 77, y: 1389, w: 154, h: 139, z: 1,
          func: () => {
            openOverlay(5);
          },
        },
      },
    },
    22: {
      wallpaper: '/20_3.png',
      divs: {
        1: {
          type: 'textbox',
          x: 65, y: 1175, w: 765, h: 116, z: 3,
          placeholder: '請在此輸入答案…',
          value: textboxValue,
          onChange: (e) => setTextboxValue(e.target.value),
        },
        2: { 
          type: 'button',
          x: 278, y: 1383, w: 534, h: 160, z: 1,
          func: () => {
            if (textboxValue=="彩虹") {
              taskcompleteRef.current[2]=true;
              goToScene(9, 'crossfade', 800);
            }
            else {
              openOverlay(1);
            }
          },
        },
        3: { 
          type: 'button',
          x: 775, y: 61, w: 94, h: 88, z: 1,
          func: () => {
            openOverlay(4);
          },
        },
        4: { 
          type: 'button',
          x: 77, y: 1389, w: 154, h: 139, z: 1,
          func: () => {
            openOverlay(5);
          },
        },
      },
    },
    30: {
      wallpaper: '/30_1.png',
      divs: {
        1: { 
            type: 'button',
            x: 200, y: 1198, w: 496, h: 147, z: 1,
            func: () => goToScene(31, 'fade', 800),
          },
      },
    },
    31: {
      wallpaper: '/30_2.png',
      divs: {
        1: {
          type: 'textbox',
          x: 65, y: 1220, w: 762, h: 116, z: 3,
          placeholder: '請在此輸入答案…',
          value: textboxValue,
          onChange: (e) => setTextboxValue(e.target.value),
        },
        2: { 
          type: 'button',
          x: 278, y: 1383, w: 534, h: 160, z: 1,
          func: () => {
            if (textboxValue=="無間道") {
              taskcompleteRef.current[3]=true;
              goToScene(9, 'crossfade', 800);
            }
            else {
              openOverlay(1);
            }
          },
        },
        3: { 
          type: 'button',
          x: 775, y: 61, w: 94, h: 88, z: 1,
          func: () => {
            openOverlay(4);
          },
        },
        4: { 
          type: 'button',
          x: 77, y: 1389, w: 154, h: 139, z: 1,
          func: () => {
            openOverlay(5);
          },
        },
      },
    },
    40: {
      wallpaper: '/40_1.png',
      divs: {
        1: { 
            type: 'button',
            x: 203, y: 1223, w: 490, h: 135, z: 1,
            func: () => goToScene(41, 'fade', 800),
          },
      },
    },
    41: {
      wallpaper: '/40_2.png',
      divs: {
        1: {
          type: 'textbox',
          x: 62, y: 1220, w: 770, h: 116, z: 3,
          placeholder: '請在此輸入答案…',
          value: textboxValue,
          onChange: (e) => setTextboxValue(e.target.value),
        },
        2: { 
          type: 'button',
          x: 278, y: 1383, w: 534, h: 160, z: 1,
          func: () => {
            if (textboxValue=="好世界洋樓") {
              taskcompleteRef.current[4]=true;
              goToScene(9, 'crossfade', 800);
            }
            else {
              openOverlay(1);
            }
          },
        },
        3: { 
          type: 'button',
          x: 775, y: 61, w: 94, h: 88, z: 1, z: 1,
          func: () => {
            openOverlay(4);
          },
        },
        4: { 
          type: 'button',
          x: 77, y: 1389, w: 154, h: 139, z: 1,
          func: () => {
            openOverlay(5);
          },
        },
        5: { 
          type: 'button',
          x: 112, y: 736, w: 188, h: 308, z: 1,
          func: () => {
            openOverlay(6);
          },
        },
        6: { 
          type: 'button',
          x: 354, y: 739, w: 188, h: 292, z: 1,
          func: () => {
            openOverlay(7);
          },
        },
        7: { 
          type: 'button',
          x: 593, y: 736, w: 191, h: 292, z: 1,
          func: () => {
            openOverlay(8);
          },
        },
      },
    },
    50: {
      wallpaper: '/50_1.png',
      divs: {
        1: { 
            type: 'button',
            x: 200, y: 1201, w: 496, h: 141, z: 1,
            func: () => goToScene(50, 'fade', 800),
          },
        2: { 
            type: 'button',
            x: 278, y: 1383, w: 534, h: 160, z: 1,
            func: () => {
              taskcompleteRef.current[5]=true;
              goToScene(9, 'crossfade', 800);
            }
          },
      },
    },
    60: {
      wallpaper: '/60_1.png',
      divs: {
        1: { 
            type: 'button',
            x: 203, y: 1201, w: 490, h: 144, z: 1,
            func: () => goToScene(60, 'fade', 800),
          },
        2: { 
            type: 'button',
            x: 278, y: 1383, w: 534, h: 160, z: 1,
            func: () => {
              taskcompleteRef.current[6]=true;
              goToScene(9, 'crossfade', 800);
            }
          },
      },
    },
    70: {
      wallpaper: '/70_1.png',
      divs: {
        1: { 
            type: 'button',
            x: 200, y: 1198, w: 496, h: 144, z: 1,
            func: () => goToScene(71, 'fade', 800),
          },
      },
    },
    71: {
      wallpaper: '/70_2.png',
      divs: {
        1: {
          type: 'button',
          x: 209, y: 598, w: 478, h: 113, z: 3,
          func: () => {openOverlay(9);},
        },
        2: {
          type: 'checkboxes',
          onChange: (keys) => {setSelectedModes(keys);},
          buttons: {
            1: { x: 209, y: 755, w: 161, h: 145, z: 2},
            2: { x: 376, y: 755, w: 161, h: 145, z: 2},
            3: { x: 545, y: 755, w: 161, h: 145, z: 2},
            4: { x: 712, y: 755, w: 161, h: 145, z: 2},
            5: { x: 288, y: 965, w: 138, h: 135, z: 2},
            6: { x: 436, y: 965, w: 138, h: 135, z: 2},
            7: { x: 577, y: 965, w: 138, h: 135, z: 2},
            8: { x: 728, y: 965, w: 138, h: 135, z: 2},
            9: { x: 288, y: 1170, w: 138, h: 128, z: 2},
            10: { x: 432, y: 1170, w: 138, h: 128, z: 2},
            11: { x: 580, y: 1170, w: 138, h: 128, z: 2},
            12: { x: 722, y: 1170, w: 138, h: 128, z: 2},
          },
        },
        3: {
          type: "button",
          x: 278, y: 1383, w: 534, h: 160,
          func: () => {
            if (timeText=="02:00" && JSON.stringify(selectedModes.sort())==JSON.stringify(['1','10','3','5','6'])) {
              taskcompleteRef.current[7]=true;
              goToScene(9, 'crossfade', 800);
            }
            else {
              openOverlay(1);
            }
          },
        },
        4: { 
          type: 'button',
          x: 775, y: 61, w: 94, h: 88, z: 1,
          func: () => {
            openOverlay(4);
          },
        },
        5: { 
          type: 'button',
          x: 77, y: 1389, w: 154, h: 139, z: 1,
          func: () => {
            openOverlay(5);
          },
        },
        6: { 
          type: 'text',
          text: timeText,
          color: "000000",
          fontSize: 20,
          x: 329, y: 607, w: 301, h: 88, z: 1,
        },
      },
    },
    80: {
      wallpaper: '/80_1.png',
      divs: {
        1: { 
            type: 'button',
            label: '形品星寓',
            x: 200, y: 1204, w: 502, h: 148, z: 1,
            func: () => goToScene(81, 'fade', 800),
          },
      },
    },
    81: {
      wallpaper: '/80_2.png',
      divs: {
        1: { 
            type: 'button',
            x: 118, y: 625, w: 91, h: 282, z: 1,
            func: () => {playpiano("C");}
          },
        2: { 
            type: 'button',
            x: 209, y: 625, w: 91, h: 282, z: 1,
            func: () => {playpiano("D");}
          },
        3: { 
            type: 'button',
            x: 300, y: 625, w: 91, h: 282, z: 1,
            func: () => {playpiano("E");}
          },
        4: { 
            type: 'button',
            x: 394, y: 625, w: 94, h: 282, z: 1,
            func: () => {playpiano("F");}
          },
        5: { 
            type: 'button',
            x: 487, y: 625, w: 100, h: 282, z: 1,
            func: () => {playpiano("G");}
          },
        6: { 
            type: 'button',
            x: 586, y: 625, w: 94, h: 282, z: 1,
            func: () => {playpiano("A");}
          },
        7: { 
            type: 'button',
            x: 684, y: 625, w: 94, h: 282, z: 1,
            func: () => {playpiano("B");}
          },
        8: { 
            type: 'button',
            x: 184, y: 625, w: 54, h: 170, z: 2,
            func: () => {playpiano("C#");}
          },
        9: { 
            type: 'button',
            x: 278, y: 625, w: 51, h: 170, z: 2,
            func: () => {playpiano("D#");}
          },
        10: { 
            type: 'button',
            x: 462, y: 625, w: 50, h: 170, z: 2,
            func: () => {playpiano("F#");}
          },
        11: { 
            type: 'button',
            x: 558, y: 625, w: 57, h: 170, z: 2,
            func: () => {playpiano("G#");}
          },
        12: { 
            type: 'button',
            x: 655, y: 625, w: 57, h: 170, z: 2,
            func: () => {playpiano("A#");}
          },
        13: { 
            type: 'button',
            x: 90, y: 994, w: 113, h: 113, z: 2,
            func: () => {
              setTimeout(() => playpiano("A"), 500);
              setTimeout(() => playpiano("G"), 1000);
              setTimeout(() => playpiano("E"), 1500);
            }
          },
        14: {
          type: 'textbox',
          x: 62, y: 1217, w: 766, h: 119, z: 3,
          placeholder: '請在此輸入答案…',
          value: textboxValue,
          onChange: (e) => setTextboxValue(e.target.value),
        },
        15: { 
          type: 'button',
          x: 278, y: 1383, w: 534, h: 160, z: 1,
          func: () => {
            if (textboxValue.toUpperCase()=="AGE") {
              taskcompleteRef.current[8]=true;
              goToScene(9, 'crossfade', 800);
            }
            else {
              openOverlay(1);
            }
          },
        },
        16: { 
          type: 'button',
          x: 775, y: 61, w: 94, h: 88, z: 1,
          func: () => {
            openOverlay(4);
          },
        },
        17: { 
          type: 'button',
          x: 77, y: 1389, w: 154, h: 139, z: 1,
          func: () => {
            openOverlay(5);
          },
        },
      },
    }
  };

  const puzzleElements = Object.entries(taskcompleteRef.current).reduce((acc, [x, isComplete]) => {
    if (isComplete) {
      acc[3 + Number(x)] = {
        type: 'div',
        x: 0, y: 0, w: 900, h: 1600, z: 2,
        image: `/puz${x}.png`,
      };
    }
    return acc;
  }, {});

  const OVERLAY = {
    1: {
      wallpaper: '/wrong.png',
      divs: {
        1: {
          type: 'button',
          x: 203, y: 950, w: 493, h: 125, z: 2,
          label: '',
          func: () => closeOverlay(),
        },
      },
    },
    2: {
      wallpaper: '/puz.png',
      divs: {
        1: {
          type: 'button',
          x: 762, y: 117, w: 85, h: 82, z: 3,
          label: '',
          func: () => closeOverlay(),
        },
        2: { 
          type: 'text',
          text: Object.values(taskcompleteRef.current).filter(Boolean).length.toString(),
          color: "#f2ce6d",
          fontSize: 30,
          x: 469, y: 1365, w: 50, h: 69, z: 2,
        },
        ...puzzleElements
      },
    },
    3: {
      wallpaper: '/cser.png',
      divs: {
        1: {
          type: 'button',
          x: 693, y: 457, w: 79, h: 78, z: 2,
          label: '',
          func: () => closeOverlay(),
        },
      },
    },
    4: {
      wallpaper: '/pop.png',
      divs: {
        1: {
          type: 'button',
          x: 690, y: 375, w: 160, h: 150, z: 2,
          label: '',
          func: () => closeOverlay(),
        },
        2: {
          type: 'button',
          x: 87, y: 563, w: 741, h: 164, z: 2,
          label: '',
          func: () => openOverlay(3),
        },
        3: {
          type: 'button',
          x: 87, y: 727, w: 741, h: 191, z: 2,
          label: '',
          func: () => openOverlay(2),
        },
        4: {
          type: 'button',
          x: 87, y: 918, w: 741, h: 179, z: 2,
          label: '',
          func: () => {
            closeOverlay();
            goToScene(5, 'fade', 800);
          },
        },
      },
    },
    5: {
      wallpaper: '/hint.png',
      divs: {
        1: {
          type: 'button',
          x: 709, y: 388, w: 69, h: 75, z: 2,
          label: '',
          func: () => closeOverlay(),
        },
      },
    },
    6: {
      wallpaper: '/40_mag1.png',
      divs: {
        1: {
          type: 'button',
          x: 756, y: 146, w: 91, h: 91, z: 2,
          label: '',
          func: () => closeOverlay(),
        },
        2: {
          type: 'button',
          x: 291, y: 1345, w: 110, h: 110, z: 2,
          label: '',
          func: () => openOverlay(8),
        },
        3: {
          type: 'button',
          x: 495, y: 1345, w: 110, h: 110, z: 2,
          label: '',
          func: () => openOverlay(7),
        },
      },
    },
    7: {
      wallpaper: '/40_mag2.png',
      divs: {
        1: {
          type: 'button',
          x: 756, y: 146, w: 91, h: 91, z: 2,
          label: '',
          func: () => closeOverlay(),
        },
        2: {
          type: 'button',
          x: 291, y: 1345, w: 110, h: 110, z: 2,
          label: '',
          func: () => openOverlay(6),
        },
        3: {
          type: 'button',
          x: 495, y: 1345, w: 110, h: 110, z: 2,
          label: '',
          func: () => openOverlay(8),
        },
      },
    },
    8: {
      wallpaper: '/40_mag3.png',
      divs: {
        1: {
          type: 'button',
          x: 756, y: 146, w: 91, h: 91, z: 2,
          label: '',
          func: () => closeOverlay(),
        },
        2: {
          type: 'button',
          x: 291, y: 1345, w: 110, h: 110, z: 2,
          label: '',
          func: () => openOverlay(7),
        },
        3: {
          type: 'button',
          x: 495, y: 1345, w: 110, h: 110, z: 2,
          label: '',
          func: () => openOverlay(6),
        },
      },
    },
    9: {
      divs: {
        1: {
          type: 'button',
          x: 0, y: 0, w: 900, h: 1600, z: 1,
          label: '',
          func: () => closeOverlay(),
        },
        2: {
          type: 'clock'
        },
      },
    }
  }

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

          if (item.type === 'checkboxes') {
            return <CheckboxesGroup key={key} config={item} />;
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
                  fontFamily: 'MyCustomFont',
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

  const renderOverlay = () => {
    if (!currentOverlayId || !OVERLAY[currentOverlayId]) return null;
    const overlay = OVERLAY[currentOverlayId];

    return (
      <>
        {/* 1. Semi-transparent black backdrop between the scene and overlay */}
        <div
          className="overlay-backdrop"
          onClick={closeOverlay} // Tapping dimmed background closes the overlay
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)', // Adjust dim darkness here
            zIndex: 999, // Sits above scene, behind overlay content
          }}
        />

        {/* 2. The 9:16 Overlay Content */}
        <div
          className="scene-layer overlay-layer"
          style={{
            zIndex: 1000,
            backgroundImage: overlay.wallpaper ? `url(${overlay.wallpaper})` : 'none',
          }}
        >
          {overlay.divs &&
            Object.entries(overlay.divs).map(([key, item]) => {
              const bgImage = item.image
                ? `url(${item.image.startsWith('/') ? item.image : `/${item.image}`})`
                : undefined;

              const itemStyle = {
                position: 'absolute',
                left: `${(item.x / BASE_WIDTH) * 100}%`,
                top: `${(item.y / BASE_HEIGHT) * 100}%`,
                width: `${(item.w / BASE_WIDTH) * 100}%`,
                height: `${(item.h / BASE_HEIGHT) * 100}%`,
                zIndex: item.z || 2,
                backgroundImage: bgImage,
                backgroundSize: bgImage ? '100% 100%' : undefined,
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                cursor: item.func ? 'pointer' : 'default',
              };

              if (item.type === 'button') {
                return (
                  <button
                    key={`overlay-btn-${key}`}
                    className="action-button"
                    onClick={item.func}
                    style={itemStyle}
                  >
                    {item.label}
                  </button>
                );
              }

              if (item.type === 'clock') {
                return(<WheelTimePicker
                  config={{
                    x: 200,
                    y: 380,
                    w: 500,
                    z: 5,
                    defaultHour: timeText.split(':').map(Number)[0],
                    defaultMinute: timeText.split(':').map(Number)[1],
                  }}
                  onChange={({ hour, minute }) => {
                    setTimeText(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
                  }}
                />)
              }

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
                      fontFamily: 'MyCustomFont',
                      fontSize: item.fontSize || '16px',
                      color: hex,
                    }}
                  >
                    {item.text}
                  </div>
                );
              }

              return (
                <div
                  key={`overlay-div-${key}`}
                  className="action-div"
                  onClick={item.func}
                  style={itemStyle}
                >
                  {item.label}
                </div>
              );
            })}
        </div>
      </>
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
        {renderOverlay()}
      </div>
    </div>
  );
}

export default App;