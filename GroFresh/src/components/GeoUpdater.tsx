"use client";

import { getSocket } from "@/lib/socket";
import { useEffect } from "react";

const GeoUpdater = ({ userId }: { userId: string }) => {
  let socket = getSocket();

  useEffect(() => {
    if (!userId) return;
    if (!navigator.geolocation) return;
    const watcher = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        socket.emit("update_location", { userId, latitude, longitude });
      },
      (error) => {
        console.log("Error getting location:", error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
    );
    return () => navigator.geolocation.clearWatch(watcher);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const registerOnline = () => {
      socket.emit("user_online", userId);
    };

    registerOnline();

    socket.on("connect", registerOnline);

    return () => {
      socket.off("connect", registerOnline);
    };
  }, [userId]);

  return null;
};

export default GeoUpdater;
