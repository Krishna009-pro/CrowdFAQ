import { create } from "zustand";

const useStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  authLoading: true,
  notifications: [],
  setUser: (user) =>
    set({
      user,
      isAuthenticated: Boolean(user),
    }),
  setAuthLoading: (loading) =>
    set({
      authLoading: loading,
    }),
  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
    }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          id: crypto.randomUUID(),
          ...notification,
        },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter(
        (notification) => notification.id !== id
      ),
    })),
}));

export default useStore;
