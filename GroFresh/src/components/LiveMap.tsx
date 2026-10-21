"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

export interface LiveMapProps {
  userLocation: { latitude: number; longitude: number };
  deliveryBoyLocation: { latitude: number; longitude: number } | null;
  className?: string;
}

const LiveMap = ({
  userLocation,
  deliveryBoyLocation,
  className,
}: LiveMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if ((containerRef.current as any)._leaflet_id) {
      delete (containerRef.current as any)._leaflet_id;
    }

    const initialLat = Number.isFinite(userLocation?.latitude)
      ? userLocation.latitude
      : 28.6139;
    const initialLng = Number.isFinite(userLocation?.longitude)
      ? userLocation.longitude
      : 77.209;

    const map = L.map(containerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const timer = setTimeout(() => {
      try {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      } catch (e) {
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      try {
        if (mapRef.current) {
          mapRef.current.remove();
        }
      } catch (e) {}
      mapRef.current = null;
      userMarkerRef.current = null;
      riderMarkerRef.current = null;
      polylineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const userIcon = L.divIcon({
      className: "custom-user-pin",
      html: `<div style="background-color: #2e7d32; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18],
    });

    const riderIcon = L.divIcon({
      className: "custom-delivery-pin",
      html: `<div style="background-color: #0284c7; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18],
    });

    const hasValidUserLocation =
      userLocation &&
      Number.isFinite(userLocation.latitude) &&
      Number.isFinite(userLocation.longitude) &&
      (userLocation.latitude !== 0 || userLocation.longitude !== 0);

    const hasValidRiderLocation =
      deliveryBoyLocation &&
      Number.isFinite(deliveryBoyLocation.latitude) &&
      Number.isFinite(deliveryBoyLocation.longitude) &&
      (deliveryBoyLocation.latitude !== 0 || deliveryBoyLocation.longitude !== 0);

    if (hasValidUserLocation) {
      const userLatLng: L.LatLngTuple = [
        userLocation.latitude,
        userLocation.longitude,
      ];
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker(userLatLng, { icon: userIcon })
          .bindPopup("Customer Drop Location")
          .addTo(map);
      } else {
        userMarkerRef.current.setLatLng(userLatLng);
      }
    }

    if (hasValidRiderLocation && hasValidUserLocation) {
      const riderLatLng: L.LatLngTuple = [
        deliveryBoyLocation.latitude,
        deliveryBoyLocation.longitude,
      ];

      if (!riderMarkerRef.current) {
        riderMarkerRef.current = L.marker(riderLatLng, { icon: riderIcon })
          .bindPopup("Delivery Partner")
          .addTo(map);
      } else {
        riderMarkerRef.current.setLatLng(riderLatLng);
      }

      const linePositions: L.LatLngTuple[] = [
        [userLocation.latitude, userLocation.longitude],
        riderLatLng,
      ];

      if (!polylineRef.current) {
        polylineRef.current = L.polyline(linePositions, {
          color: "#2e7d32",
          weight: 3,
          dashArray: "6, 8",
          opacity: 0.85,
        }).addTo(map);
      } else {
        polylineRef.current.setLatLngs(linePositions);
      }

      try {
        const bounds = L.latLngBounds(linePositions);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16, animate: false });
        }
      } catch (e) {}
    } else {
      if (riderMarkerRef.current) {
        try {
          map.removeLayer(riderMarkerRef.current);
        } catch (e) {}
        riderMarkerRef.current = null;
      }
      if (polylineRef.current) {
        try {
          map.removeLayer(polylineRef.current);
        } catch (e) {}
        polylineRef.current = null;
      }

      if (hasValidUserLocation) {
        try {
          map.setView([userLocation.latitude, userLocation.longitude], 14, {
            animate: false,
          });
        } catch (e) {}
      }
    }
  }, [
    userLocation?.latitude,
    userLocation?.longitude,
    deliveryBoyLocation?.latitude,
    deliveryBoyLocation?.longitude,
  ]);

  const containerClass =
    className ||
    "relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-[#dce8d4] shadow-inner";

  return <div ref={containerRef} className={containerClass} style={{ isolation: "isolate" }} />;
};

export default LiveMap;
