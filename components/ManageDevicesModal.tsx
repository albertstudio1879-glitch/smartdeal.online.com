import React, { useState, useEffect } from 'react';
import { UserAccount } from '../services/authService';
import { DeviceRecord, fetchUserDevices, removeDeviceRecord, getStableDeviceId } from '../services/deviceService';
import { 
  X, ArrowLeft, Smartphone, Laptop, Monitor, Trash2, LogOut, 
  ShieldCheck, AlertCircle, CheckCircle2, RefreshCw 
} from 'lucide-react';

interface ManageDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onOpenLogin: () => void;
}

export const ManageDevicesModal: React.FC<ManageDevicesModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenLogin,
}) => {
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadDevices = async () => {
    if (!currentUser?.uid) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const fetched = await fetchUserDevices(currentUser.uid);
      setDevices(fetched);
    } catch (err: any) {
      console.error('Failed to load devices:', err);
      setErrorMsg('Failed to load registered devices. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser?.uid) {
      loadDevices();
    } else if (!currentUser) {
      setDevices([]);
    }
  }, [isOpen, currentUser?.uid]);

  if (!isOpen) return null;

  const handleRemoveDevice = async (deviceId: string) => {
    if (!currentUser?.uid) return;
    try {
      await removeDeviceRecord(currentUser.uid, deviceId);
      setDevices(prev => prev.filter(d => d.id !== deviceId));
      setConfirmDeleteId(null);
      setActionMsg('Device record removed successfully.');
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err: any) {
      console.error('Failed to remove device:', err);
      setErrorMsg('Failed to remove device record.');
    }
  };

  const handleLogOutAll = async () => {
    if (!currentUser?.uid) return;
    if (!window.confirm('Are you sure you want to remove all other device records?')) return;
    try {
      const currentDevId = getStableDeviceId();
      const otherDevices = devices.filter(d => d.id !== currentDevId);
      for (const dev of otherDevices) {
        await removeDeviceRecord(currentUser.uid, dev.id);
      }
      setDevices(prev => prev.filter(d => d.id === currentDevId));
      setActionMsg('All other devices removed successfully.');
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err: any) {
      console.error('Failed to remove all devices:', err);
      setErrorMsg('Failed to remove devices.');
    }
  };

  const currentDevice = devices.find(d => d.isCurrent) || devices[0];
  const otherDevices = devices.filter(d => d.id !== currentDevice?.id);

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' +
           date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-white dark:bg-slate-950 flex flex-col animate-in fade-in duration-200">
      
      {/* Top Header Bar */}
      <div className="bg-blue-600 text-white px-4 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
            title="Back to My Accounts"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold tracking-tight">Manage Devices</h1>
        </div>

        <button
          type="button"
          onClick={loadDevices}
          className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
          title="Refresh Devices"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Body Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-2xl mx-auto w-full space-y-6">
        
        {/* Subtitle description */}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            View and manage devices used to access your Smart Deal account. Deleting a device record removes its tracking entry; to fully revoke access, ensure you log out of that device.
          </p>
        </div>

        {actionMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!currentUser ? (
          <div className="p-12 text-center space-y-4 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Please sign in to view and manage your registered devices.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              Sign in with Google
            </button>
          </div>
        ) : isLoading && devices.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold text-gray-500">Loading registered devices...</p>
          </div>
        ) : (
          <>
            {/* Current Device Section */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">This device</h2>
              
              {currentDevice ? (
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-sm space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                    Current Device
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-100 dark:border-blue-900">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 pr-16">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {currentDevice.deviceName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Browser: <span className="font-semibold text-gray-700 dark:text-gray-300">{currentDevice.browser}</span> on <span className="font-semibold text-gray-700 dark:text-gray-300">{currentDevice.os}</span>
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Last used on {formatDate(currentDevice.lastActiveAt)} • {currentDevice.location || 'Online Session'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500">
                    <span>Registered on {formatDate(currentDevice.registeredAt)}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Active Session
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 text-center text-xs text-gray-500">
                  Current device registering...
                </div>
              )}
            </div>

            {/* Other Devices Section */}
            <div className="space-y-3 pt-2">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Other devices</h2>

              {otherDevices.length === 0 ? (
                <div className="p-6 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 text-center text-xs text-gray-500">
                  No other devices currently registered for this account.
                </div>
              ) : (
                <div className="space-y-3">
                  {otherDevices.map(dev => (
                    <div key={dev.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-3">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 flex items-center justify-center flex-shrink-0">
                          <Laptop className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {dev.deviceName}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Browser: <span className="font-semibold text-gray-700 dark:text-gray-300">{dev.browser}</span> on <span className="font-semibold text-gray-700 dark:text-gray-300">{dev.os}</span>
                          </p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            Last used on {formatDate(dev.lastActiveAt)} • {dev.location || 'Online Session'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(dev.id)}
                          className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 flex-shrink-0"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>

                      <div className="pt-2 border-t border-gray-100 dark:border-slate-800 text-xs text-gray-400 flex items-center justify-between">
                        <span>Registered on {formatDate(dev.registeredAt)}</span>
                      </div>

                      {confirmDeleteId === dev.id && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/60 rounded-xl border border-red-200 dark:border-red-800 flex items-center justify-between animate-in fade-in duration-150">
                          <p className="text-xs text-red-700 dark:text-red-300 font-medium">Remove this device record?</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-3 py-1 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg border border-gray-300 dark:border-slate-700 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveDevice(dev.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                            >
                              Confirm
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Action */}
            {otherDevices.length > 0 && (
              <div className="pt-4 text-center">
                <button
                  type="button"
                  onClick={handleLogOutAll}
                  className="w-full py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer uppercase tracking-wider"
                >
                  Log out from all other devices
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};
