defineSuite([
        'Scene/Cesium3DTile',
        'Scene/Cesium3DTileset',
        'Scene/Cesium3DTilesetHeatmap',
        'Core/clone',
        'Core/Color',
        'Core/Math',
        'Core/Matrix4',
        'Scene/Cesium3DTileContentState',
        'Specs/createScene'
    ], function(
        Cesium3DTile,
        Cesium3DTileset,
        Cesium3DTilesetHeatmap,
        clone,
        Color,
        CesiumMath,
        Matrix4,
        Cesium3DTileContentState,
        createScene) {
    'use strict';

    var tileWithBoundingSphere = {
        geometricError : 1,
        refine : 'REPLACE',
        children : [],
        boundingVolume : {
            sphere: [0.0, 0.0, 0.0, 5.0]
        }
    };

    var mockTileset = {
        debugShowBoundingVolume : true,
        debugShowViewerRequestVolume : true,
        modelMatrix : Matrix4.IDENTITY,
        _geometricError : 2
    };

    var scene;
    beforeEach(function() {
        scene = createScene();
        scene.frameState.passes.render = true;
    });

    afterEach(function() {
        scene.destroyForSpecs();
    });

    function verifyColor(tileColor, expectedColor) {
        var diff = new Color (Math.abs(expectedColor.red   - tileColor.red),
                              Math.abs(expectedColor.green - tileColor.green),
                              Math.abs(expectedColor.blue  - tileColor.blue));

        var threshold = 0.01;
        expect(diff.red).toBeLessThan(threshold);
        expect(diff.green).toBeLessThan(threshold);
        expect(diff.blue).toBeLessThan(threshold);
    }

    it('destroys', function() {
        var heatmap = new Cesium3DTilesetHeatmap();
        expect(heatmap.isDestroyed()).toEqual(false);
        heatmap.destroy();
        expect(heatmap.isDestroyed()).toEqual(true);
    });

    it('expected heat map color', function() {
        var heatmap = new Cesium3DTilesetHeatmap('_centerZDepth');

        var tile = new Cesium3DTile(mockTileset, '/some_url', tileWithBoundingSphere, undefined);
        tile._contentState = Cesium3DTileContentState.READY;
        tile.hasEmptyContent = false;
        var frameState = scene.frameState;
        tile._selectedFrame = frameState.frameNumber;
        var originalColor = tile.color;

        // This is first frame, previousMin/Max are unititialized so no coloring occurs
        tile._centerZDepth = 1;
        heatmap.colorize(tile, frameState);
        tile._centerZDepth = -1;
        heatmap.colorize(tile, frameState);

        expect(heatmap._min).toBe(-1);
        expect(heatmap._max).toBe( 1);
        verifyColor(tile.color, originalColor);

        // Preparing for next frame, previousMin/Max are take current frame's values
        heatmap.resetMinMax();
        expect(heatmap._min).toBe(Number.MAX_VALUE);
        expect(heatmap._max).toBe(-Number.MAX_VALUE);
        expect(heatmap._previousMin).toBe(-1);
        expect(heatmap._previousMax).toBe( 1);

        tile._centerZDepth = -1;
        heatmap.colorize(tile, frameState);

        var expectedColor = new Color(0,0,0,1);
        verifyColor(tile.color, expectedColor);
    });
});
