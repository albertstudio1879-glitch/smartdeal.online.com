import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { X, Search, MapPin, Check, AlertCircle, Loader2 } from 'lucide-react';

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

function MapContent({ 
  selectedPos, 
  setSelectedPos, 
  onAddressResolved 
}: { 
  selectedPos: { lat: number; lng: number }; 
  setSelectedPos: (pos: { lat: number; lng: number }) => void;
  onAddressResolved: (data: any) => void;
}) {
  const map = useMap();
  const geocodingLib = useMapsLibrary('geocoding');

  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);

  useEffect(() => {
    if (map && selectedPos) {
      map.panTo(selectedPos);
    }
  }, [selectedPos, map]);

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

  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const newPos = { lat, lng };
    setSelectedPos(newPos);
    await reverseGeocode(lat, lng);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!geocodingLib) return;
    setIsResolving(true);
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results && response.results[0]) {
        const result = response.results[0];
        const formatted = result.formatted_address;
        setResolvedAddress(formatted);

        let houseName = '';
        let street = '';
        let city = '';
        let district = '';
        let state = '';
        let pinCode = '';

        for (const component of result.address_components) {
          const types = component.types;
          if (types.includes('subpremise') || types.includes('premise') || types.includes('establishment')) {
            houseName = component.long_name;
          } else if (types.includes('route')) {
            street = component.long_name;
          } else if (types.includes('sublocality') || types.includes('neighborhood')) {
            if (!street) street = component.long_name;
          } else if (types.includes('locality')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_2')) {
            district = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            state = component.long_name;
          } else if (types.includes('postal_code')) {
            pinCode = component.long_name;
          }
        }

        if (!houseName && street) houseName = street;

        onAddressResolved({
          latitude: lat,
          longitude: lng,
          formattedAddress: formatted,
          houseName,
          street: street || formatted.split(',')[0] || '',
          city,
          district: district || city,
          state,
          pinCode
        });
      }
    } catch (err) {
      console.error('Geocoder error:', err);
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

    const newPos = { lat, lng };
    setSelectedPos(newPos);
    if (map) {
      map.panTo(newPos);
      map.setZoom(16);
    }
    await reverseGeocode(lat, lng);
  };

  return (
    <>
      <div className="absolute top-4 left-4 right-4 z-10">
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
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs text-gray-700 dark:text-gray-300 border-b border-gray-50 dark:border-slate-850 flex items-center gap-2 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span className="truncate">{pred.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Map
        defaultCenter={selectedPos}
        defaultZoom={15}
        mapId={import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID"}
        gestureHandling={'greedy'}
        disableDefaultUI={false}
        onClick={handleMapClick}
        style={{ width: '100%', height: '100%' }}
      >
        <AdvancedMarker 
          position={selectedPos} 
          draggable={true}
          onDragEnd={(e) => {
            if (e.latLng) {
              const lat = e.latLng.lat();
              const lng = e.latLng.lng();
              setSelectedPos({ lat, lng });
              reverseGeocode(lat, lng);
            }
          }}
        />
      </Map>

      {resolvedAddress && (
        <div className="absolute bottom-20 left-4 right-4 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-3 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 text-xs text-gray-800 dark:text-gray-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <p className="truncate font-medium">{resolvedAddress}</p>
          </div>
          {isResolving && <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />}
        </div>
      )}
    </>
  );
}

export const GoogleMapSelectorModal: React.FC<GoogleMapSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialLat,
  initialLng,
}) => {
  const [selectedPos, setSelectedPos] = useState({ 
    lat: initialLat || DEFAULT_CENTER.lat, 
    lng: initialLng || DEFAULT_CENTER.lng 
  });
  const [addressData, setAddressData] = useState<any>(null);

  useEffect(() => {
    if (initialLat && initialLng) {
      setSelectedPos({ lat: initialLat, lng: initialLng });
    }
  }, [initialLat, initialLng]);

  if (!isOpen) return null;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === 'YOUR_ACTUAL_GOOGLE_MAPS_API_KEY') {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Google Maps API Key Missing or Unconfigured</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Please configure your valid <code className="bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded text-blue-600">VITE_GOOGLE_MAPS_API_KEY</code> in the root <code className="bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded text-blue-600">.env.local</code> file to use interactive map selection. You can still enter your address manually.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

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
        <APIProvider apiKey={apiKey} libraries={['places', 'geocoding']}>
          <MapContent 
            selectedPos={selectedPos} 
            setSelectedPos={setSelectedPos}
            onAddressResolved={(data) => setAddressData(data)}
          />
        </APIProvider>
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
