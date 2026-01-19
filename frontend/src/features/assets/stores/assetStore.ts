import { create } from 'zustand';
import { assetApi } from '../../../lib/api';

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
    checkAssetUsage: (id: number) => Promise<boolean>;
}

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
        // 1. Check usage via real API
        const isUsed = await get().checkAssetUsage(id);

        if (isUsed) {
            // Archive instead of delete
            set((state) => ({
                assets: state.assets.map((a) => (a.id === id ? { ...a, is_archived: true } : a))
            }));
            return false;
        } else {
            // Hard delete via API
            try {
                await assetApi.delete(id);
                set((state) => ({
                    assets: state.assets.filter((a) => a.id !== id)
                }));
                return true;
            } catch (error) {
                console.error('Failed to delete asset', error);
                return false;
            }
        }
    },

    checkAssetUsage: async (id: number) => {
        try {
            const refs = await assetApi.getReferences(id);
            return !refs.can_delete;
        } catch (error) {
            console.error('Failed to check asset usage', error);
            return false;
        }
    },
}));
