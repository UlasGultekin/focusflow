import { create } from 'zustand';

export const useLinkStore = create((set, get) => ({
  links: [],
  isLoading: false,

  fetchLinks: async () => {
    set({ isLoading: true });
    try {
      if (window.electronAPI) {
        const links = await window.electronAPI.getLinks();
        set({ links: links || [] });
      }
    } catch (err) {
      console.error('Linkler yüklenirken hata:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addLink: async (linkData) => {
    if (window.electronAPI) {
      const newLink = await window.electronAPI.addLink(linkData);
      await get().fetchLinks();
      return newLink;
    }
  },

  updateLink: async (id, linkData) => {
    if (window.electronAPI) {
      await window.electronAPI.updateLink(id, linkData);
      await get().fetchLinks();
    }
  },

  deleteLink: async (id) => {
    if (window.electronAPI) {
      await window.electronAPI.deleteLink(id);
      await get().fetchLinks();
    }
  },

  openExternalLink: (url) => {
    if (window.electronAPI && url) {
      const validUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
      window.electronAPI.openExternal(validUrl);
    }
  },
}));
