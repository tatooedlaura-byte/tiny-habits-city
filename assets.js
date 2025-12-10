/**
 * Asset definitions for Tiny Habits City
 * Catalogs all Kenney isometric assets for buildings, ground, and decorations
 */

const ASSETS = {
    // Base path for assets
    basePath: 'assets/',

    // Ground tiles (city pack)
    ground: {
        grass: 'city/PNG/cityTiles_090.png',          // Plain grass
        sidewalk: 'city/PNG/cityTiles_105.png',       // Sidewalk
        road: {
            straight: 'city/PNG/cityTiles_010.png',   // Straight road
            corner: 'city/PNG/cityTiles_020.png',     // Corner road
            intersection: 'city/PNG/cityTiles_030.png', // Intersection
            end: 'city/PNG/cityTiles_015.png',        // Road end
        },
        parking: 'city/PNG/cityTiles_050.png',        // Parking lot
        park: 'city/PNG/cityTiles_061.png',           // Park/grass with path
    },

    // Building pieces (modular - stack these!)
    buildings: {
        // Ground floors (bases)
        bases: [
            { id: 'shop_blue', file: 'buildings/PNG/buildingTiles_000.png' },
            { id: 'shop_red', file: 'buildings/PNG/buildingTiles_010.png' },
            { id: 'office_tan', file: 'buildings/PNG/buildingTiles_020.png' },
            { id: 'office_gray', file: 'buildings/PNG/buildingTiles_030.png' },
        ],
        // Middle floors (stack on bases)
        floors: [
            { id: 'floor_tan', file: 'buildings/PNG/buildingTiles_050.png' },
            { id: 'floor_gray', file: 'buildings/PNG/buildingTiles_051.png' },
            { id: 'floor_white', file: 'buildings/PNG/buildingTiles_052.png' },
            { id: 'floor_red', file: 'buildings/PNG/buildingTiles_053.png' },
        ],
        // Roofs (top pieces)
        roofs: [
            { id: 'roof_flat_tan', file: 'buildings/PNG/buildingTiles_080.png' },
            { id: 'roof_flat_gray', file: 'buildings/PNG/buildingTiles_081.png' },
            { id: 'roof_peaked_tan', file: 'buildings/PNG/buildingTiles_090.png' },
            { id: 'roof_peaked_red', file: 'buildings/PNG/buildingTiles_091.png' },
        ],
    },

    // Decorations/props
    decorations: {
        trees: [
            { id: 'tree_green', file: 'city/Details/cityDetails_010.png', weight: 3 },
        ],
        props: [
            { id: 'lamppost_single', file: 'city/Details/cityDetails_000.png', weight: 2 },
            { id: 'bus_stop_left', file: 'city/Details/cityDetails_001.png', weight: 1 },
            { id: 'bus_stop_right', file: 'city/Details/cityDetails_002.png', weight: 1 },
            { id: 'bench_left', file: 'city/Details/cityDetails_008.png', weight: 2 },
            { id: 'bench_right', file: 'city/Details/cityDetails_009.png', weight: 2 },
            { id: 'lamppost_tall', file: 'city/Details/cityDetails_005.png', weight: 2 },
        ],
    },

    // Tile dimensions (isometric)
    tileWidth: 128,
    tileHeight: 64,
    floorHeight: 40, // How much to offset each floor vertically
};

/**
 * Asset loader - preloads all images
 */
class AssetLoader {
    constructor() {
        this.images = {};
        this.loaded = false;
    }

    async loadAll() {
        const imagesToLoad = [];

        // Collect all image paths
        // Ground tiles
        imagesToLoad.push({ key: 'ground_grass', path: ASSETS.ground.grass });
        imagesToLoad.push({ key: 'ground_sidewalk', path: ASSETS.ground.sidewalk });
        imagesToLoad.push({ key: 'ground_road_straight', path: ASSETS.ground.road.straight });
        imagesToLoad.push({ key: 'ground_parking', path: ASSETS.ground.parking });
        imagesToLoad.push({ key: 'ground_park', path: ASSETS.ground.park });

        // Building bases
        ASSETS.buildings.bases.forEach(b => {
            imagesToLoad.push({ key: `base_${b.id}`, path: b.file });
        });

        // Building floors
        ASSETS.buildings.floors.forEach(f => {
            imagesToLoad.push({ key: `floor_${f.id}`, path: f.file });
        });

        // Building roofs
        ASSETS.buildings.roofs.forEach(r => {
            imagesToLoad.push({ key: `roof_${r.id}`, path: r.file });
        });

        // Decorations
        ASSETS.decorations.trees.forEach(t => {
            imagesToLoad.push({ key: `tree_${t.id}`, path: t.file });
        });
        ASSETS.decorations.props.forEach(p => {
            imagesToLoad.push({ key: `prop_${p.id}`, path: p.file });
        });

        // Load all images
        const loadPromises = imagesToLoad.map(item => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.images[item.key] = img;
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`Failed to load: ${item.path}`);
                    resolve(); // Don't reject, just warn
                };
                img.src = ASSETS.basePath + item.path;
            });
        });

        await Promise.all(loadPromises);
        this.loaded = true;
        console.log(`Loaded ${Object.keys(this.images).length} images`);
    }

    get(key) {
        return this.images[key];
    }
}

// Global asset loader instance
const assetLoader = new AssetLoader();
