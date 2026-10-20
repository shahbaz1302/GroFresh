"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

type Position = [number, number];

type CheckoutMapProps = {
  position: Position;
  setPosition: (position: Position) => void;
};

const markerIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/128/854/854853.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const CheckoutMap = ({ position, setPosition }: CheckoutMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const setPositionRef = useRef(setPosition);
  const initialPositionRef = useRef(position);

  useEffect(() => {
    setPositionRef.current = setPosition;
  }, [setPosition]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current as HTMLDivElement & { _leaflet_id?: number };
    if (container._leaflet_id) {
      delete container._leaflet_id;
    }

    const map = L.map(containerRef.current, {
      center: initialPositionRef.current,
      zoom: 13,
      scrollWheelZoom: true,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const marker = L.marker(initialPositionRef.current, {
      icon: markerIcon,
      draggable: true,
    }).addTo(map);
    markerRef.current = marker;

    marker.on("dragend", () => {
      const latLng = marker.getLatLng();
      setPositionRef.current([latLng.lat, latLng.lng]);
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setPositionRef.current([e.latlng.lat, e.latlng.lng]);
    });

    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

    const currentLatLng = markerRef.current.getLatLng();
    if (
      Math.abs(currentLatLng.lat - position[0]) > 0.0001 ||
      Math.abs(currentLatLng.lng - position[1]) > 0.0001
    ) {
      markerRef.current.setLatLng(position);
      mapRef.current.setView(position, 13, { animate: true });
    }
  }, [position]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full [&_.leaflet-control-attribution]:rounded-tl-lg [&_.leaflet-control-attribution]:bg-white/85 [&_.leaflet-control-attribution]:px-1.5 [&_.leaflet-control-attribution]:text-[10px] [&_.leaflet-control-zoom]:overflow-hidden [&_.leaflet-control-zoom]:rounded-xl [&_.leaflet-control-zoom]:border-0 [&_.leaflet-control-zoom]:shadow-md"
    />
  );
};

export default CheckoutMap;
