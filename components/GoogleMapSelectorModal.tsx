import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { X, Search, MapPin, Check, Loader2 } from 'lucide-react';

interface GoogleMapSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (locationData: {
    latitude: number;
    longitude: number;
    formattedAddress: string;
    houseName: string;
    street: string;
    city: string;
    district: string;
    state: string;
    pinCode: string;
  }) => void;
  initialLat?: number;
  initialLng?: number;
}

const DEFAULT_CENTER = { lat: 10.8505, lng: 76.2711 }; // Kerala, India default

export const GoogleMapSelectorModal: React.FC<GoogleMapSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialLat,
  initialLng,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [selectedPos, setSelectedPos] = useState({
    lat: initialLat || DEFAULT_CENTER.lat,
    lng: initialLng || DEFAULT_CENTER.lng,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [addressData, setAddressData] = useState<any>(null);

  useEffect(() => {
    if (initialLat && initialLng) {
      setSelectedPos({ lat: initialLat, lng: initialLng });
    }
  }, [initialLat, initialLng]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        center: [selectedPos.lat, selectedPos.lng],
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Custom marker icon fix for Leaflet
      const defaultIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="background-color: #2563eb; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); border: 2px solid white;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([selectedPos.lat, selectedPos.lng], {
        draggable: true,
        icon: defaultIcon,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setSelectedPos({ lat: pos.lat, lng: pos.lng });
        reverseGeocode(pos.lat, pos.lng);
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setSelectedPos({ lat, lng });
        reverseGeocode(lat, lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Initial reverse geocode
      reverseGeocode(selectedPos.lat, selectedPos.lng);
    } else {
      mapInstanceRef.current.setView([selectedPos.lat, selectedPos.lng], 15);
      if (markerRef.current) {
        markerRef.current.setLatLng([selectedPos.lat, selectedPos.lng]);
      }
    }

    return () => {
      // Cleanup map on close
    };
  }, [isOpen]);

  // Clean up map instance when modal closes
  useEffect(() => {
    if (!isOpen && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }
  }, [isOpen]);

  // Search autocomplete with Nominatim
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setPredictions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.trim())}&countrycodes=in&addressdetails=1&limit=5`, {
          headers: { 'Accept-Language': 'en' }
        });
        if (res.ok) {
          const data = await res.json();
          setPredictions(data);
        } else {
          setPredictions([]);
        }
      } catch (err) {
        console.error('Search error:', err);
        setPredictions([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsResolving(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`, {
        headers: { 'Accept-Language': 'en' }
      });
      if (res.ok) {
        const data = await res.json();
        const formatted = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setResolvedAddress(formatted);

        const addr = data.address || {};
        const houseName = addr.building || addr.house_number || addr.suburb || addr.neighbourhood || '';
        const street = addr.road || addr.suburb || addr.neighbourhood || '';
        const city = addr.city || addr.town || addr.village || addr.hamlet || '';
        const district = addr.county || addr.state_district || city;
        const state = addr.state || '';
        const pinCode = addr.postcode || '';

        const payload = {
          latitude: lat,
          longitude: lng,
          formattedAddress: formatted,
          houseName: houseName || street || formatted.split(',')[0] || '',
          street: street || formatted.split(',')[0] || '',
          city: city || district || '',
          district: district || city || '',
          state: state || '',
          pinCode: pinCode || ''
        };
        setAddressData(payload);
      }
    } catch (err) {
      console.error('Nominatim reverse geocode error:', err);
      const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setResolvedAddress(fallback);
      const payload = {
        latitude: lat,
        longitude: lng,
        formattedAddress: fallback,
        houseName: '',
        street: '',
        city: '',
        district: '',
        state: '',
        pinCode: ''
      };
      setAddressData(payload);
    } finally {
      setIsResolving(false);
    }
  };

  const handleSelectPrediction = async (item: any) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const description = item.display_name;
    setSearchQuery(description);
    setPredictions([]);

    setSelectedPos({ lat, lng });
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], 16);
      markerRef.current.setLatLng([lat, lng]);
    }
    await reverseGeocode(lat, lng);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-white dark:bg-slate-950 flex flex-col animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between shadow-md z-20">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          <h2 className="text-sm font-bold">Select Delivery Location on Map</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div className="absolute top-4 left-4 right-4 z-[400]">
          <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center px-3 py-2.5">
              <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search place, street, area, or PIN code..."
                className="w-full text-xs bg-transparent text-gray-900 dark:text-white focus:outline-none"
              />
              {isSearching && <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin flex-shrink-0 ml-2" />}
            </div>

            {predictions.length > 0 && (
              <div className="border-t border-gray-100 dark:border-slate-800 max-h-60 overflow-y-auto bg-white dark:bg-slate-900">
                {predictions.map((pred, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPrediction(pred)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs text-gray-700 dark:text-gray-300 border-b border-gray-50 dark:border-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <span className="truncate">{pred.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 10 }} />

        {resolvedAddress && (
          <div className="absolute bottom-20 left-4 right-4 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-3 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 text-xs text-gray-800 dark:text-gray-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <p className="truncate font-medium">{resolvedAddress}</p>
            </div>
            {isResolving && <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />}
          </div>
        )}
      </div>

      {/* Bottom Footer Action */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between gap-4 z-20">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Tap or drag marker on map to set precise location.
        </div>
        <button
          type="button"
          disabled={!addressData}
          onClick={() => {
            if (addressData) {
              onSelectLocation(addressData);
              onClose();
            }
          }}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer uppercase tracking-wider flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          <span>Use This Location</span>
        </button>
      </div>

    </div>
  );
};
