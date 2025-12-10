/**
 * City rendering and management for Tiny Habits City
 * Handles isometric grid, building placement, and city growth
 */

class City {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = 15; // 15x15 grid
        this.grid = []; // 2D array of cell data
        this.buildings = []; // List of buildings with their growth state
        this.decorations = []; // List of decorations

        // Isometric settings
        this.tileWidth = 128;
        this.tileHeight = 64;
        this.floorHeight = 40;

        // Camera/view offset (to center the city)
        this.offsetX = 0;
        this.offsetY = 0;

        this.initGrid();
        this.resize();

        // Handle window resize
        window.addEventListener('resize', () => this.resize());
    }

    initGrid() {
        // Initialize empty grid
        for (let y = 0; y < this.gridSize; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridSize; x++) {
                this.grid[y][x] = {
                    type: 'grass', // grass, road, building, decoration
                    occupied: false,
                    building: null,
                    decoration: null,
                };
            }
        }

        // Place some initial roads in a cross pattern through center
        const center = Math.floor(this.gridSize / 2);
        for (let i = 0; i < this.gridSize; i++) {
            this.grid[center][i].type = 'road';
            this.grid[center][i].occupied = true;
            this.grid[i][center].type = 'road';
            this.grid[i][center].occupied = true;
        }
    }

    resize() {
        // Set canvas to fill container
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        // Center the grid in the view
        this.offsetX = this.canvas.width / 2;
        this.offsetY = this.canvas.height / 3;

        this.render();
    }

    // Convert grid coordinates to screen (isometric) coordinates
    gridToScreen(gridX, gridY) {
        const screenX = (gridX - gridY) * (this.tileWidth / 2) + this.offsetX;
        const screenY = (gridX + gridY) * (this.tileHeight / 2) + this.offsetY;
        return { x: screenX, y: screenY };
    }

    // Find a valid spot for a new building (adjacent to existing buildings or roads)
    findBuildingSpot() {
        const candidates = [];
        const center = Math.floor(this.gridSize / 2);

        // First, find cells adjacent to roads or existing buildings
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = this.grid[y][x];

                // Skip if already occupied
                if (cell.occupied) continue;

                // Check if adjacent to road or building
                const neighbors = this.getNeighbors(x, y);
                const hasAdjacentRoad = neighbors.some(n => n.type === 'road');
                const hasAdjacentBuilding = neighbors.some(n => n.type === 'building');

                if (hasAdjacentRoad || hasAdjacentBuilding) {
                    // Weight by distance from center (prefer closer to center)
                    const distFromCenter = Math.abs(x - center) + Math.abs(y - center);
                    candidates.push({ x, y, weight: 20 - distFromCenter });
                }
            }
        }

        if (candidates.length === 0) {
            // Fallback: find any unoccupied grass
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize; x++) {
                    if (!this.grid[y][x].occupied) {
                        candidates.push({ x, y, weight: 1 });
                    }
                }
            }
        }

        if (candidates.length === 0) return null;

        // Weighted random selection
        const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
        let random = Math.random() * totalWeight;

        for (const candidate of candidates) {
            random -= candidate.weight;
            if (random <= 0) {
                return { x: candidate.x, y: candidate.y };
            }
        }

        return candidates[0];
    }

    // Find a valid spot for decoration (near buildings/roads but not on them)
    findDecorationSpot() {
        const candidates = [];

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = this.grid[y][x];

                // Can place decorations on grass that isn't occupied
                if (cell.type === 'grass' && !cell.occupied) {
                    const neighbors = this.getNeighbors(x, y);
                    const nearRoadOrBuilding = neighbors.some(n =>
                        n.type === 'road' || n.type === 'building'
                    );

                    if (nearRoadOrBuilding) {
                        candidates.push({ x, y, weight: 3 });
                    } else {
                        candidates.push({ x, y, weight: 1 });
                    }
                }
            }
        }

        if (candidates.length === 0) return null;

        // Weighted random selection
        const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
        let random = Math.random() * totalWeight;

        for (const candidate of candidates) {
            random -= candidate.weight;
            if (random <= 0) {
                return { x: candidate.x, y: candidate.y };
            }
        }

        return candidates[0];
    }

    getNeighbors(x, y) {
        const neighbors = [];
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
                neighbors.push(this.grid[ny][nx]);
            }
        }

        return neighbors;
    }

    // Add a floor to a building, or create new building if current one is maxed
    growCity() {
        // Find a building that can still grow
        const growableBuilding = this.buildings.find(b => b.floors < b.maxFloors);

        if (growableBuilding) {
            // Add a floor to existing building
            growableBuilding.floors++;
            this.render();
            return { type: 'floor', building: growableBuilding };
        } else {
            // Create a new building
            const spot = this.findBuildingSpot();
            if (spot) {
                const building = this.createBuilding(spot.x, spot.y);
                this.render();
                return { type: 'building', building };
            }
        }

        return null;
    }

    // Add a decoration to the city
    addDecoration() {
        const spot = this.findDecorationSpot();
        if (!spot) return null;

        // Pick a random decoration (tree or prop)
        const allDecorations = [
            ...ASSETS.decorations.trees,
            ...ASSETS.decorations.props,
        ];

        // Weighted random selection
        const totalWeight = allDecorations.reduce((sum, d) => sum + d.weight, 0);
        let random = Math.random() * totalWeight;
        let decoration = allDecorations[0];

        for (const d of allDecorations) {
            random -= d.weight;
            if (random <= 0) {
                decoration = d;
                break;
            }
        }

        const newDecoration = {
            x: spot.x,
            y: spot.y,
            type: decoration.id,
            assetKey: ASSETS.decorations.trees.includes(decoration)
                ? `tree_${decoration.id}`
                : `prop_${decoration.id}`,
        };

        this.decorations.push(newDecoration);
        this.grid[spot.y][spot.x].occupied = true;
        this.grid[spot.y][spot.x].decoration = newDecoration;

        this.render();
        return newDecoration;
    }

    createBuilding(x, y) {
        // Pick random building style
        const baseIndex = Math.floor(Math.random() * ASSETS.buildings.bases.length);
        const floorIndex = Math.floor(Math.random() * ASSETS.buildings.floors.length);
        const roofIndex = Math.floor(Math.random() * ASSETS.buildings.roofs.length);

        const building = {
            x,
            y,
            floors: 1,
            maxFloors: 3 + Math.floor(Math.random() * 3), // 3-5 floors max
            baseAsset: `base_${ASSETS.buildings.bases[baseIndex].id}`,
            floorAsset: `floor_${ASSETS.buildings.floors[floorIndex].id}`,
            roofAsset: `roof_${ASSETS.buildings.roofs[roofIndex].id}`,
        };

        this.buildings.push(building);
        this.grid[y][x].type = 'building';
        this.grid[y][x].occupied = true;
        this.grid[y][x].building = building;

        return building;
    }

    render() {
        if (!assetLoader.loaded) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw in isometric order (back to front)
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                this.renderCell(x, y);
            }
        }
    }

    renderCell(gridX, gridY) {
        const ctx = this.ctx;
        const cell = this.grid[gridY][gridX];
        const pos = this.gridToScreen(gridX, gridY);

        // Draw ground tile
        let groundImg;
        switch (cell.type) {
            case 'road':
                groundImg = assetLoader.get('ground_road_straight');
                break;
            case 'building':
            case 'grass':
            default:
                groundImg = assetLoader.get('ground_grass');
                break;
        }

        if (groundImg) {
            ctx.drawImage(
                groundImg,
                pos.x - this.tileWidth / 2,
                pos.y - this.tileHeight / 2,
                this.tileWidth,
                this.tileHeight + 20 // Account for tile depth
            );
        }

        // Draw building if present
        if (cell.building) {
            this.renderBuilding(cell.building, pos);
        }

        // Draw decoration if present
        if (cell.decoration) {
            this.renderDecoration(cell.decoration, pos);
        }
    }

    renderBuilding(building, pos) {
        const ctx = this.ctx;

        // Draw base
        const baseImg = assetLoader.get(building.baseAsset);
        if (baseImg) {
            ctx.drawImage(
                baseImg,
                pos.x - this.tileWidth / 2,
                pos.y - this.tileHeight / 2 - 30,
                this.tileWidth,
                baseImg.height * (this.tileWidth / baseImg.width)
            );
        }

        // Draw floors
        const floorImg = assetLoader.get(building.floorAsset);
        if (floorImg && building.floors > 1) {
            for (let i = 1; i < building.floors; i++) {
                ctx.drawImage(
                    floorImg,
                    pos.x - this.tileWidth / 2,
                    pos.y - this.tileHeight / 2 - 30 - (i * this.floorHeight),
                    this.tileWidth,
                    floorImg.height * (this.tileWidth / floorImg.width)
                );
            }
        }

        // Draw roof
        const roofImg = assetLoader.get(building.roofAsset);
        if (roofImg) {
            const roofY = pos.y - this.tileHeight / 2 - 30 - (building.floors * this.floorHeight) + 10;
            ctx.drawImage(
                roofImg,
                pos.x - this.tileWidth / 2,
                roofY,
                this.tileWidth,
                roofImg.height * (this.tileWidth / roofImg.width)
            );
        }
    }

    renderDecoration(decoration, pos) {
        const ctx = this.ctx;
        const img = assetLoader.get(decoration.assetKey);

        if (img) {
            // Center decoration on tile
            const scale = 0.8;
            const width = img.width * scale;
            const height = img.height * scale;

            ctx.drawImage(
                img,
                pos.x - width / 2,
                pos.y - height + 10,
                width,
                height
            );
        }
    }

    // Get stats for display
    getStats() {
        const totalFloors = this.buildings.reduce((sum, b) => sum + b.floors, 0);
        return {
            buildings: this.buildings.length,
            floors: totalFloors,
            decorations: this.decorations.length,
        };
    }

    // Save city state to localStorage
    save() {
        const state = {
            buildings: this.buildings,
            decorations: this.decorations,
            grid: this.grid,
        };
        localStorage.setItem('tinyHabitsCity', JSON.stringify(state));
    }

    // Load city state from localStorage
    load() {
        const saved = localStorage.getItem('tinyHabitsCity');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.buildings = state.buildings || [];
                this.decorations = state.decorations || [];
                this.grid = state.grid || this.grid;
                return true;
            } catch (e) {
                console.warn('Failed to load city state:', e);
            }
        }
        return false;
    }
}
