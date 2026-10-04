import { useState, useEffect, useRef } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import './index.css';

const BASE_WIDTH = 740;
const BASE_HEIGHT = 1600;

/**
 * OpenStreetMap Leaflet Component
 */
function OSMMap({ coords }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!window.L || !mapContainerRef.current) return;

    const map = window.L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([coords.lat, coords.lon], 17);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    const gpsIcon = window.L.divIcon({
      className: 'live-gps-marker',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    const marker = window.L.marker([coords.lat, coords.lon], { icon: gpsIcon }).addTo(map);
    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => map.remove();
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && coords) {
      const newLatLng = [coords.lat, coords.lon];
      markerRef.current.setLatLng(newLatLng);
      mapInstanceRef.current.panTo(newLatLng, { animate: true, duration: 1 });
    }
  }, [coords]);

  return <div ref={mapContainerRef} className="map-frame" style={{'zIndex':0}} />;
}

/**
 * Draggables Group Component with Slot Snapping & Non-Overlapping Logic
 */
function DraggablesGroup({ config, stageRef }) {
  // Store which slot each item currently occupies: { [itemId]: slotId }
  const [placements, setPlacements] = useState(() => {
    const initial = {};
    Object.entries(config.div || {}).forEach(([itemId, data]) => {
      initial[itemId] = Number(data.slot);
    });
    return initial;
  });

  // Track live drag position { id, x, y } in 740x1600 coordinates
  const [dragState, setDragState] = useState(null);

  const handlePointerDown = (itemId, e) => {
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);

    const stageRect = stageRef.current.getBoundingClientRect();
    const currentSlot = config.slots[placements[itemId]];

    setDragState({
      id: itemId,
      origSlot: placements[itemId],
      x: currentSlot ? currentSlot.x : 0,
      y: currentSlot ? currentSlot.y : 0,
      startX: e.clientX,
      startY: e.clientY,
      initX: currentSlot ? currentSlot.x : 0,
      initY: currentSlot ? currentSlot.y : 0,
      stageWidth: stageRect.width,
      stageHeight: stageRect.height,
    });
  };

  const handlePointerMove = (e) => {
    if (!dragState) return;

    // Convert pixel screen movement into 740x1600 base coordinate space
    const deltaX = ((e.clientX - dragState.startX) / dragState.stageWidth) * BASE_WIDTH;
    const deltaY = ((e.clientY - dragState.startY) / dragState.stageHeight) * BASE_HEIGHT;

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

    const { id, x, y, origSlot } = dragState;

    // Find the closest slot
    let closestSlotId = null;
    let minDistance = Infinity;

    Object.entries(config.slots).forEach(([slotId, slotCoords]) => {
      const dist = Math.hypot(slotCoords.x - x, slotCoords.y - y);
      if (dist < minDistance) {
        minDistance = dist;
        closestSlotId = Number(slotId);
      }
    });

    // Check if the closest slot is already taken by another item
    const isOccupied = Object.entries(placements).some(
      ([otherId, slotId]) => otherId !== String(id) && slotId === closestSlotId
    );

    // Snap to target if unoccupied and within a reasonable snap distance (350px)
    if (closestSlotId !== null && !isOccupied && minDistance < 350) {
      setPlacements((prev) => ({ ...prev, [id]: closestSlotId }));
    } else {
      // Revert to original slot if occupied or dragged too far away
      setPlacements((prev) => ({ ...prev, [id]: origSlot }));
    }

    setDragState(null);
  };

  return (
    <div className="draggables-container" style={{ zIndex: config.z || 2 }}>
      {/* Visual Slot Targets (Optional guide outlines) */}
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

      {/* Draggable Items */}
      {Object.entries(config.div || {}).map(([itemId, itemData]) => {
        const isDragging = dragState?.id === itemId;
        const currentSlot = config.slots[placements[itemId]];

        const currentX = isDragging ? dragState.x : currentSlot?.x || 0;
        const currentY = isDragging ? dragState.y : currentSlot?.y || 0;

        const bgImage = itemData.image
          ? `url(${itemData.image.startsWith('/') ? itemData.image : `/${itemData.image}`})`
          : undefined;

        return (
          <div
            key={`drag-${itemId}`}
            className={`draggable-item ${isDragging ? 'is-dragging' : ''}`}
            onPointerDown={(e) => handlePointerDown(itemId, e)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              left: `${(currentX / BASE_WIDTH) * 100}%`,
              top: `${(currentY / BASE_HEIGHT) * 100}%`,
              width: `${(config.w / BASE_WIDTH) * 100}%`,
              height: `${(config.h / BASE_HEIGHT) * 100}%`,
              backgroundImage: bgImage,
              zIndex: isDragging ? 999 : config.z || 2,
              transition: isDragging ? 'none' : 'all 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)',
            }}
          />
        );
      })}
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

  const [blackFade, setBlackFade] = useState({ opacity: 1, duration: 0 });
  const [crossfade, setCrossfade] = useState(null);

  const enablelocation = async () => {
    goToScene(5, 'fade', 800);
    setUserCoords({ lat: 22.3193, lon: 114.1694 });
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

  // Scene Configuration with textboxes and draggables support
  const SCENES = {
    1: {
      wallpaper: '/1_1.png',
      divs: {
        1: { 
          type: 'button',
          x: 139, y: 1250, w: 466, h: 155, z: 1,
          func: () => goToScene(2, 'crossfade', 1000) 
        },
      },
    },
    2: {
      wallpaper: '/1_4.png',
      divs: {
        // 1. Textbox element example
        1: {
          type: 'textbox',
          x: 160, y: 500, w: 420, h: 90, z: 3,
          placeholder: 'Enter text here...',
          value: textboxValue,
          onChange: (e) => setTextboxValue(e.target.value),
        },
        // 2. Draggables group element
        2: {
          type: 'draggables',
          w: 200, h: 200, z: 2,
          slots: {
            1: { x: 160, y: 1325 },
            2: { x: 160, y: 1025 },
            3: { x: 160, y: 725 },
          },
          div: {
            1: {
              image: '/3_1.png',
              slot: 1,
            },
            2: {
              image: '/3.png',
              slot: 3,
            },
          },
        },
        3: { 
          type: 'button',
          x: 160, y: 1325, w: 420, h: 130, z: 1,
          func: () => goToScene(3, 'crossfade', 1000) 
        },
      },
    },
    3: {
      wallpaper: '/2_1.png',
      divs: {
        1: { 
          type: 'button',
          x: 160, y: 1325, w: 420, h: 130, z: 1,
          func: () => enablelocation()
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
          x: 160, y: 1325, w: 420, h: 130, z: 1, image: "/3_1.png",
          func: () => enablelocation()
        },

      },
    },
  };

  // Prevent mobile gesture scrolling, but allow touch on inputs, map, and draggables
  useEffect(() => {
    const preventDefault = (e) => {
      if (
        e.target.closest('.map-frame') ||
        e.target.closest('.action-textbox') ||
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
        {scene.isMap && userCoords && <OSMMap coords={userCoords} />}

        {Object.entries(elements).map(([key, item]) => {
          // --- TYPE: DRAGGABLES ---
          if (item.type === 'draggables') {
            return (
              <DraggablesGroup
                key={key}
                config={item}
                stageRef={stageRef}
              />
            );
          }

          // Common positioning styles for standard items
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

          // --- TYPE: TEXTBOX ---
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

          // --- TYPE: DIV ---
          if (item.type === 'div') {
            return (
              <div
                key={key}
                className="action-div"
                onClick={item.func}
                style={itemStyle}
              >
                {item.label}
              </div>
            );
          }

          // --- TYPE: BUTTON (default) ---
          return (
            <button
              key={key}
              className="action-button"
              onClick={item.func}
              style={itemStyle}
            >
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