import React, { useState, useRef } from 'react';
import { CustomerQuery, Order, Product, ProductVariant, Review, UserSession } from '../types';
import { SVG_PLACEHOLDER_IMAGE } from '../services/catalogService';
import { 
  Package, 
  ShoppingBag, 
  Users, 
  HelpCircle, 
  Star, 
  PlusCircle, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Check, 
  X, 
  Edit3, 
  LogOut, 
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Phone,
  Mail,
  Calendar,
  Clock,
  RefreshCw,
  Info
} from 'lucide-react';

interface AdminPanelProps {
  products: Product[];
  categories?: string[];
  orders: Order[];
  users: UserSession[];
  queries: CustomerQuery[];
  reviews: Review[];
  onAddProduct: (product: Product, file?: File | null) => Promise<boolean | void> | void;
  onUpdateProduct: (product: Product, file?: File | null) => Promise<boolean | void> | void;
  onDeleteProduct: (productId: number | string) => Promise<boolean | void> | void;
  onToggleStock: (productId: number | string) => Promise<boolean | void> | void;
  onUpdateOrderStatus: (orderIndex: number, newStatus: Order['status']) => void;
  onDeleteOrder: (orderId: string) => void;
  onDeleteQuery: (queryId: number) => void;
  onDeleteReview: (reviewId: number) => void;
  onExitAdmin: () => void;
  onLogout?: () => void;
}

