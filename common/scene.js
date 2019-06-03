/**
 * Contains and manages the objects which compose a simulation/game scene.
 * Also responsible for running the main loop which triggers logic updates and rendering.
 */
class Scene
{
    // Use map with integer keys as they traverse faster than dictionaries
    // https://jsperf.com/dict-map-iteration-performance
    _sceneObjects = new Map();

    constructor(canvasId)
    {
        this.renderer      = new Renderer(canvasId);
        this.frameStats    = new FrameStats(this.renderer.context);
        this.sceneTree     = null;
        this.lastFrameTime = 0.0;
        this.deltaTime     = 0.0;
        this.shouldRun     = true;
    }

    /**
     * Sets up the shaders, materials, and meshes used by the scene.
     * Should be extended by specialized Scene implementations.
     */
    setup()
    {
        this.buildDefaultShaders();
        this.buildDefaultMaterials();
        this.buildDefaultMeshes();

        this.renderer.camera = new Camera(this.renderer); 
    }

    setSceneTree(sceneTree)
    {
        if(sceneTree === null)
        {
            return;
        }

        if(this.sceneTree != null)
        {
            this.sceneTree.destroy();
        }

        this.sceneTree = sceneTree;
        this.sceneTree.setScene(this);

        for(let[id, sceneObject] of this._sceneObjects)
        {
            this.sceneTree.add(sceneObject);
        }
    }

    addSceneObject(sceneObject)
    {
        let id = Scene._nextId();
        sceneObject.id = id;
        
        this._sceneObjects.set(id, sceneObject);
        
        if(this.sceneTree != null)
        {
            this.sceneTree.add(sceneObject);
        }
    }

    removeSceneObject(id)
    {
        let sceneObject = this._sceneObjects.get(id);

        if(!sceneObject)
        {
            return;
        }

        if(this.sceneTree != null)
        {
            this.sceneTree.remove(sceneObject);
        }

        this._sceneObjects.delete(id);
        sceneObject.dispose();
    }

    getSceneObject(id)
    {
        return this._sceneObjects.get(id);
    }

    forEachSceneObject(func)
    {
        for (let [id, sceneObject] of this._sceneObjects)
        {
            func(sceneObject);
        }
    }

    static _nextId()
    {
        return this.nextId++;
    }

    /**
     * Begins the simulation/game loop.
     */
    start()
    {
        requestAnimationFrame(()=>this.frame());
    }

    /**
     * Stops the simulation/game loop.
     */
    stop()
    {
        this.shouldRun = false;
    }

    /**
     * Builds several default shaders, including:
     * 
     *     - `flat`
     *     - `flat_instanced`
     *     - `flash`
     *     - `flash_instanced`
     */
    buildDefaultShaders()
    {
        new Shader(this.renderer.context, "flat", shader_flat_vs, null, shader_flat_fs);
        new Shader(this.renderer.context, "flat_instanced", shader_flat_instanced_vs, null, shader_flat_fs);
        new Shader(this.renderer.context, "flash", shader_flash_vs, null, shader_flat_fs);
        new Shader(this.renderer.context, "flash_instanced", shader_flash_instanced_vs, null, shader_flat_fs);
    }

    /**
     * Builds several default materials, including:
     * 
     *     - `default`
     *     - `default_instanced`
     *     - `flash`
     *     - `flash_instanced`
     */
    buildDefaultMaterials()
    {
        let materialDefault = new Material(this.renderer, "default", "flat");
        materialDefault.enableProperty("Color", [1.0, 1.0, 1.0, 1.0],);

        let materialDefaultInstanced = new Material(this.renderer, "default_instanced", "flat_instanced", true);
        materialDefaultInstanced.enableProperty("Color", [1.0, 1.0, 1.0, 1.0]);
        
        let materialFlash = new Material(this.renderer, "flash", "flash");
        materialFlash.enableProperty("StartColor", [0.0, 1.0, 0.0, 1.0]);
        materialFlash.enableProperty("EndColor", [1.0, 1.0, 1.0, 1.0]);
        
        let materialFlashInstanced = new Material(this.renderer, "flash_instanced", "flash_instanced", true);
        materialFlashInstanced.enableProperty("StartColor", [0.0, 0.0, 0.0, 1.0]);
        materialFlashInstanced.enableProperty("EndColor", [1.0, 1.0, 1.0, 1.0]);
    }

    /**
     * Builds the basic unit square quad mesh.
     */
    buildDefaultMeshes()
    {
        let quad = new Mesh(this.renderer.context, "quad");

        quad.vertices.push(new Vertex(-0.5, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0), 
                           new Vertex( 0.5, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 1.0, 0.0), 
                           new Vertex( 0.5,  0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 1.0, 1.0),
                           new Vertex(-0.5,  0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 0.0, 1.0));

        quad.indices.push(0, 1, 2, 
                          2, 3, 0)

        quad.build();
    }

    /**
     * A single frame of the simulation/game. Performs the folowing:
     * 
     *     1. Calculates frame delta time
     *     2. Invokes the `update` method of each `SceneObject`
     *     3. Invokes the `preRenderer` method of each `SceneObject`
     *     4. Invokes the `drawScene` method of the `Renderer`
     *     5. Calculates and reports the frame stats
     *     6. Requests another frame to be executed
     * 
     * @param {*} elapsedTime 
     */
    frame(elapsedTime)
    {
        // Calculate frame delta time in milliseconds
        if(isNaN(elapsedTime))
        {
            elapsedTime = performance.now();
        }

        elapsedTime *= 0.001;

        this.deltaTime     = elapsedTime - this.lastFrameTime;
        this.lastFrameTime = elapsedTime;

        // Update each object
        for (let [id, sceneObject] of this._sceneObjects)
        {
            sceneObject.update(this.deltaTime);
        }

        for(let [id, sceneObject] of this._sceneObjects)
        {
            if(sceneObject.visible)
            {
                sceneObject.preRender();
            }
        }

        // Draw the scene
        let drawStats = this.renderer.drawScene(0, this.frameStats.timeElapsed, this.deltaTime);

        // Update the scene tree
        if(this.sceneTree != null)
        {
            this.sceneTree.refresh();
        }
        
        // Update frame stats
        this.frameStats.endFrame(this.deltaTime, drawStats[0], drawStats[1]);
        this.frameStats.report();

        // Request another frame if we are still running
        if(this.shouldRun === true)
        {
            requestAnimationFrame(()=>this.frame());
        }
    }
}

Scene.nextId = 0;