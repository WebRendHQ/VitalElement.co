'use client';

import { useState, useEffect } from 'react';
import styles from './locationMap.module.scss';

// Define location data with coordinates
const LOCATIONS = [
  { 
    id: 'nyc', 
    name: 'New York City', 
    address: '123 Broadway, New York, NY 10001',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    pods: 5
  },
  { 
    id: 'sf', 
    name: 'San Francisco', 
    address: '456 Market St, San Francisco, CA 94105',
    coordinates: { lat: 37.7749, lng: -122.4194 },
    pods: 3
  },
  { 
    id: 'la', 
    name: 'Los Angeles', 
    address: '789 Hollywood Blvd, Los Angeles, CA 90028',
    coordinates: { lat: 34.0522, lng: -118.2437 },
    pods: 4
  },
  { 
    id: 'chicago', 
    name: 'Chicago', 
    address: '321 Michigan Ave, Chicago, IL 60601',
    coordinates: { lat: 41.8781, lng: -87.6298 },
    pods: 3
  },
  { 
    id: 'miami', 
    name: 'Miami', 
    address: '555 Ocean Dr, Miami, FL 33139',
    coordinates: { lat: 25.7617, lng: -80.1918 },
    pods: 2
  }
];

interface LocationMapProps {
  selectedLocation: string;
  onLocationSelect: (locationId: string) => void;
}

// Add Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

export default function LocationMap({ selectedLocation, onLocationSelect }: LocationMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeLocation, setActiveLocation] = useState<string | null>(null);

  // Load Google Maps script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.google) {
      const googleMapsScript = document.createElement('script');
      googleMapsScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      googleMapsScript.async = true;
      googleMapsScript.defer = true;
      googleMapsScript.onload = () => setMapLoaded(true);
      document.head.appendChild(googleMapsScript);

      return () => {
        document.head.removeChild(googleMapsScript);
      };
    } else if (window.google) {
      setMapLoaded(true);
    }
  }, []);

  // Initialize map once script is loaded
  useEffect(() => {
    if (!mapLoaded) return;

    const mapOptions = {
      center: { lat: 39.8283, lng: -98.5795 }, // Center of US
      zoom: 4,
      styles: [
        {
          featureType: 'all',
          elementType: 'geometry',
          stylers: [{ color: '#f9f7f7' }]
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#a8d8ea' }]
        },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#ffffff' }]
        }
      ],
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false
    };

    const map = new window.google.maps.Map(
      document.getElementById('location-map') as HTMLElement,
      mapOptions
    );

    // Add markers for each location
    const markers = LOCATIONS.map(location => {
      const marker = new window.google.maps.Marker({
        position: location.coordinates,
        map,
        title: location.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: location.id === selectedLocation ? '#5d8aa8' : '#aa96da',
          fillOpacity: 0.7,
          strokeColor: 'white',
          strokeWeight: 2
        }
      });

      // Create info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="${styles.infoWindow}">
            <h3>${location.name}</h3>
            <p>${location.address}</p>
            <p>${location.pods} pods available</p>
          </div>
        `
      });

      // Add click event
      marker.addListener('click', () => {
        onLocationSelect(location.id);
      });

      // Add hover events
      marker.addListener('mouseover', () => {
        setActiveLocation(location.id);
        infoWindow.open(map, marker);
      });

      marker.addListener('mouseout', () => {
        setActiveLocation(null);
        infoWindow.close();
      });

      return marker;
    });

    // Fit map to show all markers
    const bounds = new window.google.maps.LatLngBounds();
    markers.forEach(marker => {
      bounds.extend(marker.getPosition());
    });
    map.fitBounds(bounds);

    // If a location is selected, center and zoom to it
    if (selectedLocation) {
      const location = LOCATIONS.find(loc => loc.id === selectedLocation);
      if (location) {
        map.setCenter(location.coordinates);
        map.setZoom(12);
      }
    }

    return () => {
      markers.forEach(marker => marker.setMap(null));
    };
  }, [mapLoaded, selectedLocation, onLocationSelect]);

  return (
    <div className={styles.mapContainer}>
      <div id="location-map" className={styles.map}></div>
      <div className={styles.locationList}>
        <h3>Our Locations</h3>
        <div className={styles.locationCards}>
          {LOCATIONS.map(location => (
            <div 
              key={location.id}
              className={`${styles.locationCard} ${location.id === selectedLocation ? styles.selected : ''} ${location.id === activeLocation ? styles.active : ''}`}
              onClick={() => onLocationSelect(location.id)}
            >
              <h4>{location.name}</h4>
              <p className={styles.address}>{location.address}</p>
              <p className={styles.pods}>{location.pods} pods available</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 