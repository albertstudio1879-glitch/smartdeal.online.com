import React, { useState, useEffect } from 'react';
import { UserAccount } from '../services/authService';
import { AddressRecord, fetchUserAddresses, saveAddressRecord, deleteAddressRecord, setDefaultAddress } from '../services/addressService';
import { GoogleMapSelectorModal } from './GoogleMapSelectorModal';
import { 
  X, ArrowLeft, Plus, MapPin, Trash2, Edit3, CheckCircle2, 
  AlertCircle, Home, Briefcase, Building2, Phone, User, Check
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';

interface SavedAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onOpenLogin: () => void;
}

export const SavedAddressModal: React.FC<SavedAddressModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenLogin,
}) => {
  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Form Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [showGoogleMapModal, setShowGoogleMapModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationMsg, setLocationMsg] = useState<string | null>(null);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [houseName, setHouseName] = useState('');
  const [houseNumber, setHouseNumber] = useState(''); // Optional
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState(''); // Optional
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [stateName, setStateName] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [addressType, setAddressType] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [isDefault, setIsDefault] = useState(false); // Optional
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [formattedAddress, setFormattedAddress] = useState<string | undefined>(undefined);
  const [locationSource, setLocationSource] = useState<'gps' | 'google_map' | 'manual'>('manual');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (isOpen && currentUser?.uid) {
      setIsLoading(true);
      setErrorMsg(null);
      const addressesRef = collection(db, 'users', currentUser.uid, 'addresses');
      const q = query(addressesRef, orderBy('createdAt', 'desc'));

      unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => doc.data() as AddressRecord);
        setAddresses(list);
        setIsLoading(false);
      }, (err) => {
        console.error('Failed to sync addresses:', err);
        setErrorMsg('Failed to load saved addresses.');
        setIsLoading(false);
      });
    } else if (!currentUser) {
      setAddresses([]);
      setIsLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen, currentUser?.uid]);

  if (!isOpen) return null;

  const resetForm = () => {
    setFullName(currentUser?.displayName || '');
    setPhoneNumber(currentUser?.phoneNumber || '');
    setHouseName('');
    setHouseNumber('');
    setStreet('');
    setLandmark('');
    setCity('');
    setDistrict('');
    setStateName('');
    setPinCode('');
    setAddressType('Home');
    setIsDefault(addresses.length === 0);
    setLatitude(undefined);
    setLongitude(undefined);
    setFormattedAddress(undefined);
    setLocationSource('manual');
    setEditingAddressId(null);
    setFormError(null);
    setLocationMsg(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowFormModal(true);
  };

  const handleOpenEdit = (addr: AddressRecord) => {
    setEditingAddressId(addr.id);
    setFullName(addr.fullName || '');
    setPhoneNumber(addr.phoneNumber || '');
    setHouseName(addr.houseName || '');
    setHouseNumber(addr.houseNumber || '');
    setStreet(addr.street || '');
    setLandmark(addr.landmark || '');
    setCity(addr.city || '');
    setDistrict(addr.district || '');
    setStateName(addr.state || '');
    setPinCode(addr.pinCode || '');
    setAddressType(addr.addressType || 'Home');
    setIsDefault(addr.isDefault || false);
    setLatitude(addr.latitude);
    setLongitude(addr.longitude);
    setFormattedAddress(addr.formattedAddress);
    setLocationSource(addr.locationSource || 'manual');
    setFormError(null);
    setLocationMsg(null);
    setShowFormModal(true);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setFormError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setLocationMsg('Detecting your current location via GPS...');
    setFormError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude: lat, longitude: lng } = position.coords;
          setLatitude(lat);
          setLongitude(lng);
          setLocationSource('gps');

          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
            headers: { 'Accept-Language': 'en' }
          });
          if (!res.ok) throw new Error('Reverse geocoding failed');
          const data = await res.json();
          const addr = data.address || {};
          const formatted = data.display_name;

          setFormattedAddress(formatted);

          const hName = addr.building || addr.house_name || addr.suburb || addr.neighbourhood || addr.road || '';
          const str = addr.road || addr.suburb || addr.neighbourhood || '';
          const cty = addr.city || addr.town || addr.village || addr.municipality || '';
          const dist = addr.county || addr.state_district || addr.city_district || '';
          const st = addr.state || '';
          const pin = addr.postcode || '';

          if (hName) setHouseName(hName);
          if (str) setStreet(str);
          if (cty) setCity(cty);
          if (dist) setDistrict(dist);
          if (st) setStateName(st);
          if (pin) setPinCode(pin);

          setLocationMsg('GPS location detected successfully! Please review and edit fields below.');
          setTimeout(() => setLocationMsg(null), 8000);
        } catch (err) {
          console.error('Reverse geocode error:', err);
          setFormError('Could not retrieve address details from your location. Please enter manually.');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        console.error('Geolocation error:', error);
        const errCode = error?.code;
        if (errCode === 1) {
          setFormError('Location permission denied. Please allow location access in your browser or enter your address manually.');
        } else if (errCode === 3) {
          setFormError("We couldn't detect your location in time. Please check that Location/GPS is enabled, allow browser location permission, and try again.");
        } else {
          setFormError('Unable to retrieve your location. Please check browser location permissions or enter your address manually.');
        }
      },
      { timeout: 25000, enableHighAccuracy: false, maximumAge: 60000 }
    );
  };

  const handleMapLocationSelected = (data: {
    latitude: number;
    longitude: number;
    formattedAddress: string;
    houseName: string;
    street: string;
    city: string;
    district: string;
    state: string;
    pinCode: string;
  }) => {
    setLatitude(data.latitude);
    setLongitude(data.longitude);
    setFormattedAddress(data.formattedAddress);
    setLocationSource('google_map');

    if (data.houseName) setHouseName(data.houseName);
    if (data.street) setStreet(data.street);
    if (data.city) setCity(data.city);
    if (data.district) setDistrict(data.district);
    if (data.state) setStateName(data.state);
    if (data.pinCode) setPinCode(data.pinCode);

    setLocationMsg('Google Map location confirmed successfully!');
    setTimeout(() => setLocationMsg(null), 4000);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid || isSaving) return;

    // Trim required fields
    const fName = fullName.trim();
    const phone = phoneNumber.trim();
    const hName = houseName.trim();
    const str = street.trim();
    const cty = city.trim();
    const dist = district.trim();
    const st = stateName.trim();
    const pin = pinCode.trim();

    // Validation for mandatory fields only
    if (!fName || !phone || !hName || !str || !cty || !dist || !st || !pin) {
      setFormError('Please fill in all required fields marked with *.');
      return;
    }

    // Phone validation (10 digits Indian mobile)
    const phoneClean = phone.replace(/\D/g, '');
    if (phoneClean.length < 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    // PIN code validation (6 digits)
    const pinClean = pin.replace(/\D/g, '');
    if (pinClean.length !== 6) {
      setFormError('Please enter a valid 6-digit PIN code.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const now = Date.now();
      const addressId = editingAddressId || 'addr_' + Math.random().toString(36).substring(2, 10) + '_' + now;
      const record: AddressRecord = {
        id: addressId,
        fullName: fName,
        phoneNumber: phone,
        houseName: hName,
        houseNumber: houseNumber.trim() || '',
        street: str,
        landmark: landmark.trim() || '',
        city: cty,
        district: dist,
        state: st,
        pinCode: pin,
        addressType: addressType || 'Home',
        isDefault: isDefault || addresses.length === 0,
        latitude,
        longitude,
        formattedAddress,
        locationSource,
        createdAt: editingAddressId ? (addresses.find(a => a.id === editingAddressId)?.createdAt || now) : now,
        updatedAt: now
      };

      await saveAddressRecord(currentUser.uid, record);
      setShowFormModal(false);
      setActionMsg(editingAddressId ? 'Address updated successfully!' : 'New address added successfully!');
      setTimeout(() => setActionMsg(null), 3500);
    } catch (err: any) {
      console.error('Failed to save address:', err);
      setFormError(err?.message || 'Failed to save address. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!currentUser?.uid) return;
    try {
      await deleteAddressRecord(currentUser.uid, addressId);
      setConfirmDeleteId(null);
      setActionMsg('Address deleted successfully.');
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err) {
      console.error('Failed to delete address:', err);
      setErrorMsg('Failed to delete address.');
    }
  };

  const handleSetDefault = async (addressId: string) => {
    if (!currentUser?.uid) return;
    try {
      await setDefaultAddress(currentUser.uid, addressId);
      setActionMsg('Default address updated.');
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err) {
      console.error('Failed to set default address:', err);
      setErrorMsg('Failed to set default address.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#F7F9FF] dark:bg-[#071329] text-[#102A56] dark:text-[#F5F7FF] flex flex-col animate-in fade-in duration-200">
      
      {/* Top Header Bar */}
      <div className="bg-gradient-to-r from-[#6C3BFF] via-[#4F46E5] to-[#2589FF] text-white px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/25 transition-colors text-white cursor-pointer"
            title="Back to My Accounts"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold tracking-tight">Saved Addresses</h1>
        </div>

        {currentUser && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 text-xs font-bold px-4 py-2 rounded-full transition-transform active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New</span>
          </button>
        )}
      </div>

      {/* Body Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-2xl mx-auto w-full space-y-6">
        
        <div>
          <p className="text-xs text-[#526B98] dark:text-[#8294B8]">
            Manage your delivery addresses for seamless checkout across all your devices.
          </p>
        </div>

        {actionMsg && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!currentUser ? (
          <div className="p-12 text-center space-y-4 bg-white/80 dark:bg-[#102448]/80 backdrop-blur-xl rounded-[24px] border border-[rgba(92,137,220,0.22)] dark:border-[rgba(100,160,255,0.28)] shadow-sm">
            <p className="text-sm font-semibold text-[#102A56] dark:text-[#F5F7FF]">
              Please sign in to view and manage your saved addresses.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              className="px-6 py-2.5 bg-gradient-to-r from-[#6C3BFF] to-[#2589FF] hover:opacity-95 text-white font-bold text-xs rounded-full shadow-lg shadow-blue-500/25 transition-transform active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              Sign in with Google
            </button>
          </div>
        ) : isLoading && addresses.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-[#2589FF] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold text-[#526B98] dark:text-[#8294B8]">Loading saved addresses...</p>
          </div>
        ) : addresses.length === 0 ? (
          <div className="p-12 text-center space-y-4 bg-white/80 dark:bg-[#102448]/80 backdrop-blur-xl rounded-[24px] border border-[rgba(92,137,220,0.22)] dark:border-[rgba(100,160,255,0.28)] shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-[#6C3BFF]/15 to-[#2589FF]/20 text-[#2589FF] dark:text-cyan-400 flex items-center justify-center mx-auto border border-blue-400/30">
              <MapPin className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#102A56] dark:text-[#F5F7FF]">No Saved Addresses</h3>
              <p className="text-xs text-[#526B98] dark:text-[#8294B8] mt-1">Add a delivery address for quick checkout.</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-6 py-2.5 bg-gradient-to-r from-[#6C3BFF] to-[#2589FF] hover:opacity-95 text-white font-bold text-xs rounded-full shadow-lg shadow-blue-500/25 transition-transform active:scale-95 cursor-pointer uppercase tracking-wider inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Address</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map(addr => {
              const IconComponent = addr.addressType === 'Work' ? Briefcase : addr.addressType === 'Other' ? Building2 : Home;
              return (
                <div 
                  key={addr.id} 
                  className={`p-5 rounded-[22px] transition-all space-y-3 relative ${
                    addr.isDefault 
                      ? 'glow-card border-cyan-400 dark:border-cyan-400' 
                      : 'glow-card'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#6C3BFF]/15 to-[#2589FF]/20 text-[#6C3BFF] dark:text-cyan-400 flex items-center justify-center border border-blue-400/30">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-700 dark:text-cyan-300">
                            {addr.addressType || 'Home'}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 uppercase">
                              Default
                            </span>
                          )}
                          {addr.locationSource && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/70 dark:bg-[#071329]/70 text-[#526B98] dark:text-[#8294B8] border border-[rgba(92,137,220,0.18)] dark:border-[rgba(100,160,255,0.2)] uppercase">
                              {addr.locationSource === 'gps' ? 'GPS' : addr.locationSource === 'google_map' ? 'Map Pin' : 'Manual'}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-[#102A56] dark:text-[#F5F7FF] mt-1">
                          {addr.fullName}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(addr)}
                        className="p-2 text-[#526B98] hover:text-[#2589FF] dark:text-[#8294B8] dark:hover:text-cyan-400 transition-colors cursor-pointer"
                        title="Edit Address"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(addr.id)}
                        className="p-2 text-[#526B98] hover:text-red-500 dark:text-[#8294B8] dark:hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete Address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-[#526B98] dark:text-[#B8C7E8] space-y-1 pl-1">
                    <p className="font-semibold text-[#102A56] dark:text-[#F5F7FF]">
                      {addr.houseName}{addr.houseNumber ? `, #${addr.houseNumber}` : ''}
                    </p>
                    <p>{addr.street}{addr.landmark ? `, Near ${addr.landmark}` : ''}</p>
                    <p>{addr.city}, {addr.district}, {addr.state} - <span className="font-bold text-[#102A56] dark:text-[#F5F7FF]">{addr.pinCode}</span></p>
                    <p className="text-[#526B98] dark:text-[#8294B8] flex items-center gap-1 pt-0.5">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{addr.phoneNumber}</span>
                    </p>
                  </div>

                  {!addr.isDefault && (
                    <div className="pt-2 border-t border-[rgba(92,137,220,0.18)] dark:border-[rgba(100,160,255,0.22)] flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleSetDefault(addr.id)}
                        className="text-xs font-bold text-[#2589FF] dark:text-cyan-400 hover:underline cursor-pointer"
                      >
                        Set as Default Address
                      </button>
                    </div>
                  )}

                  {confirmDeleteId === addr.id && (
                    <div className="p-3 bg-red-500/15 rounded-xl border border-red-500/30 flex items-center justify-between animate-in fade-in duration-150">
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium">Delete this saved address?</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1 bg-white/80 dark:bg-slate-800 text-[#526B98] dark:text-[#B8C7E8] text-xs font-bold rounded-lg border border-gray-300 dark:border-slate-700 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(addr.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Add / Edit Address Modal Form */}
      {showFormModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#F7F9FF] dark:bg-[#102448] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-[rgba(92,137,220,0.25)] dark:border-[rgba(100,160,255,0.28)] flex flex-col max-h-[90vh]">
            
            <div className="bg-gradient-to-r from-[#6C3BFF] via-[#4F46E5] to-[#2589FF] text-white px-6 py-4 flex items-center justify-between shadow-md">
              <h2 className="text-base font-bold tracking-tight">
                {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
              </h2>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Two Location Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="py-2.5 px-3 bg-white/80 dark:bg-[#071329]/60 border border-[rgba(92,137,220,0.25)] dark:border-[rgba(100,160,255,0.28)] hover:border-blue-400 text-blue-600 dark:text-cyan-300 font-bold text-[11px] rounded-2xl shadow-xs transition-all cursor-pointer flex flex-col items-center justify-center gap-1"
                >
                  {isLocating ? (
                    <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  )}
                  <span>{isLocating ? 'Locating...' : '📍 Use Current Location'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowGoogleMapModal(true)}
                  className="py-2.5 px-3 bg-white/80 dark:bg-[#071329]/60 border border-[rgba(92,137,220,0.25)] dark:border-[rgba(100,160,255,0.28)] hover:border-indigo-400 text-indigo-600 dark:text-indigo-300 font-bold text-[11px] rounded-2xl shadow-xs transition-all cursor-pointer flex flex-col items-center justify-center gap-1"
                >
                  <span className="text-base">🗺️</span>
                  <span>Select on Google Map</span>
                </button>
              </div>

              {locationMsg && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 text-center font-semibold">{locationMsg}</p>
              )}

              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold rounded-2xl flex items-center justify-between gap-2">
                  <span>{formError}</span>
                  {formError.includes("detect your location in time") && (
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-xs cursor-pointer flex-shrink-0"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#526B98] dark:text-[#B8C7E8] mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#071329]/70 border border-[rgba(92,137,220,0.22)] dark:border-[rgba(100,160,255,0.28)] rounded-xl text-sm text-[#102A56] dark:text-[#F5F7FF] placeholder-[#7889A8] dark:placeholder-[#8294B8] focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                    placeholder="Receiver's full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#526B98] dark:text-[#B8C7E8] mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#071329]/70 border border-[rgba(92,137,220,0.22)] dark:border-[rgba(100,160,255,0.28)] rounded-xl text-sm text-[#102A56] dark:text-[#F5F7FF] placeholder-[#7889A8] dark:placeholder-[#8294B8] focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                    placeholder="10-digit mobile number"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#526B98] dark:text-[#B8C7E8] mb-1">
                    House Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={houseName}
                    onChange={(e) => setHouseName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#071329]/70 border border-[rgba(92,137,220,0.22)] dark:border-[rgba(100,160,255,0.28)] rounded-xl text-sm text-[#102A56] dark:text-[#F5F7FF] placeholder-[#7889A8] dark:placeholder-[#8294B8] focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                    placeholder="House / Apartment name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#526B98] dark:text-[#B8C7E8] mb-1">
                    House / Building Number (Optional)
                  </label>
                  <input 
                    type="text"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#071329]/70 border border-[rgba(92,137,220,0.22)] dark:border-[rgba(100,160,255,0.28)] rounded-xl text-sm text-[#102A56] dark:text-[#F5F7FF] placeholder-[#7889A8] dark:placeholder-[#8294B8] focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                    placeholder="e.g. Flat #4B"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#526B98] dark:text-[#B8C7E8] mb-1">
                  Street / Locality <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#071329]/70 border border-[rgba(92,137,220,0.22)] dark:border-[rgba(100,160,255,0.28)] rounded-xl text-sm text-[#102A56] dark:text-[#F5F7FF] placeholder-[#7889A8] dark:placeholder-[#8294B8] focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                  placeholder="Street name, Area, Sector"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#526B98] dark:text-[#B8C7E8] mb-1">
                  Landmark (Optional)
                </label>
                <input 
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#071329]/70 border border-[rgba(92,137,220,0.22)] dark:border-[rgba(100,160,255,0.28)] rounded-xl text-sm text-[#102A56] dark:text-[#F5F7FF] placeholder-[#7889A8] dark:placeholder-[#8294B8] focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                  placeholder="e.g. Near City Mall"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#526B98] dark:text-[#B8C7E8] mb-1">
                    City / Town <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#071329]/70 border border-[rgba(92,137,220,0.22)] dark:border-[rgba(100,160,255,0.28)] rounded-xl text-sm text-[#102A56] dark:text-[#F5F7FF] placeholder-[#7889A8] dark:placeholder-[#8294B8] focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                    placeholder="City"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#526B98] dark:text-[#B8C7E8] mb-1">
                    District <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#071329]/70 border border-[rgba(92,137,220,0.22)] dark:border-[rgba(100,160,255,0.28)] rounded-xl text-sm text-[#102A56] dark:text-[#F5F7FF] placeholder-[#7889A8] dark:placeholder-[#8294B8] focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                    placeholder="District"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#526B98] dark:text-[#B8C7E8] mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#071329]/70 border border-[rgba(92,137,220,0.22)] dark:border-[rgba(100,160,255,0.28)] rounded-xl text-sm text-[#102A56] dark:text-[#F5F7FF] placeholder-[#7889A8] dark:placeholder-[#8294B8] focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                    placeholder="State"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#526B98] dark:text-[#B8C7E8] mb-1">
                    PIN Code <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#071329]/70 border border-[rgba(92,137,220,0.22)] dark:border-[rgba(100,160,255,0.28)] rounded-xl text-sm text-[#102A56] dark:text-[#F5F7FF] placeholder-[#7889A8] dark:placeholder-[#8294B8] focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                    placeholder="6-digit PIN code"
                    maxLength={6}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#526B98] dark:text-[#B8C7E8] mb-1">
                    Address Type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    {(['Home', 'Work', 'Other'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAddressType(type)}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          addressType === type
                            ? 'bg-gradient-to-r from-[#6C3BFF] to-[#2589FF] border-transparent text-white shadow-xs'
                            : 'bg-white/70 dark:bg-[#071329]/60 border-[rgba(92,137,220,0.22)] dark:border-[rgba(100,160,255,0.28)] text-[#102A56] dark:text-[#F5F7FF]'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-[#102A56] dark:text-[#F5F7FF]">Set as default delivery address (Optional)</span>
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 py-3 bg-white/70 dark:bg-[#071329]/70 hover:bg-white dark:hover:bg-[#071329] border border-[rgba(92,137,220,0.22)] dark:border-[rgba(100,160,255,0.28)] text-[#526B98] dark:text-[#B8C7E8] font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-gradient-to-r from-[#6C3BFF] to-[#2589FF] hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2 border border-white/20"
                >
                  {isSaving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <span>{isSaving ? 'Saving...' : 'Save Address'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Google Map Selector Modal */}
      <GoogleMapSelectorModal 
        isOpen={showGoogleMapModal}
        onClose={() => setShowGoogleMapModal(false)}
        onSelectLocation={handleMapLocationSelected}
        initialLat={latitude}
        initialLng={longitude}
      />

    </div>
  );
};
