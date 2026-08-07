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

  addBatchLinks: async (linksArray) => {
    if (window.electronAPI && window.electronAPI.addBatchLinks) {
      const result = await window.electronAPI.addBatchLinks(linksArray);
      await get().fetchLinks();
      return result;
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

  openExternalLink: async (url) => {
    if (!window.electronAPI || !url) return;
    const trimmed = url.trim();
    // Check if it's a web URL (http:// or https://)
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      window.electronAPI.openExternal(trimmed);
    } else if (trimmed.includes('://')) {
      // Custom web scheme
      window.electronAPI.openExternal(trimmed);
    } else {
      // Local path (file or folder, e.g. D:\Projects or C:\Users\...)
      if (window.electronAPI.openPath) {
        const res = await window.electronAPI.openPath(trimmed);
        if (!res?.success) {
          // Fallback to web external if openPath failed or if user omitted http://
          const webUrl = `https://${trimmed}`;
          window.electronAPI.openExternal(webUrl);
        }
      } else {
        const webUrl = `https://${trimmed}`;
        window.electronAPI.openExternal(webUrl);
      }
    }
  },
}));
