import { create } from "zustand";
import { request } from "../utils/request";
import { useAuthStore } from "./authStore";

export const useAddToCartStore = create((set, get) => ({
  cartItems: [],
  loading: false,
  error: null,
  cartCount: 0,
  subtotal: 0,

  // ---------------------- FETCH CART ----------------------
  fetchCart: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ loading: true, error: null });

    try {
      const data = await request(
        "/api/cart",
        "GET",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      set({ 
        cartItems: data.items || [],
        cartCount: data.total_items || 0,
        subtotal: data.subtotal || 0
      });
    } catch (err) {
      console.error("Failed to fetch cart:", err);
      set({ error: err.response?.data?.error || "Failed to fetch cart" });
    } finally {
      set({ loading: false });
    }
  },

  // ---------------------- GET CART COUNT ----------------------
  fetchCartCount: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      const data = await request(
        "/api/cart/count",
        "GET",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      set({ cartCount: data.count || 0 });
    } catch (err) {
      console.error("Failed to fetch cart count:", err);
    }
  },

  // ---------------------- ADD TO CART ----------------------
  addToCart: async (bookId, quantity = 1) => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error("User not logged in");

    set({ loading: true, error: null });

    try {
      const data = await request(
        "/api/cart/add",
        "POST",
        { book_id: bookId, quantity },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Optimized: Update cart count immediately without full refresh
      set((state) => ({
        cartCount: state.cartCount + quantity,
        loading: false
      }));

      return data.item;
    } catch (err) {
      console.error("Failed to add to cart:", err);
      const errorMessage = err.response?.data?.error || "Failed to add to cart";
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
  },

  // ---------------------- UPDATE CART ITEM ----------------------
  updateCartItem: async (bookId, quantity) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ loading: true, error: null });

    try {
      const data = await request(
        `/api/cart/item/${bookId}`,
        "PATCH",
        { quantity },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update the specific item in the state
      set((state) => ({
        cartItems: state.cartItems.map((item) =>
          item.book_id === bookId ? data.item : item
        ),
      }));

      // Refresh cart totals
      await get().fetchCart();

      return data.item;
    } catch (err) {
      console.error("Failed to update cart:", err);
      const errorMessage = err.response?.data?.error || "Failed to update cart item";
      set({ error: errorMessage });
      throw new Error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  // ---------------------- REMOVE ITEM ----------------------
  removeFromCart: async (cartItemId) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ loading: true, error: null });

    try {
      await request(
        `/api/cart/item/${cartItemId}`,
        "DELETE",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Remove item from state immediately
      set((state) => ({
        cartItems: state.cartItems.filter((item) => item.id !== cartItemId),
      }));

      // Refresh cart totals
      await get().fetchCart();
    } catch (err) {
      console.error("Failed to remove item:", err);
      const errorMessage = err.response?.data?.error || "Failed to remove item";
      set({ error: errorMessage });
      throw new Error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  // ---------------------- CLEAR CART ----------------------
  clearCart: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ loading: true, error: null });

    try {
      await request(
        `/api/cart/clear`,
        "DELETE",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      set({ 
        cartItems: [],
        cartCount: 0,
        subtotal: 0
      });
    } catch (err) {
      console.error("Failed to clear cart:", err);
      const errorMessage = err.response?.data?.error || "Failed to clear cart";
      set({ error: errorMessage });
      throw new Error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  // ---------------------- CLEAR ERROR ----------------------
  clearError: () => {
    set({ error: null });
  },
}));
