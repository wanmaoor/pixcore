import { create } from 'zustand';

export interface Asset {
    id: number;
    project_id: number;
    type: 'character' | 'scene' | 'style' | 'key_object';
    name: string;
    description: string;
    reference_images: string[];
    meta: Record<string, any>;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
}

interface AssetStoreState {
    assets: Asset[];
    isLoading: boolean;
    error: string | null;

    setAssets: (assets: Asset[]) => void;
    addAsset: (asset: Asset) => void;
    updateAsset: (id: number, updates: Partial<Asset>) => void;
    deleteAsset: (id: number) => Promise<boolean>; // Returns true if deleted, false if archived (due to ref)
    checkAssetUsage: (id: number) => Promise<boolean>; // Stub for backend check
}

// Mock backend check function
const checkAssetUsageStub = async (id: number) => {
    // In a real app, this would call the API
    return false; // Default to not used
};

export const useAssetStore = create<AssetStoreState>((set, get) => ({
    assets: [],
    isLoading: false,
    error: null,

    setAssets: (assets) => set({ assets }),

    addAsset: (asset) => set((state) => ({ assets: [...state.assets, asset] })),

    updateAsset: (id, updates) => set((state) => ({
        assets: state.assets.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),

    deleteAsset: async (id) => {
        // 1. Check usage
        const isUsed = await get().checkAssetUsage(id);

        if (isUsed) {
            // Archive instead of delete
            set((state) => ({
                assets: state.assets.map((a) => (a.id === id ? { ...a, is_archived: true } : a))
            }));
            return false;
        } else {
            // Hard delete
            set((state) => ({
                assets: state.assets.filter((a) => a.id !== id)
            }));
            return true;
        }
    },

    checkAssetUsage: checkAssetUsageStub,
}));
