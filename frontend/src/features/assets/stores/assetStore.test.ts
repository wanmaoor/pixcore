import { describe, it, expect, beforeEach } from 'vitest';
import { useAssetStore, Asset } from './assetStore';

const mockAsset: Asset = {
    id: 1,
    project_id: 1,
    type: 'character',
    name: 'Hero',
    description: 'Main Character',
    reference_images: ['img1.jpg'],
    meta: {},
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
};

describe('Asset Store', () => {
    beforeEach(() => {
        useAssetStore.setState({ assets: [] });
    });

    it('should add asset', () => {
        useAssetStore.getState().addAsset(mockAsset);
        const { assets } = useAssetStore.getState();
        expect(assets).toHaveLength(1);
        expect(assets[0]).toEqual(mockAsset);
    });

    it('should update asset', () => {
        useAssetStore.getState().addAsset(mockAsset);
        useAssetStore.getState().updateAsset(1, { name: 'Villain' });
        const { assets } = useAssetStore.getState();
        expect(assets[0].name).toBe('Villain');
    });

    it('should delete unused asset', async () => {
        useAssetStore.getState().addAsset(mockAsset);

        // Mock checkAssetUsage to return false
        useAssetStore.setState({ checkAssetUsage: async () => false });

        const deleted = await useAssetStore.getState().deleteAsset(1);
        const { assets } = useAssetStore.getState();

        expect(deleted).toBe(true);
        expect(assets).toHaveLength(0);
    });

    it('should archive used asset', async () => {
        useAssetStore.getState().addAsset(mockAsset);

        // Mock checkAssetUsage to return true
        useAssetStore.setState({ checkAssetUsage: async () => true });

        const deleted = await useAssetStore.getState().deleteAsset(1);
        const { assets } = useAssetStore.getState();

        expect(deleted).toBe(false);
        expect(assets).toHaveLength(1);
        expect(assets[0].is_archived).toBe(true);
    });
});
