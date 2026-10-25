
import React, { useState, useRef, useEffect } from 'react';
import { Category, CATEGORIES, Product } from '../types';
import { getApiUrl, setApiUrl, getEffectiveApiUrl } from '../services/storageService';
import { generateSalesPitch } from '../services/geminiService';
import { Sparkles } from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
  onAddProduct: (product: Product) => Promise<void>;
  products?: Product[];
  onDeleteProduct?: (id: string) => Promise<void>;
}

// Script adjusted to remove Video mapping but keep column alignment compatible if needed, 
// or shifting back. Here we shift back (removing index 10).
const GOOGLE_SCRIPT_CODE = `function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }
function handleRequest(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
    if (!sheet) return response({ status: 'error', message: 'Sheet1 not found' });
    
    var action = e.parameter.action;
    var postData = null;
    if (e.postData && e.postData.contents) {
      try { postData = JSON.parse(e.postData.contents); if (postData.action) action = postData.action; } catch (err) {}
    }

    if (action === 'read' || !action) {
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return response([]);
      var products = data.slice(1).map(function(row) {
        return {
          images: row[0] ? String(row[0]).split('|||') : [],
          name: row[1], mrp: row[2], price: row[3], offer: row[4],
          categories: row[5] ? String(row[5]).split(',').map(function(s){return s.trim()}) : [],
          affiliateLink: row[6], highlights: row[7] ? String(row[7]).split('|||') : [],
          description: row[8], code: row[9] || '',
          // Index 10 was video, skipping/shifting.
          // Note: If you have existing data with video in col 10, likes might be read incorrectly 
          // unless we check data types or you clear your sheet. 
          // Assuming we revert to pre-video structure or handle loose types:
          likes: Number(row[11]) || 0, dislikes: Number(row[12]) || 0,
          timestamp: Number(row[13]) || 0, id: String(row[13] || Date.now()),
          platform: row[14] || ''
        };
      }).filter(function(p) { return p.timestamp; });
      return response(products);
    }

    if (postData) {
        if (action === 'delete') {
           deleteRowByTimestamp(sheet, postData.id);
           return response({ status: 'success' });
        }
        var p = postData.product;
        if (p && (action === 'create' || action === 'update' || action === 'interaction')) {
           var rowData = [
            (p.images || []).join('|||'), p.name, p.mrp, p.price, p.offer,
            (p.categories || []).join(', '), p.affiliateLink,
            (p.highlights || []).join('|||'), p.description, p.code || '',
            '', // Empty placeholder for where video was to keep column structure safe-ish, or just '' 
            p.likes || 0, p.dislikes || 0, p.timestamp, p.platform || ''
           ];
           if (action !== 'create') deleteRowByTimestamp(sheet, p.timestamp);
           sheet.appendRow(rowData);
           return response({ status: 'success' });
        }
    }
    return response({ status: 'error', message: 'Invalid Action' });
  } catch (err) { return response({ status: 'error', message: String(err) }); }
  finally { lock.releaseLock(); }
}
function deleteRowByTimestamp(sheet, timestamp) {
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][13]) === String(timestamp)) { sheet.deleteRow(i + 1); return; }
  }
}
function response(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}`;

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, onAddProduct, products = [], onDeleteProduct }) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const ADMIN_PASSWORD = 'smartDeal@859055';
  
  // Settings State
  const [scriptUrl, setScriptUrl] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showScriptCode, setShowScriptCode] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'local' | 'cloud'>('local');

  // Edit Mode State
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    highlights: '', 
    affiliateLink: '',
    platform: '',
    price: '',
    mrp: '',
    offer: '',
    code: '',
  });

  const [selectedCategories, setSelectedCategories] = useState<Category[]>(['Trending']);
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      const url = getEffectiveApiUrl();
      if (url) {
          setScriptUrl(url);
          setConnectionStatus('cloud');
      } else {
          setConnectionStatus('local');
      }
  }, []);

  // Automatic Offer Calculation Effect
  useEffect(() => {
    const cleanPrice = (val: string) => parseFloat(val.replace(/[^0-9.]/g, ''));
    
    const mrpVal = cleanPrice(formData.mrp);
    const priceVal = cleanPrice(formData.price);

    if (mrpVal > 0 && priceVal > 0 && mrpVal > priceVal) {
      const discount = Math.round(((mrpVal - priceVal) / mrpVal) * 100);
      const autoOffer = `${discount}% OFF`;
      
      if (!formData.offer || formData.offer.includes('% OFF')) {
         setFormData(prev => {
            if (prev.offer === autoOffer) return prev;
            return { ...prev, offer: autoOffer };
         });
      }
    }
  }, [formData.mrp, formData.price]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerateDescription = async () => {
    if (!formData.name) {
        alert("Please enter a Product Name first.");
        return;
    }
    setIsGeneratingAI(true);
    const pitch = await generateSalesPitch(formData.name, selectedCategories[0] || 'General');
    setFormData(prev => ({ ...prev, description: pitch }));
    setIsGeneratingAI(false);
  };

  const handleSaveSettings = async () => {
      const cleanUrl = scriptUrl.trim();
      
      if (!cleanUrl) {
         if (confirm("Disconnect from Google Sheets and switch back to Local Storage?")) {
             setApiUrl('');
             alert("Switched to Local Storage. App will reload.");
             window.location.reload();
         }
         return;
      }

      setIsTestingConnection(true);
      try {
          // Check for valid URL format roughly
          if (!cleanUrl.startsWith('http')) throw new Error("Invalid URL");

          const response = await fetch(`${cleanUrl}?action=read`);
          const data = await response.json();
          
          if (Array.isArray(data)) {
              setApiUrl(cleanUrl);
              alert("✅ Success! Connected to Google Sheet.\n\nThe app will now reload to sync your products.");
              window.location.reload();
          } else {
              throw new Error("Invalid response");
          }
      } catch (e) {
          alert("❌ Connection Failed!\n\n1. Did you copy the 'Web App URL' correctly?\n2. Did you set 'Who has access' to 'Anyone'?\n3. Did you click 'Authorize' and 'Go to unsafe'?");
      } finally {
          setIsTestingConnection(false);
      }
  };

  const handleCopyScript = () => {
      navigator.clipboard.writeText(GOOGLE_SCRIPT_CODE);
      alert("Code copied to clipboard!");
  };

  const toggleCategory = (cat: Category) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > 7) {
      alert("Maximum 7 images allowed.");
      return;
    }

    // Warning for large files if using LocalStorage (scriptUrl is empty)
    if (!scriptUrl && files[0].size > 500000) {
        alert("⚠️ Warning: This image file is large (>500KB). Local storage has limited space. Consider using 'Add Image URL' instead.");
    }

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    if (images.length >= 7) {
        alert("Maximum 7 images allowed.");
        return;
    }
    setImages(prev => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleUrlInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleAddImageUrl();
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const generateProductCode = (categories: Category[]) => {
    const mainCategory = categories.find(c => c !== 'Trending') || categories[0] || 'GEN';
    const prefix = mainCategory.substring(0, 3).toUpperCase();
    const uniqueSuffix = Date.now().toString().slice(-6);
    return `${prefix}-${uniqueSuffix}`;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect password!");
      setPasswordInput('');
    }
  };

  const resetForm = () => {
    setFormData({
        name: '', description: '', highlights: '', affiliateLink: '',
        platform: '', price: '', mrp: '', offer: '', code: ''
    });
    setSelectedCategories(['Trending']);
    setImages([]);
    setImageUrlInput('');
    setEditingId(null);
  };

  const handleEditClick = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(product.id);
    setFormData({
        name: product.name,
        description: product.description,
        highlights: product.highlights ? product.highlights.join('\n') : '',
        affiliateLink: product.affiliateLink,
        platform: product.platform || '',
        price: product.price || '',
        mrp: product.mrp || '',
        offer: product.offer || '',
        code: product.code,
    });
    setSelectedCategories(product.categories);
    setImages(product.images);
    const formElement = document.querySelector('form');
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteClick = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm("Delete this product?")) {
        if (onDeleteProduct) {
            try {
                await onDeleteProduct(id);
                if (editingId === id) resetForm();
                alert("Deleted successfully.");
            } catch (err) {
                console.error("Delete failed", err);
                alert("Failed to delete.");
            }
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-add pending URL if user forgot to click Add
    let submissionImages = [...images];
    if (imageUrlInput.trim()) {
        if (submissionImages.length < 7) {
            submissionImages.push(imageUrlInput.trim());
            setImageUrlInput(''); // clear visual input
        }
    }

    if (submissionImages.length === 0) {
      alert("Please add at least one image.");
      return;
    }
    
    const hugeImages = submissionImages.filter(img => img.length > 500000);
    // Only warn about size if using Local Storage (no scriptUrl)
    if (!scriptUrl && hugeImages.length > 0) {
        if (!confirm(`⚠️ ${hugeImages.length} images are large and might fill up local storage quickly. Proceed? (Recommendation: Use Image URLs)`)) {
            return;
        }
    }

    if (selectedCategories.length === 0) {
      alert("Please select a category.");
      return;
    }

    setIsSubmitting(true);

    const highlightsArray = formData.highlights
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const productCode = editingId ? formData.code : generateProductCode(selectedCategories);
    const productId = editingId ? editingId : Date.now().toString();
    const timestamp = editingId ? (products.find(p => p.id === editingId)?.timestamp || Date.now()) : Date.now();

    const newProduct: Product = {
      id: productId,
      timestamp: timestamp,
      name: formData.name,
      code: productCode,
      description: formData.description,
      highlights: highlightsArray,
      images: submissionImages,
      affiliateLink: formData.affiliateLink,
      platform: formData.platform || undefined,
      categories: selectedCategories,
      price: formData.price,
      mrp: formData.mrp,
      offer: formData.offer || undefined,
      likes: 0,
      dislikes: 0,
    };

    try {
      await onAddProduct(newProduct);
      if (editingId) {
        alert("Product updated!");
        resetForm();
      } else {
        alert("Product added!");
        onClose();
      }
    } catch (error) {
      alert("Failed to save.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: string) => {
    if (!price) return '';
    const cleanPrice = price.toString().trim();
    return cleanPrice.startsWith('₹') ? cleanPrice : `₹${cleanPrice}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={onClose}></div>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative z-10 text-center animate-in zoom-in-95 duration-200">
             <div className="bg-brand-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
             </div>
             <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access</h2>
             <form onSubmit={handleLogin} className="space-y-4">
               <input 
                  type="password" 
                  value={passwordInput} 
                  onChange={(e) => setPasswordInput(e.target.value)} 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 bg-white" 
                  placeholder="Enter password..." 
                  autoFocus 
               />
               <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-lg">Unlock Panel</button>
             </form>
             <button onClick={onClose} className="mt-4 text-gray-400 text-sm">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={onClose}></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-middle bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:max-w-4xl w-full">
          <div className="bg-gradient-to-r from-brand-600 to-purple-600 px-6 py-4 flex justify-between items-center">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
               {editingId ? 'Edit Product' : 'Add New Product'}
            </h3>
            <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowSettings(!showSettings)} 
                  className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 flex items-center gap-1"
                  title="Database Connection"
                >
                    <span className={`w-2.5 h-2.5 rounded-full ${connectionStatus === 'cloud' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-gray-300'}`}></span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </button>
                <button type="button" onClick={onClose} className="text-white/80 hover:text-white">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
          </div>
          
          <div className="max-h-[80vh] overflow-y-auto">
            
            {showSettings && (
               <div className="bg-gray-50 border-b border-gray-200 p-6 animate-in slide-in-from-top-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-gray-800">Database Connection</h4>
                    <span className={`text-xs px-2 py-1 rounded-full border ${connectionStatus === 'cloud' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {connectionStatus === 'cloud' ? '✅ Connected to Google Sheet' : '🟠 Using Local Browser Storage'}
                    </span>
                  </div>
                  
                  {showScriptCode ? (
                    <div className="mb-4 bg-gray-100 rounded-lg p-3 border border-gray-300">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-gray-500 uppercase">Code.gs</span>
                            <button onClick={() => setShowScriptCode(false)} className="text-xs text-blue-600 hover:underline">Close Code</button>
                        </div>
                        <textarea 
                            readOnly 
                            className="w-full h-48 text-[10px] font-mono p-2 border border-gray-200 rounded focus:outline-none text-gray-900 bg-white"
                            value={GOOGLE_SCRIPT_CODE}
                            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                        />
                        <button onClick={handleCopyScript} className="mt-2 w-full bg-blue-600 text-white text-xs py-2 rounded hover:bg-blue-700 font-bold">Copy Code</button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800">
                        <strong>Setup Guide:</strong><br/>
                        1. Create a Google Sheet & Extensions &gt; Apps Script.<br/>
                        2. <button onClick={() => setShowScriptCode(true)} className="text-blue-600 font-bold hover:underline underline">Click here to get the Script Code</button>, paste it and Save.<br/>
                        3. Click <strong>Deploy</strong> &gt; New Deployment &gt; Select "Web App".<br/>
                        4. <strong>CRITICAL:</strong> Set "Who has access" to <strong>"Anyone"</strong>.<br/>
                        5. Authorize (Click Advanced &gt; Go to unsafe if needed).<br/>
                        6. Paste the <strong>Web App URL</strong> below.
                    </p>
                  )}

                  <div className="flex gap-2">
                    <input 
                      type="url" 
                      value={scriptUrl} 
                      onChange={(e) => setScriptUrl(e.target.value)} 
                      placeholder="Paste Web App URL here (starts with https://script.google.com/...)" 
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 bg-white" 
                    />
                    <button 
                        onClick={handleSaveSettings} 
                        disabled={isTestingConnection}
                        className={`bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 flex items-center gap-2 ${isTestingConnection ? 'opacity-75 cursor-wait' : ''}`}
                    >
                        {isTestingConnection ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Testing...
                            </>
                        ) : 'Test & Connect'}
                    </button>
                  </div>
                  {connectionStatus === 'local' && <p className="text-[10px] text-orange-500 mt-2">⚠️ Local storage is temporary. Connect Google Sheets for permanent storage.</p>}
               </div>
            )}

            <form onSubmit={handleSubmit} className="p-6">
            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* Media */}
              <div className="w-full lg:w-1/3 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Product Images (Max 7)</label>
                  
                  {/* URL Input Option */}
                  <div className="flex gap-2 mb-3">
                      <input 
                        type="url" 
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        onKeyDown={handleUrlInputKeyDown}
                        placeholder="Paste Image URL here..."
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
                      />
                      <button type="button" onClick={handleAddImageUrl} className="bg-gray-800 text-white px-3 rounded-lg text-sm hover:bg-gray-900 transition-colors">Add</button>
                  </div>

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <p className="text-sm text-gray-500">Or click to upload file</p>
                    <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload}/>
                  </div>
                  
                  {images.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group bg-gray-50">
                          <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-contain" />
                          <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100 shadow-sm">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2 text-right">{images.length}/7 images</p>
                </div>
              </div>

              {/* Details */}
              <div className="w-full lg:w-2/3 space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Product Name</label>
                    <input required name="name" onChange={handleChange} value={formData.name} className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">MRP</label>
                    <input name="mrp" onChange={handleChange} value={formData.mrp} className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-brand-500 outline-none" placeholder="₹2,999" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Sale Price</label>
                    <input name="price" onChange={handleChange} value={formData.price} className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-brand-500 outline-none" placeholder="₹1,499" />
                  </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Discount Label</label>
                    <input name="offer" onChange={handleChange} value={formData.offer} className="w-full bg-red-50 border border-red-100 text-red-900 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 outline-none" />
                </div>

                <div>
                   <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Categories</label>
                   <div className="flex flex-wrap gap-2">
                     {CATEGORIES.map(cat => (
                       <button key={cat} type="button" onClick={() => toggleCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${selectedCategories.includes(cat) ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'}`}>{cat}</button>
                     ))}
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Platform</label>
                        <input name="platform" onChange={handleChange} value={formData.platform} placeholder="e.g. Amazon, Myntra" className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-brand-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Affiliate Link</label>
                        <input required name="affiliateLink" type="url" onChange={handleChange} value={formData.affiliateLink} className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-brand-500 outline-none" />
                    </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Highlights</label>
                  <textarea name="highlights" rows={3} onChange={handleChange} value={formData.highlights} className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-brand-500 outline-none" placeholder="- Item 1"></textarea>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold uppercase text-gray-500">Description</label>
                    <button 
                        type="button" 
                        onClick={handleGenerateDescription}
                        disabled={isGeneratingAI}
                        className="text-xs flex items-center gap-1 text-brand-600 hover:text-brand-700 font-bold"
                    >
                        {isGeneratingAI ? (
                            <span className="animate-pulse">✨ Writing...</span>
                        ) : (
                            <>
                                <Sparkles className="w-3 h-3" />
                                <span>Auto-Write with AI</span>
                            </>
                        )}
                    </button>
                  </div>
                  <textarea required name="description" rows={3} onChange={handleChange} value={formData.description} className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-brand-500 outline-none"></textarea>
                </div>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between border-t border-gray-100 mt-6">
              <div className="flex gap-2">
                 {editingId && <button type="button" onClick={resetForm} className="text-xs text-red-500 font-medium hover:text-red-700">Cancel Edit</button>}
              </div>
              <div className="flex items-center space-x-3">
                  <button type="button" onClick={onClose} disabled={isSubmitting} className="text-gray-500 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5">Close</button>
                  <button type="submit" disabled={isSubmitting} className={`text-white bg-brand-600 hover:bg-brand-700 font-medium rounded-lg text-sm px-5 py-2.5 flex items-center ${isSubmitting ? 'opacity-75' : ''}`}>
                    {isSubmitting ? 'Saving...' : (editingId ? 'Update Product' : 'Save Product')}
                  </button>
              </div>
            </div>
            </form>

            <div className="bg-gray-50 p-4 sm:p-6 border-t border-gray-200">
               <h4 className="font-bold text-gray-800 mb-4">Manage Inventory ({products.length})</h4>
               
               <div className="space-y-3">
                  {products.map(product => (
                    <div key={product.id} className={`bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3 ${editingId === product.id ? 'ring-2 ring-brand-500 bg-blue-50' : ''}`}>
                        <div className="h-12 w-12 flex-shrink-0 rounded bg-gray-100 overflow-hidden">
                            <img src={product.images[0]} alt="" className="h-full w-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{formatPrice(product.price || '')}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={(e) => handleEditClick(e, product)} className="p-2 text-brand-600 hover:bg-brand-50 rounded">Edit</button>
                            <button type="button" onClick={(e) => handleDeleteClick(e, product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">Delete</button>
                        </div>
                    </div>
                  ))}
                  {products.length === 0 && <div className="text-center py-4 text-gray-500 text-sm">No products found.</div>}
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
