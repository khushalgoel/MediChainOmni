"use client";

import { useState, useEffect, useCallback } from "react";

export interface GeoLocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  nearestPincode: string;
  nearestRegion: string;
  nearestHospitals: string[];
  status: "IDLE" | "PROMPTING" | "GRANTED" | "DENIED" | "UNAVAILABLE";
  errorMessage: string | null;
}

// Regional reference zones across India
const PINCODE_REGIONS = [
  { pincode: "110029", name: "Delhi Safdarjung Enclave / South Delhi", lat: 28.5670, lon: 77.2000, hospitals: ["AIIMS New Delhi", "Safdarjung Hospital Delhi", "Fortis Escorts Saket", "Max Super Speciality"] },
  { pincode: "110085", name: "Delhi Rohini Sector 14 / North West Delhi", lat: 28.7150, lon: 77.1120, hospitals: ["Dr. BSA Hospital Rohini", "Max Shalimar Bagh", "Fortis Shalimar Bagh", "Saroj Hospital"] },
  { pincode: "110001", name: "Delhi Connaught Place / Central Delhi", lat: 28.6315, lon: 77.2167, hospitals: ["Lok Nayak Hospital (LNJP)", "Lady Hardinge", "Sir Ganga Ram", "RML Hospital"] },
  { pincode: "110075", name: "Delhi Dwarka Sector 10 / South West Delhi", lat: 28.5921, lon: 77.0460, hospitals: ["Manipal Hospital Dwarka", "Venkateshwar Hospital", "Indira Gandhi Hospital"] },
  { pincode: "110020", name: "Delhi Okhla Phase III / South East Delhi", lat: 28.5307, lon: 77.2713, hospitals: ["Indraprastha Apollo", "Holy Family Hospital", "Fortis Escorts Okhla"] },
  { pincode: "110092", name: "Delhi Laxmi Nagar / East Delhi", lat: 28.6300, lon: 77.2780, hospitals: ["Max Super Speciality Patparganj", "Dharamshila Narayana", "LBS Hospital"] },
  { pincode: "122002", name: "Gurugram Cyber City / Sector 29", lat: 28.4950, lon: 77.0895, hospitals: ["Medanta - The Medicity", "Fortis FMRI", "Artemis Hospital", "Paras Health"] },
  { pincode: "201301", name: "Noida Sector 62 / Gautam Buddha Nagar", lat: 28.6280, lon: 77.3649, hospitals: ["Jaypee Hospital", "Fortis Hospital Noida", "Kailash Hospital"] },
  { pincode: "400001", name: "Mumbai Fort / Colaba", lat: 18.9322, lon: 72.8339, hospitals: ["Lilavati Hospital", "Bombay Hospital", "KEM Hospital"] },
  { pincode: "560001", name: "Bengaluru MG Road", lat: 12.9716, lon: 77.5946, hospitals: ["Manipal Hospital Bangalore", "Victoria Hospital", "Apollo Bannerghatta"] },
  { pincode: "600001", name: "Chennai George Town", lat: 13.0827, lon: 80.2707, hospitals: ["Rajiv Gandhi Govt General Hospital", "Apollo Greams Road"] },
  { pincode: "700001", name: "Kolkata BBD Bagh", lat: 22.5726, lon: 88.3639, hospitals: ["Medical College Kolkata", "SSKM Hospital", "Apollo Gleneagles"] }
];

export function findNearestHealthcareZone(lat: number, lon: number) {
  let closest = PINCODE_REGIONS[0];
  let minD = Infinity;

  for (const r of PINCODE_REGIONS) {
    const d = Math.hypot(lat - r.lat, lon - r.lon);
    if (d < minD) {
      minD = d;
      closest = r;
    }
  }

  return closest;
}

export function useGeolocation() {
  const [geoState, setGeoState] = useState<GeoLocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    nearestPincode: "110029",
    nearestRegion: "Delhi Safdarjung Enclave / South Delhi",
    nearestHospitals: ["AIIMS New Delhi", "Safdarjung Hospital Delhi", "Fortis Escorts Saket"],
    status: "IDLE",
    errorMessage: null
  });

  const requestPermission = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoState(prev => ({
        ...prev,
        status: "UNAVAILABLE",
        errorMessage: "Geolocation is not supported by your browser."
      }));
      return;
    }

    setGeoState(prev => ({ ...prev, status: "PROMPTING" }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const nearest = findNearestHealthcareZone(latitude, longitude);

        setGeoState({
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          nearestPincode: nearest.pincode,
          nearestRegion: nearest.name,
          nearestHospitals: nearest.hospitals,
          status: "GRANTED",
          errorMessage: null
        });
      },
      (error) => {
        let msg = "User denied GPS geolocation permission.";
        if (error.code === error.POSITION_UNAVAILABLE) msg = "Location information is unavailable.";
        if (error.code === error.TIMEOUT) msg = "The request to get location timed out.";

        setGeoState(prev => ({
          ...prev,
          status: "DENIED",
          errorMessage: msg
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, []);

  return { geoState, requestPermission };
}