type AdminTab = 'products' | 'upload' | 'orders' | 'users' | 'queries' | 'reviews';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  products,
  categories = [],
  orders,
  users,
  queries,
  reviews,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onToggleStock,
  onUpdateOrderStatus,
  onDeleteOrder,
  onDeleteQuery,
  onDeleteReview,
  onExitAdmin,
  onLogout,
}) => {
  const [currentTab, setCurrentTab] = useState<AdminTab>('orders');
  const [orderFilter, setOrderFilter] = useState<'All' | Order['status']>('All');

  // Notification Banner (Success / Error)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification({ type, message });
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Operation Loading States (Prevents repeated clicks / race conditions)
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [togglingStockId, setTogglingStockId] = useState<string | number | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | number | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [deletingQueryId, setDeletingQueryId] = useState<number | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);

  // Quick Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editError, setEditError] = useState('');
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string>('');
  const [editImageUrlInput, setEditImageUrlInput] = useState('');
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const validCategories = (categories || []).filter((c) => Boolean(c && c !== 'All Spices'));
  const categoriesList = validCategories.length > 0 
    ? validCategories 
    : ['Pure Spices', 'Ground Spices', 'Whole Spices', 'Blended Spices'];
  const defaultCategory = categoriesList[0];

  // Product Upload Form State
  const [pName, setPName] = useState('');
  const [pCategory, setPCategory] = useState(defaultCategory);

  React.useEffect(() => {
    if (!pCategory && categoriesList.length > 0) {
      setPCategory(categoriesList[0]);
    }
  }, [categoriesList, pCategory]);

  const [pSku, setPSku] = useState('');
  const [pStockQuantity, setPStockQuantity] = useState(100);
  const [pInStock, setPInStock] = useState(true);
  const [pIsFeatured, setPIsFeatured] = useState(true);
  const [pShortDesc, setPShortDesc] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pImagePreview, setPImagePreview] = useState<string>('');
  const [pImageUrlInput, setPImageUrlInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Variant weights & prices
  const [variants, setVariants] = useState<ProductVariant[]>([
    { weight: '25g', price: 20 },
    { weight: '50g', price: 38 },
    { weight: '100g', price: 70 },
    { weight: '200g', price: 135 },
    { weight: '500g', price: 260 },
    { weight: '1kg', price: 490 },
  ]);

  // Custom variant builder
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [newVariantWeight, setNewVariantWeight] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState<number | ''>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle local image file upload & validation
  const processImageFile = (file: File) => {
    setImageError('');
    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image file size must be less than 5MB.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPImagePreview(objectUrl);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPImagePreview('');
    setPImageUrlInput('');
    setImageError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplyImageUrl = () => {
    const url = pImageUrlInput.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image/')) {
      setImageError('Please enter a valid HTTP or HTTPS image URL.');
      return;
    }
    setSelectedFile(null);
    setPImagePreview(url);
    setImageError('');
  };

  const handleVariantPriceChange = (index: number, newPrice: number) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], price: Math.max(0, newPrice) };
    setVariants(updated);
  };

  const handleAddCustomVariant = () => {
    const trimmedWeight = newVariantWeight.trim();
    const priceNum = Number(newVariantPrice);
    if (!trimmedWeight) return;
    if (isNaN(priceNum) || priceNum < 0) return;

    if (variants.some((v) => v.weight.toLowerCase() === trimmedWeight.toLowerCase())) {
      showNotification('error', `Variant "${trimmedWeight}" already exists.`);
      return;
    }

    setVariants([...variants, { weight: trimmedWeight, price: priceNum }]);
    setNewVariantWeight('');
    setNewVariantPrice('');
    setShowAddVariant(false);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) {
      showNotification('error', 'A product must have at least one weight variant.');
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) {
      setImageError('Product title / name is required.');
      return;
    }

    if (variants.length === 0) {
      setImageError('Please configure at least one weight variant with pricing.');
      return;
    }

    setIsUploading(true);
    setImageError('');

    try {
      const newProduct: Product = {
        id: '',
        name: pName.trim(),
        category: pCategory,
        sku: pSku.trim() || `KBR-${pName.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        stockQuantity: Number(pStockQuantity) || 50,
        inStock: pInStock,
        isFeatured: pIsFeatured,
        image: pImageUrlInput.trim() || '',
        variants: variants.map((v) => ({ ...v, price: Number(v.price) || 0 })),
        shortDescription: pShortDesc.trim() || `${pCategory} from KBR Global Ventures`,
        description: pDesc.trim() || `${pName} prepared with traditional hygienic standards.`,
      };

      const result = await onAddProduct(newProduct, selectedFile);
      if (result !== false) {
        setUploadSuccess(true);
        showNotification('success', `Product "${newProduct.name}" uploaded successfully and is now live!`);

        // Reset Form
        setTimeout(() => {
          setPName('');
          setPSku('');
          setPShortDesc('');
          setPDesc('');
          setPImagePreview('');
          setPImageUrlInput('');
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          setUploadSuccess(false);
          setCurrentTab('products');
        }, 1200);
      }
    } catch (err: any) {
      console.error('Error in handleUploadSubmit:', err);
      const errMsg = err.message || 'Failed to upload product.';
      setImageError(errMsg);
      showNotification('error', errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  // Quick edit image handling
  const handleEditImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setEditError('Please select a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setEditError('Image file size must be less than 5MB.');
      return;
    }
    setEditSelectedFile(file);
    setEditImagePreview(URL.createObjectURL(file));
    setEditError('');
  };

  // Filtered orders
  const filteredOrders = orderFilter === 'All' 
    ? orders 
    : orders.filter((o) => o.status === orderFilter);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-10">
      
      {/* Top Notification Banner */}
      {notification && (
        <div 
          className={`mb-4 sm:mb-6 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2 duration-200 border ${
            notification.type === 'success' 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <p className="text-xs sm:text-sm font-bold truncate">
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-gray-500 hover:text-gray-800 transition shrink-0 cursor-pointer"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border-2 border-red-900/60 p-4 sm:p-8 mb-4 sm:mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-4 sm:pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-red-800 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Authorized Super Admin
              </span>
              <span className="text-xs text-gray-500 font-medium">
                Live Store Controls
              </span>
            </div>
            <h2 className="text-xl sm:text-3xl font-extrabold text-royal-950 mt-1">
              Management Portal
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setCurrentTab('upload')}
              className="col-span-2 sm:col-span-1 min-h-[42px] bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-[0.98] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Upload Product</span>
            </button>
            <button
              onClick={onExitAdmin}
              className="min-h-[42px] bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-gray-300 transition cursor-pointer active:scale-[0.98]"
              title="Return to customer store"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>Back to Store</span>
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="min-h-[42px] bg-red-50 hover:bg-red-100 text-red-900 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-red-200 transition cursor-pointer active:scale-[0.98]"
                title="Sign out of Admin Session"
              >
                <LogOut className="w-3.5 h-3.5 text-red-700 shrink-0" />
                <span>Admin Logout</span>
              </button>
            )}
          </div>
        </div>

        {/* Responsive Tab Bar with smooth touch scrolling */}
        <div className="mt-4 sm:mt-5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 border-b border-gray-100 scrollbar-none touch-pan-x">
          <button
            onClick={() => setCurrentTab('orders')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-[0.98] ${
              currentTab === 'orders'
                ? 'bg-red-800 text-white shadow'
                : 'text-gray-600 hover:bg-red-50 hover:text-red-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setCurrentTab('products')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-[0.98] ${
              currentTab === 'products'
                ? 'bg-red-800 text-white shadow'
                : 'text-gray-600 hover:bg-red-50 hover:text-red-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Product Inventory ({products.length})</span>
          </button>

          <button
            onClick={() => setCurrentTab('upload')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-[0.98] ${
              currentTab === 'upload'
                ? 'bg-red-800 text-white shadow'
                : 'text-gray-600 hover:bg-red-50 hover:text-red-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Product Upload</span>
          </button>

          <button
            onClick={() => setCurrentTab('users')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-[0.98] ${
              currentTab === 'users'
                ? 'bg-red-800 text-white shadow'
                : 'text-gray-600 hover:bg-red-50 hover:text-red-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users ({users.length})</span>
          </button>

          <button
            onClick={() => setCurrentTab('queries')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-[0.98] ${
              currentTab === 'queries'
                ? 'bg-red-800 text-white shadow'
                : 'text-gray-600 hover:bg-red-50 hover:text-red-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Queries ({queries.length})</span>
          </button>

          <button
            onClick={() => setCurrentTab('reviews')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-[0.98] ${
              currentTab === 'reviews'
                ? 'bg-red-800 text-white shadow'
                : 'text-gray-600 hover:bg-red-50 hover:text-red-900'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Reviews ({reviews.length})</span>
          </button>
        </div>

        {/* ===================== TAB 1: PRODUCT UPLOAD FORM (CORE FEATURE) ===================== */}
        {currentTab === 'upload' && (
          <div className="pt-4 sm:pt-6 animate-in fade-in duration-200">
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-royal-950 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-amber-700" />
                  <span>Upload New Spice / Masala Product</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Fill in the details below. Newly uploaded products will be immediately active on the live store.
                </p>
              </div>
            </div>

            {uploadSuccess && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Product uploaded successfully! It is now live in store.</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-5 sm:space-y-6">
              
              {/* Image Upload Area with Drag-and-Drop & Preview UX */}
              <div className="bg-amber-50/50 p-4 sm:p-6 rounded-2xl border-2 border-dashed border-amber-300">
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  Product Image * (Upload File or Enter Image URL)
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start">
                  
                  {/* File Upload Selector & Dropzone */}
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageFileChange}
                      className="hidden"
                      id="productImageInput"
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`cursor-pointer bg-white p-5 sm:p-6 rounded-2xl border-2 transition flex flex-col items-center justify-center text-center group min-h-[140px] sm:min-h-[160px] ${
                        isDragOver 
                          ? 'border-amber-500 bg-amber-100/50 scale-[1.01]' 
                          : 'border-amber-200 hover:border-amber-400'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 mb-2 group-hover:scale-110 transition shrink-0">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-royal-950">
                        {isDragOver ? 'Drop image here...' : 'Tap or click to select image from your device'}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1">
                        PNG, JPG, WebP up to 5MB supported
                      </p>
                      {selectedFile && (
                        <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-[11px] font-bold border border-emerald-200">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="truncate max-w-[180px]">{selectedFile.name}</span>
                          <span className="text-emerald-600">({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                        </div>
                      )}
                    </div>

                    {/* Or URL input */}
                    <div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="url"
                          value={pImageUrlInput}
                          onChange={(e) => setPImageUrlInput(e.target.value)}
                          placeholder="Or paste external image URL (https://...)"
                          className="flex-1 px-3.5 py-2.5 sm:py-2 border border-gray-300 rounded-xl text-base sm:text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[42px]"
                        />
                        <button
                          type="button"
                          onClick={handleApplyImageUrl}
                          className="bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl min-h-[42px] transition active:scale-98 cursor-pointer shrink-0"
                        >
                          Apply URL
                        </button>
                      </div>
                    </div>

                    {imageError && (
                      <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 bg-red-50 p-2.5 rounded-xl border border-red-200">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                        <span>{imageError}</span>
                      </p>
                    )}
                  </div>

                  {/* Image Live Preview */}
                  <div className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl border border-amber-200 min-h-[190px]">
                    <div className="w-full flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-gray-500 uppercase">
                        Image Preview
                      </p>
                      {pImagePreview && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                          {selectedFile ? 'Local File' : 'Image URL'}
                        </span>
                      )}
                    </div>

                    {pImagePreview ? (
                      <div className="relative w-full max-w-[200px] sm:max-w-[220px] aspect-square rounded-xl overflow-hidden shadow-sm border border-amber-300 bg-gray-50 group">
                        <img
                          src={pImagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={() => {
                            setImageError('Could not load image preview. Please check the URL or try another file.');
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full shadow-md hover:bg-red-700 cursor-pointer transition active:scale-95"
                          title="Remove image"
                          aria-label="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full max-w-[200px] sm:max-w-[220px] aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                        <ImageIcon className="w-10 h-10 mb-2 opacity-40" />
                        <span className="text-xs font-medium">No image selected yet</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">Upload a photo or enter a link</span>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Product Title / Name *
                  </label>
                  <input
                    type="text"
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    required
                    placeholder="e.g. Kashmiri Degi Mirch Powder"
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl text-base sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value)}
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl text-base sm:text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer min-h-[44px]"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    SKU / Product Code
                  </label>
                  <input
                    type="text"
                    value={pSku}
                    onChange={(e) => setPSku(e.target.value)}
                    placeholder="Auto-generated if empty"
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl text-base sm:text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Stock Quantity (Units)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={pStockQuantity}
                    onChange={(e) => setPStockQuantity(Number(e.target.value))}
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl text-base sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px]"
                  />
                </div>

                {/* Mobile Touch-friendly Toggle Chips */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-6 pt-1 sm:pt-6">
                  <label className="flex items-center gap-3 p-3 sm:p-0 bg-white sm:bg-transparent rounded-xl border border-gray-200 sm:border-transparent cursor-pointer select-none min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={pInStock}
                      onChange={(e) => setPInStock(e.target.checked)}
                      className="w-5 h-5 rounded text-amber-800 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-xs sm:text-xs font-bold text-gray-800">In Stock Now (Available for purchase)</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 sm:p-0 bg-white sm:bg-transparent rounded-xl border border-gray-200 sm:border-transparent cursor-pointer select-none min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={pIsFeatured}
                      onChange={(e) => setPIsFeatured(e.target.checked)}
                      className="w-5 h-5 rounded text-amber-800 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-xs sm:text-xs font-bold text-gray-800">Featured On Home Page</span>
                  </label>
                </div>
              </div>

              {/* Weight Variant Pricing Responsive Grid */}
              <div className="bg-gray-50 p-4 sm:p-5 rounded-2xl border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-royal-950 uppercase tracking-wider">
                      Weight Variant Pricing (INR ₹)
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Configure customer selling price for each pack size.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddVariant(!showAddVariant)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-100/80 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition active:scale-95 cursor-pointer min-h-[36px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddVariant ? 'Close' : 'Add Pack Size'}</span>
                  </button>
                </div>

                {/* Add Custom Pack Size Drawer */}
                {showAddVariant && (
                  <div className="mb-4 p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={newVariantWeight}
                      onChange={(e) => setNewVariantWeight(e.target.value)}
                      placeholder="Pack Weight (e.g. 250g, 2kg)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-base sm:text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[42px]"
                    />
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-gray-400 font-bold">₹</span>
                      <input
                        type="number"
                        min={0}
                        value={newVariantPrice}
                        onChange={(e) => setNewVariantPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Price in INR"
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-base sm:text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[42px]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCustomVariant}
                      className="bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs px-4 py-2 rounded-lg transition active:scale-98 cursor-pointer min-h-[42px]"
                    >
                      Add Variant
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
                  {variants.map((v, idx) => (
                    <div key={v.weight || idx} className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs relative group">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="block text-xs font-bold text-royal-950 text-center bg-amber-100/70 px-2 py-0.5 rounded flex-1">
                          {v.weight}
                        </span>
                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="ml-1 text-gray-400 hover:text-red-600 transition p-0.5 rounded cursor-pointer"
                            title={`Remove ${v.weight}`}
                            aria-label={`Remove ${v.weight}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-gray-400 font-bold">
                          ₹
                        </span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={v.price}
                          onChange={(e) => handleVariantPriceChange(idx, Number(e.target.value))}
                          required
                          className="w-full pl-6 pr-2 py-2 sm:py-1.5 border border-gray-300 rounded-lg text-sm sm:text-xs font-bold text-royal-950 focus:ring-1 focus:ring-amber-500 focus:outline-none min-h-[38px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Short Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={pShortDesc}
                    onChange={(e) => setPShortDesc(e.target.value)}
                    placeholder="e.g. 100% Pure High-Pungency Sun Dried"
                    className="w-full px-3.5 sm:px-4 py-2.5 border border-gray-300 rounded-xl text-base sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Full Product Description
                  </label>
                  <textarea
                    rows={2}
                    value={pDesc}
                    onChange={(e) => setPDesc(e.target.value)}
                    placeholder="Detailed culinary notes, spice origin, and hygienic process..."
                    className="w-full px-3.5 sm:px-4 py-2.5 border border-gray-300 rounded-xl text-base sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons with Double-Click Protection & Loading Feedback */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="min-h-[46px] bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white font-extrabold px-8 py-3.5 rounded-xl shadow-lg transition active:scale-[0.99] flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Uploading to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 shrink-0" />
                      <span>Save & Publish Product to Store</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setCurrentTab('products')}
                  className="min-h-[46px] px-6 py-3.5 border border-gray-300 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-700 transition active:scale-98 cursor-pointer flex items-center justify-center"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        )}

        {/* ===================== TAB 2: PRODUCT INVENTORY & STOCK CONTROLS ===================== */}
        {currentTab === 'products' && (
          <div className="pt-4 sm:pt-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-royal-950">
                  Product Inventory ({products.length})
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage stock availability, edit pricing, or remove catalogue items.
                </p>
              </div>

              <button
                onClick={() => setCurrentTab('upload')}
                className="w-full sm:w-auto min-h-[40px] bg-amber-800 hover:bg-amber-900 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-98 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Upload New Product</span>
              </button>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-6">
                <Package className="w-10 h-10 text-gray-400 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold text-gray-700">No products found in catalogue.</p>
                <p className="text-xs text-gray-500 mt-1 mb-4">Add your first spice or masala to get started.</p>
                <button
                  onClick={() => setCurrentTab('upload')}
                  className="bg-amber-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow cursor-pointer inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Upload Product Now</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                {products.map((p) => {
                  const baseVariant = (p.variants && p.variants[0]) || { weight: '100g', price: 50 };
                  const isStockToggling = togglingStockId === p.id;
                  const isDeleting = deletingProductId === p.id;

                  return (
                    <div
                      key={p.id}
                      className="bg-gray-50/80 p-3.5 sm:p-4 rounded-2xl border border-amber-200/80 flex flex-col justify-between shadow-xs hover:shadow-md transition"
                    >
                      <div className="flex items-start space-x-3 sm:space-x-3.5">
                        <img
                          src={p.image || SVG_PLACEHOLDER_IMAGE}
                          alt={p.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = SVG_PLACEHOLDER_IMAGE;
                          }}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-amber-300 shrink-0 bg-white"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-royal-950 truncate max-w-full">
                              {p.name}
                            </h4>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                p.inStock
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {p.inStock ? 'Available' : 'Out of Stock'}
                            </span>
                            {p.isFeatured && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                                Featured
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Category: <span className="font-medium text-gray-700">{p.category || 'Pure Spices'}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            SKU: <span className="font-mono text-gray-700">{p.sku || `#${p.id}`}</span> • Stock: {p.stockQuantity ?? 100} units
                          </p>
                          <p className="text-xs font-bold text-royal-950 mt-1">
                            Starts at ₹{baseVariant.price} ({baseVariant.weight})
                          </p>
                        </div>
                      </div>

                      {/* Card Action Buttons with anti-double-click & loading states */}
                      <div className="mt-3.5 pt-3 border-t border-gray-200 flex items-center justify-between gap-2 flex-wrap">
                        <button
                          onClick={async () => {
                            if (isStockToggling) return;
                            setTogglingStockId(p.id);
                            try {
                              await onToggleStock(p.id);
                              showNotification('success', `Updated stock status for "${p.name}".`);
                            } catch (err: any) {
                              showNotification('error', err.message || 'Failed to toggle stock status.');
                            } finally {
                              setTogglingStockId(null);
                            }
                          }}
                          disabled={isStockToggling || isDeleting}
                          className={`min-h-[38px] text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer active:scale-98 flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed ${
                            p.inStock
                              ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          }`}
                        >
                          {isStockToggling ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Updating...</span>
                            </>
                          ) : (
                            <span>{p.inStock ? 'Mark Out of Stock' : 'Mark In Stock'}</span>
                          )}
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditError('');
                              setEditSelectedFile(null);
                              setEditImagePreview(p.image || '');
                              setEditImageUrlInput('');
                              setEditingProduct(p);
                            }}
                            disabled={isStockToggling || isDeleting}
                            className="min-h-[38px] text-xs bg-royal-900 text-white font-bold px-3.5 py-1.5 rounded-xl hover:bg-royal-950 transition flex items-center gap-1.5 cursor-pointer active:scale-98 disabled:opacity-50"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Quick Edit</span>
                          </button>
                          
                          <button
                            onClick={async () => {
                              if (isDeleting) return;
                              let shouldDelete = true;
                              try {
                                if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
                                  shouldDelete = window.confirm(`Are you sure you want to remove "${p.name}"?`);
                                }
                              } catch {
                                shouldDelete = true;
                              }
                              if (shouldDelete) {
                                setDeletingProductId(p.id);
                                try {
                                  await onDeleteProduct(p.id);
                                  showNotification('success', `Removed "${p.name}" from inventory.`);
                                } catch (err: any) {
                                  showNotification('error', err.message || 'Failed to remove product.');
                                } finally {
                                  setDeletingProductId(null);
                                }
                              }
                            }}
                            disabled={isDeleting || isStockToggling}
                            className="min-h-[38px] text-xs text-red-600 hover:text-red-800 p-2 rounded-xl hover:bg-red-50 transition cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center"
                            title="Delete Product"
                            aria-label="Delete Product"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 3: CUSTOMER ORDERS ===================== */}
        {currentTab === 'orders' && (
          <div className="pt-4 sm:pt-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-royal-950">
                  Customer Orders ({orders.length})
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Track dispatch, confirm payments, and update order statuses.
                </p>
              </div>

              {/* Status filter - horizontally scrollable on mobile */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs font-semibold scrollbar-none touch-pan-x">
                {(['All', 'Pending', 'Confirmed', 'Delivered', 'Cancelled'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderFilter(st)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer active:scale-95 ${
                      orderFilter === st
                        ? 'bg-royal-950 text-amber-300 font-bold'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-500 text-sm p-6">
                <ShoppingBag className="w-10 h-10 text-gray-400 mx-auto mb-2 opacity-50" />
                <p className="font-bold text-gray-700">No orders found under "{orderFilter}" status.</p>
                <p className="text-xs text-gray-500 mt-1">New customer purchases will appear here automatically.</p>
              </div>
            ) : (
              <div className="space-y-3.5 sm:space-y-4">
                {filteredOrders.map((o) => {
                  const actualIdx = orders.findIndex((orig) => orig.id === o.id);
                  const isOrderUpdating = updatingOrderId === o.id;
                  const isOrderDeleting = deletingOrderId === o.id;

                  return (
                    <div
                      key={o.id}
                      className="bg-gray-50 p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-royal-950 text-sm sm:text-base">
                            #{o.id}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                              o.status === 'Confirmed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : o.status === 'Delivered'
                                ? 'bg-blue-100 text-blue-800'
                                : o.status === 'Cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {o.status}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            • {o.date}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-gray-800">
                          Customer: <span className="font-bold text-royal-950">{o.customerName}</span> ({o.phone} | {o.email})
                        </p>
                        <p className="text-xs text-gray-600 break-words">
                          Address: {o.address}, {o.city}, {o.state} - <b>{o.pincode}</b>
                        </p>

                        <div className="pt-1.5 text-xs text-gray-700 space-y-0.5">
                          <p className="font-bold text-royal-900">Items Ordered:</p>
                          {o.items.map((item, i) => (
                            <p key={i} className="text-gray-600 pl-2">
                              • {item.name} ({item.weight}) x {item.qty} — ₹{item.price * item.qty}
                            </p>
                          ))}
                        </div>

                        <p className="text-xs font-bold text-emerald-800 pt-1">
                          Total Amount: ₹{o.totalAmount} • Payment Method: {o.paymentMethod}
                        </p>
                      </div>

                      {/* Action buttons with loading states & double-click protection */}
                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-200">
                        <button
                          onClick={async () => {
                            if (isOrderUpdating) return;
                            setUpdatingOrderId(o.id);
                            try {
                              await onUpdateOrderStatus(actualIdx, 'Confirmed');
                              showNotification('success', `Order #${o.id} marked as Confirmed.`);
                            } finally {
                              setUpdatingOrderId(null);
                            }
                          }}
                          disabled={isOrderUpdating || isOrderDeleting}
                          className="min-h-[42px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          {isOrderUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          <span>Confirm</span>
                        </button>

                        <button
                          onClick={async () => {
                            if (isOrderUpdating) return;
                            setUpdatingOrderId(o.id);
                            try {
                              await onUpdateOrderStatus(actualIdx, 'Delivered');
                              showNotification('success', `Order #${o.id} marked as Delivered.`);
                            } finally {
                              setUpdatingOrderId(null);
                            }
                          }}
                          disabled={isOrderUpdating || isOrderDeleting}
                          className="min-h-[42px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          {isOrderUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          <span>Delivered</span>
                        </button>

                        <button
                          onClick={async () => {
                            if (isOrderUpdating) return;
                            setUpdatingOrderId(o.id);
                            try {
                              await onUpdateOrderStatus(actualIdx, 'Cancelled');
                              showNotification('success', `Order #${o.id} marked as Cancelled.`);
                            } finally {
                              setUpdatingOrderId(null);
                            }
                          }}
                          disabled={isOrderUpdating || isOrderDeleting}
                          className="min-h-[42px] bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          {isOrderUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          <span>Cancel</span>
                        </button>

                        <button
                          onClick={async () => {
                            if (isOrderDeleting) return;
                            let shouldDelete = true;
                            try {
                              if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
                                shouldDelete = window.confirm(`Delete order record #${o.id}?`);
                              }
                            } catch {
                              shouldDelete = true;
                            }
                            if (shouldDelete) {
                              setDeletingOrderId(o.id);
                              try {
                                await onDeleteOrder(o.id);
                                showNotification('success', `Order #${o.id} deleted.`);
                              } finally {
                                setDeletingOrderId(null);
                              }
                            }
                          }}
                          disabled={isOrderDeleting || isOrderUpdating}
                          className="min-h-[42px] p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center"
                          title="Delete Order"
                          aria-label="Delete Order"
                        >
                          {isOrderDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 4: LOGGED IN USERS DIRECTORY ===================== */}
        {currentTab === 'users' && (
          <div className="pt-4 sm:pt-6 animate-in fade-in duration-200">
            <h3 className="text-lg sm:text-xl font-extrabold text-royal-950 mb-1">
              Registered Logged-In Customers ({users.length})
            </h3>
            <p className="text-xs text-gray-500 mb-4 sm:mb-6">
              Customers who have verified their contact credentials to access the store.
            </p>

            {users.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border text-gray-500 text-sm p-6">
                <Users className="w-10 h-10 text-gray-400 mx-auto mb-2 opacity-50" />
                <p className="font-bold text-gray-700">No active logged-in users registered yet.</p>
              </div>
            ) : (
              <div>
                {/* Mobile Responsive Card Layout (< sm) */}
                <div className="block sm:hidden space-y-3">
                  {users.map((u, i) => (
                    <div key={i} className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-royal-950 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-amber-700" />
                          <span>{u.fullName || `Customer #${i + 1}`}</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {u.role || 'customer'}
                        </span>
                      </div>
                      {u.phone && (
                        <p className="text-xs text-gray-700 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <a href={`tel:${u.phone}`} className="text-amber-900 font-bold hover:underline">
                            +91 {u.phone}
                          </a>
                        </p>
                      )}
                      {u.email && (
                        <p className="text-xs text-gray-600 flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{u.email}</span>
                        </p>
                      )}
                      {u.time && (
                        <p className="text-[11px] text-gray-400 flex items-center gap-1.5 pt-1 border-t border-gray-100">
                          <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                          <span>Session: {u.time}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop Table View (>= sm) */}
                <div className="hidden sm:block overflow-x-auto bg-white rounded-2xl border border-gray-200 shadow-xs">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead className="bg-royal-950 text-amber-300 uppercase">
                      <tr>
                        <th className="p-4">#</th>
                        <th className="p-4">Customer Name</th>
                        <th className="p-4">Mobile Number</th>
                        <th className="p-4">Email / Gmail</th>
                        <th className="p-4">Session Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((u, i) => (
                        <tr key={i} className="hover:bg-amber-50/50">
                          <td className="p-4 font-bold text-gray-500">{i + 1}</td>
                          <td className="p-4 font-bold text-royal-950">{u.fullName || 'Customer'}</td>
                          <td className="p-4 font-bold text-royal-950">
                            {u.phone ? `+91 ${u.phone}` : '—'}
                          </td>
                          <td className="p-4 text-gray-700">{u.email || '—'}</td>
                          <td className="p-4 text-gray-400">{u.time || 'Active'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 5: CUSTOMER QUERIES ===================== */}
        {currentTab === 'queries' && (
          <div className="pt-4 sm:pt-6 animate-in fade-in duration-200">
            <h3 className="text-lg sm:text-xl font-extrabold text-royal-950 mb-1">
              Customer Queries & Support Tickets ({queries.length})
            </h3>
            <p className="text-xs text-gray-500 mb-4 sm:mb-6">
              Tickets submitted from the customer care helpline form.
            </p>

            {queries.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border text-gray-500 text-sm p-6">
                <HelpCircle className="w-10 h-10 text-gray-400 mx-auto mb-2 opacity-50" />
                <p className="font-bold text-gray-700">No customer queries found.</p>
                <p className="text-xs text-gray-500 mt-1">Customer support inquiries will be displayed here.</p>
              </div>
            ) : (
              <div>
                {/* Mobile Responsive Card Layout (< sm) */}
                <div className="block sm:hidden space-y-3">
                  {queries.map((q) => {
                    const isDeletingThis = deletingQueryId === q.id;
                    return (
                      <div key={q.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-400">{q.date}</span>
                          <button
                            onClick={async () => {
                              if (isDeletingThis) return;
                              setDeletingQueryId(q.id);
                              try {
                                await onDeleteQuery(q.id);
                                showNotification('success', 'Support query deleted.');
                              } finally {
                                setDeletingQueryId(null);
                              }
                            }}
                            disabled={isDeletingThis}
                            className="text-red-600 hover:text-red-800 text-xs font-bold p-1.5 rounded-lg hover:bg-red-50 transition active:scale-95 disabled:opacity-50"
                          >
                            {isDeletingThis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-xs font-bold text-amber-900">
                          <a href={`tel:${q.phone}`} className="flex items-center gap-1 hover:underline">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{q.phone}</span>
                          </a>
                        </p>
                        <p className="text-xs text-gray-800 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                          {q.query}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View (>= sm) */}
                <div className="hidden sm:block overflow-x-auto bg-white rounded-2xl border border-gray-200 shadow-xs">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead className="bg-amber-900 text-amber-100 uppercase">
                      <tr>
                        <th className="p-4">Date</th>
                        <th className="p-4">Phone Number</th>
                        <th className="p-4">Message / Query</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {queries.map((q) => {
                        const isDeletingThis = deletingQueryId === q.id;
                        return (
                          <tr key={q.id} className="hover:bg-amber-50/40">
                            <td className="p-4 text-gray-500 whitespace-nowrap">{q.date}</td>
                            <td className="p-4 font-bold text-amber-900 whitespace-nowrap">
                              <a href={`tel:${q.phone}`} className="hover:underline">
                                {q.phone}
                              </a>
                            </td>
                            <td className="p-4 text-gray-800">{q.query}</td>
                            <td className="p-4 text-right">
                              <button
                                onClick={async () => {
                                  if (isDeletingThis) return;
                                  setDeletingQueryId(q.id);
                                  try {
                                    await onDeleteQuery(q.id);
                                    showNotification('success', 'Support query deleted.');
                                  } finally {
                                    setDeletingQueryId(null);
                                  }
                                }}
                                disabled={isDeletingThis}
                                className="min-h-[34px] bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition active:scale-95 cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                              >
                                {isDeletingThis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                <span>Delete</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 6: CUSTOMER REVIEWS ===================== */}
        {currentTab === 'reviews' && (
          <div className="pt-4 sm:pt-6 animate-in fade-in duration-200">
            <h3 className="text-lg sm:text-xl font-extrabold text-royal-950 mb-1">
              Store Reviews Moderation ({reviews.length})
            </h3>
            <p className="text-xs text-gray-500 mb-4 sm:mb-6">
              Review and moderate feedback posted by verified buyers.
            </p>

            {reviews.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border text-gray-500 text-sm p-6">
                <Star className="w-10 h-10 text-gray-400 mx-auto mb-2 opacity-50" />
                <p className="font-bold text-gray-700">No reviews posted yet.</p>
                <p className="text-xs text-gray-500 mt-1">Customer store reviews will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => {
                  const isDeletingThis = deletingReviewId === r.id;
                  return (
                    <div
                      key={r.id}
                      className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex justify-between items-center gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-royal-950">{r.name}</span>
                          <span className="text-amber-500 text-xs">{'⭐'.repeat(r.rating)}</span>
                          {r.date && <span className="text-[11px] text-gray-400">• {r.date}</span>}
                        </div>
                        <p className="text-xs text-gray-600 mt-1 break-words">{r.comment}</p>
                      </div>

                      <button
                        onClick={async () => {
                          if (isDeletingThis) return;
                          setDeletingReviewId(r.id);
                          try {
                            await onDeleteReview(r.id);
                            showNotification('success', 'Customer review removed.');
                          } finally {
                            setDeletingReviewId(null);
                          }
                        }}
                        disabled={isDeletingThis}
                        className="text-red-600 hover:text-red-800 text-xs font-bold hover:bg-red-50 p-2.5 rounded-xl transition shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50"
                        title="Delete Review"
                        aria-label="Delete Review"
                      >
                        {isDeletingThis ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* QUICK EDIT PRODUCT MODAL (Fully Mobile Responsive with Sticky Actions) */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 max-w-lg w-full border-2 border-royal-950 shadow-2xl my-auto animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 max-h-[92vh] sm:max-h-[90vh] flex flex-col">
            
            {/* Sticky Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 shrink-0">
              <h3 className="font-extrabold text-base sm:text-lg text-royal-950 truncate pr-2">
                Quick Edit: {editingProduct.name}
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                disabled={isUpdating}
                className="text-gray-400 hover:text-gray-700 cursor-pointer p-1.5 rounded-lg hover:bg-gray-100 transition active:scale-95 disabled:opacity-50"
                aria-label="Close edit modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="space-y-4 py-4 overflow-y-auto pr-1 flex-1">
              
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-base sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px]"
                />
              </div>

              {/* Category & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={editingProduct.category || defaultCategory}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-base sm:text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px]"
                  >
                    {validCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, sku: e.target.value })
                    }
                    placeholder="e.g. KBR-HLD-101"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-base sm:text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              {/* Stock Quantity & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.stockQuantity ?? 100}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stockQuantity: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-base sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Stock Status
                  </label>
                  <select
                    value={editingProduct.inStock ? 'true' : 'false'}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        inStock: e.target.value === 'true',
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-base sm:text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px]"
                  >
                    <option value="true">In Stock (Available)</option>
                    <option value="false">Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Featured toggle */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="editFeatured"
                    checked={Boolean(editingProduct.isFeatured)}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        isFeatured: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded text-amber-800 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-bold text-gray-800">
                    Featured On Home Page
                  </span>
                </label>
              </div>

              {/* Image Editor in Quick Edit */}
              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2.5">
                <label className="block text-xs font-bold text-royal-950 uppercase tracking-wider">
                  Product Image
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={editImagePreview || editingProduct.image || SVG_PLACEHOLDER_IMAGE}
                    alt="Current"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = SVG_PLACEHOLDER_IMAGE;
                    }}
                    className="w-14 h-14 object-cover rounded-xl border border-amber-300 bg-white shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageFileChange}
                      className="hidden"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 font-bold text-xs px-3 py-1.5 rounded-lg min-h-[36px] transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Change Photo</span>
                      </button>
                    </div>
                    {editSelectedFile && (
                      <p className="text-[11px] text-emerald-700 font-bold truncate">
                        Selected: {editSelectedFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Variant Pricing in Quick Edit - Responsive */}
              {editingProduct.variants && editingProduct.variants.length > 0 && (
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                  <label className="block text-xs font-bold text-royal-950 uppercase tracking-wider mb-2">
                    Variant Prices (INR ₹)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {editingProduct.variants.map((v, vIdx) => (
                      <div key={v.weight || vIdx} className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-xs">
                        <span className="block text-[11px] font-bold text-gray-700 mb-1 text-center bg-amber-50 py-0.5 rounded">
                          {v.weight}
                        </span>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-xs text-gray-400 font-bold">
                            ₹
                          </span>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            value={v.price}
                            onChange={(e) => {
                              const newPrice = Number(e.target.value);
                              const updated = [...editingProduct.variants];
                              updated[vIdx] = { ...updated[vIdx], price: Math.max(0, newPrice) };
                              setEditingProduct({ ...editingProduct, variants: updated });
                            }}
                            className="w-full pl-6 pr-1.5 py-1.5 border border-gray-300 rounded-lg text-sm sm:text-xs font-bold text-royal-950 focus:ring-1 focus:ring-amber-500 focus:outline-none min-h-[36px]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Short Tagline */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Short Tagline
                </label>
                <input
                  type="text"
                  value={editingProduct.shortDescription || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, shortDescription: e.target.value })
                  }
                  placeholder="e.g. 100% Pure Heritage Spice"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-base sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px]"
                />
              </div>

              {/* Full Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Full Description
                </label>
                <textarea
                  rows={2}
                  value={editingProduct.description || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  placeholder="Detailed notes on spices, culinary use..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-base sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {editError && (
                <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 bg-red-50 p-3 rounded-xl border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{editError}</span>
                </p>
              )}

            </div>

            {/* Sticky Modal Action Footer */}
            <div className="pt-3 border-t border-gray-200 flex gap-2 shrink-0">
              <button
                type="button"
                disabled={isUpdating}
                onClick={async () => {
                  if (isUpdating) return;
                  setIsUpdating(true);
                  setEditError('');
                  try {
                    await onUpdateProduct(editingProduct, editSelectedFile);
                    showNotification('success', `Saved changes for "${editingProduct.name}".`);
                    setEditingProduct(null);
                  } catch (err: any) {
                    const msg = err.message || 'Failed to update product.';
                    setEditError(msg);
                    showNotification('error', msg);
                  } finally {
                    setIsUpdating(false);
                  }
                }}
                className="flex-1 min-h-[44px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow transition active:scale-[0.99]"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Saving to Supabase...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => setEditingProduct(null)}
                className="min-h-[44px] px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer transition active:scale-95"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
