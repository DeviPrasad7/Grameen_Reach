'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cartApi, ordersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface CartItem {
  productId: string;
  qty: number;
  product: {
    id: string; title: string; fixedPrice?: number; minBidPrice?: number;
    unit: string; imageUrls: string[]; farmer: { name: string };
  };
}

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState({ street: '', city: '', pincode: '', state: 'Andhra Pradesh' });
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    loadCart();
  }, [user]);

  const loadCart = async () => {
    try {
      const res = await cartApi.get();
      setCart(res.data?.items || []);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId: string) => {
    await cartApi.removeItem(productId);
    loadCart();
  };

  const total = cart.reduce((sum, item) => {
    const p = item.product.fixedPrice ?? item.product.minBidPrice ?? 0;
    return sum + p * item.qty;
  }, 0);

  const placeOrder = async () => {
    if (!address.street || !address.city || !address.pincode) {
      setToast('Please fill delivery address'); return;
    }
    setPlacing(true);
    try {
      const res = await ordersApi.create({ deliveryAddress: address, notes, paymentMethod: 'COD' });
      router.push(`/buyer/orders/${res.data.id}`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setToast(msg || 'Order failed');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading cart...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">🛒 Your Cart</h1>

        {cart.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border">
            <div className="text-5xl mb-3">🧺</div>
            <p className="text-gray-500">Your cart is empty</p>
            <a href="/buyer/browse" className="mt-4 inline-block text-primary-600 font-medium hover:underline">Browse products →</a>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 divide-y">
              {cart.map((item) => {
                const price = item.product.fixedPrice ?? item.product.minBidPrice ?? 0;
                return (
                  <div key={item.productId} className="flex items-center gap-4 p-4">
                    <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                      {item.product.imageUrls?.[0] ? '🖼️' : '🥬'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{item.product.title}</p>
                      <p className="text-xs text-gray-400">{item.product.farmer?.name}</p>
                      <p className="text-primary-600 font-semibold text-sm mt-0.5">
                        ₹{price} × {item.qty} {item.product.unit} = ₹{price * item.qty}
                      </p>
                    </div>
                    <button onClick={() => removeItem(item.productId)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Delivery Address</h2>
              <div className="space-y-3">
                <input value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  placeholder="Street / House No." className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="City" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                  <input value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                    placeholder="Pincode" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
                <select value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400">
                  <option>Andhra Pradesh</option>
                  <option>Telangana</option>
                </select>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Order notes (optional)" rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-primary-100 p-6">
              <div className="flex justify-between text-lg font-bold text-gray-800 mb-4">
                <span>Total</span>
                <span className="text-primary-700">₹{total}</span>
              </div>
              <p className="text-xs text-gray-400 mb-4">Payment method: Cash on Delivery (COD)</p>
              <button onClick={placeOrder} disabled={placing}
                className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors">
                {placing ? 'Placing order...' : '✅ Place Order (COD)'}
              </button>
            </div>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">{toast}</div>
        )}
      </div>
    </div>
  );
}
