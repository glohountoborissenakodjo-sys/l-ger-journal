// Remplace l'API window.storage (disponible uniquement dans les artifacts Claude)
// par une version basée sur localStorage, pour un site déployé de façon autonome.
export const storage = {
  async get(key) {
    const v = localStorage.getItem(key);
    return v !== null ? { key, value: v } : null;
  },
  async set(key, value) {
    localStorage.setItem(key, value);
    return { key, value };
  },
};
