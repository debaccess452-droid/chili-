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
  Eye, 
  LogOut, 
  ArrowLeft,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Filter
} from 'lucide-react';

interface AdminPanelProps {
  products: Product[];
  categories?: string[];
  orders: Order[];
  users: UserSession[];
  queries: CustomerQuery[];
  reviews: Review[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: number | string) => void;
  onToggleStock: (productId: number | string) => void;
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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [orderFilter, setOrderFilter] = useState<'All' | Order['status']>('All');

  const validCategories = (categories || []).filter((c) => Boolean(c && c !== 'All Spices'));
  const defaultCategory = validCategories.length > 0 ? validCategories[0] : '';

  // Product Upload Form State
  const [pName, setPName] = useState('');
  const [pCategory, setPCategory] = useState(defaultCategory);

  React.useEffect(() => {
    if (!pCategory && validCategories.length > 0) {
      setPCategory(validCategories[0]);
    }
  }, [validCategories, pCategory]);
  const [pSku, setPSku] = useState('');
  const [pStockQuantity, setPStockQuantity] = useState(100);
  const [pInStock, setPInStock] = useState(true);
  const [pIsFeatured, setPIsFeatured] = useState(true);
  const [pShortDesc, setPShortDesc] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pImagePreview, setPImagePreview] = useState<string>('');
  const [pImageUrlInput, setPImageUrlInput] = useState('');
  const [imageError, setImageError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Variant weights & prices
  const [variants, setVariants] = useState<ProductVariant[]>([
    { weight: '25g', price: 20 },
    { weight: '50g', price: 38 },
    { weight: '100g', price: 70 },
    { weight: '200g', price: 135 },
    { weight: '500g', price: 260 },
    { weight: '1kg', price: 490 },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle local image file upload & validation
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    // Check size (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setPImagePreview(event.target.result);
      }
    };
    reader.onerror = () => {
      setImageError('Failed to read image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyImageUrl = () => {
    if (!pImageUrlInput.trim()) return;
    setPImagePreview(pImageUrlInput.trim());
    setImageError('');
  };

  const handleVariantPriceChange = (index: number, newPrice: number) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], price: Math.max(0, newPrice) };
    setVariants(updated);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) {
      alert('Product name is required!');
      return;
    }
    const finalImage = pImagePreview.trim() || pImageUrlInput.trim() || SVG_PLACEHOLDER_IMAGE;

    const newProduct: Product = {
      id: Date.now(),
      name: pName.trim(),
      category: pCategory,
      sku: pSku.trim() || `KBR-${pName.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      stockQuantity: Number(pStockQuantity) || 50,
      inStock: pInStock,
      isFeatured: pIsFeatured,
      image: finalImage,
      variants: variants.map((v) => ({ ...v, price: Number(v.price) || 0 })),
      shortDescription: pShortDesc.trim() || `${pCategory} from KBR Global Ventures`,
      description: pDesc.trim() || `${pName} prepared with traditional hygienic standards.`,
    };

    onAddProduct(newProduct);
    setUploadSuccess(true);

    // Reset Form
    setTimeout(() => {
      setPName('');
      setPSku('');
      setPShortDesc('');
      setPDesc('');
      setPImagePreview('');
      setPImageUrlInput('');
      setUploadSuccess(false);
      setCurrentTab('products');
    }, 1200);
  };

  // Filtered orders
  const filteredOrders = orderFilter === 'All' 
    ? orders 
    : orders.filter((o) => o.status === orderFilter);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
      
      {/* Top Banner Header */}
      <div className="bg-white rounded-3xl shadow-xl border-2 border-red-900/60 p-5 sm:p-8 mb-6 sm:mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-red-800 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Authorized Super Admin
              </span>
              <span className="text-xs text-gray-500 font-medium">
                Live Store Controls
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-royal-950 mt-1">
              Management Portal
            </h2>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={() => setCurrentTab('upload')}
              className="flex-1 sm:flex-none bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Upload Product</span>
            </button>
            <button
              onClick={onExitAdmin}
              className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-gray-300 transition cursor-pointer"
              title="Return to customer store"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Store</span>
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex-1 sm:flex-none bg-red-50 hover:bg-red-100 text-red-900 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-red-200 transition cursor-pointer"
                title="Sign out of Admin Session"
              >
                <LogOut className="w-3.5 h-3.5 text-red-700" />
                <span>Admin Logout</span>
              </button>
            )}
          </div>
        </div>

        {/* Responsive Tab Bar */}
        <div className="mt-5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 border-b border-gray-100 scrollbar-none">
          <button
            onClick={() => setCurrentTab('orders')}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition flex items-center gap-1.5 ${
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
            className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition flex items-center gap-1.5 ${
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
            className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition flex items-center gap-1.5 ${
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
            className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition flex items-center gap-1.5 ${
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
            className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition flex items-center gap-1.5 ${
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
            className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition flex items-center gap-1.5 ${
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
          <div className="pt-6 animate-in fade-in duration-200">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-royal-950 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-amber-700" />
                  <span>Upload New Spice / Masala Product</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Fill in the details below. Newly uploaded products will be immediately active on the live store.
                </p>
              </div>
            </div>

            {uploadSuccess && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-800 text-sm font-bold flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Product uploaded successfully! It is now live in store.</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-6">
              
              {/* Image Upload Area */}
              <div className="bg-amber-50/50 p-4 sm:p-6 rounded-2xl border-2 border-dashed border-amber-300">
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  Product Image * (Upload File or Enter Image URL)
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  
                  {/* File Upload Selector */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                      id="productImageInput"
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer bg-white p-6 rounded-2xl border border-amber-200 hover:border-amber-400 text-center transition flex flex-col items-center justify-center group"
                    >
                      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 mb-2 group-hover:scale-110 transition">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-royal-950">
                        Click to select image from your device
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1">
                        PNG, JPG, WebP up to 5MB supported
                      </p>
                    </div>

                    {/* Or URL input */}
                    <div className="mt-3 flex gap-2">
                      <input
                        type="url"
                        value={pImageUrlInput}
                        onChange={(e) => setPImageUrlInput(e.target.value)}
                        placeholder="Or paste external image URL"
                        className="flex-1 px-3 py-2 border rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyImageUrl}
                        className="bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs px-3 py-2 rounded-xl"
                      >
                        Apply URL
                      </button>
                    </div>

                    {imageError && (
                      <p className="text-xs text-red-600 font-semibold mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{imageError}</span>
                      </p>
                    )}
                  </div>

                  {/* Image Live Preview */}
                  <div className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl border border-amber-200">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">
                      Image Preview
                    </p>
                    {pImagePreview ? (
                      <div className="relative w-full max-w-[220px] aspect-square rounded-xl overflow-hidden shadow border border-amber-300">
                        <img
                          src={pImagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPImagePreview('');
                            setPImageUrlInput('');
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full shadow hover:bg-red-700"
                          title="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full max-w-[220px] aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                        <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                        <span className="text-xs">No image selected yet</span>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                  >
                    {validCategories.map((cat) => (
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-6 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={pInStock}
                      onChange={(e) => setPInStock(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-800 focus:ring-amber-500"
                    />
                    <span className="text-xs font-bold text-gray-800">In Stock Now</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={pIsFeatured}
                      onChange={(e) => setPIsFeatured(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-800 focus:ring-amber-500"
                    />
                    <span className="text-xs font-bold text-gray-800">Featured On Home</span>
                  </label>
                </div>
              </div>

              {/* Weight Variant Pricing Grid */}
              <div className="bg-gray-50 p-4 sm:p-5 rounded-2xl border">
                <div className="mb-3">
                  <h4 className="text-xs font-bold text-royal-950 uppercase tracking-wider">
                    Weight Variant Pricing (INR ₹)
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Configure customer selling price for each pack size.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {variants.map((v, idx) => (
                    <div key={v.weight} className="bg-white p-3 rounded-xl border border-gray-200">
                      <span className="block text-xs font-bold text-royal-950 mb-1 text-center bg-amber-100/70 py-0.5 rounded">
                        {v.weight}
                      </span>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-xs text-gray-400 font-bold">
                          ₹
                        </span>
                        <input
                          type="number"
                          min={1}
                          value={v.price}
                          onChange={(e) => handleVariantPriceChange(idx, Number(e.target.value))}
                          required
                          className="w-full pl-6 pr-2 py-1.5 border rounded-lg text-xs font-bold text-royal-950 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Short Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={pShortDesc}
                    onChange={(e) => setPShortDesc(e.target.value)}
                    placeholder="e.g. 100% Pure High-Pungency Sun Dried"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white font-extrabold px-8 py-3.5 rounded-xl shadow-lg transition transform active:scale-98 flex items-center justify-center gap-2 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>Save & Publish Product to Store</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentTab('products')}
                  className="w-full sm:w-auto px-6 py-3.5 border border-gray-300 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-700"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        )}

        {/* ===================== TAB 2: PRODUCT INVENTORY & STOCK CONTROLS ===================== */}
        {currentTab === 'products' && (
          <div className="pt-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-royal-950">
                  Product Inventory ({products.length})
                </h3>
                <p className="text-xs text-gray-500">
                  Manage stock availability, edit pricing, or remove catalogue items.
                </p>
              </div>

              <button
                onClick={() => setCurrentTab('upload')}
                className="bg-amber-800 hover:bg-amber-900 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Upload New Product</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((p) => {
                const baseVariant = p.variants[0] || { weight: '100g', price: 50 };
                return (
                  <div
                    key={p.id}
                    className="bg-gray-50/80 p-4 rounded-2xl border border-amber-200/80 flex flex-col justify-between shadow-xs hover:shadow-md transition"
                  >
                    <div className="flex items-start space-x-3.5">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-amber-300 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-royal-950 truncate">
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

                    <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between gap-2 flex-wrap">
                      <button
                        onClick={() => onToggleStock(p.id)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                          p.inStock
                            ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                      >
                        {p.inStock ? 'Mark Out of Stock' : 'Mark In Stock'}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingProduct(p)}
                          className="text-xs bg-royal-900 text-white font-bold px-3 py-1.5 rounded-xl hover:bg-royal-950 transition flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Quick Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove "${p.name}"?`)) {
                              onDeleteProduct(p.id);
                            }
                          }}
                          className="text-xs text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-50 transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== TAB 3: CUSTOMER ORDERS ===================== */}
        {currentTab === 'orders' && (
          <div className="pt-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-royal-950">
                  Customer Orders ({orders.length})
                </h3>
                <p className="text-xs text-gray-500">
                  Track dispatch, confirm payments, and update order statuses.
                </p>
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
                {(['All', 'Pending', 'Confirmed', 'Delivered', 'Cancelled'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderFilter(st)}
                    className={`px-2.5 py-1.5 rounded-lg transition ${
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
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-500 text-sm">
                No orders found under this status.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((o) => {
                  const actualIdx = orders.findIndex((orig) => orig.id === o.id);
                  return (
                    <div
                      key={o.id}
                      className="bg-gray-50 p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
                    >
                      <div className="space-y-1 flex-1">
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
                        <p className="text-xs text-gray-600">
                          Address: {o.address}, {o.city}, {o.state} - <b>{o.pincode}</b>
                        </p>

                        <div className="pt-2 text-xs text-gray-700 space-y-0.5">
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

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-200">
                        <button
                          onClick={() => onUpdateOrderStatus(actualIdx, 'Confirmed')}
                          className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-xl transition"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => onUpdateOrderStatus(actualIdx, 'Delivered')}
                          className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-xl transition"
                        >
                          Delivered
                        </button>
                        <button
                          onClick={() => onUpdateOrderStatus(actualIdx, 'Cancelled')}
                          className="flex-1 sm:flex-none bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs px-3 py-2 rounded-xl transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete order record #${o.id}?`)) {
                              onDeleteOrder(o.id);
                            }
                          }}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
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
          <div className="pt-6 animate-in fade-in duration-200">
            <h3 className="text-xl font-extrabold text-royal-950 mb-2">
              Registered Logged-In Customers ({users.length})
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Customers who have verified their contact credentials to access the store.
            </p>

            {users.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border text-gray-500 text-sm">
                No active logged-in users registered yet.
              </div>
            ) : (
              <div className="overflow-x-auto bg-white rounded-2xl border border-gray-200 shadow-xs">
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead className="bg-royal-950 text-amber-300 uppercase">
                    <tr>
                      <th className="p-4">#</th>
                      <th className="p-4">Mobile Number</th>
                      <th className="p-4">Email / Gmail</th>
                      <th className="p-4">Session Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((u, i) => (
                      <tr key={i} className="hover:bg-amber-50/50">
                        <td className="p-4 font-bold text-gray-500">{i + 1}</td>
                        <td className="p-4 font-bold text-royal-950">+91 {u.phone}</td>
                        <td className="p-4 text-gray-700">{u.email}</td>
                        <td className="p-4 text-gray-400">{u.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 5: CUSTOMER QUERIES ===================== */}
        {currentTab === 'queries' && (
          <div className="pt-6 animate-in fade-in duration-200">
            <h3 className="text-xl font-extrabold text-royal-950 mb-2">
              Customer Queries & Support Tickets ({queries.length})
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Tickets submitted from the customer care helpline form.
            </p>

            {queries.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border text-gray-500 text-sm">
                No customer queries found.
              </div>
            ) : (
              <div className="overflow-x-auto bg-white rounded-2xl border border-gray-200 shadow-xs">
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
                    {queries.map((q) => (
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
                            onClick={() => onDeleteQuery(q.id)}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 6: CUSTOMER REVIEWS ===================== */}
        {currentTab === 'reviews' && (
          <div className="pt-6 animate-in fade-in duration-200">
            <h3 className="text-xl font-extrabold text-royal-950 mb-2">
              Store Reviews Moderation ({reviews.length})
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Review and moderate feedback posted by verified buyers.
            </p>

            {reviews.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border text-gray-500 text-sm">
                No reviews posted yet.
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex justify-between items-center gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-royal-950">{r.name}</span>
                        <span className="text-amber-500 text-xs">{'⭐'.repeat(r.rating)}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{r.comment}</p>
                    </div>

                    <button
                      onClick={() => onDeleteReview(r.id)}
                      className="text-red-600 hover:text-red-800 text-xs font-bold hover:bg-red-50 p-2 rounded-lg transition shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* QUICK EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border-2 border-royal-950 shadow-2xl my-auto animate-in fade-in">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="font-bold text-lg text-royal-950">
                Quick Edit: {editingProduct.name}
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={editingProduct.category || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={editingProduct.stockQuantity ?? 100}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stockQuantity: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Stock Status</label>
                <select
                  value={editingProduct.inStock ? 'true' : 'false'}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      inStock: e.target.value === 'true',
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                >
                  <option value="true">In Stock (Available)</option>
                  <option value="false">Out of Stock</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateProduct(editingProduct);
                    setEditingProduct(null);
                  }}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-sm"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2.5 border rounded-xl text-sm font-semibold text-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
